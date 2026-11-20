import type { Campaign, Station } from "./types";
import { BIBLE_BOOKS, findBook } from "./books";
import counts from "./verseCounts.json";
import { applyAcademy as apply, coverage } from "./academy-core";
import type { AcademyRow, BookLookup } from "./academy-core";
import tora from "./academy/tora.json";
import gospels from "./academy/gospels.json";
import parablesActs from "./academy/parables-acts.json";
import deeper from "./academy/deeper.json";
import prophetsLetters from "./academy/prophets-letters.json";
import johnRevelation from "./academy/john-revelation.json";
import { ARTICLE_BY_ID } from "./articles";
import { THEME_MAPS } from "./themeMaps";
import { findInfoIds } from "./lexicon";

// Anpassung an den Emergent-Stand: Geschichtsbücher heißen hier "history-1"; Debora/Gideon vertiefen die vorhandenen Einheiten gb1-8/gb1-9 statt Duplikate anzulegen.
const SAME_AS:Record<string,string>={"ac-hist-deborah":"gb1-8","ac-hist-gideon":"gb1-9"};
export const ACADEMY_ROWS=([...tora,...gospels,...parablesActs,...deeper,...prophetsLetters,...johnRevelation] as AcademyRow[])
  .map(r=>({...r,id:SAME_AS[r.id]??r.id,campaign:r.campaign==="history"?"history-1":r.campaign}));
const lookup:BookLookup=(code,ch)=>{
  const b=findBook(code);const n=b?(counts as Record<string,number[][]>)[String(b.nr)]?.[ch-1]?.[0]:undefined;
  return b&&n?{code:b.code,verses:n}:null;
};
const placeHints:Record<string,string[]>={
  "tora-1-4":["ur","haran","hebron"],"tora-1-5":["egypt","goshen"],"tora-2-1":["sinai"],"tora-2-4":["sinai"],"tora-2-6":["sinai"],
  "ac-gen-babel":["babylon"],"ac-gen-isaac":["beersheba"],"ac-ex-calf":["sinai"],
  "matthew-1":["bethlehem","nazareth"],"matthew-2":["capernaum"],"matthew-5":["jerusalem"],"mark-4":["jerusalem"],"mark-5":["jerusalem"],
  "luke-1":["nazareth","bethlehem"],"luke-5":["jerusalem","emmaus"],"ac-joh-bethesda":["jerusalem"],"ac-joh-water":["jerusalem"],"ac-joh-restoration":["capernaum"],
  "ac-lk-mary":["bethany"],"ac-mk-woman":["tyre","sidon"],"ac-lk-ascension":["jerusalem"],"parables-7":["jerusalem","jericho"],
  "acts-1":["jerusalem"],"acts-2":["jerusalem","gaza"],"acts-3":["damascus","caesarea"],"acts-4":["antioch","philippi","athens"],"acts-5":["rome"],
  "ac-acts-jerusalem":["jerusalem"],"ac-acts-trip1":["antioch","paphos","lystra","derbe"],"ac-acts-trip2":["philippi","thessalonica","athens","corinth"],
  "ac-acts-trip3":["ephesus","miletus","jerusalem"],"ac-acts-peter":["jerusalem"],"ac-acts-ship":["malta","rome"],
  "ac-hist-athan":["jerusalem"],"ac-hist-manasse":["jerusalem"],"ac-jer-new":["jerusalem","babylon"],"ac-ezek-dry":["babylon"],
};
export function applyAcademy(campaign:Campaign,stations:Station[]){
  const result=apply(campaign,stations,ACADEMY_ROWS,lookup);
  const map=THEME_MAPS[campaign.worldId];
  result.stations=result.stations.map(s=>{
    const row=ACADEMY_ROWS.find(r=>r.id===s.id);
    if(!row)return s;
    const ids=findInfoIds([s.title,...row.body].join(" "));
    const related=[...new Set([...(s.lexicon??[]),row.image,...ids])].filter(id=>!!ARTICLE_BY_ID[id]);
    const places=[...new Set([...(s.placeIds??[]),...(placeHints[s.id]??[]).filter(id=>map?.places.some(p=>p.id===id))])];
    return {...s,lexicon:related,placeIds:places};
  });
  return result;
}
export const academyCoverage=(stations:Station[])=>coverage(BIBLE_BOOKS,stations);
