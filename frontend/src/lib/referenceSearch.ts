/** Accent-insensitive AND-token search for the library. */
export function normalizeReferenceSearch(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[.,:;–—-]/g, " ").replace(/\s+/g, " ").trim();
}
export function matchesReferenceSearch(query: string, ...fields: string[]): boolean {
  const words = normalizeReferenceSearch(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const haystack = normalizeReferenceSearch(fields.join(" "));
  return words.every(word => haystack.includes(word));
}
