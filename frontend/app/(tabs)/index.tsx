import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvatarView } from "@/src/components/AvatarView";
import { GeoMap, placesBox } from "@/src/components/GeoMap";
import { VerseOfDay } from "@/src/components/VerseOfDay";
import { Icon } from "@/src/components/Icon";
import { StudyJourneyCards } from "@/src/components/StudyJourneyCards";
import { JourneyLayer } from "@/src/components/JourneyLayer";
import { PlaceSheet } from "@/src/components/PlaceSheet";
import { RefText } from "@/src/components/RefText";
import { Sheet } from "@/src/components/Sheet";
import { Button, Chip } from "@/src/components/ui";
import { ZoomableMap } from "@/src/components/ZoomableMap";
import { worldProgress } from "@/src/data/john";
import { GENERIC_ART, SPRITES } from "@/src/data/atlasAssets";
import { CERTAINTY_META } from "@/src/data/meta";
import { PLACE_FILTERS, PlaceFilter, PlaceKind } from "@/src/data/placeKinds";
import { GeoPlace, GeoRoute, mapSize, THEME_MAPS } from "@/src/data/themeMaps";
import { WORLDS } from "@/src/data/worlds";
import { levelInfo } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const LEGEND_KINDS: [PlaceKind, string][] = [["city", "Stadt"], ["sacred", "Heiliger Ort"], ["mount", "Berg"], ["desert", "Wüste / Oase"], ["water", "Am Wasser"]];

const THEMES = [{ id: "overview", title: "Übersicht", icon: "map" }, ...WORLDS.map((w) => ({ id: w.id, title: w.title.replace("Die ", ""), icon: w.icon }))];

export default function WorldMapScreen() {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: vw, height: vh } = useWindowDimensions();
  const { state } = useProgress();
  const params = useLocalSearchParams<{ theme?: string; place?: string }>();
  const [theme, setTheme] = useState("overview");
  const [mode, setMode] = useState<"explore" | "journey">("explore");
  const [journeyMap, setJourneyMap] = useState(false);
  const [place, setPlace] = useState<GeoPlace | null>(null);
  const [route, setRoute] = useState<GeoRoute | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<PlaceFilter>("all");
  const [showRoutes, setShowRoutes] = useState(true);
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
  const cards = journey && !journeyMap;
  const map = journey ? THEME_MAPS.journey : THEME_MAPS[theme];
  const size = mapSize(map);
  const k = Math.min(3.2, Math.max(0.8, 1 / Math.min(vw / size.width, vh / size.height)));
  const world = journey ? undefined : WORLDS.find((w) => w.id === theme);
  const accent = world?.palette.base ?? colors.brandPrimary;

  // Überblick startet beim Kernland (Galiläa bis Negev); „Zurücksetzen“ zeigt die ganze Karte
  const initial = useMemo(() => (!journey && theme === "overview" ? placesBox(map, ["capernaum", "caesarea", "joppa", "jerusalem", "beersheba", "nebo", "engedi"], 0.1) : !journey ? placesBox(map, [[...map.places].sort((a, b) => (b.events?.length ?? 0) - (a.events?.length ?? 0))[0]?.id].filter(Boolean), 0.55) : undefined), [journey, theme, map]);
  const progress = useMemo(() => worldProgress(world?.campaignIds, state.stations), [world, state.stations]);

  return (
    <View style={styles.root} testID="world-map-screen">
      {!cards && <Animated.View key={journey ? "journey" : theme} entering={FadeIn.duration(500)} style={{ flex: 1 }} onLayout={(e) => setMapH(e.nativeEvent.layout.height)}>
        <ZoomableMap fit={size.width > size.height * 1.15 && vh > vw ? "cover" : "contain"} initial={initial} padTop={topH} padBottom={cardH + 16} width={size.width} height={size.height} controlsBottom={bottomChrome + cardH + 24} maxZoom={5} reserved={reserved} testID="world-map">
          <GeoMap map={map} k={k} onSelect={setPlace} selected={place?.id ?? null} filter={journey ? "all" : filter} showRoutes={journey || showRoutes}>
            {journey ? <JourneyLayer map={map} k={k} stations={state.stations} /> : null}
          </GeoMap>
        </ZoomableMap>
      </Animated.View>}

      {/* Sticky Kopfbereich: Stufe + Themen */}
      <View style={[styles.top, cards && { position: "relative", paddingBottom: spacing.sm, backgroundColor: scheme === "dark" ? "#194144" : colors.surface }, { paddingTop: insets.top + spacing.sm }]} onLayout={(e) => setTopH(e.nativeEvent.layout.height)}>
        {!cards ? (
          <View style={styles.brandRow} testID="biblia-wordmark">
            <View style={styles.brandLine} />
            <Icon name="book-open" size={18} color={colors.brandPrimary} />
            <Text style={styles.brandText}>BIBLIA</Text>
            <View style={styles.brandLine} />
          </View>
        ) : null}
        <View style={[styles.hud,cards&&vw<390&&{paddingHorizontal:8}]}>
          <Pressable style={styles.pill} testID="hud-level-pill" onPress={() => router.push("/profile")} accessibilityLabel={`Stufe ${lvl.level}, ${state.xp} Erfahrungspunkte`}>
            {state.avatar && !(cards&&vw<420) ? <View style={styles.hudAvatar} testID="hud-avatar"><AvatarView a={state.avatar} size={38} mode="head" /></View> : null}
            <View style={styles.lvl}><Text style={styles.lvlText}>{lvl.level}</Text></View>

          </Pressable>
          <View style={styles.modeSwitch}>
            {([["explore", "Übersicht", "map"], ["journey", "Studienreise", "compass"]] as const).map(([m, l, ic]) => (
              <Pressable key={m} testID={`map-mode-${m}`} onPress={() => { setMode(m); setJourneyMap(false); setOpen(false); setPlace(null); setRoute(null); }} style={[styles.modeBtn, cards&&vw<390&&{paddingHorizontal:6}, mode === m && { backgroundColor: colors.surfaceInverse }]} accessibilityState={{ selected: mode === m }}>
                <Icon name={ic} size={14} color={mode === m ? colors.onSurfaceInverse : colors.onSurface} />
                <Text style={[styles.modeText, { color: mode === m ? colors.onSurfaceInverse : colors.onSurface }]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.round} testID="hud-settings-button" onPress={() => router.push("/settings")} accessibilityLabel="Einstellungen">
            <Icon name="settings" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        {journey ? (journeyMap ? <Pressable testID="study-back-to-cards" accessibilityRole="button" style={{paddingHorizontal:16,minHeight:44,justifyContent:"center",alignSelf:"center",backgroundColor:colors.surface,borderRadius:22,borderWidth:1,borderColor:colors.brandPrimary,marginTop:8}} onPress={()=>setJourneyMap(false)}><Text style={{color:colors.onSurface,fontFamily:fonts.text}}>Zur Themenübersicht</Text></Pressable> : null) : <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {THEMES.map((t) => (
            <Chip key={t.id} testID={`theme-chip-${t.id}`} label={t.title} selected={theme === t.id} color={WORLDS.find((w) => w.id === t.id)?.palette.base} onPress={() => { setTheme(t.id); setOpen(false); setFilter("all"); }} />
          ))}
        </ScrollView>}
        {!cards && <VerseOfDay />}
      </View>

      {cards && <StudyJourneyCards onMap={()=>setJourneyMap(true)} />}
      {/* Info-Karte zum Thema */}
      {!cards && <Animated.View key={"card" + (journey ? "journey" : theme)} entering={FadeInDown.duration(350)} onLayout={(e) => setCardH(e.nativeEvent.layout.height)} style={[styles.card, { bottom: bottomChrome + 12, borderTopColor: accent }]} testID="theme-card">
        <Pressable onPress={() => setOpen(!open)} style={styles.cardHead} testID="theme-card-toggle" accessibilityLabel="Details ein- oder ausblenden">
          <Image source={SPRITES.olives.src} style={styles.cardArt} resizeMode="contain" />
          <View style={styles.cardDivider} />
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
            {!journey ? (
              <>
                <Text style={styles.sectionLabel}>Ebenen</Text>
                <View style={styles.filterWrap}>
                  {PLACE_FILTERS.map((f) => (
                    <Chip key={f.id} testID={`map-filter-${f.id}`} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
                  ))}
                  {map.routes.length ? <Chip testID="map-filter-routes" label={showRoutes ? "Routen an" : "Routen aus"} selected={showRoutes} onPress={() => setShowRoutes(!showRoutes)} /> : null}
                </View>
              </>
            ) : null}
            <Text style={styles.sectionLabel}>Zeichen</Text>
            <View style={styles.legend}>
              {LEGEND_KINDS.map(([kind, label]) => (
                <View key={kind} style={styles.legendItem}>
                  <Image source={GENERIC_ART[kind].src} style={{ width: 34, height: 34 / GENERIC_ART[kind].ratio }} resizeMode="contain" />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.mapInk }]} /><Text style={styles.legendText}>{CERTAINTY_META.secure.label}</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.mapInk, borderStyle: "dotted" }]} /><Text style={styles.legendText}>{CERTAINTY_META.traditional.label}</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.surface, borderColor: colors.mapInk }]} /><Text style={styles.legendText}>{CERTAINTY_META.disputed.label}</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.brandPrimary }]} /><Text style={styles.legendText}>mit Ereignissen</Text></View>
            </View>
            <Text style={styles.noteText}>Hauptorte erscheinen sofort, weitere Orte, Illustrationen und Namen beim Hineinzoomen. Die Ortsbilder sind künstlerische Rekonstruktionen, keine historischen Abbildungen.</Text>
            <Text style={styles.src}>Kartengrundlage: Natural Earth (gemeinfrei). Relief: AWS Terrain Tiles / Mapzen (SRTM u. a.), künstlerisch eingefärbt. Orte: OpenBible.info (CC BY 4.0), Pleiades.</Text>
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
      </Animated.View>}

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
  lvl: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: c.brandTertiary, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  lvlText: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onBrandPrimary },
  pillTitle: { fontFamily: fonts.display, fontSize: 14, fontWeight: "700", color: c.onSurface, marginBottom: 3 },
  modeSwitch: { flexDirection: "row", backgroundColor: c.glass, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: c.border },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 4, height: 38, paddingHorizontal: 10, borderRadius: radius.pill },
  modeText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800" },
  round: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.glass, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  card: { position: "absolute", left: spacing.md, right: spacing.md, backgroundColor: c.surface, borderRadius: 24, padding: spacing.md, borderWidth: 1, borderColor: c.borderStrong, borderTopWidth: 3, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
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
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginBottom: 4, pointerEvents: "none" },
  brandLine: { width: 44, height: 1.5, backgroundColor: c.brandPrimary, opacity: 0.8 },
  brandText: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", letterSpacing: 6, color: c.onSurface, textShadowColor: c.surface, textShadowRadius: 6 },
  cardArt: { width: 56, height: 36 },
  cardDivider: { width: 1, alignSelf: "stretch", marginVertical: 4, backgroundColor: c.borderStrong },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: c.surface },
  sectionLabel: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.muted, textTransform: "uppercase", letterSpacing: 1 },
  filterWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  legendText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: c.onSurfaceSecondary },
  src: { fontFamily: fonts.text, fontSize: 10, color: c.muted },
}));
