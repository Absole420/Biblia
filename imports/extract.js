const fs=require('fs'),vm=require('vm');
const files={tora:['B','L','coords'],gleichnisse:['P'],briefe:['B','glossary','globalLinks','pool','examQ'],propheten:['P','extra','glossary','Q','examQ'],evangelien:['books','atlas','glossary','examQuestions','pool']};
const map={tora:'tora_und_bund_die_fuenf_buecher_mose',gleichnisse:'die_gleichnisse_jesu_interaktive_lernreise',briefe:'das_evangelium_leben_neutestamentliche_briefe',propheten:'die_propheten_weisen_auf_jesus_lernreise',evangelien:'die_evangelien_grosse_bibel_lernreise'};
const mk=()=>new Proxy(function(){}, {get:(t,k)=>k===Symbol.toPrimitive?()=>'' :k==='length'?0:mk(), apply:()=>mk(), construct:()=>mk(), set:()=>true});
for(const [k,f] of Object.entries(map)){
  const s=fs.readFileSync('/app/imports/'+f+'.html','utf8');
  let sc=s.slice(s.indexOf('<script>')+8, s.lastIndexOf('</script>'));
  const names=files[k];
  sc+=`\n;globalThis.__out={${names.map(n=>`${n}:typeof ${n}!=='undefined'?${n}:null`).join(',')}};`;
  const ctx={document:mk(),window:mk(),localStorage:{getItem:()=>null,setItem(){}} ,setTimeout(){},setInterval(){},console,navigator:mk(),addEventListener(){},requestAnimationFrame(){},alert(){},confirm(){},location:mk(),Math,JSON};
  ctx.globalThis=ctx;
  try{vm.runInNewContext(sc,ctx,{timeout:3000});}catch(e){console.log(k,'ERR',e.message);}
  fs.writeFileSync('/app/imports/json/'+k+'.json',JSON.stringify(ctx.__out,null,1));
  console.log(k, ctx.__out && Object.entries(ctx.__out).map(([a,b])=>a+':'+(b?(Array.isArray(b)?b.length:Object.keys(b).length):'null')).join(' '));
}
