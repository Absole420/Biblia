import { GeoPlace } from "./themeMaps";

// Darstellungsklassen für Kartenorte (rein visuell; die Ortsdaten bleiben unverändert).
export type PlaceKind = "city" | "sacred" | "mount" | "desert" | "water";
export type PlaceTier = 1 | 2 | 3; // 1 = Hauptort · 2 = bedeutender Ort · 3 = Detailort

const PRIMARY = new Set(["jerusalem", "bethlehem", "nazareth", "jericho", "sinai", "horeb", "capernaum", "babylon", "rome", "rom"]);
const SACRED = new Set(["jerusalem", "shiloh", "bethel", "gerizim", "garizim", "gilgal"]);
const MOUNT = new Set(["carmel", "nebo", "sinai", "horeb", "hermon", "tabor", "gerizim", "garizim", "olives", "ebal", "gilboa", "ararat", "moriah"]);
const DESERT = new Set(["kadesh", "engedi", "beersheba", "qumran", "mara", "elim", "rephidim", "wilderness", "midian", "haran"]);
const WATER = new Set(["capernaum", "joppa", "caesarea", "tyre", "sidon", "magdala", "bethsaida", "tiberias", "ezion-geber", "tarshish", "troas", "ephesus", "corinth", "kenchreae", "puteoli", "malta", "patmos", "salamis", "seleucia", "attalia", "neapolis", "fair-havens"]);

const NT = /^(Mt|Mk|Lk|Joh|Apg|Röm|[12]Kor|Gal|Eph|Phil|Kol|[12]Thess|[12]Tim|Tit|Phlm|Hebr|Jak|[12]Petr|[123]Joh|Jud|Offb)\b/;

export function placeKind(p: GeoPlace): PlaceKind {
  if (SACRED.has(p.id) && !MOUNT.has(p.id)) return "sacred";
  if (MOUNT.has(p.id) || /^Berg /.test(p.name)) return "mount";
  if (WATER.has(p.id)) return "water";
  if (DESERT.has(p.id) || /Wüste/.test(p.name)) return "desert";
  return "city";
}

export function placeTier(p: GeoPlace): PlaceTier {
  if (PRIMARY.has(p.id)) return 1;
  return (p.events?.length ?? 0) > 0 ? 2 : 3;
}

/** „at“ / „nt“: kommt der Ort in Stellen des Alten bzw. Neuen Testaments vor? */
export function placeTestaments(p: GeoPlace): { at: boolean; nt: boolean } {
  const refs = [...p.refs, ...(p.events ?? []).map((e) => e.ref)];
  const nt = refs.some((r) => NT.test(r));
  const at = refs.some((r) => !NT.test(r));
  return { at, nt };
}

export type PlaceFilter = "all" | "at" | "nt" | "cities" | "sacred" | "mounts" | "events";
export const PLACE_FILTERS: { id: PlaceFilter; label: string; icon: string }[] = [
  { id: "all", label: "Alle", icon: "layers" },
  { id: "at", label: "Altes Testament", icon: "book" },
  { id: "nt", label: "Neues Testament", icon: "book-open" },
  { id: "cities", label: "Städte", icon: "home" },
  { id: "sacred", label: "Heilige Orte", icon: "sun" },
  { id: "mounts", label: "Berge", icon: "triangle" },
  { id: "events", label: "Ereignisse", icon: "star" },
];

export function matchesFilter(p: GeoPlace, f: PlaceFilter): boolean {
  const k = placeKind(p);
  switch (f) {
    case "all": return true;
    case "at": return placeTestaments(p).at;
    case "nt": return placeTestaments(p).nt;
    case "cities": return k === "city" || k === "water";
    case "sacred": return k === "sacred";
    case "mounts": return k === "mount";
    case "events": return (p.events?.length ?? 0) > 0;
  }
}
