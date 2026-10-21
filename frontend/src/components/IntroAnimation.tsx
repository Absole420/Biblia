import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import geo from "@/src/data/geo.json";
import { fonts } from "@/src/theme";

import { Icon } from "./Icon";

// Feste Farbpalette des Intro-Kunstwerks – bewusst identisch in Hell- und Dunkelmodus.
const PAL = {
  skyTop: "#22336E", skyMid: "#7B4F9E", skyLow: "#F0A35E", horizon: "#FFE2A0",
  sea: "#3E8FC4", seaDeep: "#2C6E9E", land: "#EBD3A0", green: "#8DBB6A", desert: "#E8B86A", river: "#4AA3D8",
  ink: "#4A3420", white: "#FFFFFF", parchment: "#F6E7C3", roller: "#8A5A2B", rollerDark: "#5E3B1A", gold: "#F5C24C", cross: "#5A3A1E",
};

type Ring = number[][];
const GEO = geo as { land: Ring[]; rivers: { name: string; pts: Ring }[]; lakes: { name: string; pts: Ring }[] };

// Stationen der Reise: Tora → Land → Evangelien → Kreuz
const STOPS = [
  { lat: 30.55, lon: 32.3, place: "Ägypten", person: "Josef", color: "#D9A23A", icon: "sun", side: 1 },
  { lat: 28.55, lon: 33.97, place: "Berg Sinai", person: "Mose", color: "#E0662E", icon: "book", side: 1 },
  { lat: 31.95, lon: 35.56, place: "Jordan", person: "Josua", color: "#3FA7A0", icon: "droplet", side: 1 },
  { lat: 32.7, lon: 35.3, place: "Nazareth", person: "Maria", color: "#8E5BB5", icon: "home", side: -1 },
  { lat: 32.88, lon: 35.57, place: "Galiläa", person: "Petrus", color: "#2F7FC1", icon: "anchor", side: 1 },
  { lat: 31.778, lon: 35.235, place: "Golgatha", person: "Jerusalem", color: "#C0392B", icon: "plus", side: -1 },
];
const ROUTE: [number, number][] = [
  [30.55, 32.3], [29.6, 32.75], [28.55, 33.97], [29.55, 34.95], [30.7, 35.35], [31.95, 35.56],
  [32.35, 35.5], [32.7, 35.3], [32.88, 35.57], [32.75, 35.0], [32.2, 34.98], [31.778, 35.235],
];

const DUR = 9000;
const T = { drawA: 0.05, drawB: 0.46, zoomA: 0.5, zoomB: 0.62, panA: 0.63, panB: 0.78, scrollA: 0.77, scrollB: 0.88, textA: 0.84, textB: 0.93 };

/** Catmull-Rom-Kurve → dichte Punktfolge (für exakte Pfadlänge und den Wanderer). */
function sample(pts: [number, number][], per = 18) {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Lade-Animation beim App-Start: Reise durch Israel bis zum Kreuz, Blick zum Himmel, Schriftrolle „BIBLIA“. */
export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const { width: vw, height: vh } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 0.9 : 0);
  const fade = useSharedValue(1);

  // Projektion: Längengrade 31.6–36.0 füllen die Breite, Jerusalem etwas unter der Mitte.
  const geoP = useMemo(() => {
    const cos = Math.cos((31 * Math.PI) / 180);
    const ppd = vw / (4.6 * cos);
    const lonC = 34.45, latC = 31.15;
    const P = (lat: number, lon: number) => ({ x: (lon - lonC) * ppd * cos + vw / 2, y: (latC - lat) * ppd + vh * 0.5 });
    const vis = (r: Ring) => r.some(([lo, la]) => la > 25 && la < 37 && lo > 28 && lo < 40);
    const d = (r: Ring, close: boolean) => r.map(([lo, la], i) => { const p = P(la, lo); return `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join("") + (close ? "Z" : "");
    const pts = sample(ROUTE.map(([la, lo]) => { const p = P(la, lo); return [p.x, p.y] as [number, number]; }));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    const stops = STOPS.map((s) => {
      const p = P(s.lat, s.lon);
      let best = 0, bd = Infinity;
      pts.forEach(([x, y], i) => { const dd = Math.hypot(x - p.x, y - p.y); if (dd < bd) { bd = dd; best = i; } });
      return { ...s, ...p, f: cum[best] / L };
    });
    return {
      land: GEO.land.filter(vis).map((r) => d(r, true)).join(" "),
      rivers: GEO.rivers.filter((r) => vis(r.pts)).map((r) => d(r.pts, false)).join(" "),
      lakes: GEO.lakes.filter((r) => vis(r.pts)).map((r) => d(r.pts, true)).join(" "),
      route: pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(""),
      xs: pts.map((p) => p[0]), ys: pts.map((p) => p[1]), cum: cum.map((c) => c / L), L, stops, P,
      jer: P(31.778, 35.235),
    };
  }, [vw, vh]);

  useEffect(() => {
    const finish = () => onDone();
    t.set(withTiming(1, { duration: reduced ? 1200 : DUR, easing: Easing.linear }));
    fade.set(withDelay((reduced ? 1200 : DUR) + 900, withTiming(0, { duration: 600 }, (ok) => { if (ok) scheduleOnRN(finish); })));
  }, [t, fade, reduced, onDone]);

  const skip = () => fade.set(withTiming(0, { duration: 350 }, (ok) => { if (ok) scheduleOnRN(onDone); }));

  const { jer, L } = geoP;
  const world = useAnimatedStyle(() => {
    const p = interpolate(t.value, [T.panA, T.panB], [0, 1], Extrapolation.CLAMP);
    const e = p * p * (3 - 2 * p);
    return { transform: [{ translateY: -vh + e * vh }] };
  });
  const camera = useAnimatedStyle(() => {
    const p = interpolate(t.value, [T.zoomA, T.zoomB], [0, 1], Extrapolation.CLAMP);
    const e = p * p * (3 - 2 * p);
    return { transform: [{ translateX: (vw / 2 - jer.x) * e }, { translateY: (vh * 0.62 - jer.y) * e }, { scale: 1 + 1.1 * e }] };
  });
  const draw = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - interpolate(t.value, [T.drawA, T.drawB], [0, 1], Extrapolation.CLAMP)) }));
  const walker = useAnimatedStyle(() => {
    const f = interpolate(t.value, [T.drawA, T.drawB], [0, 1], Extrapolation.CLAMP);
    const c = geoP.cum;
    let i = 1;
    while (i < c.length - 1 && c[i] < f) i++;
    const k = c[i] === c[i - 1] ? 0 : (f - c[i - 1]) / (c[i] - c[i - 1]);
    const x = geoP.xs[i - 1] + (geoP.xs[i] - geoP.xs[i - 1]) * k;
    const y = geoP.ys[i - 1] + (geoP.ys[i] - geoP.ys[i - 1]) * k;
    return { opacity: interpolate(t.value, [T.drawA, T.drawA + 0.02, T.drawB, T.drawB + 0.03], [0, 1, 1, 0], Extrapolation.CLAMP), transform: [{ translateX: x - 9 }, { translateY: y - 9 }] };
  });
  const root = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, root]} testID="intro-animation">
      <Animated.View style={[{ width: vw, height: vh * 2 }, world]}>
        <Sky vw={vw} vh={vh} t={t} />
        {/* Landkarte (untere Hälfte) */}
        <View style={{ width: vw, height: vh, overflow: "hidden" }}>
          <Animated.View style={[{ width: vw, height: vh, transformOrigin: `${jer.x}px ${jer.y}px` }, camera]}>
            <Svg width={vw} height={vh}>
              <Defs>
                <LinearGradient id="route" x1="0" y1={vh} x2="0" y2="0" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#E0662E" />
                  <Stop offset="0.5" stopColor="#D9A23A" />
                  <Stop offset="1" stopColor="#3FA36B" />
                </LinearGradient>
                <RadialGradient id="jerGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={PAL.gold} stopOpacity={0.9} />
                  <Stop offset="1" stopColor={PAL.gold} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width={vw} height={vh} fill={PAL.sea} />
              <Path d={geoP.land} fill={PAL.seaDeep} stroke={PAL.seaDeep} strokeWidth={5} strokeLinejoin="round" />
              <Path d={geoP.land} fill={PAL.land} />
              <Landscape P={geoP.P} />
              <Path d={geoP.rivers} stroke={PAL.river} strokeWidth={2.5} fill="none" strokeLinecap="round" />
              <Path d={geoP.lakes} fill={PAL.river} />
              <AnimatedPath d={geoP.route} stroke={PAL.white} strokeOpacity={0.8} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L} ${L}`} animatedProps={draw} />
              <AnimatedPath d={geoP.route} stroke="url(#route)" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L} ${L}`} animatedProps={draw} />
            </Svg>
            <Animated.View style={[styles.walker, walker]}>
              <View style={styles.walkerCore} />
            </Animated.View>
            {geoP.stops.map((s) => <StopMarker key={s.place} s={s} t={t} />)}
            <Cross x={jer.x} y={jer.y} t={t} />
          </Animated.View>
          {/* Übergang zum Himmel */}
          <Svg width={vw} height={220} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="fadeTop" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={PAL.horizon} stopOpacity={1} />
                <Stop offset="1" stopColor={PAL.horizon} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width={vw} height={220} fill="url(#fadeTop)" />
          </Svg>
        </View>
      </Animated.View>
      <Pressable onPress={skip} style={[styles.skip, { top: insets.top + 12 }]} testID="intro-skip-button" accessibilityLabel="Intro überspringen">
        <Text style={styles.skipText}>Überspringen</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Farbige Landschaft: Wüsten, fruchtbares Land, Berge. */
function Landscape({ P }: { P: (lat: number, lon: number) => { x: number; y: number } }) {
  const blobs: [number, number, number, string][] = [
    [29.3, 33.8, 40, PAL.desert], [30.4, 34.7, 26, PAL.desert], [30.0, 31.2, 28, PAL.green], [32.8, 35.35, 18, PAL.green], [32.3, 35.1, 14, PAL.green], [31.0, 37.0, 50, PAL.desert],
  ];
  const mounts: [number, number][] = [[28.55, 33.97], [31.77, 35.73], [33.4, 35.85], [32.73, 35.05], [29.0, 34.6]];
  return (
    <G>
      {blobs.map(([la, lo, r, c], i) => { const p = P(la, lo); return <Circle key={i} cx={p.x} cy={p.y} r={r} fill={c} fillOpacity={0.55} />; })}
      {mounts.map(([la, lo], i) => {
        const p = P(la, lo);
        return (
          <G key={"m" + i}>
            <Path d={`M${p.x - 14} ${p.y + 6} L${p.x} ${p.y - 12} L${p.x + 14} ${p.y + 6} Z`} fill="#B98B5A" stroke={PAL.ink} strokeOpacity={0.4} />
            <Path d={`M${p.x - 4.5} ${p.y - 6} L${p.x} ${p.y - 12} L${p.x + 4.5} ${p.y - 6} Z`} fill={PAL.white} />
          </G>
        );
      })}
    </G>
  );
}

/** Kleine Figur im Gewand (Kopf, Kopftuch, Gewand). */
function Person({ color, size = 22, lookUp = false }: { color: string; size?: number; lookUp?: boolean }) {
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 20 25">
      <Path d="M4 25 Q4 12 10 11 Q16 12 16 25 Z" fill={color} stroke={PAL.ink} strokeWidth={0.8} />
      <Path d="M6 15 L10 25 L14 15" fill="none" stroke={PAL.white} strokeOpacity={0.5} strokeWidth={0.8} />
      <Circle cx={lookUp ? 11 : 10} cy={lookUp ? 6.5 : 7} r={3.6} fill="#E9B98A" stroke={PAL.ink} strokeWidth={0.6} />
      <Path d={lookUp ? "M7 6 Q11 0.5 15 5 L14 9 Q11 4 8 9 Z" : "M6 7 Q10 1 14 7 L14 11 Q10 6 6 11 Z"} fill={PAL.white} stroke={PAL.ink} strokeWidth={0.5} />
    </Svg>
  );
}

type StopT = (typeof STOPS)[number] & { x: number; y: number; f: number };

function StopMarker({ s, t }: { s: StopT; t: SharedValue<number> }) {
  const at = T.drawA + s.f * (T.drawB - T.drawA);
  const last = false;
  const style = useAnimatedStyle(() => {
    const p = interpolate(t.value, [at - 0.01, at + 0.03], [0, 1], Extrapolation.CLAMP);
    const back = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2); // easeOutBack
    const out = last ? 1 : interpolate(t.value, [T.zoomA, T.zoomA + 0.05], [1, 0], Extrapolation.CLAMP);
    return { opacity: Math.min(1, p * 2) * out, transform: [{ scale: p <= 0 ? 0.01 : back }] };
  });
  const left = s.side < 0;
  return (
    <Animated.View style={[styles.stop, { left: s.x - 13, top: s.y - 13 }, style]}>
      <View style={[styles.medal, { backgroundColor: s.color }]}>
        <Icon name={s.icon} size={13} color={PAL.white} />
      </View>
      <View style={[styles.tag, left ? { right: 30, flexDirection: "row-reverse" } : { left: 30 }]}>
        <Person color={s.color} size={18} />
        <View style={styles.tagText}>
          <Text style={styles.tagPlace} numberOfLines={1}>{s.place}</Text>
          <Text style={styles.tagPerson} numberOfLines={1}>{s.person}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/** Hügel Golgatha mit Kreuz; eine Figur am Fuß blickt zum Himmel. */
function Cross({ x, y, t }: { x: number; y: number; t: SharedValue<number> }) {
  const rise = useAnimatedStyle(() => {
    const p = interpolate(t.value, [T.zoomA + 0.02, T.zoomB], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: (1 - p) * 14 }] };
  });
  const glow = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [T.zoomB - 0.02, T.panA + 0.04], [0, 1], Extrapolation.CLAMP) }));
  return (
    <Animated.View style={[styles.cross, { left: x - 40, top: y - 62 }, rise]}>
      <Animated.View style={[StyleSheet.absoluteFill, glow]}>
        <Svg width={80} height={80}>
          <Defs>
            <RadialGradient id="cg" cx="50%" cy="40%" r="50%">
              <Stop offset="0" stopColor={PAL.gold} stopOpacity={0.95} />
              <Stop offset="1" stopColor={PAL.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={80} height={80} fill="url(#cg)" />
        </Svg>
      </Animated.View>
      <Svg width={80} height={80} style={StyleSheet.absoluteFill}>
        <Path d="M6 80 Q40 52 74 80 Z" fill="#9C7A4E" />
        <Rect x={37.5} y={14} width={5} height={56} rx={1} fill={PAL.cross} />
        <Rect x={26} y={26} width={28} height={4.5} rx={1} fill={PAL.cross} />
      </Svg>
      <View style={styles.looker}><Person color="#2F7FC1" size={13} lookUp /></View>
      <View style={styles.crossTag}><Text style={styles.tagPlace}>Golgatha</Text><Text style={styles.tagPerson}>Jerusalem</Text></View>
    </Animated.View>
  );
}

/** Himmel (obere Hälfte): Lichtstrahlen, Schein, Schriftrolle mit „BIBLIA“. */
function Sky({ vw, vh, t }: { vw: number; vh: number; t: SharedValue<number> }) {
  const cx = vw / 2, cy = vh * 0.44;
  const rays = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [T.panA + 0.04, T.scrollA + 0.04], [0, 0.9], Extrapolation.CLAMP),
    transform: [{ rotate: `${t.value * 50}deg` }],
  }));
  const glow = useAnimatedStyle(() => {
    const p = interpolate(t.value, [T.panB - 0.04, T.scrollB], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ scale: 0.6 + 0.5 * p }] };
  });
  const open = (v: number) => {
    "worklet";
    const p = interpolate(v, [T.scrollA, T.scrollB], [0, 1], Extrapolation.CLAMP);
    return 1 - Math.pow(1 - p, 3);
  };
  const W = Math.min(vw - 56, 340);
  const paper = useAnimatedStyle(() => ({ width: 8 + (W - 8) * open(t.value), opacity: interpolate(t.value, [T.scrollA - 0.02, T.scrollA + 0.01], [0, 1], Extrapolation.CLAMP) }));
  const rollL = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [T.scrollA - 0.03, T.scrollA], [0, 1], Extrapolation.CLAMP), transform: [{ translateX: -((W - 8) / 2) * open(t.value) }] }));
  const rollR = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [T.scrollA - 0.03, T.scrollA], [0, 1], Extrapolation.CLAMP), transform: [{ translateX: ((W - 8) / 2) * open(t.value) }] }));
  const text = useAnimatedStyle(() => {
    const p = interpolate(t.value, [T.textA, T.textB], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: (1 - p) * 8 }, { scale: 0.94 + 0.06 * p }] };
  });
  const R = Math.max(vw, vh);
  return (
    <View style={{ width: vw, height: vh, overflow: "hidden" }}>
      <Svg width={vw} height={vh} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={PAL.skyTop} />
            <Stop offset="0.45" stopColor={PAL.skyMid} />
            <Stop offset="0.8" stopColor={PAL.skyLow} />
            <Stop offset="1" stopColor={PAL.horizon} />
          </LinearGradient>
        </Defs>
        <Rect width={vw} height={vh} fill="url(#sky)" />
        {[[0.12, 0.08], [0.3, 0.15], [0.7, 0.06], [0.86, 0.18], [0.55, 0.12], [0.2, 0.28], [0.92, 0.32]].map(([x, y], i) => (
          <Circle key={i} cx={x * vw} cy={y * vh} r={i % 3 ? 1.4 : 2.2} fill={PAL.white} fillOpacity={0.8} />
        ))}
        {[[0.15, 0.7, 70], [0.78, 0.62, 90], [0.45, 0.84, 110]].map(([x, y, w], i) => (
          <G key={"c" + i} opacity={0.55}>
            <Circle cx={x * vw} cy={y * vh} r={w * 0.35} fill={PAL.white} />
            <Circle cx={x * vw + w * 0.35} cy={y * vh + 6} r={w * 0.28} fill={PAL.white} />
            <Circle cx={x * vw - w * 0.35} cy={y * vh + 8} r={w * 0.24} fill={PAL.white} />
          </G>
        ))}
      </Svg>
      <Animated.View style={[styles.abs, { left: cx - R, top: cy - R, width: R * 2, height: R * 2 }, rays]}>
        <Svg width={R * 2} height={R * 2}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const b = a + 0.09;
            return <Path key={i} d={`M${R} ${R} L${R + Math.cos(a) * R} ${R + Math.sin(a) * R} L${R + Math.cos(b) * R} ${R + Math.sin(b) * R} Z`} fill={PAL.horizon} fillOpacity={0.22} />;
          })}
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.abs, { left: cx - 200, top: cy - 200, width: 400, height: 400 }, glow]}>
        <Svg width={400} height={400}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={PAL.white} stopOpacity={0.95} />
              <Stop offset="0.35" stopColor={PAL.gold} stopOpacity={0.6} />
              <Stop offset="1" stopColor={PAL.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={200} cy={200} r={200} fill="url(#halo)" />
        </Svg>
      </Animated.View>
      {/* Schriftrolle */}
      <View style={[styles.abs, { left: 0, right: 0, top: cy - 75, height: 150, alignItems: "center", justifyContent: "center" }]}>
        <Animated.View style={[styles.paper, paper]}>
          <Animated.View style={[styles.paperInner, { width: W }, text]}>
            <Text style={styles.title}>BIBLIA</Text>
            <View style={styles.rule} />
            <Text style={styles.subtitle}>Die Reise durch Gottes Wort</Text>
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.roller, rollL]}><View style={styles.knobTop} /><View style={styles.knobBottom} /></Animated.View>
        <Animated.View style={[styles.roller, rollR]}><View style={styles.knobTop} /><View style={styles.knobBottom} /></Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: PAL.skyTop, overflow: "hidden", zIndex: 1000 },
  abs: { position: "absolute", pointerEvents: "none" },
  walker: { position: "absolute", left: 0, top: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(255,226,160,0.55)", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  walkerCore: { width: 9, height: 9, borderRadius: 5, backgroundColor: PAL.white, borderWidth: 2, borderColor: PAL.gold },
  stop: { position: "absolute", width: 26, height: 26, pointerEvents: "none" },
  medal: { width: 26, height: 26, borderRadius: 13, borderWidth: 2.5, borderColor: PAL.white, alignItems: "center", justifyContent: "center", boxShadow: "0px 2px 4px rgba(0,0,0,0.35)" },
  tag: { position: "absolute", top: -6, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  tagText: { backgroundColor: "rgba(255,248,232,0.92)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(74,52,32,0.25)" },
  tagPlace: { fontFamily: fonts.display, fontSize: 11.5, fontWeight: "700", color: PAL.ink },
  tagPerson: { fontFamily: fonts.text, fontSize: 9.5, fontWeight: "800", color: "#7A5A3A" },
  cross: { position: "absolute", width: 80, height: 80, pointerEvents: "none" },
  crossTag: { position: "absolute", top: 82, alignSelf: "center", alignItems: "center", backgroundColor: "rgba(255,248,232,0.92)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  looker: { position: "absolute", left: 50, top: 58 },
  paper: { height: 128, backgroundColor: PAL.parchment, alignItems: "center", justifyContent: "center", overflow: "hidden", borderTopWidth: 3, borderBottomWidth: 3, borderColor: "#E2C98F", boxShadow: "0px 6px 18px rgba(80,40,0,0.35)" },
  paperInner: { alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 44, fontWeight: "700", color: PAL.ink, letterSpacing: 8 },
  rule: { width: 120, height: 2, backgroundColor: PAL.gold, marginVertical: 6, borderRadius: 1 },
  subtitle: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: "#7A5A3A", letterSpacing: 1 },
  roller: { position: "absolute", width: 18, height: 150, borderRadius: 9, backgroundColor: PAL.roller, borderWidth: 2, borderColor: PAL.rollerDark, pointerEvents: "none" },
  knobTop: { position: "absolute", top: -8, left: 1, width: 12, height: 10, borderRadius: 5, backgroundColor: PAL.rollerDark },
  knobBottom: { position: "absolute", bottom: -8, left: 1, width: 12, height: 10, borderRadius: 5, backgroundColor: PAL.rollerDark },
  skip: { position: "absolute", right: 16, paddingHorizontal: 14, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  skipText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: PAL.white },
});
