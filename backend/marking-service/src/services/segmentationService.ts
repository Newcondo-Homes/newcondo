// backend/marking-service/src/services/segmentationService.ts
// ============================================================
// AI building segmentation — production port of the founder's Colab
// prototype (newcondo_from_segmented_image.ipynb). Pipeline when a marker
// finishes a job:
//   1. Frontend captures a snapshot of the DEFAULT-SATELLITE map view with
//      the user's pin, plus the exact viewport GPS bounds, and PUTs it to S3
//      (properties/.../marking/boundary/ via presigned URL).
//   2. segmentBuilding(): send that screenshot to a vision model
//      (OpenAI gpt-4o by default; Gemini via SEGMENTATION_PROVIDER=gemini)
//      asking for the SAME artifact the prototype used — the image with the
//      pinned building painted SOLID GREEN (#00FF00).
//   3. extractGreenPolygon(): TS port of the notebook's OpenCV step —
//      green-dominance threshold (g−r>40, g−b>40, g>100), largest connected
//      component, Moore boundary trace, RDP simplification (ε = 0.008 ×
//      perimeter). Vertices normalized to [0,1] so any mask/original size
//      mismatch never matters (the notebook's key insight).
//   4. The normalized polygon flows into completeMarking() → GPS projection
//      via map bounds, fingerprint + IoU duplicate check (marking-geo), and
//      the green mask PNG is stored so the map can re-draw the colored
//      overlay on every future load.
// Deps: "sharp" (decode PNG/JPEG to raw RGB). Env: OPENAI_API_KEY or
// GEMINI_API_KEY, SEGMENTATION_PROVIDER=openai|gemini.
// ============================================================
import axios from "axios";
import sharp from "sharp";
// AppError in shared/types is an interface — throw the ServiceError helpers.
import { badGateway, unprocessable } from "@newcondo/backend-shared";
import { presignDownload, presignUpload } from "@newcondo/backend-shared";
import { s3Public, PUBLIC_BUCKET, type PropertyGeo } from "@newcondo/backend-shared";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

const SEG_PROMPT =
  "This is a Google Maps satellite screenshot with a location pin. Return the exact same image, unchanged, except the single building footprint directly under the pin painted solid bright green (#00FF00) with hard edges following the roof outline precisely. Do not alter anything else, do not add labels or text.";

/* ---------- step 2: vision-model call ---------- */
async function requestGreenMask(screenshotPng: Buffer): Promise<Buffer> {
  const provider = process.env.SEGMENTATION_PROVIDER ?? "openai";
  const b64 = screenshotPng.toString("base64");
  if (provider === "gemini") {
    // Gemini image-out (the prototype's second tested provider)
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: SEG_PROMPT }, { inline_data: { mime_type: "image/png", data: b64 } }] }], generationConfig: { responseModalities: ["IMAGE"] } },
      { timeout: 60_000 },
    );
    const part = res.data?.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data: string } }) => p.inlineData);
    if (!part) throw badGateway("Segmentation model returned no image");
    return Buffer.from(part.inlineData.data, "base64");
  }
  // OpenAI images.edit (gpt-image-1) — screenshot in, painted image out
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", SEG_PROMPT);
  form.append("image", new Blob([screenshotPng], { type: "image/png" }), "map.png");
  const res = await axios.post("https://api.openai.com/v1/images/edits", form, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 120_000,
  });
  const b64out = res.data?.data?.[0]?.b64_json;
  if (!b64out) throw badGateway("Segmentation model returned no image");
  return Buffer.from(b64out, "base64");
}

/* ---------- step 3: green-polygon extraction (notebook's OpenCV step in TS) ---------- */
export async function extractGreenPolygon(maskPng: Buffer): Promise<[number, number][]> {
  const { data, info } = await sharp(maskPng).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // green-dominance threshold — identical margins to the notebook
  const bin = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 3, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (g - r > 40 && g - b > 40 && g > 100) bin[p] = 1;
  }
  // largest connected component (BFS, 4-neighbour)
  const seen = new Uint8Array(w * h);
  let best: number[] = [];
  for (let p = 0; p < bin.length; p++) {
    if (!bin[p] || seen[p]) continue;
    const comp: number[] = []; const q = [p]; seen[p] = 1;
    while (q.length) {
      const c = q.pop()!; comp.push(c);
      const x = c % w, y = (c / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (bin[n] && !seen[n]) { seen[n] = 1; q.push(n); }
      }
    }
    if (comp.length > best.length) best = comp;
  }
  if (best.length < w * h * 0.001) throw unprocessable("No green building region detected — retry the segmentation");
  const inComp = new Uint8Array(w * h);
  for (const p of best) inComp[p] = 1;
  // Moore boundary trace from the topmost-leftmost pixel
  const start = best.reduce((m, p) => (p < m ? p : m), best[0]);
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const contour: [number, number][] = [];
  let cx = start % w, cy = (start / w) | 0, dir = 6;
  for (let steps = 0; steps < 100_000; steps++) {
    contour.push([cx, cy]);
    let found = false;
    for (let k = 0; k < 8; k++) {
      const d = (dir + 6 + k) % 8; // start looking backwards-left (Moore)
      const nx = cx + dirs[d][0], ny = cy + dirs[d][1];
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && inComp[ny * w + nx]) { cx = nx; cy = ny; dir = d; found = true; break; }
    }
    if (!found) break;
    if (contour.length > 2 && cx === contour[0][0] && cy === contour[0][1]) break;
  }
  // RDP simplification, ε = 0.008 × perimeter (matches cv2.approxPolyDP call)
  const peri = contour.reduce((s, pt, i) => i ? s + Math.hypot(pt[0] - contour[i - 1][0], pt[1] - contour[i - 1][1]) : 0, 0);
  const simplified = rdp(contour, 0.008 * peri);
  // normalize to [0,1] relative to the MASK size — dimension-independent
  return simplified.map(([x, y]) => [x / w, y / h]);
}
function rdp(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], a, b);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
function perpDist(p: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

/* ---------- orchestrator: screenshot key → { polygonNorm, maskKey } ---------- */
export async function segmentBuilding(opts: { screenshotKey: string; geo: PropertyGeo }): Promise<{ polygonNorm: [number, number][]; maskKey: string }> {
  const obj = await s3.send(new GetObjectCommand({ Bucket: PUBLIC_BUCKET, Key: opts.screenshotKey }));
  const screenshot = Buffer.from(await obj.Body!.transformToByteArray());
  const maskPng = await requestGreenMask(screenshot);
  const polygonNorm = await extractGreenPolygon(maskPng);
  // persist the green mask so map loads can re-draw the colored overlay
  const maskKey = s3Public.markingBoundaryPhoto(opts.geo, "image/png").replace(/\.png$/, "-mask.png");
  await s3.send(new PutObjectCommand({ Bucket: PUBLIC_BUCKET, Key: maskKey, Body: maskPng, ContentType: "image/png" }));
  return { polygonNorm, maskKey };
}
