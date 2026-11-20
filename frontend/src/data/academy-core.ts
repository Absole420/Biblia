import type { Campaign, Station, Task, VerseRef, Term, Connection } from "./types";

export type AcademyRow = {id:string;campaign:string;title:string;refs:string[];terms:Term[];body:string[];quiz:{q:string;a:string;wrong:string[]}[];reflection:string;connection:Connection;image:string};
export type BookLookup = (code:string,ch:number)=>{code:string;verses:number}|null;

export function normalizeReadings(readings:VerseRef[],lookup:BookLookup):VerseRef[] {
  const result:VerseRef[]=[];
  for(const r of readings){
    const b=lookup(r.book,r.ch);
    if(!b || !Number.isInteger(r.from) || r.from<1 || r.from>b.verses) continue;
    const end=Math.min(b.verses,Math.max(r.from,Number.isInteger(r.to)?r.to!:r.from));
    let next={book:b.code,ch:r.ch,from:r.from,to:end};
    let first=result.length;
    // Merge overlapping ranges, retaining their earliest position in the reading flow.
    for(let i=result.length-1;i>=0;i--){
      const old=result[i];
      if(old.book===next.book&&old.ch===next.ch&&old.from<=next.to&&next.from<=(old.to??old.from)){
        next={...next,from:Math.min(next.from,old.from),to:Math.max(next.to,old.to??old.from)};
        first=i;result.splice(i,1);
      }
    }
    result.splice(Math.min(first,result.length),0,next);
  }
  return result;
}
export function parseAcademyRef(ref:string,lookup:BookLookup):VerseRef|null {
  const m=ref.match(/^(\S+) (\d+)(?:,(\d+)(?:-(\d+))?)?$/);
  if(!m)return null;
  const ch=Number(m[2]), b=lookup(m[1],ch);
  if(!b)return null;
  const from=m[3]?Number(m[3]):1,to=m[4]?Number(m[4]):m[3]?from:b.verses;
  if(from<1||to<from||to>b.verses)return null;
  return {book:b.code,ch,from,to};
}
const uniqueBy=<T>(items:T[],key:(t:T)=>string)=>{const seen=new Set<string>();return items.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true;});};
function addMissingTasks(existing:Task[],added:Task[]){
  const ids=new Set(existing.map(t=>t.id));return [...existing,...added.filter(t=>!ids.has(t.id))];
}
function mc(id:string,q:string,a:string,wrong:string[],ref:string,offset:number):Task {
  const options=[a,...wrong];const step=offset%options.length;
  const rotated=[...options.slice(step),...options.slice(0,step)];
  return {id,type:"mc",question:q,options:rotated,answer:rotated.indexOf(a),explain:a+". Lies dazu "+ref+".",ref};
}
function conceptTasks(row:AcademyRow):{tasks:Task[];exam:Task[]} {
  const ref=row.refs.join("; "), prefix=row.id+"-academy";
  const concepts=row.quiz.map((q,i)=>mc(prefix+"-t"+(i+1),q.q,q.a,q.wrong,ref,i+1));
  const matching:Task={id:prefix+"-terms",type:"match",question:"Ordne die Begriffe der in dieser Einheit erläuterten Bedeutung zu.",pairs:row.terms.map(t=>[t.term,t.explanation]),explain:"Die Wortstudien erläutern die Bedeutung im jeweiligen Zusammenhang.",ref};
  const tasks:Task[]=[...concepts,matching,
    {id:prefix+"-link",type:"free",question:"Lies "+row.connection.from+" und "+row.connection.to+". Erkläre ihren Zusammenhang in eigenen Worten.",model:row.connection.note+" Die ursprünglichen Textzusammenhänge bleiben dabei wichtig.",ref:row.connection.from+"; "+row.connection.to},
    {id:prefix+"-summary",type:"free",question:"Fasse die Hauptaussage anhand des Bibeltextes in zwei oder drei Sätzen zusammen.",model:row.body[0],ref}];
  const exam:Task[]=[...row.quiz.map((q,i)=>mc(prefix+"-e"+(i+1),q.q,q.a,q.wrong,ref,i+2)),...row.terms.slice(0,2).map((t,i)=>mc(prefix+"-word"+i,"Welche Bedeutung erklärt die Wortstudie für "+t.term+"?",t.explanation,row.terms.filter((_,j)=>i!==j).map(x=>x.explanation),ref,i+1)),
    {id:prefix+"-check",type:"tf",statement:row.quiz[0].q+" Vorgeschlagene Antwort: "+row.quiz[0].wrong[0]+".",answer:false,explain:"Die richtige Antwort lautet: "+row.quiz[0].a+".",ref}];
  return {tasks,exam};
}
export function enrichAcademyStation(station:Station,row:AcademyRow,lookup:BookLookup):Station {
  const readingRefs=row.refs.map(r=>parseAcademyRef(r,lookup));
  if(readingRefs.some(r=>!r))throw new Error("Ungültiger Academy-Verweis: "+row.id);
  const {tasks,exam}=conceptTasks(row);
  const background=row.body.map((text,i)=>({kind:"teach" as const,title:["Text und Aufbau","Hintergrund und Einordnung","Biblische Zusammenhänge"][i]??"Vertiefung",text,refs:i===2?[row.connection.from,row.connection.to]:row.refs}));
  const hasAcademy=station.tasks.some(x=>x.id===row.id+"-academy-t1");
  return {
    ...station,
    goal:station.goal||"Du kannst "+row.title+" anhand der ausgewählten Schriftstellen erklären und Textaussage, Zusammenhang und Anwendung unterscheiden.",
    summary:station.summary||row.body[row.body.length-1],
    readings:normalizeReadings([...station.readings,...readingRefs as VerseRef[]],lookup),
    terms:uniqueBy([...station.terms,...row.terms],t=>t.term.toLowerCase()),
    background:hasAcademy?station.background:[...station.background,...background],
    connections:uniqueBy([...(station.connections??[]),row.connection],c=>c.from+"|"+c.to+"|"+c.kind),
    tasks:addMissingTasks(station.tasks,tasks),
    exam:addMissingTasks(station.exam,exam),
    reflection:uniqueBy([...station.reflection,row.reflection],x=>x),
    image:station.image||"academy:"+row.image,
  };
}
export function applyAcademy(campaign:Campaign,stations:Station[],rows:AcademyRow[],lookup:BookLookup){
  const relevant=rows.filter(r=>r.campaign===campaign.id),byId=new Map(relevant.map(r=>[r.id,r]));
  const existingIds=new Set(stations.map(s=>s.id));
  const newRows=relevant.filter(r=>r.id.startsWith("ac-")&&!existingIds.has(r.id));
  const shift=newRows.length*230;
  const result=stations.map(s=>{
    const normalized={...s,y:s.y+shift,readings:normalizeReadings(s.readings,lookup)};
    const row=byId.get(s.id);return row?enrichAcademyStation(normalized,row,lookup):normalized;
  });
  newRows.forEach((row,i)=>{
    const prev=result[result.length-1];
    const station:Station={id:row.id,title:row.title,subtitle:row.refs.slice(0,2).join(" · "),type:"study",icon:"book-open",
      x:Math.round(500+Math.sin((stations.length+i)*1.15)*280),y:prev?prev.y-230:Math.max(100,campaign.mapH+shift-150),
      requires:prev?[prev.id]:[],xp:60,discover:"In dieser Vertiefung liest du "+row.refs.slice(0,2).join(" und ")+". Achte auf den Aufbau der Texte und die Unterschiede zwischen Text, historischer Einordnung und Auslegung.",readings:[],terms:[],background:[],tasks:[],exam:[],reflection:[]};
    result.push(enrichAcademyStation(station,row,lookup));
  });
  return {stations:result,shift};
}
export function coverage(books:{code:string;chapters:number}[],stations:Station[]){
  return books.map(b=>{
    const chapters=new Set<number>();
    let count=0;
    for(const s of stations)if(s.readings.some(r=>r.book===b.code)){
      count++;for(const r of s.readings)if(r.book===b.code)chapters.add(r.ch);
    }
    return {book:b.code,stations:count,coveredChapters:[...chapters].sort((a,b)=>a-b),totalChapters:b.chapters};
  });
}
