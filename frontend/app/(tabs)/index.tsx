import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GeoMap } from "@/src/components/GeoMap";
import { Icon } from "@/src/components/Icon";
import { PlaceSheet } from "@/src/components/PlaceSheet";
import { RefText } from "@/src/components/RefText";
import { Sheet } from "@/src/components/Sheet";
import { Button, Chip, ProgressBar } from "@/src/components/ui";
import { ZoomableMap } from "@/src/components/ZoomableMap";
import { CAMPAIGNS } from "@/src/data/john";
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
  const [theme, setTheme] = useState("overview");
  const [place, setPlace] = useState<GeoPlace | null>(null);
  const [route, setRoute] = useState<GeoRoute | null>(null);
  const [open, setOpen] = useState(false);
  const [cardH, setCardH] = useState(120);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const lvl = levelInfo(state.xp);

  const map = THEME_MAPS[theme];
  const size = mapSize(map);
  const k = Math.min(3.2, Math.max(0.8, 1 / Math.min(vw / size.width, vh / size.height)));
  const world = WORLDS.find((w) => w.id === theme);
  const accent = world?.palette.base ?? colors.brandPrimary;

  const progress = useMemo(() => {
    const c = CAMPAIGNS.john;
    return c.stations.filter((s) => state.stations[s.id]).length / c.stations.length;
  }, [state.stations]);

  return (
    <View style={styles.root} testID="world-map-screen">
      <Animated.View key={theme} entering={FadeIn.duration(500)} style={{ flex: 1 }}>
        <ZoomableMap fit="contain" width={size.width} height={size.height} controlsBottom={bottomChrome + cardH + 24} maxZoom={5} testID="world-map">
          <GeoMap map={map} k={k} onSelect={setPlace} />
        </ZoomableMap>
      </Animated.View>

      {/* Sticky Kopfbereich: Stufe + Themen */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.hud} pointerEvents="box-none">
          <Pressable style={styles.pill} testID="hud-level-pill" onPress={() => router.push("/profile")} accessibilityLabel={`Stufe ${lvl.level}, ${state.xp} Erfahrungspunkte`}>
            <View style={styles.lvl}><Text style={styles.lvlText}>{lvl.level}</Text></View>
            <View style={{ width: 110 }}>
              <Text style={styles.pillTitle} numberOfLines={1}>{lvl.name}</Text>
              <ProgressBar value={lvl.progress} height={5} />
            </View>
          </Pressable>
          <Pressable style={styles.round} testID="hud-settings-button" onPress={() => router.push("/settings")} accessibilityLabel="Einstellungen">
            <Icon name="settings" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {THEMES.map((t) => (
            <Chip key={t.id} testID={`theme-chip-${t.id}`} label={t.title} selected={theme === t.id} color={WORLDS.find((w) => w.id === t.id)?.palette.base} onPress={() => { setTheme(t.id); setOpen(false); }} />
          ))}
        </ScrollView>
      </View>

      {/* Info-Karte zum Thema */}
      <Animated.View key={"card" + theme} entering={FadeInDown.duration(350)} onLayout={(e) => setCardH(e.nativeEvent.layout.height)} style={[styles.card, { bottom: bottomChrome + 12, borderTopColor: accent }]} testID="theme-card">
        <Pressable onPress={() => setOpen(!open)} style={styles.cardHead} testID="theme-card-toggle" accessibilityLabel="Details ein- oder ausblenden">
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{map.title}</Text>
            <Text style={styles.cardEra} numberOfLines={open ? 3 : 1}>{map.era}</Text>
          </View>
          <Icon name={open ? "chevron-down" : "chevron-up"} size={22} color={colors.onSurface} />
        </Pressable>
        {open ? (
          <ScrollView style={{ maxHeight: vh * 0.36 }} contentContainerStyle={{ gap: spacing.sm }}>
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
            label={world.status === "playable" ? `Johannes-Kampagne · ${Math.round(progress * 100)} %` : "Lernwelt-Vorschau"}
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
  top: { position: "absolute", left: 0, right: 0, top: 0 },
  hud: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
  pill: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.glass, borderRadius: radius.pill, paddingVertical: 6, paddingLeft: 6, paddingRight: spacing.lg, borderWidth: 1, borderColor: c.border },
  lvl: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  lvlText: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onBrandPrimary },
  pillTitle: { fontFamily: fonts.display, fontSize: 14, fontWeight: "700", color: c.onSurface, marginBottom: 3 },
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
