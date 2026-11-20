// iter45: writes /tmp/answers_t.json + /tmp/answers_e.json (task vs exam keys differ because academy mc options are rotated differently)
globalThis.require=()=>1;
import fs from "fs";
const {ALL_STATIONS}=await import("/app/frontend/src/data/john.ts");
const T={},E={};
const put=(o,t)=>{const k=t.question??t.statement;if(t.type==="tf")o[k]=["tf",t.answer];else if(t.type==="mc")o[k]=["mc",t.answer];else if(t.type==="multi")o[k]=["multi",t.answers];else if(t.type==="gap")o[k]=["gap",t.blanks];};
for(const s of ALL_STATIONS){s.tasks.forEach(t=>put(T,t));s.exam.forEach(t=>put(E,t));}
fs.writeFileSync("/tmp/answers_t.json",JSON.stringify(T));fs.writeFileSync("/tmp/answers_e.json",JSON.stringify(E));
const s=ALL_STATIONS.find(x=>x.id==="tora-1-1");console.log(s.tasks.filter(t=>t.type==="mc").map(t=>t.question+" => "+t.options[t.answer]));
