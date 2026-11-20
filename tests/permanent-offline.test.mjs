import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { chapterLocal, searchLocal, indexCommentaries, permittedOffline } from "../frontend/src/data/offlineCore.ts";

const read = p => readFileSync(new URL(p, import.meta.url));
const json = p => JSON.parse(read(p).toString("utf8"));
const local = "../frontend/src/data/offline/";
const backend = "../backend/data/";
const { books } = json(local + "elb1905.json");
const sources = json(local + "sources.json");
const commentaries = ["calvin_de.json", "mhcc.json"];

test("all 66 books and verbatim source data are available from the initial bundle", () => {
  assert.equal(books.length, 66);
  assert.equal(books.reduce((n,b) => n+b.chapters.length,0),1189);
  assert.equal(books.reduce((n,b)=>n+b.chapters.reduce((s,c)=>s+c.length,0),0),31102);
  assert.deepEqual(books.map(b=>b.nr), Array.from({length:66},(_,i)=>i+1));
  for (const file of ["elb1905.json", "sources.json", ...commentaries.map(f=>"commentaries/"+f), ...Array.from({length:66},(_,i)=>"xref/"+(i+1)+".json")]) {
    assert.deepEqual(read(local+file),read(backend+file),file+" differs from source");
  }
  for (const b of books) {
    assert.ok(chapterLocal(books,b.nr,1).length);
    assert.ok(chapterLocal(books,b.nr,b.chapters.length).length);
    assert.equal(chapterLocal(books,b.nr,b.chapters.length+1),null);
  }
  assert.equal(chapterLocal(books,0,1),null);
  assert.equal(chapterLocal(books,1,0),null);
  assert.equal(chapterLocal(books,1,1.5),null);
  assert.match(chapterLocal(books,1,1)[0],/Im Anfang/);
  assert.match(chapterLocal(books,66,22).at(-1),/Gnade/);
});

test("global offline search, accurate references, no remote calls", () => {
  const prev = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Unexpected network access"); };
  try {
    const result = searchLocal(books, "  JESUS  ");
    assert.equal(result.results.length,60);
    assert.equal(result.truncated,true);
    for (const r of result.results) assert.equal(r.text,chapterLocal(books,r.book,r.chapter)[r.verse-1]);
    assert.deepEqual(searchLocal(books,"xx"),{results:[],truncated:false});
    assert.deepEqual(searchLocal(books,"xyzxyzxyzxyz"),{results:[],truncated:false});
    assert.deepEqual(searchLocal(books,"Jesus",1).results, result.results.slice(0,1));
    assert.equal(searchLocal(books,"Im Anfang schuf Gott die Himmel und die Erde.").results[0].book,1);
  } finally { globalThis.fetch = prev; }
});

test("local commentary index and rights metadata", () => {
  const files = commentaries.map(f=>json(local+"commentaries/"+f));
  const index = indexCommentaries(files,sources);
  assert.ok(index.get("43:3").length);
  assert.equal([...index.values()].flat().length,files.reduce((n,f)=>n+f.entries.length,0));
  assert.ok(!permittedOffline(sources.find(s=>s.id==="bibelkommentare-de")));
  assert.equal(indexCommentaries(files,[]).size,0);
  assert.ok(permittedOffline(sources.find(s=>s.id==="openbible-xref")));
});

test("all xref books exist and preserve the source row format", () => {
  for(let nr=1;nr<=66;nr++) {
    const file=json(local+"xref/"+nr+".json");
    for(const rows of Object.values(file)) {
      assert.ok(Array.isArray(rows));
      for(const row of rows) assert.ok(Array.isArray(row)&&row.length===8);
    }
  }
  assert.ok(Object.values(json(local+"xref/43.json")).flat().length);
});

test("no runtime networking in the replaced providers and explicit offline release config", () => {
  for(const p of ["src/data/bible.ts","src/data/offlineData.ts","src/components/VerseStudy.tsx"]){
    const s=read("../frontend/"+p).toString("utf8");
    assert.doesNotMatch(s,/\bfetch\s*\(|EXPO_PUBLIC_BACKEND_URL/);
  }
  assert.doesNotMatch(read("../frontend/app/(tabs)/library.tsx").toString("utf8"),/https?:\/\/images\.unsplash\.com/);
  const cfg=json("../frontend/app.json").expo;
  assert.equal(cfg.updates.enabled,false);
  assert.equal(cfg.updates.checkAutomatically,"NEVER");
  assert.equal(cfg.updates.useEmbeddedUpdate,true);
  const build=json("../frontend/eas.json").build["offline-release"];
  assert.equal(build.developmentClient,false);
  assert.equal(build.android.buildType,"apk");
});
