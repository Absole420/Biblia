import { test } from "node:test";
import assert from "node:assert/strict";
import { HISTORY } from "../frontend/src/data/history.ts";
import { WORLDS } from "../frontend/src/data/worlds.ts";

test("Geschichtsbücher-Kampagne enthält alle neun Bücher und 16 Stationen", () => {
  assert.equal(HISTORY.stations.length, 16);
  for (const book of ["Jos", "Ri", "Rut", "1Sam", "1Kö", "2Kö", "1Chr", "2Chr", "Esra", "Neh", "Est"]) {
    assert.ok(HISTORY.stations.some((station) => station.readings.some((reading) => reading.book === book)), book);
  }
});

test("Könige und Chronik erhalten je vier Stationen", () => {
  assert.equal(HISTORY.stations.filter((station) => station.id.startsWith("hist-kings-")).length, 4);
  assert.equal(HISTORY.stations.filter((station) => station.id.startsWith("hist-chronicles-")).length, 4);
});

test("jede Station hat Lernziele, Bibeltexte, Aufgaben und belegte Prüfungsfragen", () => {
  const ids = new Set(HISTORY.stations.map((station) => station.id));
  assert.equal(ids.size, HISTORY.stations.length);

  for (const station of HISTORY.stations) {
    assert.ok(station.goal?.length > 10, station.id);
    assert.ok(station.readings.length > 0, station.id);
    assert.ok(station.tasks.length >= 3, station.id);
    assert.ok(station.exam.length >= 2, station.id);
    for (const task of [...station.tasks, ...station.exam]) {
      assert.ok(task.ref?.length > 2, `${station.id}: ${task.id}`);
    }
    for (const prerequisite of station.requires) {
      assert.ok(ids.has(prerequisite), `${station.id} requires missing ${prerequisite}`);
    }
    assert.ok(station.x >= 0 && station.x <= HISTORY.mapW, station.id);
    assert.ok(station.y >= 0 && station.y <= HISTORY.mapH, station.id);
  }
});

test("AT-NT-Verknüpfungen sind in den fokussierten Büchern sichtbar", () => {
  for (const id of [
    "hist-kings-solomon",
    "hist-kings-divided",
    "hist-kings-exile",
    "hist-chronicles-david",
    "hist-chronicles-temple",
  ]) {
    const station = HISTORY.stations.find((item) => item.id === id);
    assert.ok(station?.connections?.length, id);
  }
});

test("Geschichtsbücher-Welt ist als spielbar registriert", () => {
  const world = WORLDS.find((item) => item.id === "history");
  assert.equal(world?.status, "playable");
  assert.ok(world?.campaignIds?.includes(HISTORY.id));
});
