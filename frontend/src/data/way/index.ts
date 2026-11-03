import { TOPICS_1 } from "./topics1";
import { TOPICS_2 } from "./topics2";
import type { Topic, TopicCat } from "./types";

export * from "./types";

export const TOPICS: Topic[] = [...TOPICS_1, ...TOPICS_2];
export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export const TOPIC_CATS: { id: TopicCat; label: string; icon: string }[] = [
  { id: "light", label: "Freude & Hoffnung", icon: "sun" },
  { id: "heavy", label: "Schwere Gefühle", icon: "cloud" },
  { id: "guilt", label: "Schuld & Konflikt", icon: "git-merge" },
  { id: "faith", label: "Glaube & Zweifel", icon: "help-circle" },
  { id: "strength", label: "Kraft & Orientierung", icon: "compass" },
  { id: "others", label: "Ich & die anderen", icon: "users" },
  { id: "suffering", label: "Leid & Warten", icon: "clock" },
];

/** Geplante, noch nicht ausgearbeitete Themen – ehrlich als „offen“ gekennzeichnet. */
export const OPEN_TOPICS: { title: string; cat: TopicCat }[] = [
  { title: "Eifersucht und Vergleich", cat: "guilt" },
  { title: "Entscheidungen treffen", cat: "strength" },
  { title: "Arbeit, Beruf und Sinn", cat: "strength" },
  { title: "Geld, Mangel und Sorge um das Auskommen", cat: "heavy" },
  { title: "Liebe, Partnerschaft und Sehnsucht", cat: "others" },
  { title: "Familie, Eltern und Kinder", cat: "others" },
  { title: "Älterwerden und Abschied vom Gewohnten", cat: "suffering" },
  { title: "Sterben, Tod und Ewigkeit", cat: "suffering" },
  { title: "Frieden, Gelassenheit und Stille", cat: "light" },
  { title: "Mut, Aufbruch und Neuanfang", cat: "light" },
  { title: "Ungerechtigkeit und Ohnmacht", cat: "heavy" },
  { title: "Gebet, das schwerfällt", cat: "faith" },
];

/**
 * Gefühlsauswahl für den Check-in. Symbol + Text tragen die Bedeutung;
 * die Farbtöne sind bewusst nicht nach „angenehm/unangenehm“ gruppiert.
 */
export type Feeling = { id: string; label: string; icon: string; hue: number };
const HUES = 6;
const F = (id: string, label: string, icon: string, i: number): Feeling => ({ id, label, icon, hue: i % HUES });
export const FEELINGS: Feeling[] = [
  F("freude", "Freude", "sun", 0), F("traurig", "Traurig", "cloud-rain", 1), F("aengstlich", "Ängstlich", "wind", 2),
  F("dankbar", "Dankbar", "gift", 3), F("zornig", "Zornig", "zap", 4), F("einsam", "Einsam", "user", 5),
  F("ruhig", "Ruhig", "feather", 1), F("besorgt", "Besorgt", "cloud", 3), F("hoffnung", "Hoffnungsvoll", "sunrise", 2),
  F("erschoepft", "Erschöpft", "battery", 0), F("schuldig", "Schuldig", "droplet", 5), F("zufrieden", "Zufrieden", "smile", 4),
  F("unsicher", "Unsicher", "help-circle", 0), F("gekraenkt", "Gekränkt", "frown", 2), F("verbunden", "Verbunden", "users", 1),
  F("zweifelnd", "Zweifelnd", "shuffle", 3), F("ueberfordert", "Überfordert", "layers", 5), F("enttaeuscht", "Enttäuscht", "cloud-off", 4),
  F("mutlos", "Mutlos", "trending-down", 1), F("beschaemt", "Beschämt", "eye-off", 0), F("leer", "Leer", "circle", 2),
  F("neidisch", "Neidisch", "git-compare", 5), F("verletzt", "Verletzt", "heart", 3), F("abgelehnt", "Abgelehnt", "user-x", 4),
  F("gottfern", "Gott fern", "moon", 0), F("ungeduldig", "Ungeduldig", "clock", 1), F("orientierungslos", "Orientierungslos", "compass", 2),
  F("reuig", "Reue", "rotate-ccw", 3), F("wertlos", "Wertlos", "minus-circle", 5), F("versucht", "Versucht", "repeat", 4),
  F("krank", "Krank", "thermometer", 0), F("wartend", "Wartend", "watch", 1),
];
export const FEELING_BY_ID: Record<string, Feeling> = Object.fromEntries(FEELINGS.map((f) => [f.id, f]));
export const feelingLabel = (id: string) => FEELING_BY_ID[id]?.label ?? id;

/** Themen, die zu einem Gefühl passen. */
export const topicsForFeeling = (id: string) => TOPICS.filter((t) => t.feelings.includes(id));

const parse = (ref: string) => {
  const [b, c, vv] = ref.split(":");
  const [f, t] = (vv ?? "1").split("-").map((n) => parseInt(n, 10));
  return { b, c: parseInt(c, 10), f, t: t || f };
};
/** Alle Bibelstellen eines Themas. */
export const topicRefs = (t: Topic) => [...t.passages.map((p) => p.ref), ...t.people.map((p) => p.ref), ...t.jesus.map((j) => j.ref)];
/** Themen, in denen ein bestimmter Vers vorkommt (für den Bibelleser). */
export function topicsForVerse(book: string, ch: number, v: number): Topic[] {
  return TOPICS.filter((t) => topicRefs(t).some((r) => { const x = parse(r); return x.b === book && x.c === ch && v >= x.f && v <= x.t; }));
}
