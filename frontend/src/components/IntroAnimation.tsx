import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, Extrapolation, useReducedMotion, cancelAnimation } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Stop, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/src/theme";
import type { Scripture } from "@/src/lib/dailyScriptureLogic";

const GOLD = "#DFC38A";
const particles = Array.from({length: 24}, (_, i) => ({x: (i * 37 + 13) % 100, y: (i * 61 + 7) % 100, r: 0.7 + i % 3 * 0.5}));

export function IntroAnimation({ onDone, first = false, scripture }: { onDone: () => void; first?: boolean; scripture: Scripture }) {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const finished = useRef(false);
  const duration = reduced ? 650 : first ? 6000 : 1050;
  const finish = () => { if (!finished.current) { finished.current = true; onDone(); } };
  useEffect(() => {
    p.value = 0;
    p.value = withTiming(1, {duration, easing: Easing.linear});
    const timer = setTimeout(finish, duration);
    return () => {clearTimeout(timer); cancelAnimation(p);};
  }, [duration, onDone, p]);
  const book = useAnimatedStyle(() => ({opacity: interpolate(p.value,[0,.10,.28,.40],[0,1,1,0],Extrapolation.CLAMP),transform:[{scale: .96 + p.value*.12}]}));
  const cross = useAnimatedStyle(() => ({opacity: interpolate(p.value,[.28,.39,.59,.70],[0,1,1,0],Extrapolation.CLAMP)}));
  const logo = useAnimatedStyle(() => ({opacity: first && !reduced ? interpolate(p.value,[.60,.74,1],[0,1,1],Extrapolation.CLAMP) : interpolate(p.value,[0,.24,1],[0,1,1],Extrapolation.CLAMP)}));
  const dust = useAnimatedStyle(() => ({transform:[{translateY: reduced ? 0 : -18*p.value}], opacity: .48 + .2*p.value}));
  const full = first && !reduced;
  const words = scripture.text.split(/\s+/);
  const middle = Math.ceil(words.length / 2);
  const firstPart = words.slice(0, middle).join(" ");
  const secondPart = words.slice(middle).join(" ");
  const verseSize = Math.max(15, Math.min(width < 360 || height < 620 ? 18 : 24, scripture.text.length > 175 ? 18 : scripture.text.length > 100 ? 21 : 24));
  return <View style={styles.root} testID="intro-animation">
    <LinearGradient colors={["#0A100D","#22281B","#100F0B"]} style={StyleSheet.absoluteFill}/>
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs><RadialGradient id="glow" cx="50%" cy="42%" rx="65%" ry="55%"><Stop offset="0" stopColor="#C49B50" stopOpacity=".30"/><Stop offset="1" stopColor="#C49B50" stopOpacity="0"/></RadialGradient></Defs>
      <Rect width={width} height={height} fill="url(#glow)"/>
    </Svg>
    {!reduced && <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,dust]}><Svg width={width} height={height}>{particles.map((s,i)=><Circle key={i} cx={s.x*width/100} cy={s.y*height/100} r={s.r} fill={GOLD} opacity={.15+(i%5)*.13}/>)}</Svg></Animated.View>}
    {full && <Animated.View style={[styles.center,book]}><BookMark cross={false}/><Text style={styles.eyebrow}>DAS WORT</Text><Text style={[styles.verse,{fontSize:verseSize}]}>{firstPart}</Text></Animated.View>}
    {full && <Animated.View style={[styles.center,cross]}><Svg width={156} height={174} viewBox="0 0 156 174"><Path d="M12 155 Q78 110 144 155" stroke={GOLD} strokeWidth="1" fill="none" opacity=".5"/><Path d="M78 20 V137 M44 57 H112" stroke={GOLD} strokeWidth="4" strokeLinecap="round"/></Svg><Text style={styles.eyebrow}>DAS LICHT</Text><Text style={[styles.verse,{fontSize:verseSize}]}>{secondPart || firstPart}</Text><Text style={styles.ref}>{scripture.ref} · ELB 1905</Text></Animated.View>}
    <Animated.View style={[styles.center,logo]}><BookMark cross/><Text accessibilityRole="header" style={styles.title}>BIBLIA</Text><Text style={styles.subtitle}>Entdecke sein Wort.</Text><Text testID="intro-daily-verse" style={[styles.verse,{fontSize:verseSize}]}>{scripture.text}</Text><Text style={styles.ref} testID="intro-daily-ref">{scripture.ref} · ELB 1905</Text></Animated.View>
    {full && <Pressable accessibilityRole="button" testID="intro-skip-button" onPress={finish} style={[styles.skip,{top:insets.top+12}]}><Text style={styles.skipText}>Überspringen</Text></Pressable>}
  </View>;
}
function BookMark({cross}: {cross:boolean}) {return <Svg width={150} height={150} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={46} stroke={GOLD} strokeWidth=".6" opacity=".35" fill="none"/><Path d="M50 76 Q33 64 13 68 V29 Q33 25 50 39 Q67 25 87 29 V68 Q67 64 50 76Z M50 39 V76 M20 39 Q34 38 43 45 M20 47 Q34 46 43 53 M57 45 Q66 38 80 39 M57 53 Q66 46 80 47" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>{cross && <Path d="M50 8 V29 M41 16 H59" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round"/>}</Svg>}
const styles=StyleSheet.create({
 root:{...StyleSheet.absoluteFillObject,zIndex:60,backgroundColor:"#10130E"},
 center:{...StyleSheet.absoluteFillObject,alignItems:"center",justifyContent:"center",paddingHorizontal:26,gap:12},
 title:{color:GOLD,fontFamily:fonts.display,fontSize:42,letterSpacing:7,textAlign:"center"},
 subtitle:{color:"#F3E9D5",fontFamily:fonts.text,fontSize:18,textAlign:"center"},
 eyebrow:{color:GOLD,fontFamily:fonts.text,fontSize:13,letterSpacing:4},
 verse:{color:"#F3E9D5",fontFamily:fonts.display,fontSize:24,textAlign:"center"},
 ref:{color:GOLD,fontFamily:fonts.text,fontSize:11,letterSpacing:2,marginTop:8},
 skip:{position:"absolute",right:18,padding:14},skipText:{color:"#F3E9D5",fontFamily:fonts.text,fontSize:14}
});
