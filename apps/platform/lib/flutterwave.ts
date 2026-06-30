/* ============================================================
   Flutterwave Inline — script loader

   Injects https://checkout.flutterwave.com/v3.js once and resolves
   when window.FlutterwaveCheckout is available. Safe to call multiple
   times — concurrent callers share a single in-flight promise.
   ============================================================ */

export const FLW_INLINE_SRC = "https://checkout.flutterwave.com/v3.js";

let loadPromise: Promise<void> | null = null;

export function loadFlutterwaveInline(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Flutterwave inline can only load in the browser"));
  }
  if (window.FlutterwaveCheckout) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${FLW_INLINE_SRC}"]`);

    const onReady = () => {
      if (window.FlutterwaveCheckout) resolve();
      else reject(new Error("Flutterwave script loaded but FlutterwaveCheckout is undefined"));
    };

    if (existing) {
      if (window.FlutterwaveCheckout) return resolve();
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Flutterwave")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = FLW_INLINE_SRC;
    script.async = true;
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", () => {
      loadPromise = null; // allow a retry
      reject(new Error("Failed to load the Flutterwave checkout script"));
    }, { once: true });
    document.head.appendChild(script);
  });

  return loadPromise;
}
