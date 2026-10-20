"use client";
// Camera QR scanner. Uses the native BarcodeDetector where the browser has it
// (Chrome/Android) and falls back to jsQR on canvas frames everywhere else.
// The platform renders visit QRs with error-correction "L" and a large
// module scale (VENDORS.codes.qr), so even weak cameras lock on quickly.
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let stream: MediaStream | null = null, raf = 0, done = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    const detector = BD ? new BD({ formats: ["qr_code"] }) : null;
    const tick = async () => {
      const v = video.current;
      if (done || !v || v.readyState < 2) { raf = requestAnimationFrame(tick); return; }
      let text: string | null = null;
      if (detector) { try { text = (await detector.detect(v))[0]?.rawValue ?? null; } catch { /* fall through */ } }
      if (!text && ctx) {
        canvas.width = v.videoWidth; canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0);
        text = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" })?.data ?? null;
      }
      if (text) { done = true; navigator.vibrate?.(60); onResult(text); return; }
      raf = requestAnimationFrame(tick);
    };
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => { stream = s; if (video.current) { video.current.srcObject = s; void video.current.play(); } raf = requestAnimationFrame(tick); })
      .catch(() => setError("Camera blocked. Allow camera access, or use Enter code instead."));
    return () => { done = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onResult]);
  return <div className="v-scan">
    {error ? <span style={{ padding: 20, textAlign: "center" }}>{error}</span> : <>
      <video ref={video} playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
      <div className="v-scan-frame"><i /><i /><i /><i /></div>
      <span style={{ position: "relative" }}>Point your camera at the QR on their phone</span>
    </>}
  </div>;
}
