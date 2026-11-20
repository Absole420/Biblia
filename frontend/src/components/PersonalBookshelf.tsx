import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Book, BookTheme, Shelf } from "./Bookshelf";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { Button, Chip } from "./ui";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { BOOK_ICONS, COVER_COLORS, DEFAULT_LIBRARY_LAYOUT, LibraryLayout, SHELVES, bookWeight, changeLibraryBook, customBookTheme, isCoverColor, normalizeLibraryLayout, packLibraryRows, shiftLibraryBook } from "@/src/lib/library-layout";

export type LibraryBook = {id:string;title:string;subtitle?:string;icon:string;theme:BookTheme;testID:string;badge?:number;onPress:()=>void};
type Registry = Record<string,LibraryBook>;

export function PersonalBookshelf({books,stored,onSave}:{books:Registry;stored:unknown;onSave:(value:LibraryLayout)=>void}) {
  const s=useStyles();const {colors}=useTheme();
  const [draft,setDraft]=useState<LibraryLayout|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [hex,setHex]=useState("");
  const [resetConfirm,setResetConfirm]=useState(false);
  const layout=draft??normalizeLibraryLayout(stored);
  const current=draft?.find(x=>x.id===selected);
  const book=current?books[current.id]:undefined;
  const theme=(b:LibraryBook,p:LibraryLayout[number])=>p.color?customBookTheme(p.color):b.theme;
  const choose=(id:string)=>{setSelected(id);setHex(layout.find(x=>x.id===id)?.color??books[id]?.theme.cover??"");};
  const patch=(value:Partial<Omit<LibraryLayout[number],"id">>)=>{if(selected)setDraft(d=>d?changeLibraryBook(d,selected,value):d);};
  const finish=()=>{if(draft){onSave(normalizeLibraryLayout(draft));setDraft(null);}setSelected(null);setResetConfirm(false);};
  return <View testID="personal-bookshelf">
    <View style={s.toolbar}>
      {draft?<><Text style={[s.hint,{flex:1}]}>Bearbeiten: Buch antippen. Mit Pfeilen sortieren oder in ein anderes Fach stellen.</Text></>:<Text style={[s.hint,{flex:1}]}>Deine persönliche Studienbibliothek</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel="Bibliothek bearbeiten" testID="library-customize" onPress={()=>{setDraft(normalizeLibraryLayout(stored));setSelected(null);}} style={s.iconBtn} disabled={!!draft}>
        <Icon name="settings" color={colors.onSurface} size={20}/>
      </Pressable>
    </View>
    {draft?<View style={{gap:spacing.sm,marginBottom:spacing.lg}}>
      <Button label="Änderungen speichern" testID="library-layout-save" icon="check" onPress={finish}/>
      <Button label="Abbrechen" testID="library-layout-cancel" variant="secondary" onPress={()=>{setDraft(null);setSelected(null);setResetConfirm(false);}}/>
      <Button label="Standardregal wiederherstellen" testID="library-layout-reset" variant="ghost" onPress={()=>setResetConfirm(true)}/>
    </View>:null}
    {SHELVES.map(group=>{
      const items=layout.filter(p=>p.shelf===group.id&&books[p.id]);
      if(!items.length)return null;
      return <View key={group.id}>
        <Text style={s.label}>{group.label}</Text>
        {packLibraryRows(items).map((row,i)=><Shelf key={group.id+"-"+i} testID={group.id==="reference"&&!i?"shelf-reference":"shelf-"+group.id+(i?"-"+i:"")}>
          {row.map(p=>{const b=books[p.id];return <Book key={p.id} title={b.title} subtitle={b.subtitle} icon={p.icon??b.icon} theme={theme(b,p)} size={p.size} weight={bookWeight(p.size)} badge={b.badge} testID={b.testID} onPress={draft?()=>choose(p.id):b.onPress}/>;})}
        </Shelf>)}
      </View>;
    })}
    <Sheet visible={!!current&&!!book} onClose={()=>setSelected(null)} title={book?.title.replace(/\n/g," ")} testID="library-book-edit">
      {current&&book?<View style={{gap:spacing.sm}}>
        <View style={{alignSelf:"center",width:160}}><Shelf><Book title={book.title} icon={current.icon??book.icon} subtitle={book.subtitle} theme={theme(book,current)} size={current.size} testID="library-book-preview" onPress={()=>{}}/></Shelf></View>
        <Text style={s.label}>Größe</Text>
        <View style={s.row}>{(["small","medium","large"] as const).map((size,i)=><Chip key={size} testID={"library-size-"+size} label={["Klein","Mittel","Groß"][i]} selected={current.size===size} onPress={()=>patch({size})}/>)}</View>
        <Text style={s.label}>Regalfach und Position</Text>
        <View style={s.row}>{SHELVES.map(g=><Chip key={g.id} testID={"library-move-"+g.id} label={g.label} selected={current.shelf===g.id} onPress={()=>patch({shelf:g.id})}/>)}</View>
        <Text style={s.hint}>Position {layout.filter(x=>x.shelf===current.shelf).findIndex(x=>x.id===current.id)+1} von {layout.filter(x=>x.shelf===current.shelf).length}</Text>
        <View style={s.row}>
          {([-1,1] as const).map(dir=><Pressable key={dir} testID={dir===-1?"library-order-earlier":"library-order-later"} accessibilityRole="button" accessibilityLabel={dir===-1?"Früher":"Später"} style={s.action} onPress={()=>setDraft(d=>d?shiftLibraryBook(d,current.id,dir):d)}>
            <Icon name={dir===-1?"arrow-left":"arrow-right"} size={18} color={colors.onSurface}/><Text style={s.hint}>{dir===-1?"Früher":"Später"}</Text>
          </Pressable>)}
        </View>
        <Text style={s.label}>Einbandfarbe</Text>
        <View style={s.row}>{COVER_COLORS.map(color=><Pressable key={color} accessibilityRole="button" accessibilityLabel={"Farbe "+color} accessibilityState={{selected:(current.color??book.theme.cover).toUpperCase()===color}} testID={"library-cover-"+color.slice(1)} onPress={()=>{setHex(color);patch({color});}} style={[s.swatch,{backgroundColor:color,borderColor:(current.color??book.theme.cover).toUpperCase()===color?colors.brandPrimary:colors.borderStrong}]} />)}</View>
        <TextInput style={s.input} value={hex} onChangeText={setHex} maxLength={7} placeholder="#123456" placeholderTextColor={colors.muted} autoCapitalize="characters" testID="library-custom-color" accessibilityLabel="Eigene Hex-Farbe"/>
        <Button testID="library-apply-color" label="Eigene Farbe anwenden" variant="secondary" disabled={!isCoverColor(hex)} onPress={()=>patch({color:hex})}/>
        <Button testID="library-original-color" label="Ursprüngliche Farbe" variant="ghost" onPress={()=>{setHex(book.theme.cover);patch({color:undefined});}}/>
        <Text style={s.label}>Symbol</Text>
        <View style={s.row}>{BOOK_ICONS.map(icon=><Pressable key={icon} accessibilityRole="button" accessibilityLabel={"Symbol "+icon} accessibilityState={{selected:(current.icon??book.icon)===icon}} testID={"library-icon-"+icon} onPress={()=>patch({icon})} style={[s.iconBtn,{borderWidth:1,borderColor:(current.icon??book.icon)===icon?colors.brandPrimary:colors.border}]}>
          <Icon name={icon} size={22} color={colors.onSurface}/>
        </Pressable>)}</View>
        <Button testID="library-original-symbol" label="Ursprüngliches Symbol" variant="ghost" onPress={()=>patch({icon:undefined})}/>
        <Button testID="library-book-done" label="Fertig" onPress={()=>setSelected(null)}/>
      </View>:null}
    </Sheet>
    <Sheet visible={resetConfirm} onClose={()=>setResetConfirm(false)} title="Standardregal wiederherstellen?" testID="library-reset-confirm">
      <Text style={s.hint}>Nur Einbände, Größen und Positionen werden zurückgesetzt. Deine Notizen und Lerninhalte bleiben erhalten.</Text>
      <Button testID="library-reset-yes" label="Regal zurücksetzen" onPress={()=>{setDraft(DEFAULT_LIBRARY_LAYOUT.map(b=>({...b})));setResetConfirm(false);}}/>
    </Sheet>
  </View>;
}
const useStyles=makeStyles(c=>({
 toolbar:{flexDirection:"row",alignItems:"center",gap:spacing.sm,marginBottom:spacing.md},
 label:{fontFamily:fonts.display,fontSize:19,fontWeight:"700",color:c.onSurface,marginTop:spacing.sm,marginBottom:spacing.sm},
 hint:{fontFamily:fonts.text,fontSize:14,color:c.onSurfaceSecondary,lineHeight:20},
 row:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm,alignItems:"center"},
 iconBtn:{width:44,height:44,borderRadius:radius.md,backgroundColor:c.surfaceSecondary,alignItems:"center",justifyContent:"center"},
 swatch:{width:44,height:44,borderRadius:radius.md,borderWidth:2},
 input:{minHeight:44,borderWidth:1,borderColor:c.border,borderRadius:radius.md,paddingHorizontal:spacing.md,fontSize:16,color:c.onSurface,fontFamily:fonts.text},
 action:{minHeight:44,paddingHorizontal:spacing.md,flexDirection:"row",alignItems:"center",gap:spacing.sm,backgroundColor:c.surfaceSecondary,borderRadius:radius.md},
}));
