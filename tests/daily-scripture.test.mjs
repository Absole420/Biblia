import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localDay, selectDaily, fallbackDaily } from "../frontend/src/lib/dailyScriptureLogic.ts";

const pool = JSON.parse(readFileSync(new URL("../frontend/src/data/daily-scripture-elb1905.json", import.meta.url), "utf8"));
const bible = JSON.parse(readFileSync(new URL("../backend/data/elb1905.json", import.meta.url), "utf8"));
const booksSource = readFileSync(new URL("../frontend/src/data/books.ts", import.meta.url), "utf8");
const codes = new Map([...booksSource.matchAll(/\{ nr: (\d+), code: "([^"]+)"/g)].map(m => [m[2], Number(m[1])]));

test("365 unique verses exactly match ELB 1905 source", () => {
  assert.equal(pool.length, 365);
  assert.equal(new Set(pool.map(v => v.id)).size, 365);
  for (const v of pool) {
    assert.equal(v.id, `${v.book}:${v.ch}:${v.v}`);
    assert.equal(v.text, bible.books.find(b => b.nr === codes.get(v.book)).chapters[v.ch - 1][v.v - 1].trim(), v.id);
    assert.ok(v.text.length <= 240 && v.text.length > 0);
  }
  assert.ok(pool.some(v => codes.get(v.book) <= 39));
  assert.ok(pool.some(v => codes.get(v.book) >= 40));
});

test("same local day keeps verse and remaining pool", () => {
  const first = selectDaily(pool, null, "2026-11-18", () => 0);
  const repeat = selectDaily(pool, JSON.parse(JSON.stringify(first.state)), "2026-11-18", () => 0.99);
  assert.equal(repeat.newDay, false);
  assert.deepEqual(repeat.state, first.state);
});

test("all entries used before repeating and no immediate cycle-boundary repeat", () => {
  let previous = null;
  const used = new Set();
  for (let i = 0; i < pool.length; i++) {
    const result = selectDaily(pool, previous, localDay(new Date(2026, 0, i + 1)), () => 0);
    assert.ok(!used.has(result.verse.id));
    assert.equal(result.newDay, true);
    used.add(result.verse.id);
    previous = result.state;
  }
  const next = selectDaily(pool, previous, "2027-01-01", () => 0.999);
  assert.notEqual(next.verse.id, previous.id);
  assert.equal(next.state.remaining.length, pool.length - 1);
});

test("local dates, invalid storage and stable fallback", () => {
  assert.equal(localDay(new Date(2026, 10, 18, 0, 1)), "2026-11-18");
  assert.equal(localDay(new Date(2026, 10, 18, 23, 59)), "2026-11-18");
  assert.equal(localDay(new Date(2026, 10, 19)), "2026-11-19");
  assert.ok(selectDaily(pool, {id: "missing", remaining: "bad"}, "2026-11-18").verse.text);
  assert.equal(fallbackDaily(pool, "2026-11-18").verse.id, fallbackDaily(pool, "2026-11-18").verse.id);
});
