import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {WORLDS} from "../frontend/src/data/worlds.ts";

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const names = ["revelation","prophets-more","psalms-5","psalms-6","letters-more","history-tribes","synoptic"];
const campaigns = names.map(id => load("../frontend/src/data/campaigns/" + id + ".json"));
const bible = load("../backend/data/elb1905.json");
const booksSource = readFileSync(new URL("../frontend/src/data/books.ts", import.meta.url), "utf8");
const codes = new Map([...booksSource.matchAll(/\{ nr: (\d+), code: "([^"]+)"/g)].map(m => [m[2], Number(m[1])]));
const all = campaigns.flatMap(c => c.stations);

test("38 new independent stations, all registered in playable worlds", () => {
  assert.equal(all.length, 38);
  assert.equal(new Set(all.map(s => s.id)).size, all.length);
  for (const c of campaigns) {
    const world = WORLDS.find(w => w.id === c.worldId);
    assert.equal(world.status, "playable", c.id);
    assert.ok(world.campaignIds.includes(c.id), c.id);
    for (const s of c.stations) {
      assert.ok(s.x >= 0 && s.x <= c.mapW && s.y >= 0 && s.y <= c.mapH);
      assert.ok(s.goal && s.discover && s.summary && s.reflection.length);
      assert.ok(s.tasks.length >= 3 && s.exam.length >= 2);
      assert.equal(new Set([...s.tasks, ...s.exam].map(t => t.id)).size, s.tasks.length+s.exam.length);
      for (const t of [...s.tasks, ...s.exam]) {
        assert.ok(t.ref);
        if (t.type === "mc") assert.ok(Number.isInteger(t.answer) && t.answer >= 0 && t.answer < t.options.length);
      }
    }
  }
});

test("all structured reading references exist in bundled ELB 1905, including Jude fix", () => {
  const jude = load("../frontend/src/data/campaigns/letters.json").stations.find(s => s.id === "letters-14");
  for (const s of [...all, jude]) for (const r of s.readings) {
    const chapter = bible.books.find(b => b.nr === codes.get(r.book))?.chapters[r.ch - 1];
    assert.ok(chapter && r.from >= 1 && (r.to ?? r.from) <= chapter.length && r.from <= (r.to ?? r.from), s.id + ": " + JSON.stringify(r));
  }
});

test("Revelation has a reading in each of its 22 chapters", () => {
  const chapters = new Set(campaigns.find(c => c.id === "revelation").stations.flatMap(s => s.readings.map(r => r.ch)));
  assert.deepEqual([...chapters].sort((a,b) => a-b), Array.from({length:22}, (_,i)=>i+1));
});
