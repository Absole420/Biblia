// Serializable library preferences, intentionally part of AppState.settings.
export const SHELVES = [
  {id:"reference",label:"Nachschlagewerke"},
  {id:"deep1",label:"Das Wort verstehen"},
  {id:"deep2",label:"Gottes Geschichte"},
  {id:"deep3",label:"Vertiefung"},
  {id:"deep4",label:"Welt der Bibel"},
  {id:"way",label:"Mein geistlicher Weg"},
  {id:"mine",label:"Mein Studium"},
  {id:"collection",label:"Meine Sammlung"},
  {id:"prayer",label:"Gebet & Begriffe"},
] as const;
export type ShelfID = typeof SHELVES[number]["id"];
export type BookSize = "small" | "medium" | "large";
export const BOOK_ICONS = ["book","book-open","globe","feather","compass","clock","heart","star","sun","moon","users","map","bookmark","layers","image","edit-3","anchor","shield","zap","gift","eye","home","award","flag","key","link","music","coffee","droplet","wind","crosshair","columns","headphones","sunrise","git-branch","archive"] as const;
export const COVER_COLORS = ["#2F4A3A","#2C3E5C","#2F6F6A","#536E50","#7A4E2D","#8A2F3C","#5B4372","#3F5E8C","#B9802F","#6B5A3E","#262B35","#D9D4C5","#F4E5BD","#806240","#4E617C","#72584D"];
export type LibraryBookPreference = {id:string;shelf:ShelfID;size:BookSize;color?:string;icon?:string};
export type LibraryLayout = LibraryBookPreference[];
export const DEFAULT_LIBRARY_LAYOUT: LibraryLayout = [
  {id:"lexicon",shelf:"reference",size:"large"},{id:"timeline",shelf:"reference",size:"large"},{id:"media",shelf:"reference",size:"large"},
  {id:"words",shelf:"deep1",size:"large"},{id:"symbols",shelf:"deep1",size:"large"},
  {id:"thread",shelf:"deep2",size:"large"},
  {id:"unseen",shelf:"deep3",size:"large"},{id:"trees",shelf:"deep3",size:"large"},
  {id:"history",shelf:"deep4",size:"large"},
  {id:"way",shelf:"way",size:"large"},{id:"jesus",shelf:"way",size:"large"},
  {id:"mine",shelf:"mine",size:"small"},{id:"favBible",shelf:"mine",size:"small"},{id:"favLessons",shelf:"mine",size:"small"},
  {id:"photos",shelf:"collection",size:"small"},{id:"units",shelf:"collection",size:"small"},
  {id:"prayer",shelf:"prayer",size:"small"},{id:"terms",shelf:"prayer",size:"small"},
];
export const isCoverColor = (v:unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
const validShelf = (v:unknown):v is ShelfID => SHELVES.some(s=>s.id===v);
const validSize = (v:unknown):v is BookSize => v==="small"||v==="medium"||v==="large";
const validIcon = (v:unknown):v is string => typeof v==="string" && (BOOK_ICONS as readonly string[]).includes(v);
export function normalizeLibraryLayout(raw:unknown):LibraryLayout {
  const current = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const result:LibraryLayout = [];
  for (const item of current) {
    const d = item && typeof item==="object" ? DEFAULT_LIBRARY_LAYOUT.find(b=>b.id===item.id) : undefined;
    if(!d || seen.has(d.id)) continue;
    seen.add(d.id);
    result.push({id:d.id,shelf:validShelf(item.shelf)?item.shelf:d.shelf,size:validSize(item.size)?item.size:d.size,
      ...(isCoverColor(item.color)?{color:item.color.toUpperCase()}:{}),...(validIcon(item.icon)?{icon:item.icon}:{})});
  }
  return [...result,...DEFAULT_LIBRARY_LAYOUT.filter(d=>!seen.has(d.id)).map(d=>({...d}))];
}
export function changeLibraryBook(layout:LibraryLayout,id:string,patch:Partial<Omit<LibraryBookPreference,"id">>):LibraryLayout {
  const next=layout.map(b=>b.id===id?{...b,...patch}:b);
  // A moved book is placed at the end of the destination shelf, then can be reordered.
  if (patch.shelf && layout.find(b=>b.id===id)?.shelf!==patch.shelf) {
    const item=next.find(b=>b.id===id);
    if(item) return normalizeLibraryLayout([...next.filter(b=>b.id!==id),item]);
  }
  return normalizeLibraryLayout(next);
}
export function shiftLibraryBook(layout:LibraryLayout,id:string,dir:-1|1):LibraryLayout {
  const at=layout.findIndex(b=>b.id===id); if(at<0)return layout;
  const peers=layout.filter(b=>b.shelf===layout[at].shelf);
  const other=peers[peers.findIndex(b=>b.id===id)+dir]; if(!other)return layout;
  const next=[...layout], j=next.findIndex(b=>b.id===other.id);
  [next[at],next[j]]=[next[j],next[at]]; return next;
}
export const bookWeight = (size:BookSize) => size==="small"?1:1.5;
export function packLibraryRows(books:LibraryLayout):LibraryLayout[] {
  const rows:LibraryLayout[]=[]; let row:LibraryLayout=[], used=0;
  for(const book of books){const cost=bookWeight(book.size);if(used+cost>3&&row.length){rows.push(row);row=[];used=0;}row.push(book);used+=cost;}
  if(row.length)rows.push(row);return rows;
}
const channel=(n:number)=>{const x=n/255;return x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4);};
export function customBookTheme(hex:string) {
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const light=rgb.map(channel).reduce((s,v,i)=>s+v*[0.2126,0.7152,0.0722][i],0);
  const ink=(light+0.05)/0.05>=1.05/(light+0.05)?"#000000":"#FFFFFF";
  const spine="#"+rgb.map(x=>Math.round(x*0.72).toString(16).padStart(2,"0")).join("");
  return {cover:hex,spine,ink,trim:ink};
}
