import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvatarView } from "@/src/components/AvatarView";
import { GeoMap } from "@/src/components/GeoMap";
import { VerseOfDay } from "@/src/components/VerseOfDay";
import { Icon } from "@/src/components/Icon";
import { JourneyLayer } from "@/src/components/JourneyLayer";
import { PlaceSheet } from "@/src/components/PlaceSheet";
import { RefText } from "@/src/components/RefText";
import { Sheet } from "@/src/components/Sheet";
import { Button, Chip } from "@/src/components/ui";
import { ZoomableMap } from "@/src/components/ZoomableMap";
import { worldProgress } from "@/src/data/john";
import { CERTAINTY_META } from "@/src/data/meta";
import { GeoPlace, GeoRoute, mapSize, THEME_MAPS } from "@/src/data/themeMaps";
import { WORLDS } from "@/src/data/worlds";
import { levelInfo } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const THEMES = [{ id: "overview", title: "Übersicht", icon: "map" }, ...WORLDS.map((w) => ({ id: w.id, title: w.title.replace("Die ", ""), icon: w.icon }))];

export default function WorldMapScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: vw, height: vh } = useWindowDimensions();
  const { state } = useProgress();
  const params = useLocalSearchParams<{ theme?: string; place?: string }>();
  const [theme, setTheme] = useState("overview");
  const [mode, setMode] = useState<"explore" | "journey">("explore");
  const [place, setPlace] = useState<GeoPlace | null>(null);
  const [route, setRoute] = useState<GeoRoute | null>(null);
  const [open, setOpen] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  // Sprung aus einer Infotafel: passende Karte öffnen und den Ort anzeigen
  useEffect(() => {
    if (!params.theme || !THEME_MAPS[params.theme]) return;
    setMode("explore");
    setTheme(params.theme);
    const pl = THEME_MAPS[params.theme].places.find((x) => x.id === params.place);
    if (pl) setPlace(pl);
  }, [params.theme, params.place]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const [cardH, setCardH] = useState(120);
  const [topH, setTopH] = useState(120);
  const [mapH, setMapH] = useState(0);
  // Fest eingeblendete Bereiche: dort darf keine Beschriftung liegen
  const reserved = useMemo(() => [{ x: 0, y: 0, w: vw, h: topH }, { x: 0, y: mapH - bottomChrome - cardH - 16, w: vw, h: cardH + 16 + bottomChrome }], [vw, topH, mapH, cardH, bottomChrome]);
  const lvl = levelInfo(state.xp);

  const journey = mode === "journey";
  const map = journey ? THEME_MAPS.journey : THEME_MAPS[theme];
  const size = mapSize(map);
  const k = Math.min(3.2, Math.max(0.8, 1 / Math.min(vw / size.width, vh / size.height)));
  const world = journey ? undefined : WORLDS.find((w) => w.id === theme);
  const accent = world?.palette.base ?? colors.brandPrimary;

  const progress = useMemo(() => worldProgress(world?.campaignIds, state.stations), [world, state.stations]);

  return (
    <View style={styles.root} testID="world-map-screen">
      <Animated.View key={journey ? "journey" : theme} entering={FadeIn.duration(500)} style={{ flex: 1 }} onLayout={(e) => setMapH(e.nativeEvent.layout.height)}>
        <ZoomableMap fit="contain" width={size.width} height={size.height} controlsBottom={bottomChrome + cardH + 24} maxZoom={5} reserved={reserved} testID="world-map">
          <GeoMap map={map} k={k} onSelect={setPlace}>
            {journey ? <JourneyLayer map={map} k={k} stations={state.stations} /> : null}
          </GeoMap>
        </ZoomableMap>
      </Animated.View>

      {/* Sticky Kopfbereich: Stufe + Themen */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]} onLayout={(e) => setTopH(e.nativeEvent.layout.height)}>
        <View style={styles.hud}>
          <Pressable style={styles.pill} testID="hud-level-pill" onPress={() => router.push("/profile")} accessibilityLabel={`Stufe ${lvl.level}, ${state.xp} Erfahrungspunkte`}>
            {state.avatar ? <View style={styles.hudAvatar} testID="hud-avatar"><AvatarView a={state.avatar} size={38} mode="head" /></View> : null}
            <View style={styles.lvl}><Text style={styles.lvlText}>{lvl.level}</Text></View>

          </Pressable>
          <View style={styles.modeSwitch}>
            {([["explore", "Übersicht", "map"], ["journey", "Studienreise", "compass"]] as const).map(([m, l, ic]) => (
              <Pressable key={m} testID={`map-mode-${m}`} onPress={() => { setMode(m); setOpen(false); }} style={[styles.modeBtn, mode === m && { backgroundColor: colors.surfaceInverse }]} accessibilityState={{ selected: mode === m }}>
                <Icon name={ic} size={14} color={mode === m ? colors.onSurfaceInverse : colors.onSurface} />
                <Text style={[styles.modeText, { color: mode === m ? colors.onSurfaceInverse : colors.onSurface }]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.round} testID="hud-settings-button" onPress={() => router.push("/settings")} accessibilityLabel="Einstellungen">
            <Icon name="settings" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        {journey ? <View style={styles.chipRow} /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {THEMES.map((t) => (
            <Chip key={t.id} testID={`theme-chip-${t.id}`} label={t.title} selected={theme === t.id} color={WORLDS.find((w) => w.id === t.id)?.palette.base} onPress={() => { setTheme(t.id); setOpen(false); }} />
          ))}
        </ScrollView>}
        <VerseOfDay />
      </View>

      {/* Info-Karte zum Thema */}
      <Animated.View key={"card" + (journey ? "journey" : theme)} entering={FadeInDown.duration(350)} onLayout={(e) => setCardH(e.nativeEvent.layout.height)} style={[styles.card, { bottom: bottomChrome + 12, borderTopColor: accent }]} testID="theme-card">
        <Pressable onPress={() => setOpen(!open)} style={styles.cardHead} testID="theme-card-toggle" accessibilityLabel="Details ein- oder ausblenden">
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{map.title}</Text>
            <Text style={styles.cardEra} numberOfLines={open ? 3 : 1}>{map.era}</Text>
          </View>
          <Icon name={open ? "chevron-down" : "chevron-up"} size={22} color={colors.onSurface} />
        </Pressable>
        {open ? (
          <ScrollView style={{ maxHeight: vh * 0.36 }} contentContainerStyle={{ gap: spacing.sm }}>
            {journey ? <Text style={styles.noteText}>Jedes farbige Feld ist eine Lernwelt. Tippe darauf, um die Lektionen zu öffnen. Die Felder sind symbolisch platziert; die genauen Orte findest du in der Übersicht.</Text> : null}
            {map.note ? (
              <View style={styles.note}><Icon name="alert-triangle" size={14} color={colors.warning} /><Text style={styles.noteText}>{map.note}</Text></View>
            ) : null}
            {map.routes.map((r) => (
              <Pressable key={r.id} style={styles.routeRow} onPress={() => setRoute(r)} testID={`route-${r.id}`}>
                <View style={[styles.routeLine, { backgroundColor: r.color }]} />
                <Text style={styles.routeText} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.routeTag}>{r.certainty === "hypothetical" ? "Hypothese" : r.certainty === "traditional" ? "Tradition/schematisch" : "nach Bibeltext"}</Text>
              </Pressable>
            ))}
            <View style={styles.legend}>
              {(["secure", "traditional", "disputed"] as const).map((c) => (
                <View key={c} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: c === "secure" ? colors.mapInk : c === "traditional" ? colors.brandPrimary : colors.surface, borderStyle: c === "disputed" ? "dashed" : "solid" }]} />
                  <Text style={styles.legendText}>{CERTAINTY_META[c].label}</Text>
                </View>
              ))}
              <View style={styles.legendItem}><Icon name="star" size={12} color={colors.brandPrimary} /><Text style={styles.legendText}>Ereignis</Text></View>
            </View>
            <Text style={styles.src}>Kartengrundlage: Natural Earth (gemeinfrei). Orte: OpenBible.info (CC BY 4.0), Pleiades.</Text>
          </ScrollView>
        ) : null}
        {world ? (
          <Button
            testID="world-enter-button"
            label={world.status === "playable" ? `Lernreise starten · ${Math.round(progress * 100)} %` : "Lernwelt-Vorschau"}
            icon={world.status === "playable" ? "play" : "eye"}
            variant={world.status === "playable" ? "primary" : "secondary"}
            style={{ marginTop: spacing.sm, minHeight: 46 }}
            onPress={() => router.push({ pathname: "/world/[id]", params: { id: world.id } })}
          />
        ) : null}
      </Animated.View>

      <PlaceSheet place={place} onClose={() => setPlace(null)} />
      <Sheet visible={!!route} onClose={() => setRoute(null)} title={route?.name} accent={route?.color} testID="route-sheet">
        {route ? (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.routeTag}>{route.certainty === "hypothetical" ? "HYPOTHESE – nicht historisch gesichert" : route.certainty === "traditional" ? "Traditionelle / schematische Linienführung" : "Stationen nach dem Bibeltext, Linie schematisch"}</Text>
            <Text style={styles.noteText}>{route.note}</Text>
            <RefText text={route.refs} style={styles.noteText} />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.mapSea },
  top: { position: "absolute", left: 0, right: 0, top: 0, pointerEvents: "box-none" },
  hud: { pointerEvents: "box-none", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
  pill: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.glass, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: c.border },
  hudAvatar: { width: 38, height: 38, borderRadius: 19, overflow: "hidden", backgroundColor: c.mapLand, marginRight: -6 },
  lvl: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  lvlText: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onBrandPrimary },
  pillTitle: { fontFamily: fonts.display, fontSize: 14, fontWeight: "700", color: c.onSurface, marginBottom: 3 },
  modeSwitch: { flexDirection: "row", backgroundColor: c.glass, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: c.border },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 4, height: 38, paddingHorizontal: 10, borderRadius: radius.pill },
  modeText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800" },
  round: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.glass, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  card: { position: "absolute", left: spacing.md, right: spacing.md, backgroundColor: c.glass, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border, borderTopWidth: 4 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44 },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onSurface },
  cardEra: { fontFamily: fonts.text, fontSize: 12, color: c.muted, fontWeight: "700" },
  note: { flexDirection: "row", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.warning },
  noteText: { flex: 1, fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary, lineHeight: 19 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 36 },
  routeLine: { width: 26, height: 5, borderRadius: 3 },
  routeText: { flex: 1, fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: c.onSurface },
  routeTag: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.warning },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: c.mapInk },
  legendText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: c.onSurfaceSecondary },
  src: { fontFamily: fonts.text, fontSize: 10, color: c.muted },
}));
