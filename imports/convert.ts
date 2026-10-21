// Wandelt die HTML-Lernreisen (extrahiert nach /app/imports/json) in BIBLIA-Kampagnen um.
// Aufruf: npx tsx /app/imports/convert.ts
import fs from "fs";

import { findBook } from "../frontend/src/data/books";
import type { Campaign, Claim, Station, StationType, Task, Term, VerseRef } from "../frontend/src/data/types";

const J = (f: string) => JSON.parse(fs.readFileSync(`/app/imports/json/${f}.json`, "utf8"));
const OUT = "/app/frontend/src/data/campaigns";
fs.mkdirSync(OUT, { recursive: true });

const DOT = (s: string) => (s ?? "").replace(/\s*·\s*/g, "; ");
const BOOK_RE = /^((?:[1-5]\.?\s?)?[A-Za-zÄÖÜäöüß]+\.?)\s+(.*)$/;

/** "1. Mose 2,4–3,24; Römer 5,12–21; 7,1" → VerseRefs (mehrkapitelige Bereiche werden aufgeteilt). */
function toReadings(text: string, max = 3): VerseRef[] {
  const out: VerseRef[] = [];
  let book: string | null = null;
  for (const raw of DOT(text).split(/;\s*/)) {
    let part = raw.trim();
    const m = part.match(BOOK_RE);
    if (m && findBook(m[1])) { book = findBook(m[1])!.code; part = m[2]; }
    if (!book) continue;
    const r = part.match(/^(\d+)(?:,(\d+))?(?:\s*[–-]\s*(\d+)(?:,(\d+))?)?/);
    if (!r) continue;
    const c1 = +r[1];
    const v1 = r[2] ? +r[2] : 1;
    if (r[3] && r[4]) { // 2,4–3,24
      const c2 = +r[3];
      for (let c = c1; c <= Math.min(c2, c1 + 2); c++) out.push({ book, ch: c, from: c === c1 ? v1 : 1, to: c === c2 ? +r[4] : 200 });
    } else if (r[3] && r[2]) out.push({ book, ch: c1, from: v1, to: +r[3] }); // 1,1–17
    else if (r[3]) for (let c = c1; c <= Math.min(+r[3], c1 + 1); c++) out.push({ book, ch: c, from: 1, to: 200 }); // 1–4
    else out.push({ book, ch: c1, from: v1, to: r[2] ? undefined : 200 });
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

const TYPES: StationType[] = ["study", "narrative", "practice", "event", "challenge"];
const ICONS = ["book-open", "compass", "feather", "sun", "flag", "heart", "key", "star", "anchor", "shield", "map", "award", "eye", "music", "zap"];

let tid = 0;
const mc = (q: string, opts: string[], a: number, why: string, ref: string): Task => ({ id: `t${++tid}`, type: "mc", question: q, options: opts, answer: a, explain: why, ref });

/** Ordnet Stationen als Serpentine von unten (Start) nach oben (Ziel) an. */
function build(id: string, worldId: string, title: string, book: string, intro: string, raw: Omit<Station, "x" | "y" | "requires" | "id" | "type" | "icon" | "xp">[], opts: { icons?: string[]; examLast?: boolean } = {}): Campaign {
  const n = raw.length;
  const W = 1000;
  const H = Math.max(1500, 420 + n * 230);
  const stations: Station[] = raw.map((s, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const x = 500 + Math.sin(i * 1.15) * 300;
    const y = H - 270 - t * (H - 450);
    return {
      ...s,
      id: `${id}-${i + 1}`,
      type: opts.examLast && i === n - 1 ? "exam" : TYPES[i % TYPES.length],
      icon: (opts.icons ?? ICONS)[i % (opts.icons ?? ICONS).length],
      x: Math.round(x),
      y: Math.round(y),
      requires: i ? [`${id}-${i}`] : [],
      xp: opts.examLast && i === n - 1 ? 80 : 50,
    };
  });
  return { id, worldId, title, book, mapW: W, mapH: H, intro, stations };
}

const write = (c: Campaign) => {
  fs.writeFileSync(`${OUT}/${c.id}.json`, JSON.stringify(c));
  console.log(c.id, c.stations.length, "Stationen", c.stations.map((s) => s.readings.length).join(","));
};
const ensureExam = (tasks: Task[], exam: Task[]) => (exam.length ? { tasks, exam } : { tasks: tasks.slice(0, -1), exam: tasks.slice(-1) });

// ---------------------------------------------------------------- Tora
{
  const { B, L } = J("tora");
  B.forEach((b: any, bi: number) => {
    const lessons = L.slice(b[2], b[3]);
    const raw = lessons.map((l: any) => {
      const [title, , ref, , theme, summary, read, meaning, cross, practice, q, o, a, why, kind, x1, x2] = l;
      const tasks: Task[] = [];
      if (kind === "sort") tasks.push({ id: `t${++tid}`, type: "order", question: x1, items: x2, explain: summary, ref });
      tasks.push({ id: `t${++tid}`, type: "free", question: kind === "write" ? x1 : "Fasse die Bedeutung dieses Abschnitts in eigenen Worten zusammen.", model: meaning, ref });
      return {
        title, subtitle: `${theme} · ${ref}`, discover: summary, readings: toReadings(ref, 2), terms: [] as Term[],
        background: [
          { kind: "text", title: "Beobachten", text: read, refs: [ref] },
          { kind: "christian", title: "Bedeutung", text: meaning },
          { kind: "text", title: "Querverbindungen", text: DOT(cross), refs: DOT(cross).split("; ") },
        ] as Claim[],
        tasks, exam: [mc(q, o, a, why, ref)], reflection: [practice],
      };
    });
    write(build(`tora-${bi + 1}`, "tora", `${b[0]} · ${b[1]}`, b[0], b[4], raw));
  });
}

// ---------------------------------------------------------------- Gleichnisse
{
  const { P } = J("gleichnisse");
  const raw = P.map((p: any) => {
    const tasks: Task[] = [];
    if (p.kind === "sort" && p.pairs) tasks.push({ id: `t${++tid}`, type: "match", question: "Ordne richtig zu:", pairs: p.pairs, explain: p.meaning, ref: p.ref });
    tasks.push({ id: `t${++tid}`, type: "free", question: "Was sagt dieses Gleichnis über Gottes Reich? Erkläre in eigenen Worten.", model: p.meaning, ref: p.ref });
    return {
      title: p.title, subtitle: `${p.theme} · ${p.ref.split(" · ")[0]}`, discover: p.intro, readings: toReadings(p.ref, 1), terms: [] as Term[],
      background: [
        { kind: "text", title: "Leseauftrag", text: p.text, refs: DOT(p.ref).split("; ") },
        { kind: "christian", title: "Bedeutung", text: p.meaning },
        { kind: "text", title: "Querverbindungen", text: DOT(p.cross), refs: DOT(p.cross).split("; ") },
      ] as Claim[],
      tasks, exam: [mc(p.q, p.opts, p.correct, p.why, p.ref)], reflection: [p.practice],
    };
  });
  write(build("parables", "parables", "Die Gleichnisse Jesu", "Mt", "Eine Lernreise durch zwölf Gleichnisse: hören, verstehen und im Alltag entdecken, wie Jesus vom Reich Gottes erzählt.", raw, { icons: ["feather", "sun", "search", "heart", "gift", "home", "users", "key", "droplet", "award", "clock", "star"] }));
}

// ---------------------------------------------------------------- Briefe
{
  const { B, glossary, examQ } = J("briefe");
  const raw = B.map((b: any) => {
    const quiz = b.quiz.map((q: any) => mc(q[0], q[1], q[2], q[3], b.s));
    const refs = b.lessons.map((l: any) => l[2]).join("; ");
    return {
      title: b.n, subtitle: `${b.author} · ${b.date}`, discover: `${b.summary}\n\nThema: ${b.theme}`, readings: toReadings(refs, 3),
      terms: b.links.map((l: any) => ({ term: l[1], explanation: `${l[3]} Vgl. ${l[2]}.`, ref: l[0] })),
      background: [
        { kind: "history", title: "Situation", text: `Verfasser: ${b.author}. Empfänger: ${b.aud}. Datierung: ${b.date}.` },
        ...b.lessons.map((l: any) => ({ kind: "text", title: l[0], text: l[1], refs: DOT(l[2]).split("; ") })),
      ] as Claim[],
      tasks: quiz.slice(0, 3), exam: quiz.slice(3), reflection: b.life.map((l: any) => `${l[0]}: ${l[1]}`),
    };
  });
  const ex = examQ.map((q: any) => mc(q[0], q[1], q[2], q[3], ""));
  raw.push({
    title: "Abschlussprüfung", subtitle: "Das Evangelium leben · alle Briefe", discover: "Wiederhole die zentralen Begriffe der Briefe und zeige in der Abschlussprüfung, was du gelernt hast.",
    readings: toReadings("Römer 12,1–2; Epheser 2,8–10", 2), terms: glossary.map((g: any) => ({ term: g[0], explanation: g[1] })),
    background: [{ kind: "christian", title: "Rückblick", text: "Die Briefe verbinden Lehre und Leben: Aus Gottes Gnade in Christus folgt ein neues Leben in Gemeinschaft, Hoffnung und Liebe." }] as Claim[],
    tasks: ex.slice(0, 4), exam: ex.slice(4), reflection: ["Welcher Brief hat dich am meisten herausgefordert – und warum?"],
  });
  write(build("letters", "letters", "Das Evangelium leben", "Röm", "Vom Römerbrief bis Judas: Lerne die neutestamentlichen Briefe kennen – ihre Situation, ihre Botschaft und was sie für das Leben heute bedeuten.", raw, { examLast: true, icons: ["mail", "users", "heart", "unlock", "link", "smile", "crown", "sunrise", "shield", "anchor", "check-square", "key", "sun", "alert-triangle", "award"].map((i) => (i === "crown" ? "award" : i)) }));
}

// ---------------------------------------------------------------- Propheten
{
  const { P, extra, glossary, Q, examQ } = J("propheten");
  const raw = P.map((p: any) => {
    const qs = (Q[p.id] ?? []).map((q: any) => mc(q[0], q[1], q[2], q[3], p.key));
    const pairs = p.prophecies.slice(0, 4).map((x: any) => [x[0], x[2]] as [string, string]);
    const tasks: Task[] = [{ id: `t${++tid}`, type: "match", question: "Ordne jeder Prophetenstelle die neutestamentliche Aufnahme zu:", pairs, explain: "Die Zuordnung zeigt, wie das Neue Testament die Propheten liest.", ref: p.key }, ...qs.slice(0, 2)];
    return {
      title: p.n, subtitle: `${p.date} · ${p.theme}`, discover: p.summary, readings: toReadings(p.lessons.map((l: any) => l[2]).join("; "), 3),
      terms: p.prophecies.map((x: any) => ({ term: x[1], explanation: `${x[0]} → ${x[2]} (${x[3]}). ${x[4]}`, ref: `${x[0]}; ${x[2]}` })),
      background: [
        { kind: "history", title: "Zeit und Ort", text: `${p.date} · ${p.place}` },
        ...p.lessons.map((l: any, i: number) => ({ kind: i === p.lessons.length - 1 ? "christian" : "text", title: l[0], text: l[1], refs: DOT(l[2]).split("; ") })),
      ] as Claim[],
      ...ensureExam(tasks, qs.slice(2)), reflection: ["Welche Botschaft dieses Propheten trifft dich heute – und warum?", "Wie hilft dir der historische Kontext, die Verheißung besser zu verstehen?"],
    };
  });
  const ex = examQ.map((q: any) => mc(q[0], q[1], q[2], q[3], ""));
  raw.push({
    title: "Verheißung & Erfüllung", subtitle: "Abschluss · Die Propheten weisen auf Jesus", discover: "Weitere Prophetenworte und ihre Aufnahme im Neuen Testament – und die große Abschlussprüfung.",
    readings: toReadings("Lukas 24,25–27; Lukas 24,44–47", 2),
    terms: [...extra.map((x: any) => ({ term: x[3], explanation: `${x[1]} → ${x[2]} (${x[4]}). ${x[5]}`, ref: `${x[1]}; ${x[2]}` })), ...glossary.map((g: any) => ({ term: g[0], explanation: g[1] }))],
    background: [{ kind: "hypothesis", title: "Lesehilfe", text: "Nicht jede Verbindung ist eine direkte Vorhersage: Das Neue Testament zitiert, deutet Motive oder liest Muster typologisch. Der ursprüngliche Kontext bleibt der Ausgangspunkt." }] as Claim[],
    tasks: ex.slice(0, 4), exam: ex.slice(4), reflection: ["Welche Verheißung ist dir auf dieser Reise neu wichtig geworden?"],
  });
  write(build("prophets", "prophets", "Die Propheten weisen auf Jesus", "Jes", "Zehn Propheten in ihrer Zeit – und wie das Neue Testament ihre Worte auf Jesus bezieht.", raw, { examLast: true, icons: ["zap", "droplet", "wind", "eye", "home", "sunrise", "heart", "sun", "tool", "cloud-rain", "award"] }));
}

// ---------------------------------------------------------------- Evangelien + Apg
{
  const { books, atlas, glossary, examQuestions } = J("evangelien");
  const conv = (st: any) => {
    const qs = st.questions.map((q: any) => mc(q.q, q.opts, q.a, q.why, q.ref));
    return {
      title: st.title, subtitle: `${st.theme} · ${st.range}`, discover: st.lesson, readings: toReadings(`${st.key}`, 2), terms: [] as Term[],
      background: [
        { kind: "text", title: "Kernvers", text: `„${st.quote}“ (${st.key})`, refs: [st.key] },
        { kind: "text", title: "Leseauftrag", text: st.take, refs: [st.range] },
        ...st.questions.filter((q: any) => q.ot).map((q: any) => ({ kind: "jewish", title: "Alttestamentlicher Hintergrund", text: q.ot })),
      ] as Claim[],
      tasks: [...qs.slice(0, -1), { id: `t${++tid}`, type: "free", question: `Was ist der Kern von „${st.title}“? Fasse ihn in zwei, drei Sätzen zusammen.`, model: st.lesson, ref: st.range } as Task],
      exam: qs.slice(-1), reflection: [`Was bedeutet „${st.theme}“ für deinen Alltag?`],
    };
  };
  const meta: Record<string, [string, string, string, string]> = {
    Matthäus: ["matthew", "gospels", "Mt", "Jesus, der verheißene König: Matthäus verbindet Jesu Weg mit Israels Schriften."],
    Markus: ["mark", "gospels", "Mk", "Das kürzeste Evangelium: schnell, dramatisch – und der Weg führt zum Kreuz."],
    Lukas: ["luke", "gospels", "Lk", "Lukas erzählt sorgfältig von Gottes Erbarmen für Arme, Außenseiter und Verlorene."],
    Apostelgeschichte: ["acts", "acts", "Apg", "Von Jerusalem bis Rom: Der Heilige Geist treibt die Botschaft hinaus zu den Völkern."],
  };
  for (const b of books) {
    const m = meta[b.title];
    if (!m) continue; // Johannes ist bereits als eigene Kampagne vorhanden
    const raw = b.stations.map(conv);
    if (m[0] === "matthew") {
      const ex = examQuestions.map((q: any) => mc(q.q, q.opts, q.a, q.why ?? "", q.ref ?? ""));
      raw.push({
        title: "Schrift-Atlas", subtitle: "Altes Testament im Neuen · Abschluss", discover: "Wie greifen die Evangelien das Alte Testament auf? Zitat, Motiv oder Typologie – entdecke die Verbindungen.",
        readings: toReadings("Lukas 24,27", 1),
        terms: [...atlas.map((a: any) => ({ term: a.title, explanation: `${a.ot} → ${a.nt} (${a.kind}). ${a.explain}`, ref: `${a.ot}; ${a.nt}` })), ...glossary.map((g: any) => (Array.isArray(g) ? { term: g[0], explanation: g[1] } : { term: g.term ?? g.t, explanation: g.text ?? g.d ?? "" }))],
        background: [{ kind: "hypothesis", title: "Lesehilfe", text: "Direktes Zitat, Motiv und Typologie unterscheiden: Nicht jede Ähnlichkeit ist eine Vorhersage. Der ursprüngliche Zusammenhang bleibt wichtig." }] as Claim[],
        tasks: ex.slice(0, 3), exam: ex.slice(3), reflection: ["Welche Verbindung zwischen Altem und Neuem Testament hat dich überrascht?"],
      });
    }
    write(build(m[0], m[1], b.title === "Apostelgeschichte" ? "Die Apostelgeschichte" : `Das Evangelium nach ${b.title}`, m[2], m[3], raw, { examLast: m[0] === "matthew" }));
  }
}
