// Pure data functions shared by the app and offline regression tests.
export type BibleBookData = { nr: number; chapters: string[][] };
export type SearchHit = { book: number; chapter: number; verse: number; text: string };
export type CrossRefRow = [number, number, number, number, number, number, number, number];
export type CommentaryEntry = { id: string; source: string; book: number; chapter: number; from: number; to: number; scope: "verse" | "range" | "section" | "chapter"; title: string; text: string };
export type CommentaryFile = { source: string; entries: Omit<CommentaryEntry, "source">[] };
export type Source = { id: string; type: string; title: string; author: string; language: string; edition: string; year: string; url: string; license: string; rights: Record<string, boolean>; perspective: string; historical: boolean; status: string; coverage?: string };

export function chapterLocal(books: readonly BibleBookData[], nr: number, chapter: number): string[] | null {
  if (!Number.isInteger(nr) || !Number.isInteger(chapter) || chapter < 1) return null;
  return books.find(b => b.nr === nr)?.chapters[chapter - 1] ?? null;
}

/** Whole-Bible literal case-insensitive search; preserve original text & numbering. */
export function searchLocal(books: readonly BibleBookData[], q: string, limit = 60): { results: SearchHit[]; truncated: boolean } {
  const needle = q.trim().toLowerCase();
  const results: SearchHit[] = [];
  if (needle.length < 3) return { results, truncated: false };
  const cap = Number.isFinite(limit) ? Math.min(500, Math.max(1, Math.floor(limit))) : 60;
  for (const b of books) {
    for (let ci = 0; ci < b.chapters.length; ci++) {
      const ch = b.chapters[ci];
      for (let vi = 0; vi < ch.length; vi++) {
        const text = ch[vi];
        if (text.toLowerCase().includes(needle)) {
          if (results.length >= cap) return { results, truncated: true };
          results.push({book:b.nr, chapter:ci+1, verse:vi+1, text});
        }
      }
    }
  }
  return { results, truncated: false };
}

export function permittedOffline(source: Source | undefined): boolean {
  return !!source && source.status === "integrated" && source.rights.fulltext === true && source.rights.offline === true && source.rights.redistribute === true;
}

export function indexCommentaries(files: readonly CommentaryFile[], sources: readonly Source[]): Map<string, CommentaryEntry[]> {
  const byChapter = new Map<string, CommentaryEntry[]>();
  for (const file of files) {
    if (!permittedOffline(sources.find(s => s.id === file.source))) continue;
    for (const entry of file.entries) {
      const key = entry.book + ":" + entry.chapter;
      const list = byChapter.get(key) ?? [];
      list.push({...entry, source:file.source});
      byChapter.set(key, list);
    }
  }
  return byChapter;
}
