"use client";

/* ============================================================
   SyncedMaps — two Google Maps that mirror each other.

   • Desktop: satellite LEFT, default roadmap (building boxes) RIGHT.
   • Mobile:  satellite TOP, roadmap BOTTOM.
   • Both fill the screen; the page itself never scrolls.
   • Pan/zoom on either map drives the other (the "active" map — the
     one under the pointer — is the source; the passive map's own
     bounds_changed is ignored, which kills the feedback loop).
   • Tap (web) / press (mobile) drops a green pin on the tapped
     building; the pin mirrors onto both maps. Already-marked
     properties render as translucent red-grey masks and block picks.
   ============================================================ */

import { useCallback, useEffect, useRef } from "react";
import { GoogleMap, Polygon } from "@react-google-maps/api";
import { pointInPolygon, type LatLngLiteral, type MarkedProperty } from "./marking-core";

const CONTAINER = { width: "100%", height: "100%" };
const GREEN = "#008F5A";
const MASK_FILL = "rgba(192,57,43,0.32)";
const MASK_STROKE = "rgba(192,57,43,0.85)";

const BASE_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "greedy", // one-finger pan on mobile (page doesn't scroll)
  clickableIcons: false,
  keyboardShortcuts: false,
  tilt: 0,
};

function pinIcon(): google.maps.Icon {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='46' height='46' viewBox='0 0 24 24' ` +
    `fill='${GREEN}' stroke='white' stroke-width='1.4' stroke-linejoin='round'>` +
    `<path d='M12 21s7-6.16 7-12a7 7 0 1 0-14 0c0 5.84 7 12 7 12z'/>` +
    `<circle cx='12' cy='9' r='2.6' fill='white' stroke='none'/></svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(46, 46),
    anchor: new google.maps.Point(23, 44),
  };
}

interface Props {
  center: LatLngLiteral;
  zoom: number;
  pin: LatLngLiteral | null;
  marked: MarkedProperty[];
  interactive: boolean;
  onPick: (point: LatLngLiteral, blocker: MarkedProperty | null) => void;
  /** Hand a "recenter on user" function back up to the parent. */
  onRecenterReady?: (fn: () => void) => void;
}

export default function SyncedMaps({
  center,
  zoom,
  pin,
  marked,
  interactive,
  onPick,
  onRecenterReady,
}: Props) {
  const satRef = useRef<google.maps.Map | null>(null);
  const roadRef = useRef<google.maps.Map | null>(null);
  const activeRef = useRef<"sat" | "road" | null>(null);
  const linkedRef = useRef(false);
  // Imperative pin overlays (one Marker + one Circle per map) so there is
  // never more than one pin on screen — each tap removes the previous
  // instances outright instead of relying on prop-diffing to move them.
  const satPinRef = useRef<{ marker: google.maps.Marker; circle: google.maps.Circle } | null>(null);
  const roadPinRef = useRef<{ marker: google.maps.Marker; circle: google.maps.Circle } | null>(null);

  // Wire the two maps together once both exist.
  const link = useCallback(() => {
    const a = satRef.current;
    const b = roadRef.current;
    if (!a || !b || linkedRef.current) return;
    linkedRef.current = true;

    const copy = (from: google.maps.Map, to: google.maps.Map) => {
      const c = from.getCenter();
      const z = from.getZoom();
      if (c) to.setCenter(c);
      if (typeof z === "number") to.setZoom(z);
    };

    a.addListener("bounds_changed", () => {
      if (activeRef.current === "sat") copy(a, b);
    });
    b.addListener("bounds_changed", () => {
      if (activeRef.current === "road") copy(b, a);
    });
  }, []);

  // Recenter both when the parent's center/zoom changes (e.g. geolocation lands).
  useEffect(() => {
    [satRef.current, roadRef.current].forEach((m) => {
      if (m) {
        m.setCenter(center);
        m.setZoom(zoom);
      }
    });
  }, [center.lat, center.lng, zoom]);

  // Expose a "recenter" action to the parent (the locate-me button).
  useEffect(() => {
    if (!onRecenterReady) return;
    onRecenterReady(() => {
      [satRef.current, roadRef.current].forEach((m) => {
        if (m) {
          m.panTo(center);
          m.setZoom(zoom);
        }
      });
    });
  }, [onRecenterReady, center.lat, center.lng, zoom]);

  // Draw/clear the pin on both maps imperatively whenever it changes.
  useEffect(() => {
    const draw = (map: google.maps.Map | null, ref: React.MutableRefObject<{ marker: google.maps.Marker; circle: google.maps.Circle } | null>) => {
      if (!map) return;
      if (ref.current) {
        ref.current.marker.setMap(null);
        ref.current.circle.setMap(null);
        ref.current = null;
      }
      if (!pin) return;
      const marker = new google.maps.Marker({
        position: pin,
        map,
        icon: pinIcon(),
        animation: google.maps.Animation.DROP,
        zIndex: 3,
        clickable: false,
      });
      const circle = new google.maps.Circle({
        center: pin,
        radius: 11,
        map,
        fillColor: GREEN,
        fillOpacity: 0.18,
        strokeColor: GREEN,
        strokeOpacity: 0.9,
        strokeWeight: 1.5,
        clickable: false,
        zIndex: 2,
      });
      ref.current = { marker, circle };
    };
    draw(satRef.current, satPinRef);
    draw(roadRef.current, roadPinRef);
  }, [pin?.lat, pin?.lng]);

  const handleClick = (e: google.maps.MapMouseEvent) => {
    if (!interactive || !e.latLng) return;
    const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    const blocker = marked.find((m) => pointInPolygon(p, m.polygon)) ?? null;
    onPick(p, blocker);
  };

  const overlays = (
    <>
      {marked.map((m) => (
        <Polygon
          key={m.id}
          paths={m.polygon}
          options={{
            fillColor: MASK_FILL,
            fillOpacity: 1,
            strokeColor: MASK_STROKE,
            strokeWeight: 1.5,
            clickable: false,
            zIndex: 1,
          }}
        />
      ))}
    </>
  );

  const cell = (which: "sat" | "road", label: string) => (
    <div
      className="relative min-h-0 min-w-0 overflow-hidden rounded-[20px] border border-border-hair shadow-[0_12px_34px_-14px_rgba(19,19,19,0.22)]"
      onPointerDown={() => (activeRef.current = which)}
      onPointerEnter={() => (activeRef.current = which)}
      onWheel={() => (activeRef.current = which)}
    >
      <GoogleMap
        mapContainerStyle={CONTAINER}
        center={center}
        zoom={zoom}
        onLoad={(m) => {
          (which === "sat" ? satRef : roadRef).current = m;
          link();
          // Draw the pin immediately for a map that mounts after the pin is already set.
          if (pin) {
            const ref = which === "sat" ? satPinRef : roadPinRef;
            if (!ref.current) {
              const marker = new google.maps.Marker({ position: pin, map: m, icon: pinIcon(), zIndex: 3, clickable: false });
              const circle = new google.maps.Circle({ center: pin, radius: 11, map: m, fillColor: GREEN, fillOpacity: 0.18, strokeColor: GREEN, strokeOpacity: 0.9, strokeWeight: 1.5, clickable: false, zIndex: 2 });
              ref.current = { marker, circle };
            }
          }
        }}
        onClick={handleClick}
        options={{ ...BASE_OPTIONS, mapTypeId: which === "sat" ? "satellite" : "roadmap" }}
      >
        {overlays}
      </GoogleMap>

      <div className="pointer-events-none absolute left-3 top-3 z-[1] inline-flex items-center gap-1.5 rounded-full bg-[rgba(19,19,19,0.72)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream backdrop-blur-sm">
        {label}
      </div>
    </div>
  );

  return (
    <div className="grid h-full w-full grid-cols-2 gap-3 p-3 max-[820px]:grid-cols-1 max-[820px]:grid-rows-2">
      {cell("sat", "Satellite")}
      {cell("road", "Map")}
    </div>
  );
}
