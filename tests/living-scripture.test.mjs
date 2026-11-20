import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BIBLE_BOOKS } from "../frontend/src/data/books.ts";
import { DEFAULT_LIBRARY_LAYOUT, SHELVES, normalizeLibraryLayout, changeLibraryBook, shiftLibraryBook, packLibraryRows, bookWeight, customBookTheme } from "../frontend/src/lib/library-layout.ts";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const volumes=read("../frontend/src/data/livingScripture.json"),counts=read("../frontend/src/data/verseCounts.json");
test("seven volumes and all original-language entries have unique IDs and usable content",()=>{
 assert.equal(volumes.length,7); const all=volumes.flatMap(v=>v.entries);assert.equal(all.length,223);
 assert.equal(new Set(all.map(e=>e.id)).size,all.length);
 for(const e of all){assert.ok(e.title&&e.group&&e.body.length>30&&e.refs.length,e.id);}
 const words=volumes.find(v=>v.id==="words").entries;
 assert.equal(words.length,106);
 for(const e of words){assert.ok(e.translit&&/^[\p{Script=Latin}\s]+$/u.test(e.translit),e.id);assert.ok(/[\p{Script=Greek}\p{Script=Hebrew}]/u.test(e.original),e.id);}
});
test("all 514 references within stored verse limits",()=>{
 let total=0;
 for(const v of volumes)for(const e of v.entries)for(const ref of e.refs){
  total++; const m=ref.match(/^(\S+) (\d+)(?:,(\d+)(?:-(\d+))?)?$/);assert.ok(m,ref);
  const b=BIBLE_BOOKS.find(b=>b.code===m[1]);assert.ok(b,ref);
  const n=counts[String(b.nr)]?.[Number(m[2])-1]?.[0];assert.ok(n,ref);
  if(m[3])assert.ok(Number(m[3])>=1&&Number(m[3])<=n,ref);
  if(m[4])assert.ok(Number(m[4])>=Number(m[3])&&Number(m[4])<=n,ref);
 }
 assert.equal(total,514);
});
test("missing or malformed layout never hides books; future books are appended",()=>{
 const l=normalizeLibraryLayout([{id:"words",shelf:"bad",size:4,color:"not a color",icon:"bad"},{id:"words"},{id:"unknown"}]);
 assert.equal(l.length,DEFAULT_LIBRARY_LAYOUT.length);assert.equal(new Set(l.map(x=>x.id)).size,l.length);
 assert.equal(l[0].shelf,"deep1");assert.equal(l[0].size,"large");assert.equal(l[0].color,undefined);
});
test("size, position, color and icon survive serialization",()=>{
 let l=normalizeLibraryLayout(null);l=changeLibraryBook(l,"words",{shelf:"mine",size:"medium",color:"#336699",icon:"star"});
 l=shiftLibraryBook(l,"words",-1);
 let restored=normalizeLibraryLayout(JSON.parse(JSON.stringify(l)));
 assert.deepEqual(restored,l);
 assert.equal(restored.find(x=>x.id==="words").shelf,"mine");
 assert.equal(restored.find(x=>x.id==="words").size,"medium");
 assert.equal(restored.find(x=>x.id==="words").color,"#336699");
 assert.equal(restored.find(x=>x.id==="words").icon,"star");
 assert.ok(restored.filter(x=>x.shelf==="mine").findIndex(x=>x.id==="words")<3);
});
test("all books fit responsive rows without omission",()=>{
 const l=normalizeLibraryLayout(null);
 const rows=SHELVES.flatMap(s=>packLibraryRows(l.filter(x=>x.shelf===s.id)));
 assert.equal(rows.flat().length,l.length);
 for(const row of rows)assert.ok(row.reduce((sum,b)=>sum+bookWeight(b.size),0)<=3);
});
test("custom covers choose readable light or dark ink",()=>{
 assert.equal(customBookTheme("#000000").ink,"#FFFFFF");
 assert.equal(customBookTheme("#FFFFFF").ink,"#000000");
});
