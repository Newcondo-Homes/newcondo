"use client";

/* ============================================================
   MarkPropertyExperience — full-screen marking workspace for the
   shareable-link ("known person") flow: /mark-property/[linkId].

   Layout: slim top bar (brand + stepper) over a no-scroll, full-
   height pair of synced Google Maps. All controls float over the
   maps as glass panels so both maps stay fully on-screen.

   Flow: Locate (geolocation, auto-zoom) → Mark (tap building, pin
   mirrors on both maps) → Photos → Submit (owner is then notified
   to confirm).
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MapPin, Crosshair, Loader2, ShieldCheck, AlertTriangle, RefreshCw, Check, ArrowRight } from "lucide-react";
import { toast } from "@newcondo/ui";
import { useUpload } from "@/hooks/useUpload";
import { useMarkProperty } from "@/hooks/useProperties";
import SyncedMaps from "./SyncedMaps";
import MarkingStepper from "./MarkingStepper";
import MarkingPanel from "./MarkingPanel";
import MarkingActionBar from "./MarkingActionBar";
import MarkingPhotoSheet from "./MarkingPhotoSheet";
import MarkingPhotoViewer from "./MarkingPhotoViewer";
import {
  squareAround,
  formatLatLng,
  type LatLngLiteral,
  type MarkStep,
  type MarkedProperty,
  type PropertyLinkInfo,
} from "./marking-core";

const LOGO_DARK = "/assets/logo-mark-dark.png";
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const LIBRARIES: Libraries = ["geometry"];
const DEFAULT_CENTER: LatLngLiteral = { lat: 6.5244, lng: 3.3792 }; // Lagos fallback

const STEPS = [
  { key: "locate", label: "Locate" },
  { key: "mark", label: "Mark" },
  { key: "photos", label: "Photos" },
  { key: "submit", label: "Submit" },
];
const STEP_INDEX: Record<MarkStep, number> = { locate: 0, mark: 1, photos: 2, submit: 3 };

type GeoStatus = "idle" | "locating" | "granted" | "denied";

export default function MarkPropertyExperience({
  linkId,
  link,
  markedProperties = [],
}: {
  linkId: string;
  link: PropertyLinkInfo;
  /** Already-marked nearby properties (red-grey masks). TODO: fetch by linkId/area. */
  markedProperties?: MarkedProperty[];
}) {
  const reduce = useReducedMotion();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "newcondo-maps",
    googleMapsApiKey: MAPS_KEY,
    libraries: LIBRARIES,
  });

  const { uploadFile } = useUpload();
  const { mutateAsync: markProperty } = useMarkProperty();

  const [geo, setGeo] = useState<GeoStatus>("idle");
  const [center, setCenter] = useState<LatLngLiteral>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(13);
  const [step, setStep] = useState<MarkStep>("locate");
  const [pin, setPin] = useState<LatLngLiteral | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const recenterRef = useRef<(() => void) | null>(null);

  /* ---- geolocation: pinpoint + auto-zoom to max ---- */
  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo("denied");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(p);
        setZoom(20);
        setGeo("granted");
        setStep((s) => (s === "locate" ? "mark" : s));
      },
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (isLoaded) locate();
  }, [isLoaded, locate]);

  const interactive = step !== "locate" && !done && !submitting;

  /* ---- pin picking ---- */
  const handlePick = (point: LatLngLiteral, blocker: MarkedProperty | null) => {
    if (blocker) {
      toast.error("That building is already marked", {
        description: "Pick the building that matches this property.",
      });
      return;
    }
    setPin(point);
  };

  const dropAtMe = () => {
    if (geo === "granted") setPin(center);
    else toast.error("We don't have your location yet", { description: "Allow location access to use this." });
  };

  /* ---- photos ---- */
  const handleFiles = async (files: File[]) => {
    if (photos.length + files.length > 8) {
      toast.error("Up to 8 photos");
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const url = await uploadFile(fd);
        setPhotos((prev) => [...prev, url]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't upload that image", { description: "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  /* ---- submit ---- */
  const submit = async () => {
    if (!pin) {
      toast.error("Mark the property first");
      setStep("mark");
      return;
    }
    if (photos.length === 0) {
      toast.error("Add at least one photo", { description: "Photos let the owner confirm the property." });
      setStep("photos");
      setSheetOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      await markProperty({
        // For the link flow we pass linkId; the backend resolves the property.
        propertyId: linkId,
        data: {
          boundaryCoordinates: squareAround(pin, 12),
          boundaryCenter: pin,
          boundaryImages: photos,
          boundaryVerified: true,
          boundaryMarkedAt: new Date(),
        },
      });
      setDone(true);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't submit the marking", { description: "Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- map-load / key errors ---- */
  if (loadError || !MAPS_KEY) {
    return (
      <CenteredNotice
        Icon={AlertTriangle}
        title="Map couldn't load"
        body={
          !MAPS_KEY
            ? "The maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable marking."
            : "Something went wrong loading Google Maps. Please refresh and try again."
        }
      />
    );
  }

  return (
    <main
      data-screen-label="Mark property"
      className="flex h-dvh w-full flex-col overflow-hidden bg-background"
    >
      {/* ── top bar (logo · hint pill · stepper) ── */}
      <header className="relative z-[130] flex flex-none items-center gap-3 border-b border-border-hair bg-[rgba(247,246,239,0.88)] px-[clamp(12px,3vw,28px)] py-3 backdrop-blur-[18px] sm:gap-4">
        <Link href="/" className="flex flex-none items-center gap-2.5 text-[17px] font-bold tracking-[-0.04em] text-ink no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DARK} alt="Newcondo" className="h-auto w-[24px]" />
          <span className="max-[460px]:hidden">newcondo</span>
        </Link>
        <span className="h-5 w-px flex-none bg-border max-[680px]:hidden" />
        <span className="flex-none whitespace-nowrap text-[13.5px] font-semibold text-text-secondary max-[680px]:hidden">Mark property</span>

        {/* hint pill — centered on mobile, beside "Mark property" on desktop */}
        {!done && step !== "locate" && (
          <div className="flex min-w-0 flex-1 justify-center self-stretch sm:flex-none sm:justify-start">
            <MarkingPanel
              step={step}
              pin={pin}
              photosCount={photos.length}
              link={link}
              hasMasks={markedProperties.length > 0}
              disabled={submitting}
            />
          </div>
        )}

        <div className="ml-auto flex-none">
          <MarkingStepper steps={STEPS} active={done ? STEPS.length : STEP_INDEX[step]} />
        </div>
      </header>

      {/* ── maps + floating chrome ── */}
      <div className="relative min-h-0 flex-1">
        {isLoaded ? (
          <SyncedMaps
            center={center}
            zoom={zoom}
            pin={pin}
            marked={markedProperties}
            interactive={interactive}
            onPick={handlePick}
            onRecenterReady={(fn) => (recenterRef.current = fn)}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-surface-sunken">
            <span className="flex flex-col items-center gap-3 text-text-secondary">
              <Loader2 size={28} strokeWidth={2} className="animate-spin text-ink" />
              <span className="text-[14px]">Loading maps…</span>
            </span>
          </div>
        )}

        {/* recenter */}
        {!done && geo === "granted" && (
          <button
            type="button"
            onClick={() => recenterRef.current?.()}
            className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-border-hair bg-[rgba(247,246,239,0.9)] text-ink shadow-[0_10px_30px_-8px_rgba(19,19,19,0.25)] backdrop-blur-[18px] transition-transform duration-200 ease-nc hover:-translate-y-0.5"
            aria-label="Recenter on my location"
            title="Recenter on my location"
          >
            <Crosshair size={20} strokeWidth={2} />
          </button>
        )}

        {/* photo sheet */}
        <MarkingPhotoSheet
          open={sheetOpen}
          photos={photos}
          uploading={uploading}
          onClose={() => setSheetOpen(false)}
          onFiles={handleFiles}
          onRemove={(i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
        />

        {/* image review lightbox */}
        <MarkingPhotoViewer
          open={viewerOpen}
          photos={photos}
          onClose={() => setViewerOpen(false)}
        />

        {/* location gate */}
        <AnimatePresence>
          {!done && step === "locate" && (
            <LocationGate reduce={reduce} status={geo} onRetry={locate} onManual={() => setStep("mark")} />
          )}
        </AnimatePresence>

        {/* success */}
        <AnimatePresence>
          {done && pin && (
            <SuccessOverlay reduce={reduce} pin={pin} photosCount={photos.length} ownerName={link.ownerName} />
          )}
        </AnimatePresence>
      </div>

      {/* ── action bar — lives in the layout flow so it never covers the maps ── */}
      {!done && step !== "locate" && (
        <footer className="flex flex-none justify-center border-t border-border-hair bg-background px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <MarkingActionBar
            step={step}
            pin={pin}
            photosCount={photos.length}
            submitting={submitting}
            viewerOpen={viewerOpen}
            onDropAtMe={dropAtMe}
            onClear={() => setPin(null)}
            onContinue={() => {
              setStep("photos");
              setSheetOpen(true);
            }}
            onBack={() => {
              // While the review lightbox is open, "back" just closes it.
              if (viewerOpen) {
                setViewerOpen(false);
                return;
              }
              // Closing the photos sheet on "back" keeps the uploaded photos in state,
              // so they're still there when the user returns to the Photos step.
              setSheetOpen(false);
              setStep((s) => (s === "submit" ? "photos" : "mark"));
            }}
            onOpenPhotos={() => {
              // From the review lightbox, tapping "N photos added" reopens the sheet.
              setViewerOpen(false);
              setSheetOpen(true);
            }}
            onReview={() => {
              setSheetOpen(false);
              setViewerOpen(true);
            }}
            onProceed={() => {
              setViewerOpen(false);
              setStep("submit");
            }}
            onSubmit={submit}
          />
        </footer>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays                                                            */
/* ------------------------------------------------------------------ */

function LocationGate({
  status,
  onRetry,
  onManual,
  reduce,
}: {
  status: GeoStatus;
  onRetry: () => void;
  onManual: () => void;
  reduce: boolean | null;
}) {
  const denied = status === "denied";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-30 grid place-items-center bg-ink/45 px-5 backdrop-blur-[3px]"
    >
      <motion.div
        initial={reduce ? { opacity: 0 } : { scale: 0.96, y: 12, opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-[min(420px,100%)] rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,36px)] text-center shadow-[0_30px_70px_-20px_rgba(19,19,19,0.4)]"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-ink">
          {denied ? <AlertTriangle size={26} strokeWidth={1.9} /> : <MapPin size={26} strokeWidth={1.9} />}
        </span>
        <h1 className="m-0 mt-5 text-[clamp(21px,2.4vw,26px)] font-bold tracking-[-0.03em] text-text-primary">
          {denied ? "We need your location" : "Finding the property…"}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[34ch] text-[14.5px] leading-[1.55] text-text-secondary">
          {denied
            ? "Marking pins your exact spot, so the map must use your location. Enable it in your browser, then try again."
            : "Allow location access when your browser asks. The maps will zoom to where you're standing."}
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          {denied ? (
            <>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.98]"
              >
                <RefreshCw size={17} strokeWidth={2} /> Try again
              </button>
              <button
                type="button"
                onClick={onManual}
                className="inline-flex items-center justify-center rounded-full border border-border-strong bg-surface px-7 py-3.5 text-[14.5px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken"
              >
                Find it on the map myself
              </button>
            </>
          ) : (
            <span className="inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-text-secondary">
              <Loader2 size={17} strokeWidth={2} className="animate-spin" /> Waiting for location…
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SuccessOverlay({
  pin,
  photosCount,
  ownerName,
  reduce,
  homeHref = "/",
}: {
  pin: LatLngLiteral;
  photosCount: number;
  ownerName?: string;
  reduce: boolean | null;
  homeHref?: string;
}) {
  // gentle auto-redirect so the user is never left wondering "what now?"
  const [count, setCount] = useState(40);
  useEffect(() => {
    const t = setInterval(() => setCount((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (count === 0) window.location.href = homeHref;
  }, [count, homeHref]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 grid place-items-center bg-ink/55 px-5 backdrop-blur-[4px]"
    >
      <motion.div
        initial={reduce ? { opacity: 0 } : { scale: 0.95, y: 14, opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-[min(440px,100%)] rounded-card border border-border-hair bg-surface p-[clamp(26px,3.4vw,40px)] text-center shadow-[0_30px_80px_-20px_rgba(19,19,19,0.45)]"
      >
        <motion.span
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 320, damping: 18 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green text-cream"
        >
          <Check size={32} strokeWidth={2.6} />
        </motion.span>
        <h1 className="m-0 mt-5 text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.035em] text-text-primary">
          Property marked
        </h1>
        <p className="mx-auto mt-2.5 max-w-[38ch] text-[15px] leading-[1.55] text-text-secondary">
          Thank you. {ownerName ? <span className="font-semibold text-text-primary">{ownerName}</span> : "The owner"} has
          been notified to review and confirm the marking before the property goes live.
        </p>
        <div className="mt-6 rounded-[16px] bg-surface-sunken px-4 py-3.5 text-left">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="font-semibold uppercase tracking-[0.1em] text-text-tertiary">Coordinates</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-green-dark">
              <ShieldCheck size={14} strokeWidth={2.2} /> verified
            </span>
          </div>
          <p className="m-0 mt-1 font-mono text-[13px] text-text-primary">{formatLatLng(pin)}</p>
          <p className="m-0 mt-1.5 text-[12.5px] text-text-tertiary">
            {photosCount} photo{photosCount === 1 ? "" : "s"} submitted
          </p>
        </div>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Link
            href={homeHref}
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[14.5px] font-semibold text-cream no-underline transition-[transform,background] duration-200 ease-nc hover:bg-black hover:-translate-y-0.5"
          >
            Explore newcondo
            <ArrowRight size={17} strokeWidth={2.2} className="transition-transform duration-200 ease-nc group-hover:translate-x-1" />
          </Link>
          <span className="text-[12px] text-text-tertiary">
            Taking you home in <span className="font-semibold text-text-secondary">{count}</span>s — or close this page anytime.
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CenteredNotice({
  Icon,
  title,
  body,
}: {
  Icon: typeof AlertTriangle;
  title: string;
  body: string;
}) {
  return (
    <main className="grid h-dvh place-items-center bg-background px-6">
      <div className="w-[min(440px,100%)] rounded-card border border-border-hair bg-surface p-[clamp(26px,3.4vw,40px)] text-center shadow-[0_24px_60px_-16px_rgba(19,19,19,0.28)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-ink">
          <Icon size={26} strokeWidth={1.9} />
        </span>
        <h1 className="m-0 mt-5 text-[clamp(21px,2.4vw,27px)] font-bold tracking-[-0.03em] text-text-primary">{title}</h1>
        <p className="mx-auto mt-2.5 max-w-[40ch] text-[14.5px] leading-[1.55] text-text-secondary">{body}</p>
      </div>
    </main>
  );
}
