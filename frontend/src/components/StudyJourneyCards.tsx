import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/src/components/Icon";
import { CAMPAIGNS } from "@/src/data/john";
import { WORLDS } from "@/src/data/worlds";
import type { World } from "@/src/data/types";
import { ILLUSTRATIONS } from "@/src/data/illustrations";
import { STATION_IMAGES } from "@/src/data/stationImages";
import { stationStatus } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, spacing, useTheme } from "@/src/theme";

const ART: Record<string, ImageSourcePropType> = {
  tora: ILLUSTRATIONS.mose, history: ILLUSTRATIONS.salomo, psalms: STATION_IMAGES["ps1-1"],
  prophets: ILLUSTRATIONS.jesaja, gospels: ILLUSTRATIONS.jesus, parables: require("../../assets/images/intro/verkuendigung.jpg"),
  acts: ILLUSTRATIONS.paulus, letters: ILLUSTRATIONS["johannes-apostel"],
};
const SUB: Record<string,string> = { tora:"Schöpfung, Bund und Wüste", history:"Land, Richter und Könige", psalms:"Gebet, Lob und Lebensweisheit", prophets:"Gericht, Hoffnung und Visionen", gospels:"Das Leben und Wirken Jesu", parables:"Geschichten vom Reich Gottes", acts:"Die ersten Gemeinden", letters:"Glaube und Gemeindeleben", revelation:"Sendschreiben und Neues Jerusalem" };
const getCampaigns = (w:World) => (w.campaignIds ?? []).map(id=>CAMPAIGNS[id]).filter(Boolean);

function Art({source, icon, large=false}: {source?:ImageSourcePropType;icon:string;large?:boolean}) {
  const s=useStyles(); const {colors}=useTheme();
  const resolved=source ? Image.resolveAssetSource(source) : undefined;
  const ratio=resolved?.width && resolved?.height ? resolved.width/resolved.height : 1.5;
  return <View style={[s.art,large?{width:"100%",aspectRatio:ratio,maxHeight:340}:s.thumb]}>
    {source ? <Image source={source} style={{width:"100%",height:"100%"}} resizeMode="contain" accessibilityIgnoresInvertColors/> : <Icon name={icon} color={colors.brandPrimary} size={large?64:36}/>}
  </View>;
}

export function StudyJourneyCards({onMap}:{onMap:()=>void}) {
  const s=useStyles(); const {colors}=useTheme(); const {state}=useProgress(); const router=useRouter();
  const insets=useSafeAreaInsets();
  return <ScrollView testID="study-journey-cards" style={s.scroll} contentContainerStyle={[s.content,{paddingBottom:insets.bottom+24}]} showsVerticalScrollIndicator={false}>
    <View style={s.banner}><Text style={s.heroTitle}>Studienreise</Text><Text style={s.subtitle}>Wähle ein Themenfeld und starte deine Lernreise.</Text><Pressable accessibilityRole="button" onPress={onMap} style={s.mapLink}><Icon name="map" size={16} color={colors.brandPrimary}/><Text style={s.link}>Abenteuerkarte ansehen</Text></Pressable></View>
    {WORLDS.map(w=>{
      const stations=getCampaigns(w).flatMap(c=>c.stations);
      const done=stations.filter(st=>state.stations[st.id]).length;
      const pct=stations.length?done/stations.length:0;
      return <Pressable key={w.id} testID={"study-world-"+w.id} accessibilityRole="button" onPress={()=>router.push({pathname:"/world/[id]",params:{id:w.id,view:"study"}})} style={({pressed})=>[s.card,pressed&&{opacity:.8}]}>
        <Art source={ART[w.id]} icon={w.icon}/>
        <View style={s.cardBody}><Text style={s.title}>{w.title}</Text><Text style={s.subtitle}>{SUB[w.id]??w.subtitle}</Text><Text style={s.meta}>{w.status==="playable"&&stations.length?done+" / "+stations.length+" Stationen · "+Math.round(pct*100)+" %":"Vorschau"}</Text>{w.status==="playable"&&stations.length>0&&<View style={s.track}><View style={[s.fill,{width:`${pct*100}%`}]}/></View>}</View>
        <Icon name="chevron-right" size={20} color={colors.brandPrimary}/>
      </Pressable>;
    })}
  </ScrollView>;
}

export function StudyWorldDetail({world}:{world:World}) {
  const s=useStyles();const {colors}=useTheme();const {state}=useProgress();const router=useRouter();const insets=useSafeAreaInsets();
  const campaigns=getCampaigns(world); const stations=campaigns.flatMap(c=>c.stations);const done=stations.filter(st=>state.stations[st.id]).length;
  const next=stations.find(st=>stationStatus(st,state.stations)==="available");
  const open=(id:string)=>router.push({pathname:"/station/[id]",params:{id}});
  return <View style={s.detailRoot} testID="study-world-detail">
    <View style={[s.header,{paddingTop:insets.top+8}]}><Pressable accessibilityRole="button" accessibilityLabel="Zurück" onPress={()=>router.canGoBack()?router.back():router.replace("/")} style={s.back}><Icon name="arrow-left" size={23} color={colors.onSurface}/></Pressable><Text style={[s.title,{flex:1}]}>{world.title}</Text></View>
    <ScrollView contentContainerStyle={[s.content,{paddingBottom:insets.bottom+32}]} style={s.scroll}>
      <Art source={ART[world.id]} icon={world.icon} large/>
      <Text style={s.heroTitle}>{world.title}</Text><Text style={s.subtitle}>{SUB[world.id]??world.subtitle}</Text>
      <Text style={s.description}>{world.description}</Text><Text style={s.meta}>{world.books.join(" · ")}</Text>
      {world.status==="playable"&&stations.length>0?<><Text style={s.meta}>{done} von {stations.length} Stationen abgeschlossen</Text><View style={s.track}><View style={[s.fill,{width:`${done/stations.length*100}%`}]}/></View>
      {next&&<Pressable accessibilityRole="button" style={s.cta} onPress={()=>open(next.id)}><Text style={s.ctaText}>Weiterlernen: {next.title}</Text></Pressable>}
      <Pressable accessibilityRole="button" style={s.mapLink} onPress={()=>router.push({pathname:"/world/[id]",params:{id:world.id}})}><Icon name="map" size={18} color={colors.brandPrimary}/><Text style={s.link}>Abenteuerkarte und historische Karte</Text></Pressable>
      {campaigns.map(c=><View key={c.id} style={{gap:10}}><Text style={s.section}>{c.title}</Text>{c.stations.map((st,i)=>{const status=stationStatus(st,state.stations); const missing=st.requires.filter(id=>!state.stations[id]).map(id=>stations.find(x=>x.id===id)?.title??id);return <Pressable key={st.id} testID={"study-station-"+st.id} disabled={status==="locked"} accessibilityRole="button" accessibilityState={{disabled:status==="locked"}} onPress={()=>open(st.id)} style={[s.station,status==="locked"&&{opacity:.72}]}>{st.image&&STATION_IMAGES[st.image]?<Art source={STATION_IMAGES[st.image]} icon={st.icon}/>:<View style={s.stationNum}><Text style={s.meta}>{i+1}</Text></View>}<View style={s.cardBody}><Text style={s.title}>{st.title}</Text><Text style={s.subtitle}>{st.subtitle}</Text><Text style={s.meta}>{status==="locked"?"Zuerst: "+missing.join(", "):status==="completed"?"Abgeschlossen · Wiederholen":st.tasks.length+" Aufgaben · "+st.exam.length+" Prüfungsfragen"}</Text></View><Icon name={status==="locked"?"lock":status==="completed"?"check-circle":"chevron-right"} size={20} color={status==="completed"?colors.success:colors.brandPrimary}/></Pressable>})}</View>)}</>:<><Text style={s.section}>Geplante Stationen</Text>{world.planned.map(p=><Text key={p} style={s.description}>{p}</Text>)}</>}
    </ScrollView>
  </View>;
}

const useStyles=makeStyles(c=>({
 scroll:{flex:1,backgroundColor:c.surface},
 detailRoot:{flex:1,backgroundColor:c.surface},
 content:{padding:spacing.lg,gap:12,width:"100%",maxWidth:850,alignSelf:"center"},
 banner:{padding:spacing.lg,borderRadius:22,backgroundColor:c.surfaceSecondary,gap:8,borderWidth:1,borderColor:c.border},
 heroTitle:{fontFamily:fonts.display,fontWeight:"700",fontSize:30,color:c.onSurface},
 title:{fontFamily:fonts.display,fontWeight:"700",fontSize:19,color:c.onSurface},
 subtitle:{fontFamily:fonts.text,fontSize:14,lineHeight:20,color:c.onSurfaceSecondary},
 description:{fontFamily:fonts.text,fontSize:16,lineHeight:24,color:c.onSurface},
 meta:{fontFamily:fonts.text,fontSize:12,fontWeight:"700",color:c.brandPrimary},
 card:{flexDirection:"row",alignItems:"center",padding:8,gap:10,minHeight:126,borderRadius:20,borderWidth:1,borderColor:c.brandPrimary,backgroundColor:c.surfaceSecondary},
 cardBody:{flex:1,minWidth:0,gap:5},
 art:{backgroundColor:c.surfaceTertiary,borderRadius:15,overflow:"hidden",alignItems:"center",justifyContent:"center"},
 thumb:{width:"30%",aspectRatio:1.1},
 track:{height:5,backgroundColor:c.surfaceTertiary,borderRadius:5,overflow:"hidden"},
 fill:{height:5,backgroundColor:c.brandPrimary,borderRadius:5},
 mapLink:{flexDirection:"row",alignItems:"center",gap:8,minHeight:44,flexWrap:"wrap"},
 link:{fontFamily:fonts.text,fontWeight:"700",fontSize:14,color:c.brandPrimary,flexShrink:1},
 header:{flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:16,paddingBottom:10,borderBottomWidth:1,borderBottomColor:c.divider},
 back:{width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center",backgroundColor:c.surfaceSecondary},
 section:{fontFamily:fonts.display,fontSize:23,fontWeight:"700",color:c.onSurface,marginTop:10},
 station:{flexDirection:"row",alignItems:"center",gap:10,borderRadius:18,borderWidth:1,borderColor:c.border,padding:12,backgroundColor:c.surfaceSecondary},
 stationNum:{width:32,height:32,alignItems:"center",justifyContent:"center",borderRadius:16,backgroundColor:c.surfaceTertiary},
 cta:{backgroundColor:c.brandPrimary,padding:15,borderRadius:14},
 ctaText:{color:c.onBrandPrimary,fontFamily:fonts.text,fontWeight:"800",fontSize:15}
}));
