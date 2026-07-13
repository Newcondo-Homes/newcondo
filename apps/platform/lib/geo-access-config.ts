/* ============================================================
   GEO ACCESS CONFIG — modular allow-list for states & cities
   ============================================================

   HOW TO GRANT A WHOLE STATE
   ---------------------------
   Set `allowWholeState: true` on that state's entry. Every visitor
   located anywhere inside the state's radius passes — the `cities`
   list is ignored while this is true.

   HOW TO RESTRICT TO SPECIFIC CITIES WITHIN A STATE
   ---------------------------------------------------
   Keep `allowWholeState: false` and list only the cities you want to
   allow inside that state's `cities` array. Any city NOT listed (or
   commented out) is rejected even though it's in an allowed state.

   HOW TO ADD A NEW STATE / CITY
   -------------------------------
   Copy an existing entry in ALLOWED_ZONES (or an existing city inside
   a zone's `cities` array), fill in the name + lat/lng + radiusKm,
   and it is picked up automatically — no other code changes needed.

   Note on precision: this uses simple circle (haversine radius)
   checks around a city/state center point, not real administrative
   boundary polygons. It's accurate enough to gate "which city is this
   visitor roughly in", but a visitor right at the edge of a radius
   could be mis-classified. If exact polygon precision is ever needed,
   swap `isPointAllowed` in `geo-access.ts` for a point-in-polygon
   check against real Nigerian LGA/state boundary GeoJSON.
   ============================================================ */

export interface CityZone {
  name: string;
  lat: number;
  lng: number;
  /** Radius in kilometres around the city center considered "inside" this city. */
  radiusKm: number;
}

export interface StateZone {
  name: string;
  /** true = allow EVERY visitor anywhere in this state (cities list is ignored). */
  allowWholeState: boolean;
  center: { lat: number; lng: number };
  /** Radius in kilometres around the state center — only used when allowWholeState is true. */
  radiusKm: number;
  /** Only used when allowWholeState is false. Only these cities are allowed. */
  cities: CityZone[];
}

export const ALLOWED_ZONES: StateZone[] = [
  {
    name: "Imo",
    // Flip to `true` to open all of Imo State instead of just the cities below.
    allowWholeState: false,
    center: { lat: 5.485, lng: 7.035 },
    radiusKm: 55,
    cities: [
      { name: "Owerri", lat: 5.4836, lng: 7.0333, radiusKm: 12 },

      // Uncomment to add more Imo cities — each is allowed automatically:
      // { name: "Umuguma World Bank, Owerri", lat: 5.4625, lng: 7.0094, radiusKm: 8 },
      // { name: "Orlu", lat: 5.7891, lng: 7.0339, radiusKm: 10 },
      // { name: "Okigwe", lat: 5.8296, lng: 7.3392, radiusKm: 10 },
    ],
  },
  {
    name: "Rivers",
    // Flip to `true` to open all of Rivers State instead of just the cities below.
    allowWholeState: false,
    center: { lat: 4.8156, lng: 7.0498 },
    radiusKm: 60,
    cities: [
      { name: "Woji, Port Harcourt", lat: 4.8235, lng: 7.0398, radiusKm: 8 },

      // Uncomment to add more Rivers cities — each is allowed automatically:
      // { name: "GRA Phase 2, Port Harcourt", lat: 4.8156, lng: 7.0134, radiusKm: 6 },
      // { name: "Trans-Amadi, Port Harcourt", lat: 4.7947, lng: 7.0298, radiusKm: 1 },
    ],
  },

  // Add a whole new state the same way. Example (commented out):
  // {
  //   name: "Lagos",
  //   allowWholeState: false,
  //   center: { lat: 6.5244, lng: 3.3792 },
  //   radiusKm: 70,
  //   cities: [
  //     { name: "Ikeja", lat: 6.6018, lng: 3.3515, radiusKm: 10 },
  //     { name: "Lekki", lat: 6.4698, lng: 3.5852, radiusKm: 12 },
  //   ],
  // },
];

/* ============================================================
   ROUTE EXEMPTIONS — paths that skip the location gate entirely
   (e.g. a shared-property link a landlord sends to an out-of-state
   family member, or a marking-agent job link). Empty by default —
   the whole site is gated. Uncomment a prefix to exempt it.
   ============================================================ */
export const GATE_EXEMPT_PATH_PREFIXES: string[] = [
  // "/share",
  // "/mark-property",
];

// How the check works

// Each state is a "zone" with one center point + radius, and a list of city zones (each also a point + radius). For a visitor's GPS coordinate, checkGeoAccess draws an imaginary circle around each allowed point and asks "is the visitor's coordinate inside this circle?" using straight-line (haversine) distance — not real map/LGA boundaries.

// allowWholeState: true → only the state's center + radiusKm are checked. Anyone within that one big circle passes; the cities array is ignored entirely.
// allowWholeState: false (current setting for both Imo and Rivers) → the state's own center/radiusKm are ignored, and instead each city in cities is checked individually. A visitor passes only if they fall inside at least one city's circle.
// Rivers State's radiusKm (the one on the state object, line: radiusKm: 60)

// This one is currently unused/dormant — it only matters if you flip allowWholeState to true for Rivers. Then it defines the radius (60km) around the Rivers center point that would open the entire state. Since you want only Woji restricted, leave allowWholeState: false and that state-level radiusKm just sits there inactive, ready for if you ever want to open all of Rivers with one flip.

// City's radiusKm (e.g. Woji's radiusKm: 8)

// This is the one actually gating you right now. It draws an 8km circle around Woji's lat/lng (4.8235, 7.0398) — anyone with GPS coordinates within 8km of that point passes; everyone else in Rivers (Trans-Amadi, GRA, Rumuola, etc.) is rejected, even though they're in the same state.

// To restrict to a smaller/different area in Rivers (say, only Woji, not neighboring streets):

// Shrink radiusKm on the Woji entry — e.g. radiusKm: 3 tightens the circle to roughly Woji's core.
// Or add a second, more specific city entry with a smaller radius and remove/comment the broader one.
// To open more Rivers neighborhoods later, uncomment or add more entries to the cities array — each is an independent circle, so you can have many small allowed pockets inside one state without opening the whole thing.
// Caveat already noted in the file's comments: circles are an approximation, not true polygon boundaries — a visitor right at the edge of a radius could be misclassified either way. If you need street-accurate boundaries later, that would mean swapping this for a real GeoJSON polygon lookup.

