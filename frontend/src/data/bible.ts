// Austauschbare Bibel-Datenquelle.
// Jede Übersetzung implementiert dasselbe Interface. Neue Übersetzungen werden
// hier registriert (siehe /app/docs/NEUE_BUECHER.md).
import johnElb from "./john-elb1905.json";
import { VerseRef } from "./types";

export type TranslationId = "elb1905" | "neue";

export type Translation = {
  id: TranslationId;
  name: string;
  short: string;
  license: string;
  available: boolean;
  getChapter: (book: string, ch: number) => string[] | null;
};

const elbChapters = (johnElb as { chapters: Record<string, string[]> }).chapters;

export const TRANSLATIONS: Record<TranslationId, Translation> = {
  elb1905: {
    id: "elb1905",
    name: "Elberfelder 1905",
    short: "ELB 1905",
    license: "Gemeinfrei (Public Domain). Quelle: getbible.net",
    available: true,
    getChapter: (book, ch) => (book === "Joh" ? elbChapters[String(ch)] ?? null : null),
  },
  neue: {
    id: "neue",
    name: "NeÜ bibel.heute",
    short: "NeÜ",
    license:
      "PLATZHALTER – Die NeÜ (Karl-Heinz Vanheiden) ist urheberrechtlich geschützt. Der Text wird erst nach Einholung der Nutzungsrechte eingebunden.",
    available: false,
    getChapter: () => null,
  },
};

export const BOOKS: Record<string, { name: string; chapters: number }> = {
  Joh: { name: "Johannes", chapters: 21 },
};

export function getVerses(t: TranslationId, ref: VerseRef): { v: number; text: string }[] {
  const tr = TRANSLATIONS[t].available ? TRANSLATIONS[t] : TRANSLATIONS.elb1905;
  const chapter = tr.getChapter(ref.book, ref.ch) ?? [];
  const to = ref.to ?? ref.from;
  const out: { v: number; text: string }[] = [];
  for (let v = ref.from; v <= Math.min(to, chapter.length); v++) out.push({ v, text: chapter[v - 1] });
  return out;
}

export function getVerse(book: string, ch: number, v: number): string {
  return TRANSLATIONS.elb1905.getChapter(book, ch)?.[v - 1] ?? "";
}

export function formatRef(ref: VerseRef): string {
  const b = BOOKS[ref.book]?.name ?? ref.book;
  return `${b} ${ref.ch},${ref.from}${ref.to && ref.to !== ref.from ? "–" + ref.to : ""}`;
}

export const verseKey = (book: string, ch: number, v: number) => `${book}:${ch}:${v}`;

export function verseKeyLabel(key: string): string {
  const [book, ch, v] = key.split(":");
  return `${BOOKS[book]?.name ?? book} ${ch},${v}`;
}
