import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchesReferenceSearch } from "../frontend/src/lib/referenceSearch.ts";
import { isTimelineEntry, isVision, timelineContext, TIMELINE_YEAR, TIMELINE_VISION_IDS } from "../frontend/src/data/timelineData.ts";

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const data = load("../frontend/src/data/articlesExpansion.json");
const bible = load("../backend/data/elb1905.json");
const books = readFileSync(new URL("../frontend/src/data/books.ts", import.meta.url), "utf8");
const codes = new Map([...books.matchAll(/\{ nr: (\d+), code: "([^"]+)"/g)].map(m => [m[2], Number(m[1])]));

test("new lexicon expansion has 49 unique articles with valid primary scripture references", () => {
  assert.equal(data.length, 49);
  assert.equal(new Set(data.map(a => a.id)).size, data.length);
  for (const a of data) {
    assert.ok(a.summary && a.overview.length >= 2 && a.deep.length && a.sources.length);
    for (const r of a.refs) {
      const m = r.match(/^(\S+) (\d+),(\d+)(?:–(\d+))?$/);
      assert.ok(m, r);
      const chapter = bible.books.find(b => b.nr === codes.get(m[1]))?.chapters[Number(m[2]) - 1];
      assert.ok(chapter && Number(m[3]) >= 1 && Number(m[4] ?? m[3]) <= chapter.length && Number(m[3]) <= Number(m[4] ?? m[3]), r);
    }
  }
});

test("visions are never assigned historical calendar dates", () => {
  for (const id of TIMELINE_VISION_IDS) {
    assert.ok(isTimelineEntry(id));
    assert.ok(isVision(id));
    assert.equal(timelineContext(id), "vision");
    assert.equal(TIMELINE_YEAR[id], undefined);
  }
  assert.equal(TIMELINE_YEAR["fall-ninives"], -612);
  assert.equal(TIMELINE_YEAR["fall-babylons"], -539);
  assert.equal(TIMELINE_YEAR["tempelzerstoerung-70"], 70);
});

test("search accepts normalized German spellings and multiple terms", () => {
  assert.ok(matchesReferenceSearch("glaube gerechtigkeit", "Glaube", "Gerechtigkeit"));
  assert.ok(matchesReferenceSearch("schoepfung", "Schoepfung")); // standard alias if provided
  assert.ok(matchesReferenceSearch("schopfung", "Schöpfung"));
  assert.ok(matchesReferenceSearch("Offb 7:4", "Offb 7,4–8"));
  assert.ok(!matchesReferenceSearch("Ninive Babylon", "Ninive"));
});
