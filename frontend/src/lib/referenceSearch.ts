/** Accent-insensitive AND-token search for the library. */
export function normalizeReferenceSearch(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[.,:;–—-]/g, " ").replace(/\s+/g, " ").trim();
}
export function matchesReferenceSearch(query: string, ...fields: string[]): boolean {
  const words = normalizeReferenceSearch(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const haystack = ` ${normalizeReferenceSearch(fields.join(" "))} `;
  // Zahlen gehören zum vorigen Wort ("Offb 5" = Buch + Kapitel) und zählen nur als ganzes Wort.
  const terms: string[] = [];
  for (const w of words) {
    if (/^\d+$/.test(w) && terms.length && !/\d$/.test(terms[terms.length - 1])) terms[terms.length - 1] += " " + w;
    else terms.push(w);
  }
  return terms.every(t => (/\d$/.test(t) ? haystack.includes(` ${t} `) : haystack.includes(t)));
}
