// Austauschbare Bibel-Datenquelle.
// Elberfelder 1905: alle 66 Bücher liegen lokal im App-Paket (Permanent Offline Edition).
import { BOOK_BY_CODE } from "./books";
import johnElb from "./john-elb1905.json";
import { BIBLE } from "./offline";
import { rankBibleMatches } from "./searchRanking";
import { VerseRef } from "./types";

export type TranslationId = "elb1905" | "elb2006" | "neue";

export type Translation = { id: TranslationId; name: string; short: string; license: string; available: boolean };

const elbJohn = (johnElb as { chapters: Record<string, string[]> }).chapters;

export const TRANSLATIONS: Record<TranslationId, Translation> = {
  elb1905: { id: "elb1905", name: "Elberfelder 1905", short: "ELB 1905", license: "Gemeinfrei (Public Domain). Quelle: getbible.net", available: true },
  elb2006: {
    id: "elb2006",
    name: "Elberfelder Bibel, Edition 2006",
    short: "ELB 2006",
    license: "Urheberrechtlich geschützt (SCM R.Brockhaus). Technisch vorbereitet: Sobald lizenzierte Textdaten lokal im App-Paket vorliegen, kann sie angeboten werden. Bis dahin wird die Elberfelder 1905 angezeigt und so gekennzeichnet.",
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

const mem = new Map<string, string[]>();

export function getChapterSync(code: string, ch: number): string[] | null {
  if (code === "Joh" && elbJohn[String(ch)]) return elbJohn[String(ch)];
  return mem.get(`${code}:${ch}`) ?? null;
}

/** Ganze Bibel liegt im App-Paket; ein Buch wird beim ersten Zugriff geladen. */
function bookChapters(nr: number): string[][] {
  return BIBLE[nr]?.().chapters ?? [];
}

export async function loadChapter(code: string, ch: number): Promise<string[]> {
  const cached = getChapterSync(code, ch);
  if (cached) return cached;
  const verses = bookChapters(BOOK_BY_CODE[code].nr)[ch - 1];
  if (!verses) throw new Error("Kapitel nicht gefunden");
  mem.set(`${code}:${ch}`, verses);
  return verses;
}

/** Offline-Volltextsuche über alle 66 Bücher (Groß-/Kleinschreibung und Akzente egal, alle Wörter müssen vorkommen). */
export async function searchBible(q: string, limit = 60) {
  function* verses(){
    for(const nr of Object.keys(BIBLE).map(Number).sort((a,b)=>a-b)){
      const chapters=bookChapters(nr);
      for(let c=0;c<chapters.length;c++)for(let v=0;v<chapters[c].length;v++)
        yield {book:nr,chapter:c+1,verse:v+1,text:chapters[c][v]};
    }
  }
  return rankBibleMatches(verses(),q,limit);
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
