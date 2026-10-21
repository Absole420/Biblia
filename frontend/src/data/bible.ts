// Austauschbare Bibel-Datenquelle.
// Elberfelder 1905: gesamte Bibel über das Backend (/api/bible), Kapitel werden
// lokal zwischengespeichert (offline lesbar). Johannes ist zusätzlich im App-Bundle.
import { storage } from "@/src/utils/storage";

import { BOOK_BY_CODE } from "./books";
import johnElb from "./john-elb1905.json";
import { VerseRef } from "./types";

export type TranslationId = "elb1905" | "neue";

export type Translation = { id: TranslationId; name: string; short: string; license: string; available: boolean };

const elbJohn = (johnElb as { chapters: Record<string, string[]> }).chapters;

export const TRANSLATIONS: Record<TranslationId, Translation> = {
  elb1905: { id: "elb1905", name: "Elberfelder 1905", short: "ELB 1905", license: "Gemeinfrei (Public Domain). Quelle: getbible.net", available: true },
  neue: {
    id: "neue",
    name: "NeÜ bibel.heute",
    short: "NeÜ",
    license: "PLATZHALTER – Die NeÜ (Karl-Heinz Vanheiden) ist urheberrechtlich geschützt. Der Text wird erst nach Einholung der Nutzungsrechte eingebunden.",
    available: false,
  },
};

const mem = new Map<string, string[]>();
const API = process.env.EXPO_PUBLIC_BACKEND_URL;

export function getChapterSync(code: string, ch: number): string[] | null {
  if (code === "Joh" && elbJohn[String(ch)]) return elbJohn[String(ch)];
  return mem.get(`${code}:${ch}`) ?? null;
}

export async function loadChapter(code: string, ch: number): Promise<string[]> {
  const cached = getChapterSync(code, ch);
  if (cached) return cached;
  const key = `bible_elb_${code}_${ch}`;
  const stored = await storage.getItem(key, null as string | null);
  if (typeof stored === "string") {
    const verses = JSON.parse(stored) as string[];
    mem.set(`${code}:${ch}`, verses);
    return verses;
  }
  const book = BOOK_BY_CODE[code];
  const res = await fetch(`${API}/api/bible/${book.nr}/${ch}`);
  if (!res.ok) throw new Error("Kapitel konnte nicht geladen werden");
  const data = (await res.json()) as { verses: string[] };
  mem.set(`${code}:${ch}`, data.verses);
  storage.setItem(key, JSON.stringify(data.verses));
  return data.verses;
}

export async function searchBible(q: string) {
  const res = await fetch(`${API}/api/bible/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Suche fehlgeschlagen");
  return (await res.json()) as { results: { book: number; chapter: number; verse: number; text: string }[]; truncated: boolean };
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
