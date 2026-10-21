// Sortier- und Zuordnungshilfen für die Bibliothek (Bibel: Buch/Kapitel/Vers · Studienreise: Lernwelt/Lektion/Station).
import { BOOK_BY_CODE } from "@/src/data/books";
import { CAMPAIGNS } from "@/src/data/john";
import { Campaign, Station, World } from "@/src/data/types";
import { WORLDS } from "@/src/data/worlds";

export type StationInfo = { station: Station; campaign: Campaign; world: World; order: number };

export const STATION_INFO: Record<string, StationInfo> = {};
WORLDS.forEach((w, wi) =>
  (w.campaignIds ?? []).forEach((cid, ci) =>
    CAMPAIGNS[cid]?.stations.forEach((s, si) => {
      STATION_INFO[s.id] = { station: s, campaign: CAMPAIGNS[cid], world: w, order: wi * 1e6 + ci * 1e3 + si };
    }),
  ),
);

/** Zerlegt einen Schlüssel wie "Joh", "Joh:3", "Joh:3:16" oder "Joh:3:16-18". */
export function splitKey(key: string) {
  const [book, ch, v] = key.split(":");
  return { book, ch: ch ? parseInt(ch, 10) : 0, v: v ? parseInt(v, 10) : 0 };
}

/** Kanonische Reihenfolge: Buch → Kapitel → Vers. */
export function bibleOrder(key: string) {
  const { book, ch, v } = splitKey(key);
  return (BOOK_BY_CODE[book]?.nr ?? 99) * 1e6 + ch * 1e3 + v;
}

export function bibleKeyLabel(key: string) {
  const { book, ch } = splitKey(key);
  const name = BOOK_BY_CODE[book]?.name ?? book;
  const rest = key.split(":").slice(1);
  if (!rest.length) return name;
  if (rest.length === 1) return `${name} ${ch}`;
  return `${name} ${ch},${rest[1]}`;
}
