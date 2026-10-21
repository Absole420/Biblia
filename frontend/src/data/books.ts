// Alle 66 Bücher der Bibel (Nummerierung wie getbible.net / Elberfelder 1905).
export type BookInfo = { nr: number; code: string; name: string; chapters: number };

export const BIBLE_BOOKS: BookInfo[] = [
  { nr: 1, code: "1Mo", name: "1. Mose (Genesis)", chapters: 50 },
  { nr: 2, code: "2Mo", name: "2. Mose (Exodus)", chapters: 40 },
  { nr: 3, code: "3Mo", name: "3. Mose (Levitikus)", chapters: 27 },
  { nr: 4, code: "4Mo", name: "4. Mose (Numeri)", chapters: 36 },
  { nr: 5, code: "5Mo", name: "5. Mose (Deuteronomium)", chapters: 34 },
  { nr: 6, code: "Jos", name: "Josua", chapters: 24 },
  { nr: 7, code: "Ri", name: "Richter", chapters: 21 },
  { nr: 8, code: "Rut", name: "Rut", chapters: 4 },
  { nr: 9, code: "1Sam", name: "1. Samuel", chapters: 31 },
  { nr: 10, code: "2Sam", name: "2. Samuel", chapters: 24 },
  { nr: 11, code: "1Kö", name: "1. Könige", chapters: 22 },
  { nr: 12, code: "2Kö", name: "2. Könige", chapters: 25 },
  { nr: 13, code: "1Chr", name: "1. Chronik", chapters: 29 },
  { nr: 14, code: "2Chr", name: "2. Chronik", chapters: 36 },
  { nr: 15, code: "Esr", name: "Esra", chapters: 10 },
  { nr: 16, code: "Neh", name: "Nehemia", chapters: 13 },
  { nr: 17, code: "Est", name: "Ester", chapters: 10 },
  { nr: 18, code: "Hi", name: "Hiob", chapters: 42 },
  { nr: 19, code: "Ps", name: "Psalmen", chapters: 150 },
  { nr: 20, code: "Spr", name: "Sprüche", chapters: 31 },
  { nr: 21, code: "Pred", name: "Prediger", chapters: 12 },
  { nr: 22, code: "Hld", name: "Hoheslied", chapters: 8 },
  { nr: 23, code: "Jes", name: "Jesaja", chapters: 66 },
  { nr: 24, code: "Jer", name: "Jeremia", chapters: 52 },
  { nr: 25, code: "Kla", name: "Klagelieder", chapters: 5 },
  { nr: 26, code: "Hes", name: "Hesekiel", chapters: 48 },
  { nr: 27, code: "Dan", name: "Daniel", chapters: 12 },
  { nr: 28, code: "Hos", name: "Hosea", chapters: 14 },
  { nr: 29, code: "Joel", name: "Joel", chapters: 3 },
  { nr: 30, code: "Am", name: "Amos", chapters: 9 },
  { nr: 31, code: "Obd", name: "Obadja", chapters: 1 },
  { nr: 32, code: "Jona", name: "Jona", chapters: 4 },
  { nr: 33, code: "Mi", name: "Micha", chapters: 7 },
  { nr: 34, code: "Nah", name: "Nahum", chapters: 3 },
  { nr: 35, code: "Hab", name: "Habakuk", chapters: 3 },
  { nr: 36, code: "Zef", name: "Zefanja", chapters: 3 },
  { nr: 37, code: "Hag", name: "Haggai", chapters: 2 },
  { nr: 38, code: "Sach", name: "Sacharja", chapters: 14 },
  { nr: 39, code: "Mal", name: "Maleachi", chapters: 4 },
  { nr: 40, code: "Mt", name: "Matthäus", chapters: 28 },
  { nr: 41, code: "Mk", name: "Markus", chapters: 16 },
  { nr: 42, code: "Lk", name: "Lukas", chapters: 24 },
  { nr: 43, code: "Joh", name: "Johannes", chapters: 21 },
  { nr: 44, code: "Apg", name: "Apostelgeschichte", chapters: 28 },
  { nr: 45, code: "Röm", name: "Römer", chapters: 16 },
  { nr: 46, code: "1Kor", name: "1. Korinther", chapters: 16 },
  { nr: 47, code: "2Kor", name: "2. Korinther", chapters: 13 },
  { nr: 48, code: "Gal", name: "Galater", chapters: 6 },
  { nr: 49, code: "Eph", name: "Epheser", chapters: 6 },
  { nr: 50, code: "Phil", name: "Philipper", chapters: 4 },
  { nr: 51, code: "Kol", name: "Kolosser", chapters: 4 },
  { nr: 52, code: "1Thess", name: "1. Thessalonicher", chapters: 5 },
  { nr: 53, code: "2Thess", name: "2. Thessalonicher", chapters: 3 },
  { nr: 54, code: "1Tim", name: "1. Timotheus", chapters: 6 },
  { nr: 55, code: "2Tim", name: "2. Timotheus", chapters: 4 },
  { nr: 56, code: "Tit", name: "Titus", chapters: 3 },
  { nr: 57, code: "Phlm", name: "Philemon", chapters: 1 },
  { nr: 58, code: "Hebr", name: "Hebräer", chapters: 13 },
  { nr: 59, code: "Jak", name: "Jakobus", chapters: 5 },
  { nr: 60, code: "1Petr", name: "1. Petrus", chapters: 5 },
  { nr: 61, code: "2Petr", name: "2. Petrus", chapters: 3 },
  { nr: 62, code: "1Joh", name: "1. Johannes", chapters: 5 },
  { nr: 63, code: "2Joh", name: "2. Johannes", chapters: 1 },
  { nr: 64, code: "3Joh", name: "3. Johannes", chapters: 1 },
  { nr: 65, code: "Jud", name: "Judas", chapters: 1 },
  { nr: 66, code: "Offb", name: "Offenbarung", chapters: 22 },
];

export const BOOK_BY_CODE: Record<string, BookInfo> = Object.fromEntries(BIBLE_BOOKS.map((b) => [b.code, b]));

const norm = (s: string) => s.toLowerCase().replace(/[.\s]/g, "");
const ALIASES: Record<string, string> = {};
for (const b of BIBLE_BOOKS) {
  ALIASES[norm(b.code)] = b.code;
  ALIASES[norm(b.name)] = b.code;
  const m = b.name.match(/\((.+)\)/);
  if (m) ALIASES[norm(m[1])] = b.code;
}
Object.assign(ALIASES, {
  gen: "1Mo", ex: "2Mo", lev: "3Mo", num: "4Mo", dtn: "5Mo", "1mose": "1Mo", "2mose": "2Mo", "3mose": "3Mo", "4mose": "4Mo", "5mose": "5Mo",
  psalm: "Ps", hiob: "Hi", jesaja: "Jes", jer: "Jer", hes: "Hes", ez: "Hes", hesekiel: "Hes", mt: "Mt", mk: "Mk", lk: "Lk", jh: "Joh",
  apostelgeschichte: "Apg", rö: "Röm", rom: "Röm", röm: "Röm", hebr: "Hebr", heb: "Hebr", offb: "Offb", off: "Offb", phm: "Phlm",
  "1kön": "1Kö", "2kön": "2Kö", "1kö": "1Kö", "2kö": "2Kö", zeph: "Zef", sach: "Sach", spr: "Spr", pred: "Pred", koh: "Pred", hld: "Hld",
});

export function findBook(s: string): BookInfo | null {
  const code = ALIASES[norm(s)];
  return code ? BOOK_BY_CODE[code] : null;
}

export type ParsedRef = { code: string; ch: number; v?: number; vEnd?: number; label: string };

const REF_RE = /((?:[1-5]\.?\s?)?[A-Za-zÄÖÜäöüß]+\.?)\s*(\d+)(?:\s*[,:]\s*(\d+)(?:\s*[–-]\s*(\d+))?)?/;

/** Zerlegt einen Stellenstring wie "Joh 7,50; 19,39" oder "4Mo 21,8–9" in einzelne Verweise. */
export function parseRefs(text: string): { label: string; ref: ParsedRef | null }[] {
  const out: { label: string; ref: ParsedRef | null }[] = [];
  let lastBook: BookInfo | null = null;
  for (const raw of text.split(/;\s*/)) {
    const part = raw.trim();
    if (!part) continue;
    const m = part.match(REF_RE);
    let ref: ParsedRef | null = null;
    if (m && findBook(m[1])) {
      lastBook = findBook(m[1]);
      ref = { code: lastBook!.code, ch: +m[2], v: m[3] ? +m[3] : undefined, vEnd: m[4] ? +m[4] : undefined, label: part };
    } else if (lastBook) {
      const n = part.match(/^(\d+)(?:\s*,\s*(\d+))?/);
      if (n) ref = { code: lastBook.code, ch: +n[1], v: n[2] ? +n[2] : undefined, label: part };
    }
    if (ref && (ref.ch < 1 || ref.ch > BOOK_BY_CODE[ref.code].chapters)) ref = null;
    out.push({ label: part, ref });
  }
  return out;
}

export function parseRef(text: string): ParsedRef | null {
  return parseRefs(text)[0]?.ref ?? null;
}
