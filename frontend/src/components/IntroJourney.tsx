import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { INTRO_SCENES, MOOD_STYLE } from "@/src/data/introScenes";
import { fonts, radius, spacing } from "@/src/theme";

export const INTRO_DONE_KEY = "biblia.introJourney.done";
const POS_KEY = "biblia.introJourney.pos";
const SCENE_MS = 11000;
const FADE_MS = 700;
const N = INTRO_SCENES.length;
// Schwache Geräte (ältere Android-Versionen) bekommen keine Kamerafahrt.
const LOW_END = Platform.OS === "android" && typeof Platform.Version === "number" && Platform.Version < 29;

/** Ein Szenenbild mit sanfter Kamerafahrt (Ken Burns). Text liegt NICHT auf der bewegten Ebene. */
function SceneImage({ index, active, motion, topPad }: { index: number; active: boolean; motion: boolean; topPad: number }) {
  const op = useSharedValue(active ? 1 : 0);
  const k = useSharedValue(0);
  useEffect(() => {
    op.value = withTiming(active ? 1 : 0, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) });
    if (active && motion) { k.value = 0; k.value = withTiming(1, { duration: SCENE_MS + FADE_MS, easing: Easing.linear }); }
    else if (!active) { cancelAnimation(k); }
  }, [active, motion, op, k]);
  const dir = index % 2 === 0 ? 1 : -1;
  const st = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: motion ? [{ scale: 1.04 + 0.06 * k.value }, { translateX: dir * (10 - 20 * k.value) }] : [{ scale: 1.04 }],
  }));
  const sc = INTRO_SCENES[index];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, st, { pointerEvents: "none" }]}>
      {/* Hintergrund: dasselbe Bild weichgezeichnet füllt den Bildschirm; Vordergrund zeigt die volle Komposition ohne Beschnitt */}
      <Image source={sc.image} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={18} transition={0} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(20,14,8,0.35)" }]} />
      <Image source={sc.image} style={[StyleSheet.absoluteFill, { top: topPad }]} contentFit="contain" contentPosition="top" transition={0} priority={active ? "high" : "normal"} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: MOOD_STYLE[sc.mood].veil }]} />
    </Animated.View>
  );
}

/** Intro „Reise bis zum Kreuz“: 15 Szenen, selbst blättern, pausieren, überspringen; Fortsetzung nach Unterbrechung. */
export function IntroJourney({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sysReduced = useReducedMotion();
  const [reduced, setReduced] = useState(sysReduced);
  const [i, setI] = useState(-1); // -1 = Titelkarte
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const motion = !reduced && !LOW_END;

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then((r) => setReduced(r || sysReduced)); }, [sysReduced]);
  useEffect(() => { AsyncStorage.getItem(POS_KEY).then((v) => { const n = Number(v); if (v && n >= 0 && n < N) setI(n); }); }, []);
  useEffect(() => { if (i >= 0) AsyncStorage.setItem(POS_KEY, String(i)); }, [i]);
  // App im Hintergrund → pausieren
  useEffect(() => { const s = AppState.addEventListener("change", (st) => { if (st !== "active") setPlaying(false); }); return () => s.remove(); }, []);

  const close = useCallback(async () => {
    await AsyncStorage.multiSet([[INTRO_DONE_KEY, "1"], [POS_KEY, "-1"]]);
    onClose();
  }, [onClose]);
  const go = useCallback((n: number) => { if (n >= N) { close(); return; } setI(Math.max(-1, n)); }, [close]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (playing && i >= 0) timer.current = setTimeout(() => go(i + 1), SCENE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [i, playing, go]);

  const sc = i >= 0 ? INTRO_SCENES[i] : null;
  const accent = sc ? MOOD_STYLE[sc.mood].accent : "#E8B86A";
  const wide = width > height;
  const panelW = Math.min(width - spacing.lg * 2, 620);

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} testID="intro-journey">
      {/* Nur aktuelle, vorige und nächste Szene sind montiert → Vorladen ohne Speicherballast */}
      {INTRO_SCENES.map((_, n) => (Math.abs(n - Math.max(0, i)) <= 1 ? <SceneImage key={n} index={n} topPad={wide ? 0 : insets.top + 52} active={n === i || (i === -1 && n === 0)} motion={motion && i >= 0} /> : null))}
      <LinearGradient colors={["rgba(20,14,8,0.55)", "rgba(20,14,8,0)", "rgba(20,14,8,0.15)", "rgba(20,14,8,0.88)"]} locations={[0, 0.22, 0.5, 1]} style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]} />

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.dots} accessibilityLabel={sc ? `Szene ${i + 1} von ${N}` : "Titel"} testID="intro-progress">
          {INTRO_SCENES.map((s, n) => <View key={s.id} style={[styles.dot, { backgroundColor: n <= i ? accent : "rgba(255,255,255,0.35)", flex: 1 }]} />)}
        </View>
        <Pressable onPress={close} style={styles.skip} testID="intro-journey-skip" accessibilityRole="button" accessibilityLabel="Intro überspringen">
          <Text style={styles.skipText}>Überspringen</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={[styles.panel, { width: panelW, maxHeight: height * (wide ? 0.62 : 0.5) }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {sc ? (
              <View key={sc.id} testID={`intro-scene-${sc.id}`}>
                <Text style={[styles.count, { color: accent }]}>{i + 1} / {N}</Text>
                <Text style={styles.title} testID="scene-title-text">{sc.title}</Text>
                <Text style={styles.text}>{sc.text}</Text>
                <View style={styles.refs}>{sc.refs.map((r) => <View key={r} style={[styles.ref, { borderColor: accent }]}><Text style={[styles.refText, { color: accent }]}>{r}</Text></View>)}</View>
                {sc.note ? <Text style={styles.note}>Hinweis: {sc.note}</Text> : null}
              </View>
            ) : (
              <View testID="intro-title-card">
                <Text style={[styles.count, { color: accent }]}>BIBLIA · by Absole</Text>
                <Text style={styles.title}>Die Reise bis zum Kreuz</Text>
                <Text style={styles.text}>Fünfzehn Stationen aus dem Leben Jesu – von Bethlehem bis zum leeren Grab.</Text>
                <Text style={styles.note}>Zusammenfassende Darstellung nach den vier Evangelien. Die Evangelien erzählen manches in anderer Reihenfolge; Hinweise dazu stehen bei den Szenen. Die Texte sind Nacherzählungen, keine Zitate. Bilder: KI-generierte künstlerische Rekonstruktion.</Text>
              </View>
            )}
          </ScrollView>
        </View>
        <View style={styles.controls}>
          <Ctl icon="chevron-left" label="Zurück" testID="intro-prev" disabled={i < 0} onPress={() => go(i - 1)} />
          {i >= 0 ? <Ctl icon={playing ? "pause" : "play"} label={playing ? "Pausieren" : "Abspielen"} testID="intro-play" onPress={() => setPlaying((p) => !p)} /> : null}
          <Ctl icon={i === N - 1 ? "check" : "chevron-right"} label={i < 0 ? "Reise beginnen" : i === N - 1 ? "Abschließen" : "Weiter"} testID="intro-next" primary accent={accent} onPress={() => go(i + 1)} />
        </View>
      </View>
    </View>
  );
}

function Ctl({ icon, label, onPress, testID, disabled, primary, accent }: { icon: string; label: string; onPress: () => void; testID: string; disabled?: boolean; primary?: boolean; accent?: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} testID={testID} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => [styles.ctl, primary && { backgroundColor: accent, paddingHorizontal: spacing.lg }, disabled && { opacity: 0.35 }, pressed && { opacity: 0.8 }]}>
      <Icon name={icon} size={20} color={primary ? "#2A1D0E" : "#FFFFFF"} />
      {primary ? <Text style={styles.ctlText}>{label}</Text> : null}
    </Pressable>
  );
}

/** Route /intro: Wiederholung aus den Einstellungen. */
export function IntroRoute() {
  const router = useRouter();
  return <IntroJourney onClose={() => (router.canGoBack() ? router.back() : router.replace("/"))} />;
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#140E08", zIndex: 50 },
  top: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg },
  dots: { flex: 1, flexDirection: "row", gap: 3 },
  dot: { height: 3, borderRadius: 2 },
  skip: { minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: "rgba(0,0,0,0.38)", justifyContent: "center" },
  skipText: { color: "#FFFFFF", fontFamily: fonts.text, fontWeight: "800", fontSize: 14 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: spacing.md },
  panel: { backgroundColor: "rgba(24,17,10,0.72)", borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  count: { fontFamily: fonts.text, fontSize: 12, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: fonts.display, fontSize: 26, fontWeight: "700", color: "#FFF8EC", marginTop: 4 },
  text: { fontFamily: fonts.text, fontSize: 16.5, lineHeight: 24, color: "#F5EBDD", marginTop: spacing.sm },
  refs: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.md },
  ref: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  refText: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800" },
  note: { fontFamily: fonts.text, fontSize: 13, lineHeight: 19, color: "#D9CCB8", marginTop: spacing.md, fontStyle: "italic" },
  controls: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  ctl: { minWidth: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  ctlText: { fontFamily: fonts.text, fontWeight: "900", fontSize: 15, color: "#2A1D0E" },
});
