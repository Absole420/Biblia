// Ausführen: node --import ./tests/ts-loader.mjs --experimental-strip-types --test tests/backup-keys.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { validBackupKeys } from "../frontend/src/lib/backupKeys.ts";

test("bekannte, gültige Schlüssel werden übernommen (auch aus älteren Sicherungen)", () => {
  const keys = { "biblia.introJourney.done": "1", "biblia.introJourney.pos": "-1", "biblia.cinematic.seen": "1", "biblia_backup_reminder": '{"lastExport":"2026-01-01"}', "biblia.dailyScripture.v1": '{"day":"2026-01-01","order":[1]}', "biblia_way_key": "abc+/=" };
  assert.deepEqual(Object.fromEntries(validBackupKeys(keys)), keys);
});

test("unbekannte oder ungültige Schlüssel werden verworfen", () => {
  const got = validBackupKeys({ "evil": "x", "biblia_state": "{}", "biblia.introJourney.pos": "abc", "biblia_backup_reminder": "[1]", "biblia.dailyScripture.v1": "kein json", "biblia.cinematic.seen": 1, "biblia_way_key": "x".repeat(600) });
  assert.deepEqual(got, []);
});

test("fehlende oder falsch geformte keys-Angabe ergibt leere Liste", () => {
  for (const k of [undefined, null, "x", [["a", "b"]]]) assert.deepEqual(validBackupKeys(k), []);
});
