// Thematische historische Karten. Koordinaten: WGS84-Näherungswerte nach
// OpenBible.info Bible Geocoding (CC BY 4.0) und Pleiades (CC BY 3.0).
// Gesichert = archäologisch/historisch gut belegt · Tradition = alte, weithin
// anerkannte Ortstradition · Umstritten = Lokalisierung unsicher.
import { JOHN_HISTORICAL } from "./historical";
import { Certainty } from "./types";

export type MapEvent = { title: string; ref: string };
export type GeoPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  certainty: Certainty;
  refs: string[];
  note: string;
  events?: MapEvent[];
  figures?: string[];
  left?: boolean; // Beschriftung links vom Punkt
};
export type GeoRoute = { id: string; name: string; pts: [number, number][]; certainty: Certainty | "hypothetical"; color: string; refs: string; note: string };
export type GeoLabel = { name: string; lat: number; lon: number; size?: number; kind?: "region" | "sea" | "tribe" };
export type ThemeMap = {
  id: string;
  title: string;
  era: string;
  bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number };
  pxPerDeg: number;
  places: GeoPlace[];
  routes: GeoRoute[];
  labels: GeoLabel[];
  note?: string;
};

const P = (id: string, name: string, lat: number, lon: number, certainty: Certainty, refs: string[], note: string, extra: Partial<GeoPlace> = {}): GeoPlace => ({ id, name, lat, lon, certainty, refs, note, ...extra });

// ---- Gemeinsame Orte ----
const JERUSALEM = P("jerusalem", "Jerusalem", 31.778, 35.235, "secure", ["2Sam 5,6–9", "1Kö 6,1", "2Kö 25,8–10", "Joh 19,17–20"], "Stadt Davids, Ort des Tempels Salomos und des zweiten Tempels.", {
  events: [{ title: "David erobert Jerusalem", ref: "2Sam 5,6–9" }, { title: "Tempelbau Salomos", ref: "1Kö 6,1" }, { title: "Zerstörung durch Babylon (586 v. Chr.)", ref: "2Kö 25,8–10" }, { title: "Kreuzigung und Auferstehung Jesu", ref: "Joh 19–20" }, { title: "Pfingsten", ref: "Apg 2,1–4" }],
  figures: ["David", "Salomo", "Jesaja", "Jeremia", "Jesus", "Petrus"],
});
const BETHLEHEM = P("bethlehem", "Bethlehem", 31.705, 35.2, "secure", ["Rut 1,19", "1Sam 16,1–13", "Mi 5,1", "Mt 2,1"], "Heimat Ruts und Davids; Geburtsort Jesu nach Mt 2 und Lk 2.", { events: [{ title: "David wird gesalbt", ref: "1Sam 16,13" }, { title: "Geburt Jesu", ref: "Lk 2,4–7" }], figures: ["Rut", "Boas", "David", "Jesus"], left: true });
const HEBRON = P("hebron", "Hebron", 31.525, 35.11, "secure", ["1Mo 23,19", "2Sam 2,1–4"], "Grab der Patriarchen (Machpela); David wird hier König über Juda.", { events: [{ title: "Abraham kauft die Höhle Machpela", ref: "1Mo 23" }, { title: "David König über Juda", ref: "2Sam 2,4" }], figures: ["Abraham", "Sara", "David"], left: true });
const BEERSHEBA = P("beersheba", "Beerscheba", 31.245, 34.84, "secure", ["1Mo 21,31–33", "1Mo 46,1", "Ri 20,1"], "Südgrenze Israels („von Dan bis Beerscheba“).", { figures: ["Abraham", "Isaak", "Jakob"], left: true });
const SHECHEM = P("shechem", "Sichem", 32.213, 35.282, "secure", ["1Mo 12,6", "Jos 24,1", "1Kö 12,1"], "Tell Balata. Erste Station Abrahams in Kanaan; Landtag unter Josua; Reichsteilung.", { events: [{ title: "Gott erscheint Abraham", ref: "1Mo 12,6–7" }, { title: "Bundeserneuerung unter Josua", ref: "Jos 24" }, { title: "Reichsteilung", ref: "1Kö 12,1–20" }], figures: ["Abraham", "Josua", "Rehabeam", "Jerobeam"] });
const BETHEL = P("bethel", "Bethel", 31.93, 35.22, "traditional", ["1Mo 28,10–19", "1Kö 12,29"], "Meist mit Beitin identifiziert. Jakobs Traum von der Himmelsleiter; später Kultort des Nordreichs.", { events: [{ title: "Jakobs Traum", ref: "1Mo 28,12" }, { title: "Goldenes Kalb Jerobeams", ref: "1Kö 12,29" }], figures: ["Jakob", "Jerobeam", "Amos"], left: true });
const JERICHO = P("jericho", "Jericho", 31.871, 35.444, "secure", ["Jos 6", "Lk 10,30", "Lk 19,1–10"], "Tell es-Sultan, eine der ältesten Städte der Welt. Die Datierung der Zerstörung (Jos 6) ist archäologisch umstritten.", { events: [{ title: "Fall Jerichos", ref: "Jos 6,20" }, { title: "Zachäus", ref: "Lk 19,1–10" }], figures: ["Josua", "Rahab", "Zachäus"] });
const DAN = P("dan", "Dan", 33.249, 35.652, "secure", ["Ri 18,29", "1Kö 12,29"], "Tel Dan. Nordgrenze Israels; Fund der „Haus-Davids“-Inschrift (9. Jh. v. Chr.).", { figures: ["Jerobeam"] });
const SAMARIA = P("samaria", "Samaria", 32.276, 35.197, "secure", ["1Kö 16,24", "2Kö 17,5–6"], "Hauptstadt des Nordreichs, von Omri gegründet; 722 v. Chr. von Assyrien erobert.", { events: [{ title: "Omri gründet Samaria", ref: "1Kö 16,24" }, { title: "Fall Samarias (722 v. Chr.)", ref: "2Kö 17,6" }], figures: ["Omri", "Ahab", "Isebel", "Elia", "Elisa"], left: true });
const CARMEL = P("carmel", "Berg Karmel", 32.73, 35.05, "secure", ["1Kö 18,19–40"], "Gebirgszug an der Küste. Der genaue Ort des Gottesurteils ist Tradition (el-Muhraqa).", { events: [{ title: "Elia und die Baalspropheten", ref: "1Kö 18,38" }], figures: ["Elia", "Ahab"], left: true });
const MEGIDDO = P("megiddo", "Megiddo", 32.585, 35.185, "secure", ["1Kö 9,15", "2Kö 23,29", "Offb 16,16"], "Festungsstadt an der Via Maris. „Harmagedon“ (Offb 16,16) wird meist als „Berg Megiddo“ gedeutet.", { events: [{ title: "Josia fällt gegen Necho", ref: "2Kö 23,29" }], figures: ["Salomo", "Josia"], left: true });
const HAZOR = P("hazor", "Hazor", 33.017, 35.568, "secure", ["Jos 11,10–13", "1Kö 9,15"], "Größte Stadt Kanaans im Norden.", { figures: ["Josua", "Salomo"] });
const SHILOH = P("shiloh", "Silo", 32.055, 35.29, "secure", ["Jos 18,1", "1Sam 1,3", "1Sam 3"], "Khirbet Seilun. Standort der Stiftshütte; Samuels Berufung.", { events: [{ title: "Stiftshütte in Silo", ref: "Jos 18,1" }, { title: "Berufung Samuels", ref: "1Sam 3" }], figures: ["Hanna", "Eli", "Samuel"] });
const GAZA = P("gaza", "Gaza", 31.5, 34.46, "secure", ["Ri 16,21–30", "Apg 8,26"], "Philisterstadt.", { events: [{ title: "Simsons Tod", ref: "Ri 16,30" }], figures: ["Simson", "Philippus"], left: true });
const JOPPA = P("joppa", "Joppe", 32.05, 34.75, "secure", ["Jona 1,3", "Apg 9,36–43", "Apg 10"], "Hafenstadt (heute Jaffa).", { events: [{ title: "Jona flieht nach Tarsis", ref: "Jona 1,3" }, { title: "Petrus’ Vision", ref: "Apg 10,9–16" }], figures: ["Jona", "Petrus", "Tabita"], left: true });
const CAESAREA = P("caesarea", "Caesarea", 32.5, 34.89, "secure", ["Apg 10,1", "Apg 23,33", "Apg 25,1–12"], "Hafenstadt des Herodes, Sitz der römischen Statthalter (Pilatus-Inschrift).", { events: [{ title: "Taufe des Kornelius", ref: "Apg 10,44–48" }, { title: "Paulus’ Haft und Berufung auf den Kaiser", ref: "Apg 25,11" }], figures: ["Kornelius", "Paulus", "Felix", "Festus"], left: true });
const NEBO = P("nebo", "Berg Nebo", 31.768, 35.725, "traditional", ["5Mo 34,1–5"], "Traditionell der Dschebel Siyagha. Mose sieht das verheißene Land und stirbt.", { events: [{ title: "Mose sieht das Land", ref: "5Mo 34,1–4" }], figures: ["Mose"] });
const DAMASCUS = P("damascus", "Damaskus", 33.513, 36.292, "secure", ["1Mo 14,15", "2Kö 5", "Apg 9,1–19"], "Hauptstadt Arams.", { events: [{ title: "Bekehrung des Saulus", ref: "Apg 9,3–19" }], figures: ["Naaman", "Paulus", "Hananias"] });
const TYRE = P("tyre", "Tyrus", 33.27, 35.2, "secure", ["1Kö 5,15", "Hes 26", "Mk 7,24", "Apg 21,3"], "Phönizische Hafenstadt; König Hiram half beim Tempelbau.", { figures: ["Hiram", "Hesekiel"], left: true });
const QUMRAN = P("qumran", "Qumran", 31.741, 35.459, "secure", [], "Fundort der Schriftrollen vom Toten Meer (u. a. große Jesajarolle). Kein biblischer Ort, aber zentral für die Textgeschichte.");
const ENGEDI = P("engedi", "En-Gedi", 31.46, 35.39, "secure", ["1Sam 24,1–8", "Hld 1,14"], "Oase am Toten Meer. David verschont Saul in einer Höhle.", { events: [{ title: "David verschont Saul", ref: "1Sam 24" }], figures: ["David", "Saul"] });

const john = (id: string) => {
  const p = JOHN_HISTORICAL.places.find((x) => x.id === id)!;
  return P(p.id, p.name, p.lat, p.lon, p.certainty, p.refs, p.note, { left: (p.labelDx ?? 0) < 0 });
};

const ISRAEL_LABELS: GeoLabel[] = [
  { name: "Mittelmeer", lat: 32.4, lon: 34.35, kind: "sea" },
  { name: "Totes Meer", lat: 31.35, lon: 35.62, kind: "sea", size: 0.7 },
  { name: "GALILÄA", lat: 32.98, lon: 35.3 },
  { name: "SAMARIEN", lat: 32.3, lon: 35.05 },
  { name: "JUDÄA", lat: 31.62, lon: 34.98 },
  { name: "NEGEV", lat: 30.75, lon: 34.85 },
  { name: "MOAB", lat: 31.4, lon: 35.9 },
  { name: "GILEAD", lat: 32.3, lon: 35.85 },
  { name: "EDOM", lat: 30.4, lon: 35.6 },
];

// ---------------------------------------------------------------------------
export const THEME_MAPS: Record<string, ThemeMap> = {
  journey: {
    id: "journey",
    title: "Studienreise",
    era: "Wähle ein Themenfeld und starte die Lektionen",
    bounds: { latMin: 28.2, latMax: 33.8, lonMin: 32.3, lonMax: 37.0 },
    pxPerDeg: 300,
    labels: [...ISRAEL_LABELS, { name: "SINAI", lat: 29.9, lon: 33.6 }, { name: "→ Babylon", lat: 32.9, lon: 36.6, kind: "sea", size: 0.8 }, { name: "← Rom", lat: 33.6, lon: 33.0, kind: "sea", size: 0.8 }],
    routes: [],
    places: [],
  },
  overview: {
    id: "overview",
    title: "Das Land der Bibel",
    era: "Übersicht · Orte aus Altem und Neuem Testament",
    bounds: { latMin: 29.45, latMax: 33.6, lonMin: 33.95, lonMax: 36.55 },
    pxPerDeg: 470,
    labels: ISRAEL_LABELS,
    routes: [],
    places: [
      DAN, HAZOR, john("capernaum"), john("nazareth"), MEGIDDO, CARMEL, CAESAREA, SAMARIA, SHECHEM, SHILOH, BETHEL, JOPPA, JERICHO, JERUSALEM, BETHLEHEM, QUMRAN, HEBRON, ENGEDI, GAZA, BEERSHEBA, NEBO,
      P("kadesh", "Kadesch-Barnea", 30.645, 34.42, "traditional", ["4Mo 13,26", "4Mo 20,1"], "Ein el-Qudeirat. Lagerort Israels in der Wüste.", { figures: ["Mose", "Mirjam"] }),
    ],
  },

  tora: {
    id: "tora",
    title: "Tora · Patriarchen & Exodus",
    era: "Patriarchenzeit und Auszug aus Ägypten (Datierung in der Forschung diskutiert)",
    bounds: { latMin: 26.8, latMax: 37.6, lonMin: 29.0, lonMax: 47.5 },
    pxPerDeg: 82,
    note: "Die Exodus-Route ist eine HYPOTHESE (traditionelle Südroute). Die Stationen folgen 2Mo 12–19 und 4Mo 33; ihre Lage ist großteils unbekannt. Alternativen: nördliche Küstenroute, Route nach Midian.",
    labels: [
      { name: "ÄGYPTEN", lat: 28.4, lon: 30.6 },
      { name: "GOSCHEN", lat: 30.75, lon: 31.55, size: 0.6 },
      { name: "SINAI", lat: 29.2, lon: 33.7 },
      { name: "KANAAN", lat: 31.9, lon: 34.9, size: 0.7 },
      { name: "MESOPOTAMIEN", lat: 33.6, lon: 42.8 },
      { name: "ARABISCHE WÜSTE", lat: 30.4, lon: 39.5, size: 0.8 },
      { name: "Mittelmeer", lat: 34.0, lon: 31.0, kind: "sea" },
      { name: "Rotes Meer", lat: 27.3, lon: 34.9, kind: "sea", size: 0.8 },
      { name: "Euphrat", lat: 35.0, lon: 40.2, kind: "sea", size: 0.6 },
      { name: "Nil", lat: 27.6, lon: 31.1, kind: "sea", size: 0.6 },
    ],
    routes: [
      {
        id: "abraham", name: "Weg Abrahams", color: "#C28E3A", certainty: "traditional", refs: "1Mo 11,31; 12,1–10; 13,1–18",
        note: "Stationen nach 1. Mose 11–13; Linienführung entlang des „Fruchtbaren Halbmonds“ schematisch.",
        pts: [[30.962, 46.103], [32.0, 44.6], [33.4, 43.0], [35.0, 40.6], [36.865, 39.031], [36.2, 37.15], [34.8, 36.7], [33.513, 36.292], [32.213, 35.282], [31.93, 35.22], [31.0, 34.6], [30.6, 32.3], [31.0, 34.6], [31.525, 35.11]],
      },
      {
        id: "exodus", name: "Exodus (hypothetische Südroute)", color: "#3FA7A0", certainty: "hypothetical", refs: "2Mo 12,37; 13,20; 14,2; 15,22–27; 16,1; 17,1; 19,1–2; 4Mo 33",
        note: "Ramses → Sukkot → Etam → Pi-Hahirot (Durchzug durchs Schilfmeer) → Mara → Elim → Wüste Sin → Refidim → Sinai → Ezjon-Geber → Kadesch → Berg Hor → um Edom herum → Ebene Moab → Jordan bei Jericho. Lage der meisten Stationen unbekannt.",
        pts: [[30.8, 31.83], [30.55, 32.1], [30.45, 32.3], [30.2, 32.45], [29.6, 32.75], [29.3, 32.9], [28.9, 33.35], [28.7, 33.65], [28.539, 33.975], [29.53, 35.0], [30.645, 34.42], [30.317, 35.4], [30.2, 35.9], [30.9, 35.98], [31.45, 35.78], [31.83, 35.62], [31.871, 35.444]],
      },
      {
        id: "jacob", name: "Jakobs Familie zieht nach Ägypten", color: "#D97736", certainty: "traditional", refs: "1Mo 46,1–7.28",
        note: "Von Beerscheba nach Goschen; Verlauf schematisch.",
        pts: [[31.245, 34.84], [31.1, 33.9], [30.9, 32.6], [30.75, 31.75]],
      },
    ],
    places: [
      P("ur", "Ur in Chaldäa", 30.962, 46.103, "traditional", ["1Mo 11,28–31", "Neh 9,7"], "Meist mit Tell el-Muqayyar im Südirak gleichgesetzt; eine nördliche Lokalisierung (bei Urfa) wird ebenfalls vertreten.", { events: [{ title: "Terach zieht mit Abram aus", ref: "1Mo 11,31" }], figures: ["Terach", "Abram", "Sarai", "Lot"], left: true }),
      P("haran", "Haran", 36.865, 39.031, "secure", ["1Mo 11,31–32", "1Mo 12,4", "1Mo 29,4"], "Harran in der heutigen Südtürkei.", { events: [{ title: "Gottes Ruf an Abram", ref: "1Mo 12,1–4" }, { title: "Jakob bei Laban", ref: "1Mo 29" }], figures: ["Abram", "Laban", "Jakob", "Rahel", "Lea"] }),
      { ...SHECHEM, left: true }, { ...BETHEL, left: false }, HEBRON, BEERSHEBA,
      P("on", "On (Heliopolis)", 30.129, 31.307, "secure", ["1Mo 41,45"], "Josef heiratet Asenat, die Tochter des Priesters von On.", { figures: ["Josef", "Asenat"], left: true }),
      P("rameses", "Ramses (Pi-Ramesse)", 30.8, 31.83, "traditional", ["2Mo 1,11", "2Mo 12,37"], "Pi-Ramesse bei Qantir ist archäologisch gesichert; die Gleichsetzung mit dem biblischen Ramses ist verbreitet.", { events: [{ title: "Fronarbeit Israels", ref: "2Mo 1,11–14" }, { title: "Aufbruch Israels", ref: "2Mo 12,37" }], figures: ["Mose", "Aaron", "Pharao"], left: true }),
      P("sukkot", "Sukkot (?)", 30.55, 32.1, "disputed", ["2Mo 12,37", "2Mo 13,20"], "Oft mit Tell el-Maschuta im Wadi Tumilat verbunden.", { left: true }),
      P("redsea", "Schilfmeer / Pi-Hahirot (?)", 30.2, 32.45, "disputed", ["2Mo 14,2", "2Mo 14,21–31"], "Hebr. Jam Suf. Die Lage des Durchzugs ist unbekannt; vorgeschlagen werden u. a. Bitterseen, Sirbonischer See oder der Golf von Suez bzw. Akaba.", { events: [{ title: "Durchzug durchs Meer", ref: "2Mo 14,21–22" }, { title: "Lied des Mose und der Mirjam", ref: "2Mo 15,1–21" }], figures: ["Mose", "Mirjam"] }),
      P("marah", "Mara (?)", 29.6, 32.75, "disputed", ["2Mo 15,23–25"], "Bitteres Wasser wird süß. Lage unbekannt.", { left: true }),
      P("elim", "Elim (?)", 29.3, 32.9, "disputed", ["2Mo 15,27"], "Zwölf Quellen und siebzig Palmen. Lage unbekannt.", { left: true }),
      P("sin", "Wüste Sin (?)", 28.9, 33.35, "disputed", ["2Mo 16,1–15"], "Manna und Wachteln.", { events: [{ title: "Manna vom Himmel", ref: "2Mo 16,14–15" }], left: true }),
      P("rephidim", "Refidim (?)", 28.7, 33.65, "disputed", ["2Mo 17,1–16"], "Wasser aus dem Felsen; Kampf gegen Amalek.", { events: [{ title: "Wasser aus dem Felsen", ref: "2Mo 17,6" }], figures: ["Mose", "Josua", "Aaron", "Hur"], left: true }),
      P("sinai", "Berg Sinai (?)", 28.539, 33.975, "disputed", ["2Mo 19,1–20", "2Mo 20,1–17", "2Mo 32", "2Mo 40,34"], "Traditionell der Dschebel Musa (Katharinenkloster). Alternativen: u. a. Har Karkom, Dschebel Sin Bischar, Dschebel al-Lawz (Arabien).", { events: [{ title: "Bundesschluss", ref: "2Mo 19–24" }, { title: "Die Zehn Gebote", ref: "2Mo 20,1–17" }, { title: "Goldenes Kalb", ref: "2Mo 32" }, { title: "Bau der Stiftshütte", ref: "2Mo 40" }], figures: ["Mose", "Aaron", "Josua"] }),
      P("eziongeber", "Ezjon-Geber (?)", 29.53, 35.0, "disputed", ["4Mo 33,35", "1Kö 9,26"], "Am Golf von Akaba; genaue Lage diskutiert."),
      P("kadesh", "Kadesch-Barnea", 30.645, 34.42, "traditional", ["4Mo 13,26", "4Mo 20,1–13", "5Mo 1,46"], "Meist mit Ein el-Qudeirat gleichgesetzt. Kundschafter; Mirjams Tod; Wasser aus dem Felsen.", { events: [{ title: "Aussendung der Kundschafter", ref: "4Mo 13" }], figures: ["Mose", "Kaleb", "Josua", "Mirjam"], left: true }),
      P("hor", "Berg Hor (?)", 30.317, 35.4, "disputed", ["4Mo 20,22–29"], "Aarons Tod. Traditionell bei Petra (Dschebel Harun); umstritten.", { figures: ["Aaron", "Eleasar"] }),
      P("moab", "Ebene Moab", 31.83, 35.62, "traditional", ["4Mo 22,1", "5Mo 1,5"], "Lager Israels gegenüber Jericho; Ort der Reden des Deuteronomiums und der Bileamerzählung.", { events: [{ title: "Bileam segnet Israel", ref: "4Mo 23–24" }, { title: "Mose legt die Tora aus", ref: "5Mo 1,5" }], figures: ["Mose", "Bileam", "Balak"] }),
      NEBO, JERICHO,
    ],
  },

  history: {
    id: "history",
    title: "Stämme & Königreiche",
    era: "Landnahme, Richterzeit, Königreiche Israel und Juda (ca. 1200–586 v. Chr.)",
    bounds: { latMin: 30.4, latMax: 33.7, lonMin: 34.1, lonMax: 36.6 },
    pxPerDeg: 420,
    note: "Stammesgebiete schematisch nach Jos 13–19. Die Grenzen änderten sich im Lauf der Geschichte.",
    labels: [
      ...ISRAEL_LABELS.filter((l) => l.kind === "sea"),
      { name: "NORDREICH ISRAEL", lat: 32.55, lon: 35.6, size: 0.75 },
      { name: "SÜDREICH JUDA", lat: 31.35, lon: 34.95, size: 0.75 },
      ...[["Asser", 33.0, 35.17], ["Naftali", 33.05, 35.45], ["Sebulon", 32.76, 35.28], ["Issachar", 32.62, 35.45], ["Manasse", 32.38, 35.2], ["Ost-Manasse", 32.75, 35.95], ["Ephraim", 32.07, 35.18], ["Benjamin", 31.84, 35.33], ["Dan (Süd)", 31.86, 34.92], ["Juda", 31.5, 35.0], ["Simeon", 31.15, 34.72], ["Gad", 32.1, 35.75], ["Ruben", 31.6, 35.78]].map(([n, la, lo]) => ({ name: n as string, lat: la as number, lon: lo as number, kind: "tribe" as const })),
    ],
    routes: [],
    places: [
      DAN, HAZOR, MEGIDDO, CARMEL, SAMARIA, SHECHEM, SHILOH, BETHEL, JERICHO, JERUSALEM, BETHLEHEM, HEBRON, BEERSHEBA, GAZA, TYRE, DAMASCUS,
      P("jezreel", "Jesreel", 32.556, 35.33, "secure", ["1Kö 21", "2Kö 9,30–37"], "Residenz Ahabs; Nabots Weinberg.", { events: [{ title: "Nabots Weinberg", ref: "1Kö 21" }], figures: ["Ahab", "Isebel", "Nabot", "Jehu"] }),
      P("gibeon", "Gibeon", 31.847, 35.185, "secure", ["Jos 9", "Jos 10,12", "1Kö 3,4–15"], "El-Dschib. Bündnis mit Josua; Salomos Traum.", { events: [{ title: "Salomo bittet um Weisheit", ref: "1Kö 3,9" }], figures: ["Josua", "Salomo"], left: true }),
      P("ai", "Ai (?)", 31.917, 35.26, "disputed", ["Jos 7–8"], "Meist mit et-Tell gleichgesetzt; archäologisch problematisch."),
      P("lachish", "Lachisch", 31.565, 34.849, "secure", ["2Kö 18,14", "Jer 34,7"], "Festung Judas; Belagerung durch Sanherib (701 v. Chr.) ist auf assyrischen Reliefs dargestellt.", { left: true }),
      P("ashdod", "Aschdod", 31.75, 34.65, "secure", ["1Sam 5,1–5"], "Philisterstadt; die Bundeslade im Tempel Dagons.", { left: true }),
      P("rabbah", "Rabba (Ammon)", 31.95, 35.93, "secure", ["2Sam 11,1", "2Sam 12,26–31"], "Heute Amman. Während der Belagerung: David und Batseba.", { figures: ["Joab", "Uria"] }),
    ],
  },

  psalms: {
    id: "psalms",
    title: "Psalmen & Weisheit",
    era: "Orte aus Davids Leben und den Psalm-Überschriften",
    bounds: { latMin: 30.9, latMax: 33.6, lonMin: 34.3, lonMax: 36.4 },
    pxPerDeg: 470,
    note: "Die Psalm-Überschriften (z. B. Ps 57; 63) verbinden einzelne Psalmen mit Situationen aus Davids Leben. Ob sie ursprünglich sind, wird diskutiert.",
    labels: ISRAEL_LABELS,
    routes: [],
    places: [
      { ...JERUSALEM, refs: ["Ps 48", "Ps 122", "Ps 137,5–6"], events: [{ title: "Zion, die Stadt Gottes", ref: "Ps 48,2–3" }, { title: "Wallfahrtslied", ref: "Ps 122" }] },
      BETHLEHEM, HEBRON, ENGEDI,
      P("hermon", "Hermon", 33.416, 35.857, "secure", ["Ps 42,7", "Ps 89,13", "Ps 133,3"], "Höchster Berg der Region.", { events: [{ title: "„Wie der Tau des Hermon“", ref: "Ps 133,3" }] }),
      P("tabor", "Tabor", 32.687, 35.39, "secure", ["Ri 4,6", "Ps 89,13"], "Markanter Berg in Galiläa.", { left: true }),
      P("adullam", "Höhle Adullam", 31.65, 34.96, "traditional", ["1Sam 22,1", "Ps 142,1"], "David flieht vor Saul. Ps 142 nennt „als er in der Höhle war“.", { figures: ["David"], left: true }),
      P("gath", "Gat", 31.7, 34.85, "traditional", ["1Sam 17,4", "1Sam 21,11", "Ps 56,1"], "Tell es-Safi. Heimat Goliats; David gibt sich als Wahnsinniger aus.", { figures: ["Goliat", "David", "Achisch"], left: true }),
      P("judeanwild", "Wüste Juda", 31.55, 35.3, "secure", ["Ps 63,1"], "„Ein Psalm Davids, als er in der Wüste Juda war“."),
      P("uz", "Land Uz (?)", 30.6, 35.7, "disputed", ["Hi 1,1", "Kla 4,21"], "Heimat Hiobs. Lage unbekannt; Kla 4,21 verbindet Uz mit Edom, andere denken an den Hauran."),
    ],
  },

  prophets: {
    id: "prophets",
    title: "Propheten · Assyrien & Babylon",
    era: "8.–6. Jh. v. Chr.: Fall Samarias (722), Fall Jerusalems (586), Exil und Rückkehr (ab 538)",
    bounds: { latMin: 28.8, latMax: 37.6, lonMin: 30.5, lonMax: 49.0 },
    pxPerDeg: 80,
    labels: [
      { name: "ASSYRIEN", lat: 36.6, lon: 43.6 },
      { name: "BABYLONIEN", lat: 31.8, lon: 45.6 },
      { name: "ÄGYPTEN", lat: 29.6, lon: 31.0 },
      { name: "JUDA", lat: 31.4, lon: 34.9, size: 0.6 },
      { name: "ELAM", lat: 32.7, lon: 48.0, size: 0.7 },
      { name: "Mittelmeer", lat: 34.0, lon: 32.2, kind: "sea" },
      { name: "Persischer Golf", lat: 29.3, lon: 48.7, kind: "sea", size: 0.6 },
    ],
    routes: [
      { id: "exile", name: "Deportation nach Babylon", color: "#E0A93B", certainty: "traditional", refs: "2Kö 24,14–16; 25,6–11; Jer 52,9", note: "Über Ribla am Orontes entlang des Euphrat. Verlauf schematisch.", pts: [[31.778, 35.235], [33.513, 36.292], [34.5, 36.55], [35.5, 38.0], [35.0, 40.4], [34.0, 42.1], [32.536, 44.421]] },
      { id: "return", name: "Rückkehr aus dem Exil", color: "#3FA7A0", certainty: "traditional", refs: "Esr 1,1–4; Esr 7,6–9", note: "Nach dem Edikt des Kyrus (538 v. Chr.). Verlauf schematisch.", pts: [[32.536, 44.421], [33.6, 43.0], [34.7, 41.0], [35.6, 38.6], [34.6, 36.8], [33.0, 36.1], [31.778, 35.235]] },
      { id: "assyria", name: "Deportation des Nordreichs", color: "#B05A4E", certainty: "traditional", refs: "2Kö 17,6", note: "„… und ließ sie wohnen in Halach und am Habor … und in den Städten Mediens“. Verlauf schematisch.", pts: [[32.276, 35.197], [33.513, 36.292], [36.0, 38.6], [36.6, 40.7], [36.359, 43.153]] },
    ],
    places: [
      { ...JERUSALEM, refs: ["Jes 6,1", "Jer 7,1–15", "Kla 1,1", "2Kö 25,8–10"], events: [{ title: "Jesajas Berufung im Tempel", ref: "Jes 6,1–8" }, { title: "Jeremias Tempelrede", ref: "Jer 7" }, { title: "Zerstörung Jerusalems", ref: "2Kö 25,9" }], figures: ["Jesaja", "Jeremia", "Hiskia", "Zedekia"] },
      SAMARIA, DAMASCUS, TYRE,
      P("nineveh", "Ninive", 36.359, 43.153, "secure", ["Jona 3", "Nah 1,1", "2Kö 19,36"], "Hauptstadt Assyriens (gegenüber Mossul); 612 v. Chr. zerstört.", { events: [{ title: "Jona predigt", ref: "Jona 3,4" }], figures: ["Jona", "Sanherib", "Nahum"] }),
      P("babylon", "Babylon", 32.536, 44.421, "secure", ["2Kö 25,11", "Jer 29,1–7", "Dan 1,1–7", "Dan 5"], "Hauptstadt des neubabylonischen Reiches.", { events: [{ title: "Jeremias Brief an die Verbannten", ref: "Jer 29,4–7" }, { title: "Daniel am Hof", ref: "Dan 1" }, { title: "Schrift an der Wand", ref: "Dan 5" }], figures: ["Nebukadnezar", "Daniel", "Belsazar"] }),
      P("kebar", "Fluss Kebar (?)", 32.1, 45.25, "disputed", ["Hes 1,1–3", "Hes 3,15"], "Wohl ein Kanal bei Nippur; Hesekiels Visionen.", { events: [{ title: "Thronwagenvision", ref: "Hes 1" }], figures: ["Hesekiel"] }),
      P("susa", "Susa", 32.19, 48.26, "secure", ["Dan 8,2", "Neh 1,1", "Est 1,2"], "Residenz der Perserkönige.", { figures: ["Daniel", "Nehemia", "Ester"], left: true }),
      P("carchemish", "Karkemisch", 36.83, 38.01, "secure", ["Jer 46,2"], "Entscheidungsschlacht 605 v. Chr.: Babylon besiegt Ägypten.", { figures: ["Nebukadnezar", "Necho"] }),
      P("tahpanhes", "Tachpanhes", 30.87, 32.0, "traditional", ["Jer 43,7–9"], "Tell Defenneh. Jeremia wird nach Ägypten verschleppt.", { figures: ["Jeremia", "Baruch"], left: true }),
      P("anathoth", "Anatot", 31.81, 35.26, "traditional", ["Jer 1,1"], "Heimatort Jeremias nördlich von Jerusalem.", { figures: ["Jeremia"] }),
      P("assur", "Assur", 35.456, 43.262, "secure", ["1Mo 10,11"], "Alte Hauptstadt und Namensgeberin Assyriens."),
    ],
  },

  gospels: {
    id: "gospels",
    title: "Palästina zur Zeit Jesu",
    era: JOHN_HISTORICAL.era,
    bounds: { latMin: 31.1, latMax: 33.45, lonMin: 34.4, lonMax: 36.1 },
    pxPerDeg: 560,
    labels: ISRAEL_LABELS.filter((l) => !["NEGEV", "EDOM"].includes(l.name)).concat([{ name: "See Genezareth", lat: 32.83, lon: 35.75, kind: "sea", size: 0.55 }, { name: "DEKAPOLIS", lat: 32.6, lon: 35.85 }]),
    routes: [],
    places: [
      ...JOHN_HISTORICAL.places.map((p) => john(p.id)),
      { ...BETHLEHEM, left: true },
      { ...JERICHO, left: false },
      P("caesareaphilippi", "Cäsarea Philippi", 33.248, 35.694, "secure", ["Mt 16,13–20"], "Banias an den Jordanquellen. Bekenntnis des Petrus.", { events: [{ title: "„Du bist der Christus“", ref: "Mt 16,16" }], figures: ["Petrus", "Jesus"] }),
      P("nain", "Nain", 32.63, 35.35, "secure", ["Lk 7,11–17"], "Auferweckung des Jünglings.", { figures: ["Jesus"] }),
      P("gerasa", "Gebiet der Gerasener (?)", 32.8, 35.64, "disputed", ["Mk 5,1–20", "Mt 8,28"], "Die Handschriften schwanken zwischen Gerasa, Gadara und Gergesa; oft bei Kursi am Ostufer gesucht."),
      P("emmaus", "Emmaus (?)", 31.84, 34.99, "disputed", ["Lk 24,13–35"], "Mehrere Vorschläge (u. a. Amwas/Nikopolis, el-Qubeibe, Moza).", { left: true }),
    ],
  },

  parables: {
    id: "parables",
    title: "Gleichnisse Jesu – Schauplätze",
    era: "Nur Orte, die der Bibeltext selbst nennt",
    bounds: { latMin: 31.5, latMax: 33.1, lonMin: 34.8, lonMax: 35.95 },
    pxPerDeg: 700,
    note: "Für die meisten Gleichnisse nennt die Bibel keinen Ort. Es werden nur Schauplätze gezeigt, die im Text erwähnt sind.",
    labels: [{ name: "GALILÄA", lat: 32.95, lon: 35.2 }, { name: "SAMARIEN", lat: 32.3, lon: 35.1 }, { name: "JUDÄA", lat: 31.65, lon: 35.05 }, { name: "See Genezareth", lat: 32.83, lon: 35.72, kind: "sea", size: 0.6 }],
    routes: [{ id: "jericho-road", name: "Weg von Jerusalem nach Jericho", color: "#D97736", certainty: "traditional", refs: "Lk 10,30–37", note: "Schauplatz des Gleichnisses vom barmherzigen Samariter. Verlauf der Römerstraße vereinfacht.", pts: [[31.778, 35.235], [31.79, 35.3], [31.82, 35.36], [31.84, 35.41], [31.871, 35.444]] }],
    places: [
      P("lakeshore", "Am See (bei Kapernaum)", 32.875, 35.56, "traditional", ["Mk 4,1–9", "Mt 13,1–3"], "Jesus lehrt vom Boot aus in Gleichnissen.", { events: [{ title: "Vom Sämann", ref: "Mk 4,3–9" }, { title: "Vom Senfkorn", ref: "Mk 4,30–32" }], left: true }),
      P("temple", "Tempel in Jerusalem", 31.778, 35.235, "secure", ["Mt 21,23", "Mt 21,33–46", "Lk 18,10"], "Gleichnisse in der Auseinandersetzung im Tempel.", { events: [{ title: "Von den bösen Weingärtnern", ref: "Mt 21,33–46" }, { title: "Pharisäer und Zöllner (Schauplatz im Gleichnis)", ref: "Lk 18,10–14" }], left: true }),
      P("olives", "Ölberg", 31.778, 35.245, "secure", ["Mt 24,3", "Mt 25,1–30"], "Endzeitrede mit den Gleichnissen von den zehn Jungfrauen und den anvertrauten Talenten.", { events: [{ title: "Von den zehn Jungfrauen", ref: "Mt 25,1–13" }, { title: "Von den anvertrauten Talenten", ref: "Mt 25,14–30" }] }),
      P("samaritanroad", "Barmherziger Samariter", 31.82, 35.36, "traditional", ["Lk 10,30–37"], "Der Weg hinab nach Jericho (ca. 1000 Höhenmeter).", { events: [{ title: "Vom barmherzigen Samariter", ref: "Lk 10,30–37" }] }),
      { ...JERICHO, refs: ["Lk 19,1–27"], events: [{ title: "Zachäus und das Gleichnis von den Pfunden", ref: "Lk 19,11–27" }] },
    ],
  },

  acts: {
    id: "acts",
    title: "Apostelgeschichte · Reisen des Paulus",
    era: "ca. 30–62 n. Chr.",
    bounds: { latMin: 30.8, latMax: 42.3, lonMin: 11.8, lonMax: 37.2 },
    pxPerDeg: 62,
    note: "Stationen nach dem Text der Apostelgeschichte; Linienführung schematisch. Die Route durch Galatien (nord- oder südgalatische Hypothese) wird diskutiert.",
    labels: [{ name: "Mittelmeer", lat: 34.2, lon: 20.0, kind: "sea" }, { name: "ITALIEN", lat: 41.0, lon: 15.6, size: 0.8 }, { name: "MAZEDONIEN", lat: 41.4, lon: 22.6, size: 0.7 }, { name: "ACHAJA", lat: 38.3, lon: 21.9, size: 0.7 }, { name: "ASIA", lat: 38.7, lon: 28.6, size: 0.7 }, { name: "GALATIEN", lat: 39.6, lon: 32.6, size: 0.7 }, { name: "SYRIEN", lat: 35.0, lon: 36.6, size: 0.6 }, { name: "Ägäis", lat: 38.6, lon: 25.0, kind: "sea", size: 0.6 }],
    routes: [
      { id: "j1", name: "1. Missionsreise", color: "#D97736", certainty: "secure", refs: "Apg 13,1–14,28", note: "Antiochia – Zypern – Perge – Antiochia in Pisidien – Ikonion – Lystra – Derbe und zurück.", pts: [[36.2, 36.16], [36.12, 35.93], [35.18, 33.9], [34.76, 32.42], [36.96, 30.85], [38.3, 31.19], [37.87, 32.49], [37.6, 32.35], [37.35, 33.36], [37.6, 32.35], [38.3, 31.19], [36.89, 30.7], [36.2, 36.16]] },
      { id: "j2", name: "2. Missionsreise", color: "#4A7A8C", certainty: "secure", refs: "Apg 15,36–18,22", note: "Über Kleinasien nach Troas, dann Philippi, Thessalonich, Beröa, Athen, Korinth, Ephesus, Caesarea.", pts: [[36.2, 36.16], [36.92, 34.89], [37.35, 33.36], [37.6, 32.35], [38.3, 31.19], [39.75, 26.16], [40.94, 24.41], [41.01, 24.29], [40.82, 23.84], [40.64, 22.94], [40.52, 22.2], [37.97, 23.72], [37.906, 22.88], [37.94, 27.34], [32.5, 34.89], [31.778, 35.235], [36.2, 36.16]] },
      { id: "j3", name: "3. Missionsreise", color: "#7E5B82", certainty: "secure", refs: "Apg 18,23–21,17", note: "Ephesus (ca. drei Jahre), Mazedonien, Griechenland, Rückreise über Troas, Milet, Tyrus nach Jerusalem.", pts: [[36.2, 36.16], [38.3, 31.19], [37.94, 27.34], [39.75, 26.16], [41.01, 24.29], [40.64, 22.94], [37.906, 22.88], [41.01, 24.29], [39.75, 26.16], [39.49, 26.34], [39.1, 26.55], [37.53, 27.28], [36.89, 27.29], [36.44, 28.22], [36.26, 29.31], [33.27, 35.2], [32.92, 35.07], [32.5, 34.89], [31.778, 35.235]] },
      { id: "rome", name: "Reise nach Rom", color: "#8A2F3C", certainty: "secure", refs: "Apg 27,1–28,16", note: "Als Gefangener: Caesarea – Sidon – Myra – Knidos – Kreta – Schiffbruch vor Malta – Syrakus – Rhegion – Puteoli – Rom.", pts: [[32.5, 34.89], [33.56, 35.37], [36.26, 29.98], [36.69, 27.37], [34.93, 24.8], [35.9, 14.45], [37.07, 15.29], [38.11, 15.65], [40.82, 14.12], [41.9, 12.5]] },
    ],
    places: [
      { ...JERUSALEM, left: true }, { ...CAESAREA, left: true }, DAMASCUS,
      P("antioch", "Antiochia (Syrien)", 36.2, 36.16, "secure", ["Apg 11,26", "Apg 13,1–3"], "Hier wurden die Jünger zuerst „Christen“ genannt; Ausgangspunkt der Reisen.", { figures: ["Barnabas", "Paulus"] }),
      P("tarsus", "Tarsus", 36.92, 34.89, "secure", ["Apg 9,11", "Apg 22,3"], "Heimatstadt des Paulus.", { figures: ["Paulus"] }),
      P("paphos", "Paphos", 34.76, 32.42, "secure", ["Apg 13,6–12"], "Der Statthalter Sergius Paulus kommt zum Glauben.", { left: true }),
      P("pisidian", "Antiochia in Pisidien", 38.3, 31.19, "secure", ["Apg 13,14–52"], "Paulus’ Synagogenpredigt."),
      P("lystra", "Lystra", 37.6, 32.35, "secure", ["Apg 14,8–20", "Apg 16,1"], "Heilung eines Gelähmten; Heimat des Timotheus.", { figures: ["Timotheus", "Lois", "Eunike"] }),
      P("troas", "Troas", 39.75, 26.16, "secure", ["Apg 16,8–10", "Apg 20,7–12"], "Vision vom Mann aus Mazedonien.", { left: true }),
      P("philippi", "Philippi", 41.01, 24.29, "secure", ["Apg 16,12–40"], "Erste Gemeinde in Europa: Lydia, der Kerkermeister.", { figures: ["Lydia", "Silas"] }),
      P("thessalonica", "Thessalonich", 40.64, 22.94, "secure", ["Apg 17,1–9"], "Hauptstadt Mazedoniens.", { left: true }),
      P("athens", "Athen", 37.97, 23.72, "secure", ["Apg 17,16–34"], "Rede auf dem Areopag.", { events: [{ title: "Areopagrede", ref: "Apg 17,22–31" }], figures: ["Dionysius", "Damaris"], left: true }),
      P("corinth", "Korinth", 37.906, 22.88, "secure", ["Apg 18,1–18"], "Eineinhalb Jahre Aufenthalt; die Gallio-Inschrift datiert ihn um 51/52 n. Chr.", { figures: ["Aquila", "Priszilla"], left: true }),
      P("ephesus", "Ephesus", 37.94, 27.34, "secure", ["Apg 19", "Apg 20,17–38"], "Aufruhr der Silberschmiede; Abschiedsrede an die Ältesten (in Milet).", { figures: ["Apollos", "Demetrius"] }),
      P("malta", "Malta", 35.9, 14.45, "secure", ["Apg 28,1–10"], "Schiffbruch. Die genaue Strandstelle ist Tradition (St. Paul’s Bay)."),
      P("rome", "Rom", 41.9, 12.5, "secure", ["Apg 28,14–31", "Röm 1,7"], "Paulus lebt zwei Jahre in einer Mietwohnung und verkündigt ungehindert.", { figures: ["Paulus"] }),
    ],
  },

  letters: {
    id: "letters",
    title: "Briefe · Empfänger-Gemeinden",
    era: "ca. 50–100 n. Chr.",
    bounds: { latMin: 33.5, latMax: 42.5, lonMin: 11.8, lonMax: 36.5 },
    pxPerDeg: 62,
    note: "Abfassungsorte der Gefangenschaftsbriefe (Eph, Phil, Kol, Phlm) sind diskutiert: Rom, Ephesus oder Caesarea. In Eph 1,1 fehlt „in Ephesus“ in einigen alten Handschriften.",
    labels: [{ name: "Mittelmeer", lat: 35.0, lon: 20.0, kind: "sea" }, { name: "GALATIEN", lat: 39.4, lon: 32.7, size: 0.8 }, { name: "PONTUS", lat: 41.0, lon: 35.7, size: 0.6 }, { name: "BITHYNIEN", lat: 40.7, lon: 30.2, size: 0.6 }, { name: "KAPPADOZIEN", lat: 38.6, lon: 35.2, size: 0.6 }, { name: "ASIA", lat: 38.4, lon: 28.6, size: 0.7 }],
    routes: [],
    places: [
      P("rome", "Rom · Römerbrief", 41.9, 12.5, "secure", ["Röm 1,7", "Röm 16"], "Brief an eine Gemeinde, die Paulus noch nicht besucht hatte."),
      P("corinth", "Korinth · 1./2. Kor", 37.906, 22.88, "secure", ["1Kor 1,2", "2Kor 1,1"], "Fragen zu Spaltungen, Abendmahl, Gaben, Auferstehung (1Kor 15).", { left: true }),
      P("philippi", "Philippi · Philipper", 41.01, 24.29, "secure", ["Phil 1,1"], "Brief der Freude aus der Gefangenschaft."),
      P("thessalonica", "Thessalonich · 1./2. Thess", 40.64, 22.94, "secure", ["1Thess 1,1", "2Thess 1,1"], "Wohl ältester erhaltener Paulusbrief (1Thess, ca. 50 n. Chr.).", { left: true }),
      P("ephesus", "Ephesus · Epheser / 1Tim", 37.94, 27.34, "secure", ["Eph 1,1", "1Tim 1,3"], "Timotheus als Mitarbeiter in Ephesus.", { left: true }),
      P("colossae", "Kolossä · Kolosser / Philemon", 37.79, 29.26, "secure", ["Kol 1,2", "Phlm 1–2"], "Der Sklave Onesimus kehrt zu Philemon zurück.", { figures: ["Philemon", "Onesimus", "Epaphras"] }),
      P("galatia", "Galatien · Galater", 39.0, 32.3, "disputed", ["Gal 1,2"], "Ob die Landschaft (Nord) oder die römische Provinz mit Ikonion, Lystra, Derbe (Süd) gemeint ist, ist umstritten."),
      P("crete", "Kreta · Titus", 35.24, 24.8, "secure", ["Tit 1,5"], "Titus soll Älteste einsetzen."),
      P("jerusalem", "Jerusalem · Jakobus?", 31.778, 35.235, "traditional", ["Jak 1,1", "Gal 2,9"], "Der Jakobusbrief wird traditionell dem Herrenbruder Jakobus in Jerusalem zugeschrieben (Verfasserschaft diskutiert).", { left: true }),
    ],
  },

  revelation: {
    id: "revelation",
    title: "Offenbarung · Die sieben Gemeinden",
    era: "Ende des 1. Jh. n. Chr. (Datierung meist unter Domitian)",
    bounds: { latMin: 36.7, latMax: 39.7, lonMin: 25.8, lonMax: 29.8 },
    pxPerDeg: 300,
    labels: [{ name: "ASIA", lat: 38.9, lon: 28.9 }, { name: "Ägäis", lat: 38.0, lon: 26.2, kind: "sea" }],
    routes: [{ id: "letters7", name: "Reihenfolge der Sendschreiben", color: "#E8C766", certainty: "secure", refs: "Offb 2,1–3,22", note: "Die Reihenfolge folgt dem Text; dass sie einer Botenroute entspricht, ist eine verbreitete Hypothese.", pts: [[37.94, 27.34], [38.42, 27.14], [39.13, 27.18], [38.92, 27.84], [38.49, 28.04], [38.35, 28.52], [37.84, 29.11]] }],
    places: [
      P("patmos", "Patmos", 37.31, 26.55, "secure", ["Offb 1,9"], "Insel, auf der Johannes die Offenbarung empfängt.", { figures: ["Johannes"] }),
      P("ephesus", "Ephesus", 37.94, 27.34, "secure", ["Offb 2,1–7"], "„Du hast deine erste Liebe verlassen.“", { left: true }),
      P("smyrna", "Smyrna", 38.42, 27.14, "secure", ["Offb 2,8–11"], "„Sei getreu bis zum Tode.“", { left: true }),
      P("pergamon", "Pergamon", 39.13, 27.18, "secure", ["Offb 2,12–17"], "„Wo der Thron des Satans ist“ – Deutung (Zeusaltar, Kaiserkult) diskutiert."),
      P("thyatira", "Thyatira", 38.92, 27.84, "secure", ["Offb 2,18–29"], "Handelsstadt; vgl. Lydia (Apg 16,14)."),
      P("sardis", "Sardes", 38.49, 28.04, "secure", ["Offb 3,1–6"], "„Du hast den Namen, dass du lebst, und bist tot.“"),
      P("philadelphia", "Philadelphia", 38.35, 28.52, "secure", ["Offb 3,7–13"], "„Ich habe eine geöffnete Tür vor dir gegeben.“"),
      P("laodicea", "Laodizea", 37.84, 29.11, "secure", ["Offb 3,14–22"], "„Weder kalt noch warm.“"),
    ],
  },
};

export function projectGeo(m: ThemeMap, lat: number, lon: number) {
  const k = Math.cos(((m.bounds.latMin + m.bounds.latMax) / 2) * (Math.PI / 180));
  return { x: (lon - m.bounds.lonMin) * m.pxPerDeg * k, y: (m.bounds.latMax - lat) * m.pxPerDeg };
}

export function mapSize(m: ThemeMap) {
  const p = projectGeo(m, m.bounds.latMin, m.bounds.lonMax);
  return { width: Math.round(p.x), height: Math.round(p.y) };
}
