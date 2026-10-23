// ---------------------------------------------------------------------------
// BIBLIA – gemeinsames Datenmodell (siehe /app/docs/DATENMODELL.md)
// ---------------------------------------------------------------------------

export type StationType = "event" | "narrative" | "study" | "practice" | "exam" | "challenge";

/** Kennzeichnung der fachlichen Aussageart (Abschnitt 11 des Auftrags). */
export type ClaimKind = "text" | "history" | "hypothesis" | "jewish" | "christian" | "reflection" | "teach" | "info";

export type VerseRef = { book: string; ch: number; from: number; to?: number };

export type Claim = { kind: ClaimKind; title?: string; text: string; refs?: string[] };

export type Term = { term: string; explanation: string; ref?: string };

export type Task =
  | { id: string; type: "mc"; question: string; options: string[]; answer: number; explain: string; ref: string }
  | { id: string; type: "multi"; question: string; options: string[]; answers: number[]; explain: string; ref: string }
  | { id: string; type: "tf"; statement: string; answer: boolean; explain: string; ref: string }
  | { id: string; type: "gap"; question: string; parts: string[]; blanks: string[]; distractors: string[]; explain: string; ref: string }
  | { id: string; type: "verse"; question: string; verse: { ch: number; v: number }; blank: string; options: string[]; explain: string; ref: string }
  | { id: string; type: "match"; question: string; pairs: [string, string][]; explain: string; ref: string }
  | { id: string; type: "order"; question: string; items: string[]; explain: string; ref: string }
  | { id: string; type: "error"; question: string; words: string[]; wrongIndex: number; correction: string; explain: string; ref: string }
  | { id: string; type: "free"; question: string; model: string; ref: string };

export type Station = {
  id: string;
  title: string;
  subtitle: string;
  type: StationType;
  icon: string; // Feather icon name
  x: number; // position on adventure map (0..MAP_W)
  y: number;
  requires: string[]; // Freischaltbedingung: alle IDs abgeschlossen
  xp: number;
  discover: string;
  readings: VerseRef[];
  terms: Term[];
  background: Claim[];
  tasks: Task[];
  exam: Task[];
  reflection: string[];
  placeIds?: string[];
  goal?: string; // Lernziel
  summary?: string; // kurze Zusammenfassung
  info?: string[]; // Infotafeln (src/data/lexicon.ts)
  connections?: Connection[]; // Bezüge AT ↔ NT
  image?: string; // Schlüssel in STATION_IMAGES (KI-Illustration)
  lexicon?: string[]; // verknüpfte Lexikonartikel (ARTICLE_BY_ID)
};

/** Art des Bezugs zwischen Altem und Neuem Testament. */
/** nt/foreshadow/theme: Kennzeichnung messianischer Bezüge (Psalmen & Weisheit) */
export type ConnectionKind = "quote" | "allusion" | "parallel" | "interpretation" | "nt" | "foreshadow" | "theme";
export type Connection = { from: string; to: string; kind: ConnectionKind; note: string; jewish?: string };

export type Campaign = {
  id: string;
  worldId: string;
  title: string;
  book: string;
  mapW: number;
  mapH: number;
  intro: string;
  stations: Station[];
};

export type Certainty = "secure" | "traditional" | "disputed";

export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  certainty: Certainty;
  refs: string[];
  note: string;
  labelDx?: number;
  labelDy?: number;
};

export type HistoricalMap = {
  id: string;
  title: string;
  era: string;
  bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number };
  width: number;
  height: number;
  places: Place[];
  regions: { name: string; lat: number; lon: number }[];
  sources: string[];
};

export type World = {
  id: string;
  title: string;
  subtitle: string;
  books: string[];
  palette: { base: string; accent: string; glow: string; ink: string };
  x: number;
  y: number;
  icon: string;
  status: "playable" | "preview";
  campaignIds?: string[];
  description: string;
  planned: string[];
};
