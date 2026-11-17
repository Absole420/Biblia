import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Icon } from "@/src/components/Icon";
import { VerseOfDay } from "@/src/components/VerseOfDay";
import { CAMPAIGNS } from "@/src/data/john";
import { WORLDS } from "@/src/data/worlds";
import { STATION_IMAGES } from "@/src/data/stationImages";
import type { World } from "@/src/data/types";
import { stationStatus } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, spacing, useTheme } from "@/src/theme";

// Bundled art: no network or additional permissions needed. Replace with dedicated
// landscape thumbnails later; don't use the UI concept screenshot as an app background.
const ART: Record<string, ImageSourcePropType> = {
  tora: require("../../assets/images/lexicon/mose.jpg"),
  history: require("../../assets/images/lexicon/salomo.jpg"),
  psalms: require("../../assets/images/lexicon/david.jpg"),
  prophets: require("../../assets/images/lexicon/jesaja.jpg"),
  gospels: require("../../assets/images/intro/verkuendigung.jpg"),
  parables: require("../../assets/images/intro/begegnungen.jpg"),
  acts: require("../../assets/images/lexicon/petrus.jpg"),
  letters: require("../../assets/images/lexicon/paulus.jpg"),
  revelation: require("../../assets/images/lexicon/johannes-apostel.jpg"),
};
const SUB: Record<string,string> = {
  tora:"Schöpfung, Bund und Wüste", history:"Land, Richter und Könige",
  psalms:"Gebet, Lob und Lebensweisheit", prophets:"Gericht, Hoffnung und Visionen",
  gospels:"Das Leben und die Worte Jesu", parables:"Geschichten vom Reich Gottes",
  acts:"Die ersten Gemeinden und ihre Reisen", letters:"Glaube und Leben der Gemeinden",
  revelation:"Sendschreiben und Neues Jerusalem",
};

function campaignsFor(world: World) {
  return (world.campaignIds ?? []).map(id => CAMPAIGNS[id]).filter(Boolean);
}
const GOLD="#DFB86D", CREAM="#FFF1D7", SOFT="#E4CBA4";

export function StudyJourney({ bottom=0, onMap }: {bottom?:number; onMap:()=>void}) {
  const router=useRouter();
  const {state}=useProgress();
  const {width}=useWindowDimensions();
  return <ScrollView testID="study-journey-list" style={base.list} contentContainerStyle={[base.listContent,{paddingBottom:bottom+spacing.xl}]} showsVerticalScrollIndicator={false}>
    <View style={base.banner}>
      <Image source={ART.gospels} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right" />
      <LinearGradient colors={["#102D30","#102D30E8","#102D3040"]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
      <Text accessibilityRole="header" style={base.title}>Studienreise</Text>
      <View style={base.rule}/>
      <Text style={base.lead}>Wähle ein Themenfeld und entdecke Gottes Wort Schritt für Schritt.</Text>
    </View>
    {WORLDS.map(world=>{
      const stations=campaignsFor(world).flatMap(c=>c.stations);
      const done=stations.filter(s=>!!state.stations[s.id]).length;
      const pct=stations.length?Math.round(done/stations.length*100):0;
      const playable=world.status==="playable" && stations.length>0;
      return <Pressable key={world.id} testID={"study-world-"+world.id} accessibilityRole="button" accessibilityLabel={world.title+", "+(playable?done+" von "+stations.length+" Stationen abgeschlossen":"Vorschau")} onPress={()=>router.push({pathname:"/journey/[id]",params:{id:world.id}})} style={({pressed})=>[base.card,pressed&&base.pressed]}>
        <View style={[base.thumb,{width:width<360?84:Math.min(135,width*.29)}]}>
          {ART[world.id]?<Image source={ART[world.id]} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk"/>:<Icon name={world.icon} color={GOLD} size={32}/>}
        </View>
        <View style={base.cardContent}>
          <Text style={base.cardTitle}>{world.title}</Text>
          <Text style={base.cardSub}>{SUB[world.id]??world.subtitle}</Text>
          <Text style={base.meta}>{playable?done+" / "+stations.length+" Stationen · "+pct+" %":"Vorschau"}</Text>
          {playable?<View style={base.track}><View style={[base.fill,{width:(pct+"%") as `${number}%`}]}/></View>:null}
        </View>
        <Icon name="chevron-right" color={CREAM} size={20}/>
      </Pressable>;
    })}
    <Pressable accessibilityRole="button" testID="study-journey-map" onPress={onMap} style={base.secondary}><Icon name="map" color={GOLD}/><Text style={base.secondaryText}>Studienreise auf der Karte entdecken</Text></Pressable>
    <VerseOfDay/>
  </ScrollView>;
}

export function StudyWorld({world}:{world:World}) {
  const router=useRouter();
  const {state}=useProgress();
  const {colors}=useTheme();
  const styles=useDetailStyles();
  const campaigns=campaignsFor(world);
  const stations=campaigns.flatMap(c=>c.stations);
  const done=stations.filter(s=>!!state.stations[s.id]).length;
  const next=stations.find(s=>stationStatus(s,state.stations)==="available");
  const playable=world.status==="playable"&&stations.length>0;
  const open=(id:string)=>router.push({pathname:"/station/[id]",params:{id}});
  return <ScrollView testID={"study-world-detail-"+world.id} contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      {ART[world.id]?<Image source={ART[world.id]} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk"/>:null}
      <LinearGradient colors={["transparent","#161510E8"]} style={StyleSheet.absoluteFill}/>
      <Text style={base.title}>{world.title}</Text><Text style={base.lead}>{SUB[world.id]??world.subtitle}</Text>
    </View>
    <Text style={styles.heading}>Worum geht es?</Text>
    <Text style={styles.body}>{world.description}</Text>
    <Text style={styles.small}>{world.books.join(" · ")}</Text>
    {playable?<><Text style={styles.heading}>Dein Fortschritt</Text><Text style={styles.body}>{done} von {stations.length} Stationen abgeschlossen</Text><View style={[base.track,{backgroundColor:colors.surfaceTertiary}]}><View style={[base.fill,{width:(Math.round(done/stations.length*100)+"%") as `${number}%`}]}/></View>
      {next?<Pressable accessibilityRole="button" testID="study-world-continue" onPress={()=>open(next.id)} style={styles.primary}><Text style={styles.primaryText}>{(state.phase[next.id]??0)>0?"Weiterlernen":"Nächste Station"}: {next.title}</Text><Icon name="play" color={colors.onBrandPrimary}/></Pressable>:null}</>:null}
    <Pressable accessibilityRole="button" testID="study-world-open-map" onPress={()=>router.push({pathname:"/world/[id]",params:{id:world.id}})} style={styles.action}><Icon name="map" color={colors.brandPrimary}/><Text style={styles.actionText}>{playable?"Abenteuerkarte und historische Karte":"Lernwelt-Vorschau"}</Text><Icon name="chevron-right" color={colors.muted}/></Pressable>
    {world.id==="psalms"?<Pressable accessibilityRole="button" onPress={()=>router.push("/psalms-jesus")} style={styles.action}><Icon name="book-open" color={colors.brandPrimary}/><Text style={styles.actionText}>Jesus in den Psalmen</Text><Icon name="chevron-right" color={colors.muted}/></Pressable>:null}
    {playable?campaigns.map(c=><View key={c.id} style={styles.group}>
      <Text style={styles.heading}>{campaigns.length>1?c.title:"Stationen"}</Text>
      {c.stations.map((s,i)=>{
        const status=stationStatus(s,state.stations);
        const locked=status==="locked";
        const missing=s.requires.filter(id=>!state.stations[id]).map(id=>stations.find(x=>x.id===id)?.title??id);
        const art=s.image?STATION_IMAGES[s.image]:undefined;
        return <Pressable key={s.id} testID={"study-station-"+s.id} accessibilityRole="button" accessibilityState={{disabled:locked}} disabled={locked} onPress={()=>open(s.id)} style={[styles.station,locked&&{opacity:.76}]}>
          {art?<Image source={art} style={styles.stationImage} contentFit="cover" cachePolicy="memory-disk"/>:<View style={styles.stationIcon}><Icon name={s.icon} size={24} color={colors.brandPrimary}/></View>}
          <View style={styles.stationText}><Text style={styles.stationTitle}>{i+1}. {s.title}</Text><Text style={styles.small}>{s.subtitle}</Text><Text style={styles.small}>{locked?"Zuerst: "+missing.join(", "):status==="completed"?"Abgeschlossen · Wiederholen":(state.phase[s.id]??0)>0?"Begonnen · Fortsetzen":"Bereit zum Lernen"}</Text></View>
          <Icon name={locked?"lock":status==="completed"?"check-circle":"chevron-right"} color={status==="completed"?colors.success:colors.muted}/>
        </Pressable>;
      })}
    </View>):<View style={styles.group}><Text style={styles.heading}>Geplante Inhalte</Text>{world.planned.map(x=><Text key={x} style={styles.body}>• {x}</Text>)}</View>}
  </ScrollView>;
}
const base=StyleSheet.create({
 list:{flex:1,backgroundColor:"#102D30"},listContent:{padding:12,gap:12,width:"100%",maxWidth:780,alignSelf:"center"},
 banner:{overflow:"hidden",borderRadius:20,padding:20,minHeight:136,justifyContent:"center",gap:8,backgroundColor:"#102D30"},
 title:{fontFamily:fonts.display,fontSize:30,color:CREAM,fontWeight:"700"},
 lead:{fontFamily:fonts.text,fontSize:15,lineHeight:21,color:SOFT,maxWidth:350},
 rule:{width:42,height:3,backgroundColor:GOLD,borderRadius:2},
 card:{flexDirection:"row",alignItems:"center",gap:12,padding:7,paddingRight:12,minHeight:120,backgroundColor:"#30281C",borderRadius:20,borderWidth:1,borderColor:"#B89858"},
 pressed:{opacity:.82},
 thumb:{alignSelf:"stretch",minHeight:102,overflow:"hidden",borderRadius:14,backgroundColor:"#4A3B29",alignItems:"center",justifyContent:"center"},
 cardContent:{flex:1,minWidth:0,gap:5,paddingVertical:6},
 cardTitle:{fontFamily:fonts.display,fontSize:19,color:CREAM,fontWeight:"700"},
 cardSub:{fontFamily:fonts.text,fontSize:13,lineHeight:18,color:SOFT},
 meta:{fontFamily:fonts.text,fontSize:12,color:CREAM},
 track:{height:5,borderRadius:3,backgroundColor:"#63563B",overflow:"hidden"},fill:{height:5,borderRadius:3,backgroundColor:GOLD},
 secondary:{flexDirection:"row",alignItems:"center",justifyContent:"center",padding:14,gap:8,borderRadius:14,borderColor:"#B89858",borderWidth:1},
 secondaryText:{flexShrink:1,color:CREAM,fontFamily:fonts.text,fontSize:14,fontWeight:"700"}
});
const useDetailStyles=makeStyles(c=>({
 content:{padding:spacing.lg,gap:spacing.md,width:"100%",maxWidth:850,alignSelf:"center",paddingBottom:spacing.xxxl},
 hero:{minHeight:220,borderRadius:20,overflow:"hidden",justifyContent:"flex-end",padding:20,gap:5,backgroundColor:"#30281C"},
 heading:{fontFamily:fonts.display,fontSize:22,fontWeight:"700",color:c.onSurface},
 body:{fontFamily:fonts.text,fontSize:16,lineHeight:24,color:c.onSurface},
 small:{fontFamily:fonts.text,fontSize:13,lineHeight:19,color:c.muted},
 primary:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8,backgroundColor:c.brandPrimary,borderRadius:14,padding:14},
 primaryText:{flex:1,fontFamily:fonts.text,fontWeight:"800",color:c.onBrandPrimary,fontSize:15},
 action:{flexDirection:"row",alignItems:"center",gap:10,minHeight:48,borderWidth:1,borderColor:c.border,borderRadius:14,padding:12,backgroundColor:c.surfaceSecondary},
 actionText:{flex:1,fontFamily:fonts.text,fontSize:15,color:c.onSurface,fontWeight:"700"},
 group:{gap:10,marginTop:8},
 station:{flexDirection:"row",alignItems:"center",gap:10,padding:10,borderRadius:16,borderWidth:1,borderColor:c.border,backgroundColor:c.surfaceSecondary,minHeight:76},
 stationImage:{width:64,height:68,borderRadius:10},
 stationIcon:{width:48,height:48,borderRadius:12,backgroundColor:c.surfaceTertiary,alignItems:"center",justifyContent:"center"},
 stationText:{flex:1,minWidth:0,gap:3},
 stationTitle:{fontFamily:fonts.display,fontSize:17,color:c.onSurface,fontWeight:"700"},
}));
