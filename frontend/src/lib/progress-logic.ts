// Reine (seiteneffektfreie) Fortschrittslogik – testbar ohne UI.
import type { Station } from "../data/types";
import { Avatar, sanitizeAvatar } from "./avatar";
import { DEFAULT_STUDY, sanitizeStudy, StudyState } from "./study";

export const SCHEMA_VERSION = 5;

export type StationProgress = { completedAt: string; examScore: number; examTotal: number; bestScore: number; attempts: number };
export type Note = { id: string; title: string; text: string; ref?: string; createdAt: string; updatedAt: string };
export type Bookmark = { key: string; createdAt: string };
export type Category = { id: string; name: string; color: string };
export type ThemePref = "system" | "light" | "dark";
/** Verknüpfung zwischen einem Vers und einer anderen Bibelstelle. */
export type VerseLink = { id: string; from: string; to: string; note?: string; createdAt: string };
/** Eigene Lerneinheit aus Bibelstellen und selbst formulierten Fragen. */
export type StudyUnit = { id: string; title: string; description: string; refs: string[]; questions: { id: string; q: string; a: string }[]; createdAt: string; updatedAt: string };

export type AppState = {
  schemaVersion: number;
  xp: number;
  stations: Record<string, StationProgress>;
  phase: Record<string, number>; // zuletzt erreichte Phase je Station (Autosave)
  wrong: Record<string, { stationId: string; count: number; lastAt: string }>;
  reflections: Record<string, string[]>;
  notes: Note[];
  bookmarks: Bookmark[];
  highlights: Record<string, string>; // verseKey -> categoryId
  categories: Category[];
  settings: { theme: ThemePref; fontScale: number; translation: "elb1905" | "elb2006" | "neue" };
  goal: { weeklyStations: number };
  activity: { date: string; stationId: string }[];
  answered: { total: number; correct: number };
  links: VerseLink[];
  units: StudyUnit[];
  avatar: Avatar | null; // v4: persönliche Lernfigur (beeinflusst den Lernfortschritt nicht)
  study: StudyState; // v5: Leseposition, Lesefortschritt, Lesepläne, Tags, Merkliste, Journal
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "god", name: "Gottes Wesen", color: "#C28E3A" },
  { id: "christ", name: "Jesus Christus", color: "#D97736" },
  { id: "promise", name: "Verheißungen", color: "#607D5B" },
  { id: "command", name: "Gebote", color: "#4A7A8C" },
  { id: "sin", name: "Sünde", color: "#8A2F3C" },
  { id: "grace", name: "Gnade", color: "#7E5B82" },
  { id: "prophecy", name: "Prophetie", color: "#2F4A7A" },
];

export const CATEGORY_PALETTE = ["#C28E3A", "#D97736", "#607D5B", "#4A7A8C", "#8A2F3C", "#7E5B82", "#2F4A7A", "#3FA7A0", "#B7C46A", "#B05A4E"];

export function defaultState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    xp: 0,
    stations: {},
    phase: {},
    wrong: {},
    reflections: {},
    notes: [],
    bookmarks: [],
    highlights: {},
    categories: DEFAULT_CATEGORIES,
    settings: { theme: "system", fontScale: 1, translation: "elb1905" },
    goal: { weeklyStations: 3 },
    activity: [],
    answered: { total: 0, correct: 0 },
    links: [],
    units: [],
    avatar: null,
    study: DEFAULT_STUDY,
  };
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Migriert ältere Lernstände verlustfrei auf das aktuelle Schema. */
export function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const r: Record<string, any> = { ...raw };
  // v1 -> v2: "completed: string[]" wurde zu "stations: Record"
  if ((r.schemaVersion ?? 1) < 2 && Array.isArray(r.completed)) {
    r.stations = Object.fromEntries(
      r.completed.map((id: string) => [id, { completedAt: new Date(0).toISOString(), examScore: 0, examTotal: 0, bestScore: 0, attempts: 1 }]),
    );
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    xp: typeof r.xp === "number" && r.xp >= 0 ? r.xp : 0,
    stations: isObj(r.stations) ? r.stations : {},
    phase: isObj(r.phase) ? r.phase : {},
    wrong: isObj(r.wrong) ? r.wrong : {},
    reflections: isObj(r.reflections) ? r.reflections : {},
    notes: Array.isArray(r.notes) ? r.notes.filter((n: any) => isObj(n) && typeof n.id === "string") : [],
    bookmarks: Array.isArray(r.bookmarks) ? r.bookmarks.filter((b: any) => isObj(b) && typeof b.key === "string") : [],
    highlights: isObj(r.highlights) ? r.highlights : {},
    categories: Array.isArray(r.categories) && r.categories.length ? r.categories : base.categories,
    settings: { ...base.settings, ...(isObj(r.settings) ? r.settings : {}) },
    goal: { ...base.goal, ...(isObj(r.goal) ? r.goal : {}) },
    activity: Array.isArray(r.activity) ? r.activity : [],
    answered: isObj(r.answered) ? { total: Number(r.answered.total) || 0, correct: Number(r.answered.correct) || 0 } : base.answered,
    // v2 -> v3: Verknüpfungen und eigene Lerneinheiten
    links: Array.isArray(r.links) ? r.links.filter((l: any) => isObj(l) && typeof l.from === "string" && typeof l.to === "string") : [],
    units: Array.isArray(r.units) ? r.units.filter((u: any) => isObj(u) && typeof u.id === "string").map((u: any) => ({ description: "", refs: [], questions: [], ...u })) : [],
    // v3 -> v4: Avatar
    avatar: sanitizeAvatar(r.avatar),
    // v4 -> v5: persönlicher Studienbereich
    study: sanitizeStudy(r.study),
  };
}

export type ImportResult = { ok: true; state: AppState } | { ok: false; error: string };

/** Prüft eine importierte JSON-Datei auf Gültigkeit. */
export function parseImport(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Die Datei ist kein gültiges JSON." };
  }
  if (!isObj(data) || data.app !== "BIBLIA" || !isObj(data.state)) {
    return { ok: false, error: "Die Datei ist kein BIBLIA-Lernstand." };
  }
  const s = data.state;
  if (typeof s.schemaVersion !== "number" || s.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: "Unbekannte oder neuere Schemaversion." };
  }
  if (s.xp !== undefined && typeof s.xp !== "number") return { ok: false, error: "Beschädigte Datei: XP ungültig." };
  return { ok: true, state: migrate(s) };
}

export function buildExport(state: AppState): string {
  return JSON.stringify({ app: "BIBLIA", exportedAt: new Date().toISOString(), state }, null, 2);
}

export const LEVEL_NAMES = ["Suchender", "Hörender", "Lernender", "Entdecker", "Schriftforscher", "Zeuge", "Lehrender", "Weiser"];
export const XP_PER_LEVEL = 150;

export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, name: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)], into, needed: XP_PER_LEVEL, progress: into / XP_PER_LEVEL };
}

export function isUnlocked(station: Station, stations: Record<string, StationProgress>) {
  return station.requires.every((id) => !!stations[id]);
}

export type StationStatus = "locked" | "available" | "completed";
export function stationStatus(station: Station, stations: Record<string, StationProgress>): StationStatus {
  if (stations[station.id]) return "completed";
  return isUnlocked(station, stations) ? "available" : "locked";
}

/** Prüft, ob jede Station von den Startstationen aus erreichbar ist (QA). */
export function unreachableStations(list: Station[]): string[] {
  const done = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of list) if (!done.has(s.id) && s.requires.every((r) => done.has(r))) { done.add(s.id); changed = true; }
  }
  return list.filter((s) => !done.has(s.id)).map((s) => s.id);
}

export type Badge = { id: string; title: string; description: string; icon: string; earned: boolean };

export function computeBadges(s: AppState, johnIds: string[]): Badge[] {
  const done = Object.keys(s.stations).length;
  const perfect = Object.values(s.stations).some((p) => p.examTotal > 0 && p.bestScore === p.examTotal);
  const refl = Object.values(s.reflections).filter((r) => r.some((t) => t.trim().length > 0)).length;
  return [
    { id: "first", title: "Erster Schritt", description: "Erste Station abgeschlossen", icon: "flag", earned: done >= 1 },
    { id: "explorer", title: "Entdecker", description: "5 Stationen abgeschlossen", icon: "compass", earned: done >= 5 },
    { id: "john", title: "Zeuge des Lichts", description: "Johannesevangelium abgeschlossen", icon: "sun", earned: johnIds.every((id) => s.stations[id]) },
    { id: "perfect", title: "Sorgfältig", description: "Eine Prüfung fehlerfrei bestanden", icon: "check-circle", earned: perfect },
    { id: "reflect", title: "Nachdenklich", description: "3 Reflexionen geschrieben", icon: "edit-3", earned: refl >= 3 },
    { id: "scribe", title: "Schreiber", description: "5 Notizen angelegt", icon: "file-text", earned: s.notes.length >= 5 },
    { id: "collector", title: "Sammler", description: "5 Lesezeichen gesetzt", icon: "bookmark", earned: s.bookmarks.length >= 5 },
  ];
}

export function stationsThisWeek(s: AppState, now = new Date()) {
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7; // Montag = 0
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return new Set(s.activity.filter((a) => new Date(a.date) >= start).map((a) => a.stationId)).size;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
