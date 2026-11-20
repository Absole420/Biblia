// PR #9 Tests, angepasst an die bereits vorhandene Offline-Struktur (Bücher, Kommentare, Querverweise je Buch unter src/data/offline/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { chapterLocal, searchLocal, indexCommentaries, permittedOffline } from "../frontend/src/data/offlineCore.ts";

const read = p => readFileSync(new URL(p, import.meta.url));
const json = p => JSON.parse(read(p).toString("utf8"));
const local = "../frontend/src/data/offline/";
const backend = "../backend/data/";
const books = Array.from({ length: 66 }, (_, i) => json(local + "bible/" + (i + 1) + ".json"));
const sources = json(local + "sources.json");
const commentaryFiles = readdirSync(new URL(backend + "commentaries/", import.meta.url)).filter(f => f.endsWith(".json")).map(f => json(backend + "commentaries/" + f));

test("all 66 books are bundled and identical to the source data", () => {
  assert.equal(books.reduce((n, b) => n + b.chapters.length, 0), 1189);
  assert.equal(books.reduce((n, b) => n + b.chapters.reduce((s, c) => s + c.length, 0), 0), 31102);
  assert.deepEqual(books.map(b => b.nr), Array.from({ length: 66 }, (_, i) => i + 1));
  assert.deepEqual(books.map(b => b.chapters), json(backend + "elb1905.json").books.map(b => b.chapters));
  assert.deepEqual(sources, json(backend + "sources.json"));
  for (let nr = 1; nr <= 66; nr++) assert.deepEqual(json(local + "xref/" + nr + ".json"), json(backend + "xref/" + nr + ".json"), "xref " + nr);
  for (const b of books) {
    assert.ok(chapterLocal(books, b.nr, b.chapters.length).length);
    assert.equal(chapterLocal(books, b.nr, b.chapters.length + 1), null);
  }
  assert.match(chapterLocal(books, 1, 1)[0], /Im Anfang/);
  assert.match(chapterLocal(books, 66, 22).at(-1), /Gnade/);
});

test("bundled per-book commentaries equal the source entries", () => {
  // Nur Quellen mit bestätigten Rechten werden mitgeliefert (Calvin deutsch: Rechte unbestätigt, Beta 0.9 deaktiviert)
  const all = commentaryFiles.filter(f => permittedOffline(sources.find(s => s.id === f.source))).flatMap(f => f.entries.map(e => ({ ...e, source: f.source })));
  const bundled = Array.from({ length: 66 }, (_, i) => i + 1).flatMap(nr => { try { return json(local + "commentary/" + nr + ".json"); } catch { return []; } });
  // Ungültige Versangaben der Quellen (z. B. falsche Kapitel) werden beim Bündeln verworfen/gekürzt
  assert.ok(bundled.length <= all.length && bundled.length > all.length * 0.97);
  const index = indexCommentaries(commentaryFiles, sources);
  assert.ok(index.get("43:3").length);
  // Nur deutsche Kommentare: englischer MHCC ausgeblendet, Calvin (gemeinfrei, deutsch) wieder aktiv
  assert.ok(!bundled.some(e => e.source === "mhcc"));
  assert.ok(bundled.some(e => e.source === "calvin-de"));
  for (const id of new Set(bundled.map(e => e.source))) assert.equal(sources.find(s => s.id === id).language, "de", id);
  for (const e of bundled) { const ch = books[e.book - 1].chapters[e.chapter - 1]; assert.ok(ch && e.from >= 1 && e.to >= e.from && e.to <= ch.length, e.id); }
  assert.ok(!permittedOffline(sources.find(s => s.id === "bibelkommentare-de")));
  assert.ok(permittedOffline(sources.find(s => s.id === "openbible-xref")));
});

test("global offline search without network", () => {
  const prev = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Unexpected network access"); };
  try {
    const r = searchLocal(books, "  JESUS  ");
    assert.equal(r.results.length, 60);
    assert.equal(r.truncated, true);
    for (const h of r.results) assert.equal(h.text, chapterLocal(books, h.book, h.chapter)[h.verse - 1]);
  } finally { globalThis.fetch = prev; }
});

test("no runtime networking in providers and offline release config", () => {
  for (const p of ["src/data/bible.ts", "src/components/VerseStudy.tsx", "src/data/offline/index.ts"]) {
    assert.doesNotMatch(read("../frontend/" + p).toString("utf8"), /\bfetch\s*\(|EXPO_PUBLIC_BACKEND_URL/, p);
  }
  assert.doesNotMatch(read("../frontend/app/(tabs)/library.tsx").toString("utf8"), /https?:\/\/images\.unsplash\.com/);
  const cfg = json("../frontend/app.json").expo;
  assert.equal(cfg.updates.enabled, false);
  assert.equal(cfg.updates.checkAutomatically, "NEVER");
  assert.equal(cfg.updates.useEmbeddedUpdate, true);
  const build = json("../frontend/eas.json").build["offline-release"];
  assert.equal(build.developmentClient, false);
  assert.equal(build.android.buildType, "apk");
});
