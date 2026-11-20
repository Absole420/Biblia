import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/src/components/Icon";
import { RefText } from "@/src/components/RefText";
import { Chip, Button } from "@/src/components/ui";
import { LIVING_BY_ID, VolumeID, LivingEntry, matchesLivingEntry } from "@/src/data/livingScripture";
import { INTRO_SCENES } from "@/src/data/introScenes";
import { ILLUSTRATIONS, ILLUSTRATION_LABEL } from "@/src/data/illustrations";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
const scene=(id:string)=>INTRO_SCENES.find(s=>s.id===id)?.image;
const covers={words:ILLUSTRATIONS.mose,thread:scene("auferstehung"),unseen:ILLUSTRATIONS.ezechiel,jesus:scene("verkuendigung"),trees:ILLUSTRATIONS.abraham,symbols:scene("abendmahl"),history:ILLUSTRATIONS.esra};
const groupImages:Record<string,any>={"jesus:Verkündigung":scene("verkuendigung"),"jesus:Gebet und Nachfolge":scene("gethsemane"),"jesus:Ich-bin-Worte":scene("begegnungen"),"jesus:Wunder und Begegnungen":scene("wunder"),"jesus:Passion und Sendung":scene("kreuz"),"thread:Ursprung":ILLUSTRATIONS["adam-eva"],"thread:Verheißung und Bund":ILLUSTRATIONS.mose,"thread:Könige und Propheten":ILLUSTRATIONS.david,"thread:Jesus Christus":scene("auferstehung"),"thread:Gemeinde und Vollendung":ILLUSTRATIONS.paulus,"trees:Urgeschichte":ILLUSTRATIONS.noah,"trees:Erzväter":ILLUSTRATIONS.abraham,"trees:Israel":ILLUSTRATIONS.jakob,"trees:Könige":ILLUSTRATIONS.david,"trees:Jesus":scene("geburt")};
const groupFor=(e:LivingEntry)=>e.group;
export default function LivingVolumeScreen(){
 const p=useLocalSearchParams<{id:string;entry?:string}>();const router=useRouter();const s=useStyles();const {colors}=useTheme();const insets=useSafeAreaInsets();
 const volume=LIVING_BY_ID[p.id as VolumeID];const [q,setQ]=useState("");const [group,setGroup]=useState<string|null>(null);
 const groups=useMemo(()=>volume?Array.from(new Set(volume.entries.map(groupFor))):[],[volume]);
 const entries=useMemo(()=>volume?.entries.filter(x=>(!group||x.group===group)&&matchesLivingEntry(x,q))??[],[volume,group,q]);
 const selected=volume?.entries.find(x=>x.id===p.entry);
 const goBack=()=>router.canGoBack()?router.back():router.replace("/library");
 const open=(e:LivingEntry)=>router.push({pathname:"/living/[id]",params:{id:volume.id,entry:e.id}});
 const title=selected?.title??volume?.title??"Studienbibliothek";
 const header=<View style={[s.header,{paddingTop:insets.top+spacing.sm}]}><Pressable style={s.back} testID="living-back" onPress={goBack} accessibilityRole="button" accessibilityLabel="Zurück"><Icon name="arrow-left" color={colors.onSurface} size={22}/></Pressable><View style={{flex:1}}><Text style={s.h1}>{title}</Text><Text style={s.sub}>{selected?.group??(volume?volume.entries.length+" Einträge":"")}</Text></View></View>;
 if(!volume)return <View style={s.root}>{header}<Text style={s.body}>Dieses Buch konnte nicht gefunden werden.</Text></View>;
 if(selected){const pos=volume.entries.indexOf(selected);const image=groupImages[volume.id+":"+selected.group];return <View style={s.root} testID={"living-detail-"+selected.id}>{header}<ScrollView contentContainerStyle={{padding:spacing.lg,paddingBottom:insets.bottom+spacing.xxl,gap:spacing.md}}>
   {image?<><Image source={image} style={s.detailImage} contentFit="contain"/><Text style={s.caption}>{ILLUSTRATION_LABEL}</Text></>:null}
   {selected.original?<View style={s.wordCard}><Text selectable style={[s.original,(selected.group==="Hebräisch"||selected.group==="Aramäisch")&&{writingDirection:"rtl"}]}>{selected.original}</Text><Text selectable style={[s.translit,{writingDirection:"ltr"}]}>({selected.translit})</Text><Text style={s.h2}>{selected.title}</Text></View>:null}
   <Text selectable style={s.body}>{selected.body}</Text>
   {selected.diagram?<View style={s.card}><Text style={s.h2}>Schaubild</Text>{selected.diagram.map((line,i)=><View key={i} style={s.diagramRow}><Icon name="git-branch" color={colors.brandPrimary} size={16}/><Text selectable style={[s.body,{flex:1}]}>{line}</Text></View>)}</View>:null}
   {selected.note?<View style={s.card}><Text style={s.h2}>Wichtig zum Verständnis</Text><Text selectable style={s.body}>{selected.note}</Text></View>:null}
   <View style={s.card}><Text style={s.h2}>In der Bibel nachlesen</Text><Text style={s.caption}>Ausgewählte Text- und Kontextstellen; antippen zum Öffnen.</Text>{selected.refs.map((ref,i)=><RefText key={i} text={ref} style={s.ref}/>)}</View>
   {volume.id==="words"?<Text style={s.caption}>Vereinfachte Umschrift und ausgewählte Bedeutungen; die Beispiele können Flexionsformen bzw. verwandte Wörter im Kontext enthalten.</Text>:null}
   <View style={s.nav}>{pos>0?<Button testID="living-prev" variant="secondary" label="Zurück" icon="chevron-left" onPress={()=>router.replace({pathname:"/living/[id]",params:{id:volume.id,entry:volume.entries[pos-1].id}})}/>:null}{pos+1<volume.entries.length?<Button testID="living-next" variant="secondary" label="Weiter" icon="chevron-right" onPress={()=>router.replace({pathname:"/living/[id]",params:{id:volume.id,entry:volume.entries[pos+1].id}})}/>:null}</View>
 </ScrollView></View>;}
 return <View style={s.root} testID={"living-volume-"+volume.id}>{header}
 <FlatList data={entries} keyExtractor={e=>e.id} keyboardShouldPersistTaps="handled" initialNumToRender={10} maxToRenderPerBatch={12} windowSize={7} contentContainerStyle={{padding:spacing.lg,paddingBottom:insets.bottom+spacing.xxl,gap:spacing.sm}}
   ListHeaderComponent={<View style={{gap:spacing.sm,marginBottom:spacing.md}}>
     {covers[volume.id]?<><Image source={covers[volume.id]} style={s.cover} contentFit="contain"/><Text style={s.caption}>Thematische Illustration · {ILLUSTRATION_LABEL}</Text></>:null}
     <Text style={s.body}>{volume.intro}</Text>
     {volume.id==="jesus"?<View style={{gap:spacing.sm}}><Button testID="living-jesus-psalms" label="Jesus in den Psalmen" icon="book-open" variant="secondary" onPress={()=>router.push("/psalms-jesus")}/><Button testID="living-jesus-parables" label="Gleichnisse Jesu · Studienreise" icon="compass" variant="secondary" onPress={()=>router.push({pathname:"/world/[id]",params:{id:"parables"}})}/></View>:null}
     <TextInput style={s.input} value={q} onChangeText={setQ} placeholder={volume.id==="words"?"Wort, Schrift oder Bedeutung suchen":"In diesem Buch suchen"} placeholderTextColor={colors.muted} accessibilityLabel="Buch durchsuchen" testID="living-search"/>
     <View style={s.filters}><Chip label="Alle" testID="living-group-all" selected={group===null} onPress={()=>setGroup(null)}/>{groups.map((g,i)=><Chip key={g} testID={"living-group-"+i} label={g} selected={g===group} onPress={()=>setGroup(g)}/>)}</View>
     <Text style={s.caption}>{entries.length} von {volume.entries.length} Einträgen</Text>
   </View>}
   ListEmptyComponent={<Text style={s.body}>Keine passenden Einträge. Probiere einen anderen Suchbegriff.</Text>}
   renderItem={({item:e})=><Pressable testID={"living-entry-"+e.id} accessibilityRole="button" accessibilityLabel={e.original?e.translit+" "+e.title:e.title} onPress={()=>open(e)} style={s.card}><View style={s.itemRow}><View style={{flex:1,gap:4}}><Text style={s.caption}>{e.group}</Text>{e.original?<><Text style={[s.original,{fontSize:25},(e.group==="Hebräisch"||e.group==="Aramäisch")&&{writingDirection:"rtl"}]}>{e.original}</Text><Text style={s.translit}>({e.translit})</Text></>:null}<Text style={s.h2}>{e.title}</Text><Text style={s.preview} numberOfLines={2}>{e.body}</Text></View><Icon name="chevron-right" color={colors.brandPrimary} size={20}/></View></Pressable>}/>
 </View>;
}
const useStyles=makeStyles(c=>({
 root:{flex:1,backgroundColor:c.surface},
 header:{flexDirection:"row",alignItems:"center",gap:spacing.sm,paddingHorizontal:spacing.lg,paddingBottom:spacing.sm,borderBottomWidth:1,borderBottomColor:c.divider},
 back:{width:44,height:44,alignItems:"center",justifyContent:"center",backgroundColor:c.surfaceSecondary,borderRadius:22},
 h1:{fontFamily:fonts.display,fontSize:22,fontWeight:"700",color:c.onSurface},h2:{fontFamily:fonts.display,fontSize:18,fontWeight:"700",color:c.onSurface},
 sub:{fontFamily:fonts.text,fontSize:13,color:c.muted},body:{fontFamily:fonts.text,fontSize:16,color:c.onSurface,lineHeight:25},
 preview:{fontFamily:fonts.text,fontSize:14,color:c.onSurfaceSecondary,lineHeight:20},caption:{fontFamily:fonts.text,fontSize:12,color:c.muted,lineHeight:18},
 cover:{width:"100%",height:190,borderRadius:radius.lg,backgroundColor:c.surfaceSecondary},detailImage:{width:"100%",height:220,borderRadius:radius.lg,backgroundColor:c.surfaceSecondary},
 card:{backgroundColor:c.surfaceSecondary,borderRadius:radius.lg,borderWidth:1,borderColor:c.border,padding:spacing.md,gap:spacing.sm},
 wordCard:{backgroundColor:c.surfaceSecondary,borderRadius:radius.lg,padding:spacing.lg,alignItems:"center",gap:spacing.sm},
 original:{fontSize:34,color:c.onSurface,textAlign:"center"},translit:{fontFamily:fonts.text,fontSize:16,color:c.brandPrimary,textAlign:"center",fontWeight:"700"},
 input:{minHeight:48,paddingHorizontal:spacing.md,borderWidth:1,borderColor:c.border,borderRadius:radius.md,backgroundColor:c.surfaceSecondary,color:c.onSurface,fontFamily:fonts.text,fontSize:15},
 filters:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},itemRow:{flexDirection:"row",alignItems:"center",gap:spacing.sm},
 diagramRow:{flexDirection:"row",alignItems:"flex-start",gap:spacing.sm,padding:spacing.sm,borderLeftWidth:2,borderLeftColor:c.brandPrimary},
 ref:{fontSize:15,lineHeight:24,fontFamily:fonts.text,color:c.onSurface},
 nav:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:spacing.sm},
}));
