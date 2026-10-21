import { HistoricalMap } from "./types";

// Historische Karte: Palästina zur Zeit Jesu – Orte des Johannesevangeliums.
// Koordinaten: Näherungswerte (WGS84) nach OpenBible.info Bible Geocoding und
// Pleiades Gazetteer. Sicherheitsgrad: secure = archäologisch gesichert,
// traditional = alte Ortstradition / weitgehend anerkannt, disputed = umstritten.
export const JOHN_HISTORICAL: HistoricalMap = {
  id: "john-hist",
  title: "Palästina zur Zeit Jesu",
  era: "ca. 27–30 n. Chr. · Römische Herrschaft (Präfektur Judäa, Tetrarchie des Herodes Antipas)",
  bounds: { latMin: 31.0, latMax: 33.4, lonMin: 34.2, lonMax: 36.0 },
  width: 800,
  height: 1250,
  regions: [
    { name: "GALILÄA", lat: 32.95, lon: 35.25 },
    { name: "SAMARIEN", lat: 32.28, lon: 35.1 },
    { name: "JUDÄA", lat: 31.55, lon: 35.0 },
    { name: "PERÄA", lat: 32.0, lon: 35.75 },
    { name: "DEKAPOLIS", lat: 32.65, lon: 35.8 },
  ],
  places: [
    { id: "jerusalem", name: "Jerusalem", lat: 31.778, lon: 35.235, certainty: "secure", refs: ["Joh 2,13", "Joh 5,1–2", "Joh 9,7", "Joh 12,12", "Joh 19,17–20"], note: "Stadt des Tempels. Teich Bethesda (Joh 5,2) und Teich Siloah (Joh 9,7) sind archäologisch nachgewiesen.", labelDx: -78, labelDy: 2 },
    { id: "bethany", name: "Bethanien", lat: 31.771, lon: 35.262, certainty: "traditional", refs: ["Joh 11,1.18", "Joh 12,1"], note: "Dorf am Osthang des Ölbergs (heute al-Eizariya). Die Identifizierung beruht auf alter Tradition und passt zur Entfernungsangabe in Joh 11,18.", labelDx: 14, labelDy: 10 },
    { id: "bethany-jordan", name: "Bethanien jenseits des Jordan", lat: 31.837, lon: 35.55, certainty: "disputed", refs: ["Joh 1,28", "Joh 10,40"], note: "Taufstelle des Johannes. Lage umstritten – oft mit Al-Maghtas (Jordanien) verbunden.", labelDx: 14, labelDy: -6 },
    { id: "cana", name: "Kana (?)", lat: 32.79, lon: 35.29, certainty: "disputed", refs: ["Joh 2,1.11", "Joh 4,46", "Joh 21,2"], note: "Lokalisierung umstritten: Khirbet Qana (hier dargestellt) oder Kafr Kanna.", labelDx: -70, labelDy: -6 },
    { id: "nazareth", name: "Nazareth", lat: 32.70, lon: 35.30, certainty: "secure", refs: ["Joh 1,45–46", "Joh 19,19"], note: "Heimatort Jesu; archäologisch als kleines Dorf des 1. Jh. belegt.", labelDx: -82, labelDy: 6 },
    { id: "capernaum", name: "Kapernaum", lat: 32.881, lon: 35.575, certainty: "secure", refs: ["Joh 2,12", "Joh 6,17.24.59"], note: "Tell Hum am Nordufer des Sees; Synagogenreste und Wohnhäuser ausgegraben.", labelDx: -92, labelDy: -10 },
    { id: "bethsaida", name: "Bethsaida (?)", lat: 32.91, lon: 35.63, certainty: "disputed", refs: ["Joh 1,44", "Joh 12,21"], note: "Heimat von Philippus, Andreas und Petrus. Diskutiert: et-Tell oder el-Araj.", labelDx: 12, labelDy: -14 },
    { id: "tiberias", name: "Tiberias", lat: 32.79, lon: 35.53, certainty: "secure", refs: ["Joh 6,1.23", "Joh 21,1"], note: "Um 20 n. Chr. von Herodes Antipas gegründet.", labelDx: -78, labelDy: 12 },
    { id: "sychar", name: "Sychar / Jakobsbrunnen", lat: 32.209, lon: 35.285, certainty: "traditional", refs: ["Joh 4,5–6"], note: "Traditionell bei Askar nahe Nablus; der Jakobsbrunnen ist alte Ortstradition.", labelDx: 14, labelDy: -4 },
    { id: "aenon", name: "Änon bei Salim (?)", lat: 32.35, lon: 35.52, certainty: "disputed", refs: ["Joh 3,23"], note: "Taufort des Johannes; Lage unbekannt, mehrere Vorschläge.", labelDx: 14, labelDy: -4 },
    { id: "ephraim", name: "Ephraim (?)", lat: 31.955, lon: 35.30, certainty: "disputed", refs: ["Joh 11,54"], note: "Oft mit et-Taiyiba nordöstlich von Jerusalem gleichgesetzt.", labelDx: 14, labelDy: -4 },
  ],
  sources: [
    "OpenBible.info – Bible Geocoding (CC BY 4.0), Koordinaten als Näherungswerte",
    "Pleiades Gazetteer of Ancient Places (CC BY 3.0)",
    "Flavius Josephus, Jüdische Altertümer / Jüdischer Krieg",
    "Hinweis: Küstenlinie und Gewässer schematisch vereinfacht",
  ],
};

export function project(map: HistoricalMap, lat: number, lon: number) {
  const { latMin, latMax, lonMin, lonMax } = map.bounds;
  return {
    x: ((lon - lonMin) / (lonMax - lonMin)) * map.width,
    y: ((latMax - lat) / (latMax - latMin)) * map.height,
  };
}

// Vereinfachte Geografie als [lat, lon]-Polygone/Linien.
export const COASTLINE: [number, number][] = [
  [33.4, 35.22], [33.27, 35.2], [33.09, 35.1], [32.92, 35.07], [32.83, 34.98], [32.8, 34.95],
  [32.62, 34.92], [32.5, 34.89], [32.3, 34.85], [32.08, 34.77], [31.85, 34.68], [31.67, 34.56],
  [31.5, 34.46], [31.32, 34.3], [31.2, 34.22], [31.0, 34.2],
];
export const GALILEE_SEA: [number, number][] = [
  [32.885, 35.57], [32.875, 35.62], [32.84, 35.65], [32.78, 35.645], [32.72, 35.62], [32.705, 35.585],
  [32.74, 35.545], [32.79, 35.525], [32.84, 35.525],
];
export const DEAD_SEA: [number, number][] = [
  [31.77, 35.52], [31.76, 35.58], [31.6, 35.58], [31.45, 35.6], [31.3, 35.53], [31.12, 35.47],
  [31.18, 35.39], [31.35, 35.4], [31.5, 35.46], [31.62, 35.46], [31.72, 35.48],
];
export const JORDAN: [number, number][] = [
  [33.25, 35.62], [33.05, 35.62], [32.9, 35.6], [32.705, 35.585], [32.6, 35.57], [32.45, 35.56],
  [32.3, 35.55], [32.15, 35.53], [32.0, 35.53], [31.85, 35.54], [31.77, 35.55],
];
