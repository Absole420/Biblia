import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DataGuardian, WEEK_MS } from "../frontend/src/lib/data-guardian-core.ts";
const make = () => {
  const disk = new Map();
  let now = 100;
  let fail = false;
  let legacy = null;
  const io = {
    read: async s => disk.get(s) ?? null,
    write: async (s,t) => { disk.set(s, fail ? "corrupt" : t); if (fail) throw Error("I/O"); },
    readLegacy: async () => legacy,
    digest: async t => createHash("sha256").update(t).digest("hex"),
    valid: t => /^state-[0-9]+$/.test(t),
    now: () => now
  };
  return { disk, io, advance: n => { now += n; }, fail: v => { fail = v; }, legacy: v => { legacy = v; } };
};
test("legacy is read without overwriting, then migrated into a verified slot", async () => {
  const h=make(); h.legacy("state-1");
  const g=new DataGuardian(h.io);
  assert.equal((await g.open()).payload,"state-1");
  assert.equal(h.disk.size,0);
  await g.save("state-1");
  assert.equal((await new DataGuardian(h.io).open()).payload,"state-1");
});
test("torn write keeps previous valid revision", async () => {
  const h=make(), g=new DataGuardian(h.io); await g.open();
  await g.save("state-1"); await g.save("state-2"); h.fail(true);
  await assert.rejects(g.save("state-3"));
  const loaded=await new DataGuardian(h.io).open();
  assert.deepEqual(loaded,{payload:"state-2",recovered:true});
});
test("weekly retention, rate limit and forced backup", async () => {
  const h=make(), g=new DataGuardian(h.io); await g.open();
  await g.save("state-1"); await g.weekly();
  await g.save("state-2"); await g.weekly(); assert.equal(g.backupPayload,"state-1");
  h.advance(WEEK_MS); await g.weekly(); assert.equal(g.backupPayload,"state-2");
  h.advance(1); await g.save("state-3"); await g.weekly(true);
  assert.equal(g.backupPayload,"state-3");
  assert.equal([...h.disk.keys()].filter(k=>k.startsWith("week")).length,2);
});
test("backup survives loss of both live slots", async () => {
  const h=make(), g=new DataGuardian(h.io); await g.open(); await g.save("state-1"); await g.weekly();
  h.disk.set("live-a","broken"); h.disk.set("live-b","broken");
  assert.deepEqual(await new DataGuardian(h.io).open(),{payload:"state-1",recovered:true});
});
test("all corrupt or read error must not initialize empty state", async () => {
  const h=make(); h.disk.set("live-a","broken");
  const g=new DataGuardian(h.io); await assert.rejects(g.open()); await assert.rejects(g.save("state-1"));
  assert.equal(h.disk.get("live-a"),"broken");
  const broken=new DataGuardian({...h.io,read:async()=>{throw Error("I/O");}});
  await assert.rejects(broken.open()); await assert.rejects(broken.save("state-1"));
});
test("pre-change checkpoint preserves state", async () => {
  const h=make(), g=new DataGuardian(h.io); await g.open(); await g.save("state-1");
  await g.beforeChange(); await g.save("state-2"); assert.equal(g.beforeChangePayload,"state-1");
});
test("checksum detects valid JSON with modified payload", async () => {
  const h=make(), g=new DataGuardian(h.io); await g.open(); await g.save("state-1"); await g.save("state-2");
  const record=JSON.parse(h.disk.get("live-b")); record.payload="state-9"; h.disk.set("live-b",JSON.stringify(record));
  assert.equal((await new DataGuardian(h.io).open()).payload,"state-1");
});
