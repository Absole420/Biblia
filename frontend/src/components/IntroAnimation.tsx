import React, { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, Extrapolation, useReducedMotion, cancelAnimation } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Stop, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/src/theme";

const GOLD = "#DFC38A";
const particles = Array.from({length: 24}, (_, i) => ({x: (i * 37 + 13) % 100, y: (i * 61 + 7) % 100, r: 0.7 + i % 3 * 0.5}));

export function IntroAnimation({ onDone, first = false }: { onDone: () => void; first?: boolean }) {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const finished = useRef(false);
  const duration = reduced ? 650 : first ? 9000 : 1050;
  const finish = useCallback(() => { if (!finished.current) { finished.current = true; onDone(); } }, [onDone]);
  useEffect(() => {
    p.value = 0;
    p.value = withTiming(1, {duration, easing: Easing.linear});
    const timer = setTimeout(finish, duration);
    return () => {clearTimeout(timer); cancelAnimation(p);};
  }, [duration, finish, p]);
  const book = useAnimatedStyle(() => ({opacity: interpolate(p.value,[0,.07,.28,.34],[0,1,1,0],Extrapolation.CLAMP),transform:[{scale: .96 + p.value*.12}]}));
  const cross = useAnimatedStyle(() => ({opacity: interpolate(p.value,[.32,.40,.61,.67],[0,1,1,0],Extrapolation.CLAMP)}));
  const halo = useAnimatedStyle(() => ({opacity: interpolate(p.value,[.34,.48,.62],[0,1,.6],Extrapolation.CLAMP),transform:[{scale: interpolate(p.value,[.33,.66],[.7,1.15],Extrapolation.CLAMP)}]}));
  const logo = useAnimatedStyle(() => ({opacity: first && !reduced ? interpolate(p.value,[.66,.76,1],[0,1,1],Extrapolation.CLAMP) : interpolate(p.value,[0,.24,1],[0,1,1],Extrapolation.CLAMP)}));
  const dust = useAnimatedStyle(() => ({transform:[{translateY: reduced ? 0 : -18*p.value}], opacity: .48 + .2*p.value}));
  const full = first && !reduced;
  const out = useAnimatedStyle(() => ({opacity: reduced ? 1 : interpolate(p.value,[.94,1],[1,0],Extrapolation.CLAMP)}));
  return <Animated.View style={[styles.root,out]} testID="intro-animation">
    <LinearGradient colors={["#0A100D","#22281B","#100F0B"]} style={StyleSheet.absoluteFill}/>
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs><RadialGradient id="glow" cx="50%" cy="42%" rx="65%" ry="55%"><Stop offset="0" stopColor="#C49B50" stopOpacity=".30"/><Stop offset="1" stopColor="#C49B50" stopOpacity="0"/></RadialGradient></Defs>
      <Rect width={width} height={height} fill="url(#glow)"/>
    </Svg>
    {!reduced && <Animated.View style={[styles.noTouch,StyleSheet.absoluteFill,dust]}><Svg width={width} height={height}>{particles.map((s,i)=><Circle key={i} cx={s.x*width/100} cy={s.y*height/100} r={s.r} fill={GOLD} opacity={.15+(i%5)*.13}/>)}</Svg></Animated.View>}
    {full && <Animated.View style={[styles.noTouch,styles.center,book]}><BookMark cross={false}/><Text style={styles.eyebrow}>DAS WORT</Text><Text style={styles.verse}>Dein Wort ist Leuchte meinem Fuß</Text></Animated.View>}
    {full && <Animated.View style={[styles.noTouch,styles.center,halo]}><Svg width={320} height={320}><Defs><RadialGradient id="crossGlow" cx="50%" cy="50%" rx="50%" ry="50%"><Stop offset="0" stopColor="#F2D9A0" stopOpacity=".55"/><Stop offset=".45" stopColor="#C49B50" stopOpacity=".18"/><Stop offset="1" stopColor="#C49B50" stopOpacity="0"/></RadialGradient></Defs><Circle cx={160} cy={128} r={160} fill="url(#crossGlow)"/></Svg></Animated.View>}
    {full && <Animated.View style={[styles.noTouch,styles.center,cross]}><Svg width={156} height={174} viewBox="0 0 156 174"><Path d="M12 155 Q78 110 144 155" stroke={GOLD} strokeWidth="1" fill="none" opacity=".5"/><Path d="M78 20 V137 M44 57 H112" stroke={GOLD} strokeWidth="4" strokeLinecap="round"/></Svg><Text style={styles.eyebrow}>DAS LICHT</Text><Text style={styles.verse}>und Licht für meinen Pfad.</Text><Text style={styles.ref}>PSALM 119,105</Text></Animated.View>}
    <Animated.View style={[styles.noTouch,styles.center,logo]}><BookMark cross/><Text accessibilityRole="header" style={styles.title}>BIBLIA</Text><Text style={styles.subtitle}>Entdecke sein Wort.</Text></Animated.View>
    {full && <Pressable accessibilityRole="button" testID="intro-skip-button" onPress={finish} style={[styles.skip,{top:insets.top+12}]}><Text style={styles.skipText}>Überspringen</Text></Pressable>}
  </Animated.View>;
}
function BookMark({cross}: {cross:boolean}) {return <Svg width={150} height={150} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={46} stroke={GOLD} strokeWidth=".6" opacity=".35" fill="none"/><Path d="M50 76 Q33 64 13 68 V29 Q33 25 50 39 Q67 25 87 29 V68 Q67 64 50 76Z M50 39 V76 M20 39 Q34 38 43 45 M20 47 Q34 46 43 53 M57 45 Q66 38 80 39 M57 53 Q66 46 80 47" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>{cross && <Path d="M50 8 V29 M41 16 H59" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round"/>}</Svg>}
const styles=StyleSheet.create({
 noTouch:{pointerEvents:"none"},
 root:{...StyleSheet.absoluteFill,zIndex:60,backgroundColor:"#10130E"},
 center:{...StyleSheet.absoluteFill,alignItems:"center",justifyContent:"center",paddingHorizontal:26,gap:12},
 title:{color:GOLD,fontFamily:fonts.display,fontSize:42,letterSpacing:7,textAlign:"center"},
 subtitle:{color:"#F3E9D5",fontFamily:fonts.text,fontSize:18,textAlign:"center"},
 eyebrow:{color:GOLD,fontFamily:fonts.text,fontSize:13,letterSpacing:4},
 verse:{color:"#F3E9D5",fontFamily:fonts.display,fontSize:24,textAlign:"center"},
 ref:{color:GOLD,fontFamily:fonts.text,fontSize:11,letterSpacing:2,marginTop:8},
 skip:{position:"absolute",right:18,minHeight:44,minWidth:44,paddingHorizontal:16,justifyContent:"center",borderRadius:22,backgroundColor:"rgba(243,233,213,0.10)"},skipText:{color:"#F3E9D5",fontFamily:fonts.text,fontSize:14}
});
