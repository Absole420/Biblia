// Automatisierte Tests der Daten- und Fortschrittsfunktionen.
// Ausführen: node --test /app/tests/progress.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState, migrate, parseImport, buildExport, levelInfo, stationStatus, unreachableStations, computeBadges } from "../frontend/src/lib/progress-logic.ts";
import { JOHN } from "../frontend/src/data/john.ts";

test("alle Johannes-Stationen sind erreichbar", () => {
  assert.deepEqual(unreachableStations(JOHN.stations), []);
});
test("Freischaltbedingungen", () => {
  const s = JOHN.stations;
  assert.equal(stationStatus(s[0], {}), "available");
  assert.equal(stationStatus(s[1], {}), "locked");
  const p = { "john-1": { completedAt: "", examScore: 2, examTotal: 2, bestScore: 2, attempts: 1 } };
  assert.equal(stationStatus(s[0], p), "completed");
  assert.equal(stationStatus(s[1], p), "available");
  const six = s.find((x) => x.id === "john-6");
  assert.equal(stationStatus(six, { ...p, "john-4": p["john-1"] }), "locked"); // braucht 4 UND 5
});
test("Export/Import Roundtrip ohne Verlust", () => {
  const st = { ...defaultState(), xp: 230, notes: [{ id: "a", title: "t", text: "x", createdAt: "", updatedAt: "" }] };
  const r = parseImport(buildExport(st));
  assert.equal(r.ok, true);
  assert.equal(r.state.xp, 230);
  assert.equal(r.state.notes.length, 1);
});
test("beschädigte Importdateien werden abgelehnt", () => {
  assert.equal(parseImport("{kaputt").ok, false);
  assert.equal(parseImport(JSON.stringify({ foo: 1 })).ok, false);
  assert.equal(parseImport(JSON.stringify({ app: "BIBLIA", state: { schemaVersion: 99 } })).ok, false);
  assert.equal(parseImport(JSON.stringify({ app: "BIBLIA", state: { schemaVersion: 2, xp: "viel" } })).ok, false);
});
test("Migration v1 -> v2 erhält Fortschritt", () => {
  const m = migrate({ schemaVersion: 1, xp: 100, completed: ["john-1", "john-2"] });
  assert.equal(m.xp, 100);
  assert.ok(m.stations["john-1"] && m.stations["john-2"]);
  assert.equal(m.categories.length > 0, true);
});
test("Stufen und Abzeichen", () => {
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(150).level, 2);
  const b = computeBadges(defaultState(), JOHN.stations.map((s) => s.id));
  assert.equal(b.every((x) => !x.earned), true);
});
test("Aufgaben vollständig und mit Bibelstelle", () => {
  for (const s of JOHN.stations) {
    assert.ok(s.tasks.length >= 3 && s.exam.length >= 2, s.id);
    for (const t of [...s.tasks, ...s.exam]) assert.ok(t.ref && t.ref.length > 2, t.id);
  }
});
