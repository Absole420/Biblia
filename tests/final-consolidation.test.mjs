import { test } from "node:test";
import assert from "node:assert/strict";
import { CAMPAIGNS, ALL_STATIONS, ACADEMY_COVERAGE } from "../frontend/src/data/john.ts";
import { orderFinalExams } from "../frontend/src/data/academy-core.ts";
import { rankBibleMatches } from "../frontend/src/data/searchRanking.ts";
import { defaultState, migrate, unreachableStations } from "../frontend/src/lib/progress-logic.ts";
import { validBackupKeys } from "../frontend/src/lib/backupKeys.ts";

test("restored original history, no duplicate station IDs and all prereqs resolve",()=>{
 assert.equal(CAMPAIGNS.history.stations.length,16);
 assert.equal(new Set(ALL_STATIONS.map(s=>s.id)).size,ALL_STATIONS.length);
 for(const c of Object.values(CAMPAIGNS))assert.deepEqual(unreachableStations(c.stations),[],c.id);
 assert.equal(ACADEMY_COVERAGE.length,66);
 assert.ok(ACADEMY_COVERAGE.every(b=>b.stations>0));
});
test("terminal exams follow all added lessons without cycles; ordering is idempotent",()=>{
 for(const c of Object.values(CAMPAIGNS)){
  const exam=c.stations.find(s=>s.type==="exam");
  if(!exam)continue;
  assert.equal(c.stations.at(-1).id,exam.id,c.id);
  assert.deepEqual(orderFinalExams(c.stations),c.stations);
 }
});
test("exact phrases win over earlier separate words and substrings, including at result cap",()=>{
 const a=[{book:13,chapter:7,verse:21,text:"die Eingeborenen und sein Sohn"},{book:43,chapter:3,verse:16,text:"seinen eingeborenen Sohn"},{book:43,chapter:1,verse:18,text:"seiner eingeborenen Sohnschaft"}];
 const found=rankBibleMatches(a,"eingeborenen Sohn",1);
 assert.equal(found.results[0].book,43);assert.equal(found.results[0].verse,16);assert.equal(found.truncated,true);
 assert.equal(rankBibleMatches([{...a[0],text:"GROẞE GÜTE"}],"grosse gute").results.length,1);
});
test("invalid settings and inherited backup keys cannot enter live state",()=>{
 const raw={...defaultState(),settings:{theme:"invalid",fontScale:-5,translation:"invalid",mapMotion:"true",libraryLayout:[],unrecognized:1}};
 const state=migrate(raw);assert.equal(state.settings.theme,"system");assert.equal(state.settings.fontScale,1);assert.equal(state.settings.translation,"elb1905");assert.equal("unrecognized" in state.settings,false);
 assert.deepEqual(validBackupKeys(JSON.parse('{"constructor":"x","toString":"x","__proto__":"x"}')),[]);
 const valid={...defaultState(),settings:{theme:"dark",fontScale:1.2,translation:"elb1905",mapMotion:false}};
 assert.deepEqual(migrate(valid).settings,valid.settings);
});
