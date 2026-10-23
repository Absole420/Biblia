import type { Campaign, Claim, Connection, Station, StationType, Task, Term, VerseRef } from "./types";

// Kompakte Bausteine für die Lerneinheiten der Lernwelt „Psalmen & Weisheit“.
// Versangaben folgen der Zählung der eingebundenen Elberfelder-1905-Daten (Psalmüberschrift in Vers 1).

type NoId<T> = T extends unknown ? Omit<T, "id"> : never;
export type T0 = NoId<Task>;

export const R = (book: string, ch: number, from: number, to?: number): VerseRef => ({ book, ch, from, to });
export const mc = (question: string, options: string[], answer: number, explain: string, ref: string): T0 => ({ type: "mc", question, options, answer, explain, ref });
export const multi = (question: string, options: string[], answers: number[], explain: string, ref: string): T0 => ({ type: "multi", question, options, answers, explain, ref });
export const tf = (statement: string, answer: boolean, explain: string, ref: string): T0 => ({ type: "tf", statement, answer, explain, ref });
export const match = (question: string, pairs: [string, string][], explain: string, ref: string): T0 => ({ type: "match", question, pairs, explain, ref });
export const order = (question: string, items: string[], explain: string, ref: string): T0 => ({ type: "order", question, items, explain, ref });
export const free = (question: string, model: string, ref: string): T0 => ({ type: "free", question, model, ref });

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  type?: StationType;
  icon: string;
  goal: string;
  discover: string;
  readings: VerseRef[];
  terms: Term[];
  /** Lehrtext in mehreren erklärenden Abschnitten */
  teach: [string, string, string[]?][];
  /** Vertiefende Infotafeln */
  info: [string, string, string[]?][];
  jewish?: string;
  christian?: string;
  conn?: Connection[];
  tasks: T0[];
  review: T0;
  reflection: string[];
  summary: string;
  xp?: number;
};

// Verknüpfte Lexikonartikel je Einheit (nur vorhandene Artikel-IDs)
const LEX: Record<string, string[]> = {
  "ps1-1": ["psalmen", "david", "salomo", "mose", "tempel-salomo"], "ps1-2": ["psalmen", "zehn-gebote"], "ps1-3": ["david", "davidsbund", "zion", "jerusalem", "jesus", "paulus"],
  "ps1-4": ["david", "jesus", "bethlehem"], "ps1-5": ["mose", "sinai"], "ps1-6": ["jerusalem", "zion", "tempel-salomo", "passa"], "ps1-7": ["psalmen", "david"],
  "ps1-8": ["jerusalem", "tempel-herodes", "jesus", "petrus", "passa"], "ps1-9": ["psalmen", "zehn-gebote", "sinai"], "ps1-10": ["schoepfung", "adam-eva", "jesus"],
  "ps2-1": ["psalmen", "david"], "ps2-2": ["kreuzigung", "jesus", "david"], "ps2-3": ["paulus", "abraham", "david"], "ps2-4": ["david", "jerusalem", "zion"],
  "ps2-5": ["jerusalem", "david"], "ps2-6": ["jesus", "tempel-herodes"], "ps2-7": ["psalmen", "versoehnungstag", "jerusalem"], "ps2-8": ["hermon", "jordan", "tempel-salomo"],
  "ps2-9": ["psalmen", "hiob"], "ps2-10": ["auferstehung", "pfingsten", "petrus", "abraham", "kreuzigung"],
};

const claim = (kind: Claim["kind"]) => ([title, text, refs]: [string, string, string[]?]): Claim => ({ kind, title, text, refs });

/** Baut aus den Einheiten eine Kampagne: Weg von unten nach oben, jede Einheit schaltet die nächste frei, am Ende die Stationsprüfung. */
export function buildCampaign(c: { id: string; worldId: string; title: string; book: string; intro: string; units: Unit[]; exam: T0[]; examTitle: string; examInfo: string }): Campaign {
  const n = c.units.length + 1;
  const mapH = n * 240 + 320;
  const pos = (i: number) => ({ x: Math.round(500 + Math.sin(i * 1.15) * 290), y: mapH - 170 - i * 240 });
  const stations: Station[] = c.units.map((u, i) => ({
    id: u.id,
    title: u.title,
    subtitle: u.subtitle,
    type: u.type ?? "study",
    icon: u.icon,
    ...pos(i),
    requires: i ? [c.units[i - 1].id] : [],
    xp: u.xp ?? 60,
    goal: u.goal,
    discover: u.discover,
    readings: u.readings,
    terms: u.terms,
    background: [
      ...u.teach.map(claim("teach")),
      ...u.info.map(claim("info")),
      ...(u.jewish ? [{ kind: "jewish" as const, title: "Jüdische Lesart", text: u.jewish }] : []),
      ...(u.christian ? [{ kind: "christian" as const, title: "Christliche Auslegung", text: u.christian }] : []),
    ],
    connections: u.conn,
    tasks: u.tasks.map((t, k) => ({ ...t, id: `${u.id}-t${k + 1}` }) as Task),
    exam: [{ ...u.review, id: `${u.id}-r` } as Task],
    reflection: u.reflection,
    summary: u.summary,
    image: u.id,
    lexicon: LEX[u.id],
  }));
  const last = c.units[c.units.length - 1];
  stations.push({
    id: `${c.id}-exam`,
    title: c.examTitle,
    subtitle: `Prüfung · ${c.exam.length} Aufgaben aus allen Einheiten`,
    type: "exam",
    icon: "award",
    ...pos(c.units.length),
    requires: c.units.map((u) => u.id),
    xp: 120,
    goal: "Die Inhalte der zehn Einheiten sicher wiedergeben, vergleichen und auf Alltagssituationen anwenden.",
    discover: c.examInfo,
    readings: [],
    terms: [],
    background: [{ kind: "info", title: "So funktioniert die Prüfung", text: "Bewertet werden nur Textverständnis, Zuordnungen und begründete Anwendungen – niemals persönliche Gefühle oder Frömmigkeit. Jede falsche Antwort wird erklärt und mit der Bibelstelle verlinkt. Du kannst die Prüfung beliebig oft wiederholen; dein bester Versuch zählt, bisheriger Fortschritt geht nicht verloren. Alle Einheiten bleiben jederzeit erneut zugänglich." }],
    tasks: [free("Bevor die Prüfung beginnt: Welche Einheit dieser Station war für dich am wichtigsten – und warum? (wird nicht bewertet)", "Jede ehrliche Antwort ist gut. Beispiel: „Psalm 13, weil er zeigt, dass ich Gott meine Klage sagen darf.“", last.readings[0] ? `${last.readings[0].book} ${last.readings[0].ch}` : "Ps 1")].map((t, k) => ({ ...t, id: `${c.id}-exam-t${k + 1}` }) as Task),
    exam: c.exam.map((t, k) => ({ ...t, id: `${c.id}-exam-e${k + 1}` }) as Task),
    reflection: ["Was möchtest du aus dieser Station in dein Beten oder deinen Alltag mitnehmen?"],
    summary: "Station abgeschlossen. Alle Einheiten bleiben geöffnet – wiederhole sie jederzeit über die Stationsliste.",
  });
  return { id: c.id, worldId: c.worldId, title: c.title, book: c.book, mapW: 1000, mapH, intro: c.intro, stations };
}
