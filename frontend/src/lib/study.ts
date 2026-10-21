// Persönlicher Bibel- und Studienbereich: Leseposition, Lesefortschritt, Lesepläne,
// Tags, Merkliste und Studienjournal. Reine Logik (ohne React) – testbar.
import { BIBLE_BOOKS, BOOK_BY_CODE } from "@/src/data/books";
import COUNTS from "@/src/data/verseCounts.json";

export type Pos = { book: string; ch: number; v: number; y?: number; at: string };
export type PlanItem = { book: string; ch: number };
export type PlanDay = { date: string; kind: "read" | "buffer" | "repeat" | "rest"; items: PlanItem[] };
export type PlanConfig = {
  title: string;
  template: string;
  books: string[]; // Bücher in Lesereihenfolge (bei parallel: AT-Strang)
  parallel?: string[]; // zweiter Strang (z. B. NT) – wird täglich parallel verteilt
  passages?: PlanItem[]; // thematische/chronologische Pläne: feste Kapitelfolge
  start: string; // YYYY-MM-DD (lokales Datum)
  end?: string;
  weekdays: number[]; // 0 = So … 6 = Sa
  minutes?: number; // ungefähre tägliche Lesedauer (wenn kein Enddatum)
  bufferEvery: number; // jede n-te Woche ein Puffertag (0 = keiner)
  repeatWeekly: boolean; // letzter Lesetag der Woche = Wiederholung
  note?: string;
};
export type Plan = { id: string; config: PlanConfig; days: PlanDay[]; done: Record<string, string>; createdAt: string; finishedAt?: string };
export type ReviewItem = { key: string; to?: number; addedAt: string; due: string; step: number; intervals: number[] };
export type JournalEntry = { id: string; ref: string; date: string; noticed: string; unclear: string; connection: string; apply: string };
export type StudyState = {
  lastPos: Pos | null;
  read: Record<string, number[]>; // "Joh:3" -> eindeutig gelesene Verse (keine Doppelzählung)
  readLog: { date: string; book: string; ch: number }[];
  plans: Plan[];
  tags: string[];
  verseTags: Record<string, string[]>; // verseKey oder Bereich "Joh:3:16-18"
  review: ReviewItem[];
  journal: JournalEntry[];
  reading: { lineHeight: number; focus: boolean; showAvatar: boolean };
  prefSources: string[]; // bevorzugte Kommentarquellen (leer = alle)
};

export const DEFAULT_STUDY: StudyState = {
  lastPos: null, read: {}, readLog: [], plans: [], tags: ["Gnade", "Gebet", "Fragen", "Später vertiefen"], verseTags: {}, review: [], journal: [],
  reading: { lineHeight: 1.6, focus: false, showAvatar: true }, prefSources: [],
};

export function sanitizeStudy(raw: unknown): StudyState {
  const r = (typeof raw === "object" && raw) ? (raw as Partial<StudyState>) : {};
  return {
    ...DEFAULT_STUDY, ...r,
    read: r.read && typeof r.read === "object" ? r.read : {},
    reading: { ...DEFAULT_STUDY.reading, ...(r.reading ?? {}) },
    plans: Array.isArray(r.plans) ? r.plans : [], tags: Array.isArray(r.tags) ? r.tags : DEFAULT_STUDY.tags,
    review: Array.isArray(r.review) ? r.review : [], journal: Array.isArray(r.journal) ? r.journal : [], readLog: Array.isArray(r.readLog) ? r.readLog : [],
    verseTags: r.verseTags && typeof r.verseTags === "object" ? r.verseTags : {}, prefSources: Array.isArray(r.prefSources) ? r.prefSources : [],
  };
}

// ---------------------------------------------------------------- Textumfang
const C = COUNTS as unknown as Record<string, [number, number][]>;
export const verseCount = (book: string, ch: number) => C[String(BOOK_BY_CODE[book]?.nr)]?.[ch - 1]?.[0] ?? 0;
export const charCount = (book: string, ch: number) => C[String(BOOK_BY_CODE[book]?.nr)]?.[ch - 1]?.[1] ?? 0;
export const CHARS_PER_MIN = 1100; // Schätzwert (ca. 180 Wörter/Min.)
export const minutesFor = (items: PlanItem[]) => items.reduce((s, i) => s + charCount(i.book, i.ch), 0) / CHARS_PER_MIN;
export const OT = BIBLE_BOOKS.filter((b) => b.nr <= 39).map((b) => b.code);
export const NT = BIBLE_BOOKS.filter((b) => b.nr >= 40).map((b) => b.code);
export const chaptersOf = (books: string[]): PlanItem[] => books.flatMap((b) => Array.from({ length: BOOK_BY_CODE[b]?.chapters ?? 0 }, (_, i) => ({ book: b, ch: i + 1 })));

// ---------------------------------------------------------------- Lesefortschritt
export function markRead(read: Record<string, number[]>, book: string, ch: number, verses?: number[]) {
  const k = `${book}:${ch}`;
  const all = verses ?? Array.from({ length: verseCount(book, ch) }, (_, i) => i + 1);
  return { ...read, [k]: Array.from(new Set([...(read[k] ?? []), ...all])).sort((a, b) => a - b) };
}
export function unmarkRead(read: Record<string, number[]>, book: string, ch: number, verses?: number[]) {
  const k = `${book}:${ch}`;
  const rest = verses ? (read[k] ?? []).filter((v) => !verses.includes(v)) : [];
  const out = { ...read };
  if (rest.length) out[k] = rest; else delete out[k];
  return out;
}
export const chapterState = (read: Record<string, number[]>, book: string, ch: number) => {
  const n = read[`${book}:${ch}`]?.length ?? 0;
  const t = verseCount(book, ch);
  return n === 0 ? "unread" : n >= t ? "read" : "partial";
};
export function bookProgress(read: Record<string, number[]>, book: string) {
  const info = BOOK_BY_CODE[book];
  let readCh = 0, partial = 0, verses = 0, total = 0;
  let next: { ch: number; v: number } | null = null;
  for (let ch = 1; ch <= info.chapters; ch++) {
    const t = verseCount(book, ch);
    const r = new Set(read[`${book}:${ch}`] ?? []);
    total += t;
    verses += Math.min(r.size, t);
    if (r.size >= t) readCh++; else if (r.size) partial++;
    if (!next && r.size < t) { let v = 1; while (r.has(v)) v++; next = { ch, v }; }
  }
  return { readCh, partial, verses, total, pct: total ? verses / total : 0, next };
}

// ---------------------------------------------------------------- Datum (lokal)
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseIso = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const today = () => iso(new Date());
export const addDays = (s: string, n: number) => { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a: string, b: string) => Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / 86400000);

// ---------------------------------------------------------------- Planer
/** Kalendertage ab start: Lesetage (nach Wochentagen), Puffer- und Wiederholungstage. */
function calendar(cfg: PlanConfig, from: string, readingDaysWanted?: number, until?: string) {
  const out: PlanDay[] = [];
  let d = from, week = -1, lastWeekDay: PlanDay | null = null, reading = 0;
  for (let guard = 0; guard < 4000; guard++) {
    if (until && d > until) break;
    if (!until && readingDaysWanted !== undefined && reading >= readingDaysWanted) break;
    const wd = parseIso(d).getDay();
    const w = Math.floor(daysBetween(cfg.start, d) / 7);
    if (w !== week) { if (cfg.repeatWeekly && lastWeekDay) lastWeekDay.kind = "repeat"; week = w; lastWeekDay = null; }
    if (!cfg.weekdays.includes(wd)) out.push({ date: d, kind: "rest", items: [] });
    else if (cfg.bufferEvery > 0 && w % cfg.bufferEvery === cfg.bufferEvery - 1 && !out.some((x) => x.kind === "buffer" && Math.floor(daysBetween(cfg.start, x.date) / 7) === w)) out.push({ date: d, kind: "buffer", items: [] });
    else { const day: PlanDay = { date: d, kind: "read", items: [] }; out.push(day); lastWeekDay = day; reading++; }
    d = addDays(d, 1);
  }
  if (cfg.repeatWeekly && lastWeekDay && until) lastWeekDay.kind = "repeat";
  return out;
}

/** Verteilt ganze Kapitel nach tatsächlicher Textlänge möglichst gleichmäßig auf die Lesetage. */
function distribute(items: PlanItem[], days: PlanDay[]) {
  const slots = days.filter((d) => d.kind === "read");
  if (!slots.length) return;
  const total = items.reduce((s, i) => s + charCount(i.book, i.ch), 0);
  let acc = 0, idx = 0;
  for (const it of items) {
    const c = charCount(it.book, it.ch);
    // Ziel-Lesetag anhand der Kapitelmitte → kein Kapitel wird geteilt, Abweichung minimal
    const target = Math.min(slots.length - 1, Math.floor(((acc + c / 2) / total) * slots.length));
    idx = Math.max(idx, target);
    slots[idx].items.push(it);
    acc += c;
  }
}

export function planItems(cfg: PlanConfig) {
  return cfg.passages?.length ? cfg.passages : chaptersOf(cfg.books);
}

export function buildPlan(cfg: PlanConfig, from = cfg.start, items = planItems(cfg)): PlanDay[] {
  let days: PlanDay[];
  if (cfg.end) days = calendar(cfg, from, undefined, cfg.end);
  else {
    const perDay = Math.max(3, cfg.minutes ?? 15) * CHARS_PER_MIN;
    const total = items.reduce((s, i) => s + charCount(i.book, i.ch), 0) + (cfg.parallel ? chaptersOf(cfg.parallel).reduce((s, i) => s + charCount(i.book, i.ch), 0) : 0);
    days = calendar(cfg, from, Math.max(1, Math.ceil(total / perDay)));
  }
  distribute(items, days);
  if (cfg.parallel) {
    const tmp = days.map((d) => ({ ...d, items: [] as PlanItem[] }));
    distribute(chaptersOf(cfg.parallel), tmp);
    tmp.forEach((t, i) => days[i].items.push(...t.items));
  }
  return days;
}

export function previewOf(days: PlanDay[]) {
  const read = days.filter((d) => d.kind === "read" && d.items.length);
  const mins = read.map((d) => minutesFor(d.items));
  return {
    chapters: read.reduce((s, d) => s + d.items.length, 0), readingDays: read.length, totalDays: days.length,
    start: days[0]?.date, end: days[days.length - 1]?.date,
    avgMin: mins.length ? mins.reduce((a, b) => a + b, 0) / mins.length : 0, maxMin: mins.length ? Math.max(...mins) : 0,
  };
}

export const missedDays = (p: Plan, now = today()) => p.days.filter((d) => d.date < now && d.items.length && !p.done[d.date]);

/** Umgang mit verpassten Tagen. Verpasste Einheiten gelten nie automatisch als gelesen. */
export function replan(p: Plan, mode: "keep" | "redistribute" | "shift", now = today()): Plan {
  if (mode === "keep") return p;
  const past = p.days.filter((d) => d.date < now);
  const open = p.days.filter((d) => !p.done[d.date]).flatMap((d) => d.items);
  const kept = past.map((d) => (p.done[d.date] ? d : { ...d, items: [] as PlanItem[] }));
  if (mode === "redistribute") {
    const end = p.days[p.days.length - 1].date;
    const future = calendar({ ...p.config, end }, now, undefined, end < now ? now : end);
    distribute(open, future);
    return { ...p, days: [...kept, ...future] };
  }
  // shift: gleiche Tagesportionen, Enddatum verschiebt sich
  const portions = p.days.filter((d) => !p.done[d.date] && d.items.length).map((d) => d.items);
  const cal = calendar({ ...p.config, end: undefined }, now, portions.length * 2 + 7);
  let i = 0, last = 0;
  cal.forEach((d, j) => { if (d.kind === "read" && i < portions.length) { d.items = portions[i++]; last = j; } });
  const future = cal.slice(0, last + 1);
  return { ...p, days: [...kept, ...future], config: { ...p.config, end: future[future.length - 1]?.date } };
}

export function planProgress(p: Plan) {
  const all = p.days.filter((d) => d.items.length);
  const done = all.filter((d) => p.done[d.date]).length;
  return { done, total: all.length, pct: all.length ? done / all.length : 0, next: all.find((d) => !p.done[d.date]) ?? null };
}

// ---------------------------------------------------------------- Vorlagen
const T = (passages: string) => passages.split(";").map((s) => { const [b, c] = s.trim().split(" "); return { book: b, ch: +c }; });
export const THEMES: Record<string, { title: string; passages: PlanItem[] }> = {
  jesus: { title: "Jesus – Leben und Botschaft", passages: T("Jes 53; Lk 1; Lk 2; Mk 1; Mt 5; Mt 6; Mt 7; Joh 1; Joh 3; Lk 15; Joh 6; Joh 10; Mk 8; Joh 11; Lk 19; Joh 13; Joh 17; Mk 14; Mk 15; Lk 24; Joh 20; Joh 21; Phil 2; Kol 1; Hebr 1") },
  gebet: { title: "Gebet", passages: T("1Mo 18; 2Mo 32; 1Sam 1; 1Kö 8; Neh 1; Ps 23; Ps 51; Ps 103; Ps 139; Dan 9; Mt 6; Lk 11; Lk 18; Joh 17; Röm 8; Eph 3; Phil 4; Jak 5") },
  gnade: { title: "Gnade", passages: T("1Mo 3; 2Mo 34; Ps 32; Ps 103; Jes 55; Hos 11; Jona 4; Lk 15; Joh 8; Röm 3; Röm 5; Röm 6; 2Kor 12; Gal 2; Eph 2; Tit 2; Tit 3; Hebr 4") },
  weisheit: { title: "Weisheit", passages: T("Spr 1; Spr 2; Spr 3; Spr 8; Spr 9; Hi 28; Pred 3; Pred 12; Ps 1; Ps 19; Ps 90; Mt 7; 1Kor 1; 1Kor 2; Jak 1; Jak 3") },
  bund: { title: "Die Bundesschlüsse", passages: T("1Mo 9; 1Mo 12; 1Mo 15; 1Mo 17; 2Mo 19; 2Mo 20; 2Mo 24; 5Mo 29; 5Mo 30; 2Sam 7; Ps 89; Jer 31; Hes 36; Lk 22; 2Kor 3; Hebr 8; Hebr 9") },
};
// Chronologisch orientiert (vereinfachte Buchreihenfolge). Unsichere Einordnungen sind markiert.
export const CHRONO: { book: string; uncertain?: boolean }[] = [
  "1Mo", "Hi*", "2Mo", "3Mo", "4Mo", "5Mo", "Jos", "Ri", "Rut", "1Sam", "2Sam", "Ps*", "1Chr", "1Kö", "Spr*", "Pred*", "Hld*", "2Chr", "2Kö", "Jona", "Am", "Hos", "Jes*", "Mi", "Nah", "Zef", "Hab", "Jer", "Kla", "Obd*", "Hes", "Dan*", "Joel*", "Esr", "Hag", "Sach", "Est", "Neh", "Mal",
  "Mt", "Mk", "Lk", "Joh", "Apg", "Jak*", "Gal", "1Thess", "2Thess", "1Kor", "2Kor", "Röm", "Eph", "Phil", "Kol", "Phlm", "1Tim", "Tit", "1Petr", "2Tim", "2Petr", "Hebr*", "Jud*", "1Joh", "2Joh", "3Joh", "Offb",
].map((s) => ({ book: s.replace("*", ""), uncertain: s.endsWith("*") }));

export const TEMPLATES = [
  { id: "bible-year", title: "Die ganze Bibel in einem Jahr", desc: "Kalenderjahr 1.1.–31.12., ganze Kapitel nach Textlänge verteilt." },
  { id: "nt-year", title: "Das Neue Testament in einem Jahr", desc: "Kalendergebunden, ruhige Tagesportionen." },
  { id: "parallel", title: "AT und NT parallel", desc: "Täglich ein Abschnitt aus beiden Testamenten." },
  { id: "book", title: "Ein Buch intensiv", desc: "Etwa ein Kapitel pro Lesetag." },
  { id: "chrono", title: "Chronologisch orientiert", desc: "Vereinfachte Reihenfolge; unsichere Einordnungen (*) sind gekennzeichnet." },
  ...Object.entries(THEMES).map(([k, t]) => ({ id: `theme-${k}`, title: `Thema: ${t.title}`, desc: `${t.passages.length} ausgewählte Kapitel.` })),
];

export function templateConfig(id: string, opts: { year?: number; start?: string; book?: string } = {}): PlanConfig {
  const y = opts.year ?? new Date().getFullYear();
  const base = { weekdays: [0, 1, 2, 3, 4, 5, 6], bufferEvery: 0, repeatWeekly: false, start: opts.start ?? today() };
  switch (id) {
    case "bible-year": return { ...base, title: `Bibel in einem Jahr ${y}`, template: id, books: BIBLE_BOOKS.map((b) => b.code), start: `${y}-01-01`, end: `${y}-12-31` };
    case "nt-year": return { ...base, title: `NT in einem Jahr ${y}`, template: id, books: NT, start: `${y}-01-01`, end: `${y}-12-31` };
    case "parallel": return { ...base, title: "AT und NT parallel", template: id, books: OT, parallel: NT, end: addDays(base.start, 364) };
    case "book": { const b = opts.book ?? "Joh"; return { ...base, title: `${BOOK_BY_CODE[b].name} intensiv`, template: id, books: [b], minutes: 5, end: undefined }; }
    case "chrono": return { ...base, title: "Chronologisch durch die Bibel", template: id, books: CHRONO.map((c) => c.book), end: addDays(base.start, 364), note: "Reihenfolge vereinfacht. Unsicher datiert: " + CHRONO.filter((c) => c.uncertain).map((c) => BOOK_BY_CODE[c.book]?.name).join(", ") + "." };
    default: {
      const t = THEMES[id.replace("theme-", "")];
      return { ...base, title: t.title, template: id, books: [], passages: t.passages, minutes: 8 };
    }
  }
}

// ---------------------------------------------------------------- Merkliste
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
export function reviewAnswer(it: ReviewItem, knew: boolean, now = today()): ReviewItem {
  const step = knew ? Math.min(it.step + 1, it.intervals.length - 1) : 0;
  return { ...it, step, due: addDays(now, it.intervals[step]) };
}
