// Only static local requires; Metro includes all files in the Android release.
import type { BibleBookData, CommentaryEntry, CommentaryFile, CrossRefRow, Source } from "./offlineCore";
import { indexCommentaries, permittedOffline } from "./offlineCore";

let books: BibleBookData[] | undefined;
export function offlineBible(): BibleBookData[] {
  return books ??= (require("./offline/elb1905.json") as {books:BibleBookData[]}).books;
}
export function offlineSources(): Source[] { return require("./offline/sources.json") as Source[]; }

let commentary: Map<string, CommentaryEntry[]> | undefined;
export function offlineCommentary(nr: number, ch: number): CommentaryEntry[] {
  commentary ??= indexCommentaries([
    require("./offline/commentaries/calvin_de.json") as CommentaryFile,
    require("./offline/commentaries/mhcc.json") as CommentaryFile,
  ], offlineSources());
  return commentary.get(nr + ":" + ch) ?? [];
}

// Literal require paths are necessary for Metro; load only the selected book.
const XREF: Record<number, () => Record<string, CrossRefRow[]>> = {
  1: () => require("./offline/xref/1.json"),
  2: () => require("./offline/xref/2.json"),
  3: () => require("./offline/xref/3.json"),
  4: () => require("./offline/xref/4.json"),
  5: () => require("./offline/xref/5.json"),
  6: () => require("./offline/xref/6.json"),
  7: () => require("./offline/xref/7.json"),
  8: () => require("./offline/xref/8.json"),
  9: () => require("./offline/xref/9.json"),
  10: () => require("./offline/xref/10.json"),
  11: () => require("./offline/xref/11.json"),
  12: () => require("./offline/xref/12.json"),
  13: () => require("./offline/xref/13.json"),
  14: () => require("./offline/xref/14.json"),
  15: () => require("./offline/xref/15.json"),
  16: () => require("./offline/xref/16.json"),
  17: () => require("./offline/xref/17.json"),
  18: () => require("./offline/xref/18.json"),
  19: () => require("./offline/xref/19.json"),
  20: () => require("./offline/xref/20.json"),
  21: () => require("./offline/xref/21.json"),
  22: () => require("./offline/xref/22.json"),
  23: () => require("./offline/xref/23.json"),
  24: () => require("./offline/xref/24.json"),
  25: () => require("./offline/xref/25.json"),
  26: () => require("./offline/xref/26.json"),
  27: () => require("./offline/xref/27.json"),
  28: () => require("./offline/xref/28.json"),
  29: () => require("./offline/xref/29.json"),
  30: () => require("./offline/xref/30.json"),
  31: () => require("./offline/xref/31.json"),
  32: () => require("./offline/xref/32.json"),
  33: () => require("./offline/xref/33.json"),
  34: () => require("./offline/xref/34.json"),
  35: () => require("./offline/xref/35.json"),
  36: () => require("./offline/xref/36.json"),
  37: () => require("./offline/xref/37.json"),
  38: () => require("./offline/xref/38.json"),
  39: () => require("./offline/xref/39.json"),
  40: () => require("./offline/xref/40.json"),
  41: () => require("./offline/xref/41.json"),
  42: () => require("./offline/xref/42.json"),
  43: () => require("./offline/xref/43.json"),
  44: () => require("./offline/xref/44.json"),
  45: () => require("./offline/xref/45.json"),
  46: () => require("./offline/xref/46.json"),
  47: () => require("./offline/xref/47.json"),
  48: () => require("./offline/xref/48.json"),
  49: () => require("./offline/xref/49.json"),
  50: () => require("./offline/xref/50.json"),
  51: () => require("./offline/xref/51.json"),
  52: () => require("./offline/xref/52.json"),
  53: () => require("./offline/xref/53.json"),
  54: () => require("./offline/xref/54.json"),
  55: () => require("./offline/xref/55.json"),
  56: () => require("./offline/xref/56.json"),
  57: () => require("./offline/xref/57.json"),
  58: () => require("./offline/xref/58.json"),
  59: () => require("./offline/xref/59.json"),
  60: () => require("./offline/xref/60.json"),
  61: () => require("./offline/xref/61.json"),
  62: () => require("./offline/xref/62.json"),
  63: () => require("./offline/xref/63.json"),
  64: () => require("./offline/xref/64.json"),
  65: () => require("./offline/xref/65.json"),
  66: () => require("./offline/xref/66.json"),
};
export function offlineXrefs(nr: number, ch: number): CrossRefRow[] {
  if (!permittedOffline(offlineSources().find(s => s.id === "openbible-xref"))) return [];
  return XREF[nr]?.()?.[String(ch)] ?? [];
}
