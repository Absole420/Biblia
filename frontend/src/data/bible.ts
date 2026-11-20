// Fully bundled Bible; preserve the existing reader API and ELB 1905 numbering.
import { BOOK_BY_CODE } from "./books";
import type { VerseRef } from "./types";
import { offlineBible } from "./offlineData";
import { chapterLocal, searchLocal } from "./offlineCore";

export type TranslationId = "elb1905" | "elb2006" | "neue";

export type Translation = { id: TranslationId; name: string; short: string; license: string; available: boolean };

export const TRANSLATIONS: Record<TranslationId, Translation> = {
  elb1905: { id: "elb1905", name: "Elberfelder 1905", short: "ELB 1905", license: "Gemeinfrei (Public Domain). Quelle: getbible.net", available: true },
  elb2006: {
    id: "elb2006",
    name: "Elberfelder Bibel, Edition 2006",
    short: "ELB 2006",
    license: "Urheberrechtlich geschützt (SCM R.Brockhaus). Nicht in dieser Offline-Ausgabe enthalten. Angezeigt wird die Elberfelder 1905.",
    available: false,
  },
  neue: {
    id: "neue",
    name: "NeÜ bibel.heute",
    short: "NeÜ",
    license: "PLATZHALTER – Die NeÜ (Karl-Heinz Vanheiden) ist urheberrechtlich geschützt. Der Text wird erst nach Einholung der Nutzungsrechte eingebunden.",
    available: false,
  },
};

/** Tatsächlich angezeigte Übersetzung: nicht verfügbare Übersetzungen fallen klar gekennzeichnet auf ELB 1905 zurück. */
export function displayedTranslation(id: TranslationId): Translation {
  const t = TRANSLATIONS[id] ?? TRANSLATIONS.elb1905;
  return t.available ? t : TRANSLATIONS.elb1905;
}

/** Compatibility for existing startup code, never contacts a server. */
export async function refreshTranslations(): Promise<void> {
  TRANSLATIONS.elb1905.available = true;
  TRANSLATIONS.elb2006.available = false;
  TRANSLATIONS.neue.available = false;
}

export function getChapterSync(code: string, ch: number): string[] | null {
  const book = BOOK_BY_CODE[code];
  return book ? chapterLocal(offlineBible(), book.nr, ch) : null;
}
export async function loadChapter(code: string, ch: number): Promise<string[]> {
  const verses = getChapterSync(code, ch);
  if (!verses) throw new Error("Bibelkapitel nicht gefunden.");
  return verses;
}
export async function searchBible(q: string) {
  return searchLocal(offlineBible(), q);
}

export function getVerses(_t: TranslationId, ref: VerseRef): { v: number; text: string }[] {
  const chapter = getChapterSync(ref.book, ref.ch) ?? [];
  const to = ref.to ?? ref.from;
  const out: { v: number; text: string }[] = [];
  for (let v = ref.from; v <= Math.min(to, chapter.length); v++) out.push({ v, text: chapter[v - 1] });
  return out;
}

export function getVerse(book: string, ch: number, v: number): string {
  return getChapterSync(book, ch)?.[v - 1] ?? "";
}

export function formatRef(ref: VerseRef): string {
  const b = BOOK_BY_CODE[ref.book]?.name ?? ref.book;
  if (ref.to && ref.to >= 200) return `${b} ${ref.ch}${ref.from > 1 ? "," + ref.from + "–Ende" : ""}`;
  return `${b} ${ref.ch},${ref.from}${ref.to && ref.to !== ref.from ? "–" + ref.to : ""}`;
}

export const verseKey = (book: string, ch: number, v: number) => `${book}:${ch}:${v}`;

export function verseKeyLabel(key: string): string {
  const [book, ch, v] = key.split(":");
  return `${BOOK_BY_CODE[book]?.name ?? book} ${ch},${v}`;
}
