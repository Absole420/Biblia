// „Mein geistlicher Weg“ – Allgemeines Register (statische, für alle gleiche Inhalte).
// Bibelstellen-Schlüssel: "Buch:Kapitel:Vers" bzw. "Buch:Kapitel:Von-Bis" (Elberfelder 1905, App-Buchcodes).

/** Art der Verbindung zwischen Thema und Text. */
export type LinkKind = "direct" | "person" | "theme" | "interp";
export const LINK_KIND_LABEL: Record<LinkKind, string> = {
  direct: "Direkte Aussage im Text",
  person: "Beispiel einer biblischen Person",
  theme: "Thematische Verbindung",
  interp: "Spätere Auslegung / Anwendung",
};

/** Bei Jesus: ausdrückliches Wort, beschriebenes Verhalten oder spätere theologische Deutung. */
export type JesusKind = "word" | "deed" | "interp";
export const JESUS_KIND_LABEL: Record<JesusKind, string> = {
  word: "Jesu Worte",
  deed: "Jesu Verhalten",
  interp: "Spätere Deutung (Briefe)",
};

export type Passage = { ref: string; title: string; context: string; kind: LinkKind };
export type Person = { name: string; ref: string; text: string };
export type JesusLink = { ref: string; kind: JesusKind; title: string; text: string };

export type TopicCat = "light" | "heavy" | "guilt" | "faith" | "strength" | "others" | "suffering";

export type Topic = {
  id: string;
  title: string;
  /** Weitere Begriffe für die Suche. */
  aka: string[];
  cat: TopicCat;
  icon: string;
  summary: string;
  /** Kurz erklärt */
  explained: string[];
  /** Mehrere mögliche Ursachen – ohne Festlegung. */
  causes: string[];
  passages: Passage[];
  people: Person[];
  jesus: JesusLink[];
  orientation: string[];
  /** Spannungen, Grenzen, offene Fragen, unterschiedliche Auslegungen. */
  tensions: string[];
  questions: string[];
  /** Als Vorschlag gekennzeichnetes Gebetsmuster. */
  prayer: string;
  steps: string[];
  /** Wann weitere (menschliche, fachliche) Hilfe sinnvoll sein kann. */
  care: string;
  related: string[];
  lexicon: string[];
  stations: string[];
  /** Gefühls-IDs aus dem Check-in, die zu diesem Thema führen. */
  feelings: string[];
};
