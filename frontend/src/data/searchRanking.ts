/** Exact, normalized phrases beat separate word/substrings. Stable canonical order for ties. */
export type SearchCandidate = {book:number;chapter:number;verse:number;text:string};
const normalize=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/[^\p{L}\p{N}]+/gu," ").trim();
export function rankBibleMatches(candidates:Iterable<SearchCandidate>,query:string,limit=60){
  const needle=normalize(query),words=needle.split(" ").filter(Boolean);
  const cap=Number.isFinite(limit)?Math.max(1,Math.min(500,Math.floor(limit))):60;
  if(!words.length)return {results:[] as SearchCandidate[],truncated:false};
  const buckets:SearchCandidate[][]=[[],[],[]];let count=0;
  for(const hit of candidates){
    const text=normalize(hit.text),padded=" "+text+" ";
    if(!words.every(w=>text.includes(w)))continue;
    const rank=padded.includes(" "+needle+" ")?0:words.every(w=>padded.includes(" "+w+" "))?1:2;
    count++;if(buckets[rank].length<cap)buckets[rank].push(hit);
  }
  return {results:buckets.flat().slice(0,cap),truncated:count>cap};
}
