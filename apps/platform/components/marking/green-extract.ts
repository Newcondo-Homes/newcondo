"use client";

/* ============================================================
   green-extract — OpenCV.js port of `extract_green_polygon`
   from the Colab notebook.

   Takes the green-segmented mask image and returns the building
   polygon as normalised [0,1] vertices (so the original screenshot
   and the segmented mask can be different sizes — we project through
   the map bounds later, in marking-geo).

   Pipeline (identical to the notebook):
     RGB → HSV → inRange(green) → morphology CLOSE(9×9)+OPEN(5×5)
        → findContours(EXTERNAL) → largest by area
        → approxPolyDP(0.008 × perimeter) → normalise to [0,1]

   OpenCV.js must be loaded first (it exposes a global `cv`). Call
   `await loadOpenCv()` once, or drop this in _document/layout:
     <script async src="https://docs.opencv.org/4.10.0/opencv.js"></script>
   ============================================================ */

import type { PolygonNorm } from "./marking-geo";

// minimal typing for the bits of OpenCV.js we touch
type CvMat = { delete: () => void; rows: number; cols: number; data32S: Int32Array };
interface OpenCv {
  imread: (src: HTMLImageElement | HTMLCanvasElement) => CvMat;
  cvtColor: (src: CvMat, dst: CvMat, code: number) => void;
  inRange: (src: CvMat, lo: CvMat, hi: CvMat, dst: CvMat) => void;
  getStructuringElement: (shape: number, size: { width: number; height: number }) => CvMat;
  morphologyEx: (src: CvMat, dst: CvMat, op: number, kernel: CvMat) => void;
  findContours: (src: CvMat, contours: unknown, hierarchy: CvMat, mode: number, method: number) => void;
  contourArea: (c: CvMat) => number;
  arcLength: (c: CvMat, closed: boolean) => number;
  approxPolyDP: (c: CvMat, out: CvMat, epsilon: number, closed: boolean) => void;
  Mat: new () => CvMat;
  matFromArray: (rows: number, cols: number, type: number, arr: number[]) => CvMat;
  MatVector: new () => { size: () => number; get: (i: number) => CvMat; delete: () => void };
  COLOR_RGBA2RGB: number;
  COLOR_RGB2HSV: number;
  MORPH_RECT: number;
  MORPH_CLOSE: number;
  MORPH_OPEN: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  CV_8UC1: number;
}

declare global {
  // eslint-disable-next-line no-var
  var cv: OpenCv | undefined;
}

const OPENCV_SRC = "https://docs.opencv.org/4.10.0/opencv.js";

/** Load OpenCV.js once and resolve when its runtime is ready. */
export function loadOpenCv(): Promise<OpenCv> {
  return new Promise((resolve, reject) => {
    if (globalThis.cv?.imread) return resolve(globalThis.cv);

    const ready = () => {
      const cv = globalThis.cv;
      if (!cv) return reject(new Error("OpenCV failed to initialise"));
      // cv may need a tick to attach runtime
      if ((cv as unknown as any).imread) resolve(cv);
      else (cv as unknown as { onRuntimeInitialized: () => void }).onRuntimeInitialized = () => resolve(cv);
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${OPENCV_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", ready);
      existing.addEventListener("error", () => reject(new Error("OpenCV script failed to load")));
      if (globalThis.cv) ready();
      return;
    }
    const script = document.createElement("script");
    script.src = OPENCV_SRC;
    script.async = true;
    script.onload = ready;
    script.onerror = () => reject(new Error("OpenCV script failed to load"));
    document.head.appendChild(script);
  });
}

export interface GreenPolygonResult {
  /** Vertices normalised to [0,1] of the mask image. */
  polygonNorm: PolygonNorm;
  /** Vertices in mask pixels (debug/preview). */
  polygonPx: Array<[number, number]>;
  maskSize: { width: number; height: number };
}

export interface ExtractOptions {
  epsilonFrac?: number; // smaller = more vertices (default 0.008)
  minArea?: number; // ignore specks below this area (default 500)
  /** HSV green band — defaults suit ChatGPT's bright-green segmentation. */
  hsvLow?: [number, number, number];
  hsvHigh?: [number, number, number];
}

/**
 * Isolate the green region in a segmented mask image and return its polygon.
 * `source` is an <img> or <canvas> holding the green-segmented image.
 */
export async function extractGreenPolygon(
  source: HTMLImageElement | HTMLCanvasElement,
  opts: ExtractOptions = {}
): Promise<GreenPolygonResult> {
  const cv = await loadOpenCv();
  const { epsilonFrac = 0.008, minArea = 500, hsvLow = [35, 60, 60], hsvHigh = [90, 255, 255] } = opts;

  const src = cv.imread(source);
  const rgb = new cv.Mat();
  const hsv = new cv.Mat();
  const mask = new cv.Mat();
  const lo = cv.matFromArray(1, 3, cv.CV_8UC1, hsvLow);
  const hi = cv.matFromArray(1, 3, cv.CV_8UC1, hsvHigh);
  const kClose = cv.getStructuringElement(cv.MORPH_RECT, { width: 9, height: 9 });
  const kOpen = cv.getStructuringElement(cv.MORPH_RECT, { width: 5, height: 5 });
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const approx = new cv.Mat();

  const cleanup = () =>
    [src, rgb, hsv, mask, lo, hi, kClose, kOpen, hierarchy, approx].forEach((m) => m.delete());

  try {
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
    cv.inRange(hsv, lo, hi, mask);

    cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kClose);
    cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kOpen);

    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    if (contours.size() === 0) {
      throw new Error("No green region detected in the mask image.");
    }

    // largest contour above the min-area floor (fallback: largest of all)
    let best: CvMat | null = null;
    let bestArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const area = cv.contourArea(c);
      if (area >= minArea && area > bestArea) {
        best = c;
        bestArea = area;
      }
    }
    if (!best) {
      for (let i = 0; i < contours.size(); i++) {
        const c = contours.get(i);
        const area = cv.contourArea(c);
        if (area > bestArea) {
          best = c;
          bestArea = area;
        }
      }
    }
    if (!best) throw new Error("No valid contour found.");

    const peri = cv.arcLength(best, true);
    cv.approxPolyDP(best, approx, epsilonFrac * peri, true);

    const mw = mask.cols;
    const mh = mask.rows;
    const polygonPx: Array<[number, number]> = [];
    for (let i = 0; i < approx.rows; i++) {
      polygonPx.push([approx.data32S[i * 2], approx.data32S[i * 2 + 1]]);
    }
    const polygonNorm: PolygonNorm = polygonPx.map(([x, y]) => [x / mw, y / mh]);

    contours.delete();
    return { polygonNorm, polygonPx, maskSize: { width: mw, height: mh } };
  } finally {
    cleanup();
  }
}
