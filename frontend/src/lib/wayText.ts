// Lesbare Fassung und neutrale Rückblicke – ausschließlich aus gespeicherten Einträgen.
import { TOPIC_BY_ID, feelingLabel } from "@/src/data/way";
import { BOOK_BY_CODE } from "@/src/data/books";

import { fmtDay, KIND_BY_ID, WayEntry } from "./way";

export const refLabelW = (ref: string) => {
  const [b, c, v] = ref.split(":");
  return `${BOOK_BY_CODE[b]?.name ?? b} ${c}${v ? "," + v.replace("-", "–") : ""}`;
};

export const allFeelings = (e: WayEntry) => [...e.feelings.map(feelingLabel), ...e.customFeelings];

export function buildReadable(entries: WayEntry[]): string {
  const lines = ["MEIN GEISTLICHER WEG – persönliches Tagebuch", `Exportiert am ${new Date().toLocaleString("de-DE")}`, "Vertraulich. Diese Fassung ist nicht verschlüsselt.", ""];
  [...entries].sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? ""))).forEach((e) => {
    lines.push("────────────────────────", `${fmtDay(e.date)}${e.time ? " · " + e.time : ""} · ${KIND_BY_ID[e.kind].label}`);
    const f = allFeelings(e);
    if (f.length) lines.push(`Gefühle: ${f.join(", ")}${e.intensity ? ` (Stärke ${e.intensity}/5)` : ""}`);
    const add = (label: string, v?: string) => v?.trim() && lines.push(`${label}: ${v.trim()}`);
    add(e.kind === "checkin" ? "Wie geht es mir" : "Eintrag", e.mood);
    add("Was mich beschäftigt", e.concern);
    add("Wie ich mich sehe", e.selfView);
    add("Was gutgetan / Kraft genommen hat", e.goodBad);
    add("Bibelstelle oder Gedanke", e.thought);
    add("An Gott", e.toGod);
    add("Nächster Schritt", e.nextStep);
    if (e.talk) lines.push(`Mit jemandem sprechen: ${{ yes: "ja", no: "nein", unsure: "vielleicht" }[e.talk]}`);
    if (e.refs.length) lines.push(`Bibelstellen: ${e.refs.map(refLabelW).join("; ")}`);
    if (e.topics.length) lines.push(`Themen: ${e.topics.map((t) => TOPIC_BY_ID[t]?.title ?? t).join("; ")}`);
    add("Notiz", e.note);
    lines.push("");
  });
  return lines.join("\n");
}

const count = (xs: string[]) => {
  const m: Record<string, number> = {};
  xs.forEach((x) => (m[x] = (m[x] ?? 0) + 1));
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};
const times = (n: number) => (n === 1 ? "einmal" : n === 2 ? "zweimal" : `${n}-mal`);

export type Review = {
  count: number;
  days: number;
  feelings: [string, number][];
  prevFeelings: Record<string, number>;
  refs: [string, number][];
  topics: [string, number][];
  questions: WayEntry[];
  steps: { date: string; text: string }[];
  prayers: WayEntry[];
  talk: number;
  sentences: string[];
};

/** Neutrale Zusammenfassung eines Zeitraums [from, to] (YYYY-MM-DD, inklusive). */
export function buildReview(all: WayEntry[], from: string, to: string, prevFrom?: string, prevTo?: string): Review {
  const inR = (e: WayEntry, a: string, b: string) => e.date >= a && e.date <= b;
  const list = all.filter((e) => inR(e, from, to));
  const prev = prevFrom && prevTo ? all.filter((e) => inR(e, prevFrom, prevTo)) : [];
  const feelings = count(list.flatMap(allFeelings));
  const prevFeelings = Object.fromEntries(count(prev.flatMap(allFeelings)));
  const refs = count(list.flatMap((e) => e.refs));
  const topics = count(list.flatMap((e) => e.topics));
  const questions = list.filter((e) => e.kind === "question");
  const steps = list.flatMap((e) => [...(e.nextStep?.trim() ? [{ date: e.date, text: e.nextStep.trim() }] : []), ...(e.kind === "step" && e.mood?.trim() ? [{ date: e.date, text: e.mood.trim() }] : [])]);
  const prayers = list.filter((e) => e.kind === "prayer" || e.toGod?.trim());
  const talk = list.filter((e) => e.talk === "yes").length;
  const days = new Set(list.map((e) => e.date)).size;

  const s: string[] = [];
  if (!list.length) s.push("In diesem Zeitraum hast du keine Einträge gespeichert. Das ist völlig in Ordnung.");
  else {
    s.push(`Du hast in diesem Zeitraum ${list.length} ${list.length === 1 ? "Eintrag" : "Einträge"} an ${days} ${days === 1 ? "Tag" : "Tagen"} gespeichert.`);
    if (feelings.length) s.push(`Am häufigsten hast du ${feelings.slice(0, 3).map(([f, n]) => `„${f}“ (${times(n)})`).join(", ")} genannt.`);
    if (refs.length) s.push(`Du hast ${refs.slice(0, 3).map(([r, n]) => `${refLabelW(r)} ${times(n)}`).join(", ")} gespeichert.`);
    if (prev.length && feelings.length) {
      const [f, n] = feelings[0];
      const p = prevFeelings[f] ?? 0;
      s.push(p === n ? `„${f}“ kam im Zeitraum davor genauso oft vor.` : `Im gleich langen Zeitraum davor hast du „${f}“ ${p ? times(p) : "nicht"} genannt.`);
    }
    if (questions.length) s.push(questions.length === 1 ? `Du hast eine Frage festgehalten${questions[0].resolved ? ", die du als beantwortet markiert hast" : ", die noch offen ist"}.` : `Du hast ${questions.length} Fragen festgehalten, davon ${questions.filter((q) => !q.resolved).length} noch offen.`);
    if (steps.length) s.push(`Du hast dir ${steps.length} ${steps.length === 1 ? "Schritt" : "Schritte"} vorgenommen.`);
    if (talk) s.push(`Bei ${talk} ${talk === 1 ? "Eintrag" : "Einträgen"} hast du notiert, dass du mit jemandem sprechen möchtest.`);
  }
  return { count: list.length, days, feelings, prevFeelings, refs, topics, questions, steps, prayers, talk, sentences: s };
}
