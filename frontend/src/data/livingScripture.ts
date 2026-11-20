import raw from "./livingScripture.json";
export type VolumeID = "words" | "thread" | "unseen" | "jesus" | "trees" | "symbols" | "history";
export type LivingEntry = { id: string; group: string; title: string; body: string; refs: string[]; original?: string; translit?: string; note?: string; diagram?: string[] };
export type LivingVolume = { id: VolumeID; title: string; short: string; intro: string; entries: LivingEntry[] };
export const LIVING_VOLUMES = raw as LivingVolume[];
export const LIVING_BY_ID = Object.fromEntries(LIVING_VOLUMES.map(v => [v.id,v])) as Record<VolumeID, LivingVolume>;
export const normalizeStudySearch = (s: string) => s.normalize("NFD").replace(/\p{M}/gu,"").toLowerCase();
export function matchesLivingEntry(e: LivingEntry, q: string) {
  const h = normalizeStudySearch([e.title,e.group,e.original,e.translit,e.body,e.note,...e.refs,...(e.diagram??[])].filter(Boolean).join(" "));
  return normalizeStudySearch(q).trim().split(/\s+/).every(token => h.includes(token));
}
