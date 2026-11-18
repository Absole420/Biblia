// Sortierjahre für den Zeitstrahl (negativ = v. Chr.). Reine Ordnungshilfe – die angezeigte
// Zeitangabe ist immer article.timeframe mit den dort genannten Unsicherheiten.
export const TIMELINE_YEAR: Record<string, number> = {
  schoepfung: -5000, "adam-eva": -4900, "kain-abel": -4800, noah: -4500, sintflut: -4400, "turmbau-babel": -4000,
  abraham: -1850, sara: -1840, lot: -1830, sodom: -1820, isaak: -1750, jakob: -1700, "esau-edom": -1699, "zwoelf-staemme": -1650, josef: -1649,
  aegypten: -1550, mirjam: -1295, aaron: -1290, mose: -1285, plagen: -1260, passa: -1255, auszug: -1250, schilfmeer: -1249, "zehn-gebote": -1248,
  "goldenes-kalb": -1247, stiftshuette: -1246, bundeslade: -1245, opfer: -1244, versoehnungstag: -1243, wuestenwanderung: -1240,
  "eherne-schlange": -1215, bileam: -1210, schma: -1205, josua: -1200, rahab: -1195, landnahme: -1190,
  richter: -1150, philister: -1149, debora: -1125, gideon: -1100, rut: -1099, boas: -1098, simson: -1075,
  samuel: -1060, saul: -1040, "david-goliath": -1025, david: -1010, davidsbund: -1000, salomo: -970, "tempel-salomo": -960, reichsteilung: -930,
  assyrien: -900, elia: -865, karmel: -860, elisa: -850, jona: -780, jesaja: -740, "fall-samarias": -722, hiskia: -715, josia: -640,
  jeremia: -627, babylonien: -626, daniel: -605, exil: -597, ezechiel: -593, kyros: -550, persien: -549, gottesknecht: -545, loewengrube: -539,
  "zweiter-tempel": -515, hiob: -500, ester: -480, purim: -479, esra: -458, nehemia: -445, "stadtmauer-jerusalem": -444,
  pharisaeer: -150, rom: -63, "herodes-grosse": -37, "tempel-herodes": -20, maria: -7, "geburt-jesu": -6, jesus: -5,
  "johannes-taeufer": 28, "johannes-apostel": 28.4, petrus: 28.5, "hochzeit-kana": 28.8, bergpredigt: 29, sturmstillung: 29.2,
  nikodemus: 29.5, "barmherziger-samariter": 29.6, "verlorener-sohn": 29.7, lazarus: 29.9, abendmahl: 29.95, kreuzigung: 30, auferstehung: 30.1,
  pfingsten: 30.2, paulus: 34, barnabas: 35, "johannes-markus": 45, missionsreisen: 47, "sieben-gemeinden": 95,
  ...{
  "hosea": -750,
  "amos": -760,
  "micha": -730,
  "nahum": -620,
  "habakuk": -605,
  "zefanja": -630,
  "haggai": -520,
  "sacharja": -519,
  "maleachi": -450,
  "klagelieder": -585,
  "rehabeam": -930,
  "jerobeam-i": -929,
  "ahab": -870,
  "isebel": -860,
  "manasse-koenig": -690,
  "serubbabel": -520,
  "fall-ninives": -612,
  "fall-jerusalems": -586,
  "fall-babylons": -539,
  "rueckkehr-exil": -538,
  "tempelzerstoerung-70": 70,
  "stephanus": 34,
  "philippus-evangelist": 36,
  "timotheus": 50,
  "titus": 55,
  "priska-aquila": 50,
  "apostelkonzil": 49,
  "patmos": 95
},
};

export const EPOCH_ORDER = ["urgeschichte", "erzvaeter", "exodus", "koenigszeit", "exil", "nachexil", "jesus", "urkirche"] as const;
export type Epoch = (typeof EPOCH_ORDER)[number];

/** Epochenfarben wie Kapitelbänder eines Buches – in hellem und dunklem Modus identisch. */
export const EPOCH_STYLE: Record<Epoch, { color: string; span: string; icon: string }> = {
  urgeschichte: { color: "#5E7F6B", span: "vor aller datierbaren Geschichte", icon: "sun" },
  erzvaeter: { color: "#C28E3A", span: "ca. 2000–1600 v. Chr. (unsicher)", icon: "moon" },
  exodus: { color: "#D97736", span: "ca. 1500–1050 v. Chr. (umstritten)", icon: "navigation" },
  koenigszeit: { color: "#8A2F3C", span: "ca. 1050–587 v. Chr.", icon: "award" },
  exil: { color: "#4A5E8C", span: "597–539 v. Chr.", icon: "cloud-rain" },
  nachexil: { color: "#2F6F6A", span: "539 v. Chr. – ca. 6 v. Chr.", icon: "home" },
  jesus: { color: "#B9802F", span: "ca. 6 v. Chr. – 30/33 n. Chr.", icon: "star" },
  urkirche: { color: "#7E5B82", span: "ab 30/33 n. Chr.", icon: "users" },
};

export const epochOfYear = (y: number): Epoch => (y >= 31 ? "urkirche" : y >= -6 ? "jesus" : y >= -539 ? "nachexil" : y >= -597 ? "exil" : y >= -1050 ? "koenigszeit" : y >= -1500 ? "exodus" : y >= -2100 ? "erzvaeter" : "urgeschichte");

/** Grobe Sortierjahre je Epoche für Artikel ohne eigenes Jahr (z. B. Orte). */
export const EPOCH_FALLBACK: Record<Epoch, number> = { urgeschichte: -4000, erzvaeter: -1800, exodus: -1250, koenigszeit: -900, exil: -570, nachexil: -400, jesus: 28, urkirche: 60 };

// The order of the visions is a reading order, not a prediction calendar.
export const TIMELINE_VISION_IDS = ["sieben-siegel", "versiegelte-144000", "malzeichen-tier", "babylon-offenbarung", "tausendjaehriges-reich", "neues-jerusalem"] as const;
export type TimelineEpoch = Epoch | "vision";
export const TIMELINE_EPOCH_ORDER: readonly TimelineEpoch[] = [...EPOCH_ORDER, "vision"];
export const TIMELINE_EPOCH_STYLE: Record<TimelineEpoch, { color: string; span: string; icon: string }> = {
  ...EPOCH_STYLE, vision: { color: "#68558C", span: "Leseordnung der Offenbarung · keine Kalenderdatierung", icon: "eye" },
};
export function isVision(id: string): boolean { return (TIMELINE_VISION_IDS as readonly string[]).includes(id); }
export function isTimelineEntry(id: string): boolean { return TIMELINE_YEAR[id] !== undefined || isVision(id); }
export type TimelineContext = "history" | "bible" | "literary" | "vision";
const HISTORICAL = new Set(["fall-samarias", "fall-ninives", "fall-jerusalems", "fall-babylons", "tempelzerstoerung-70", "kreuzigung"]);
const LITERARY = new Set(["barmherziger-samariter", "verlorener-sohn", "bergpredigt", "gottesknecht", "klagelieder"]);
export function timelineContext(id: string): TimelineContext {
  if (isVision(id)) return "vision";
  if (HISTORICAL.has(id)) return "history";
  if (LITERARY.has(id)) return "literary";
  return "bible";
}
export const TIMELINE_CONTEXT_LABEL: Record<TimelineContext, string> = {
  history: "Historischer Anker",
  bible: "Biblischer Zusammenhang · zeitliche Einordnung",
  literary: "Lehrtext / Dichtung · keine Ereignisdatierung",
  vision: "Prophetische Vision · undatiert",
};
