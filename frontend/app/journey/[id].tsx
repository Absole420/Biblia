import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/src/components/Icon";
import { StudyWorld } from "@/src/components/StudyJourney";
import { WORLDS } from "@/src/data/worlds";
import { fonts, spacing, useTheme } from "@/src/theme";

export default function StudyWorldRoute() {
  const {id}=useLocalSearchParams<{id:string}>();
  const world=WORLDS.find(w=>w.id===id);
  const router=useRouter();
  const insets=useSafeAreaInsets();
  const {colors}=useTheme();
  return <View style={{flex:1,backgroundColor:colors.surface,paddingTop:insets.top,paddingBottom:insets.bottom}}>
    <View style={{flexDirection:"row",alignItems:"center",paddingHorizontal:spacing.lg,minHeight:52,gap:12,borderBottomWidth:1,borderBottomColor:colors.border}}>
      <Pressable testID="study-world-back" accessibilityRole="button" accessibilityLabel="Zurück" onPress={()=>router.canGoBack()?router.back():router.replace("/")} style={{minHeight:44,minWidth:44,alignItems:"center",justifyContent:"center"}}><Icon name="arrow-left" color={colors.onSurface}/></Pressable>
      <Text numberOfLines={1} style={{flex:1,fontFamily:fonts.display,fontSize:18,color:colors.onSurface}}>Studienreise</Text>
    </View>
    {world?<StudyWorld world={world}/>:<Text style={{padding:spacing.lg,color:colors.onSurface}}>Lernwelt nicht gefunden.</Text>}
  </View>;
}
