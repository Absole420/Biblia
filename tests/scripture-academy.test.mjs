import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BIBLE_BOOKS, findBook } from "../frontend/src/data/books.ts";
import { applyAcademy, normalizeReadings, parseAcademyRef, coverage } from "../frontend/src/data/academy-core.ts";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const rows=["tora","gospels","parables-acts","deeper","prophets-letters"].flatMap(n=>read("../frontend/src/data/academy/"+n+".json"));
const counts=read("../frontend/src/data/verseCounts.json");
const lookup=(code,ch)=>{const b=findBook(code),n=b&&counts[b.nr]?.[ch-1]?.[0];return b&&n?{code:b.code,verses:n}:null;};
test("all Academy entries are unique, manually authored and reference valid verse ranges",()=>{
 assert.equal(rows.length,141);assert.equal(new Set(rows.map(r=>r.id)).size,141);
 for(const r of rows){assert.equal(r.body.length,3,r.id);assert.ok(r.body.every(x=>x.length>120),r.id);assert.ok(r.terms.length>=2,r.id);assert.ok(r.quiz.length>=2,r.id);assert.ok(r.reflection&&r.image,r.id);for(const ref of [...r.refs,r.connection.from,r.connection.to])assert.ok(parseAcademyRef(ref,lookup),r.id+" "+ref);}
});
test("old sentinel range and book alias are normalized",()=>{
 assert.deepEqual(normalizeReadings([{book:"Esra",ch:1,from:1,to:200}],lookup),[{book:"Esr",ch:1,from:1,to:11}]);
});
test("overlapping ranges are joined without repetition",()=>{
 assert.deepEqual(normalizeReadings([{book:"Joh",ch:1,from:1,to:5},{book:"Joh",ch:1,from:3,to:9}],lookup),[{book:"Joh",ch:1,from:1,to:9}]);
});
const c={id:"tora-1",worldId:"tora",title:"Tora",book:"1Mo",mapW:1000,mapH:800,intro:"",stations:[]};
const original={id:"tora-1-1",title:"Original",subtitle:"",type:"study",icon:"book",x:500,y:650,requires:[],xp:50,discover:"Originaler Text",readings:[{book:"1Mo",ch:1,from:1,to:200}],terms:[],background:[],tasks:[{id:"old-question",type:"tf",statement:"Original?",answer:true,explain:"",ref:"1Mo 1"}],exam:[],reflection:[]};
test("existing station identities, questions, XP and prerequisites survive; new ones get 5 tasks and 5 exam items",()=>{
 const out=applyAcademy(c,[original],rows,lookup);const old=out.stations[0];assert.equal(old.id,original.id);assert.equal(old.tasks[0].id,"old-question");assert.equal(old.xp,50);assert.equal(old.discover,original.discover);assert.deepEqual(old.requires,[]);
 const additions=out.stations.slice(1);assert.ok(additions.length);for(const s of additions){assert.equal(s.tasks.length,5,s.id);assert.equal(s.exam.length,5,s.id);assert.ok(s.readings.length);assert.ok(s.image);}
 const again=applyAcademy(c,out.stations,rows,lookup);assert.equal(again.stations.length,out.stations.length);assert.equal(again.stations[0].background.length,old.background.length);assert.equal(again.stations[0].tasks.length,old.tasks.length);
});
test("coverage reports books separately from chapters; whole Bible isn't implied",()=>{
 const a=coverage(BIBLE_BOOKS,[original]);assert.equal(a.length,66);assert.equal(a.find(b=>b.book==="1Mo").coveredChapters.length,1);assert.equal(a.find(b=>b.book==="Offb").stations,0);
});
