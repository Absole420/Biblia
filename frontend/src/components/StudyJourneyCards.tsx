// Studienreise 2.0 (aus PR #6, überarbeitet): Themenübersicht als vertikale Karten + Themendetailseite.
// Alle Zahlen kommen aus WORLDS/CAMPAIGNS und dem lokalen Fortschritt; Stations-IDs und Freischaltlogik bleiben unverändert.
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { CAMPAIGNS } from "@/src/data/john";
import { STATION_IMAGES } from "@/src/data/stationImages";
import type { World } from "@/src/data/types";
import { WORLDS } from "@/src/data/worlds";
import { stationStatus } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

/** Themenbilder (Gemini Nano Banana, 900×900, lokal). */
export const WORLD_ART: Record<string, ImageSourcePropType> = {
  tora: require("../../assets/images/worlds/world-tora.jpg"),
  history: require("../../assets/images/worlds/world-history.jpg"),
  psalms: require("../../assets/images/worlds/world-psalms.jpg"),
  prophets: require("../../assets/images/worlds/world-prophets.jpg"),
  gospels: require("../../assets/images/worlds/world-gospels.jpg"),
  parables: require("../../assets/images/worlds/world-parables.jpg"),
  acts: require("../../assets/images/worlds/world-acts.jpg"),
  letters: require("../../assets/images/worlds/world-letters.jpg"),
  revelation: require("../../assets/images/worlds/world-revelation.jpg"),
};
const SUB: Record<string, string> = { tora: "Schöpfung, Bund und Wüste", history: "Land, Richter und Könige", psalms: "Gebet, Lob und Lebensweisheit", prophets: "Gericht, Hoffnung und Visionen", gospels: "Das Leben und Wirken Jesu", parables: "Geschichten vom Reich Gottes", acts: "Die ersten Gemeinden", letters: "Glaube und Gemeindeleben", revelation: "Sendschreiben und Neues Jerusalem" };
const GOLD = "#C9A45C"; // Marken-Gold, in beiden Modi gleich
const PETROL = "#123B40"; // Dunkles Petrol für den Kopfbereich, in beiden Modi gleich

const campaignsOf = (w: World) => (w.campaignIds ?? []).map((id) => CAMPAIGNS[id]).filter(Boolean);

function useWorldProgress(w: World) {
  const { state } = useProgress();
  const stations = campaignsOf(w).flatMap((c) => c.stations);
  const done = stations.filter((st) => state.stations[st.id]).length;
  return { stations, done, pct: stations.length ? Math.round((done / stations.length) * 100) : 0, state };
}

function Progress({ pct }: { pct: number }) {
  const s = useStyles();
  return <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}><View style={[s.fill, { width: `${pct}%` }]} /></View>;
}

function WorldCard({ w }: { w: World }) {
  const s = useStyles();
  const router = useRouter();
  const { stations, done, pct } = useWorldProgress(w);
  const playable = w.status === "playable" && stations.length > 0;
  return (
    <Pressable testID={`study-world-${w.id}`} accessibilityRole="button" accessibilityLabel={`${w.title}, ${playable ? `${pct} Prozent` : "Vorschau"}`}
      onPress={() => router.push({ pathname: "/world/[id]", params: { id: w.id, view: "study" } })} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={s.thumb}><Image source={WORLD_ART[w.id]} style={s.img} resizeMode="contain" accessibilityIgnoresInvertColors /></View>
      <View style={s.cardBody}>
        <Text style={s.title} numberOfLines={2}>{w.title}</Text>
        <Text style={s.subtitle} numberOfLines={2}>{SUB[w.id] ?? w.subtitle}</Text>
        {playable ? (
          <>
            <View style={s.metaRow}><Text style={s.meta}>{stations.length} Stationen</Text><Text style={s.pct}>{pct} %</Text></View>
            <Progress pct={pct} />
            <Text style={s.small}>{done} abgeschlossen</Text>
          </>
        ) : <View style={s.badge}><Text style={s.badgeText}>Vorschau · in Arbeit</Text></View>}
      </View>
    </Pressable>
  );
}

export function StudyJourneyCards({ onMap }: { onMap: () => void }) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView testID="study-journey-cards" style={s.scroll} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 96 }]} showsVerticalScrollIndicator={false}>
      <View style={s.banner}>
        <Text style={s.bannerTitle}>Studienreise</Text>
        <Text style={s.bannerSub}>Wähle ein Themenfeld und setze deine Lernreise fort.</Text>
        <Pressable testID="study-open-map" accessibilityRole="button" onPress={onMap} style={s.mapBtn}><Icon name="map" size={16} color={GOLD} /><Text style={s.mapBtnText}>Abenteuerkarte ansehen</Text></Pressable>
      </View>
      {WORLDS.map((w) => <WorldCard key={w.id} w={w} />)}
    </ScrollView>
  );
}

export function StudyWorldDetail({ world }: { world: World }) {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stations, done, pct, state } = useWorldProgress(world);
  const campaigns = campaignsOf(world);
  const next = stations.find((st) => stationStatus(st, state.stations) === "available");
  const open = (id: string) => router.push({ pathname: "/station/[id]", params: { id } });
  const playable = world.status === "playable" && stations.length > 0;
  return (
    <View style={s.root} testID="study-world-detail">
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="study-detail-back" accessibilityRole="button" accessibilityLabel="Zurück" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={s.back}><Icon name="arrow-left" size={22} color="#F3E9D5" /></Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{world.title}</Text>
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]} style={s.scroll}>
        <View style={s.hero}><View style={{ width: "100%", aspectRatio: 1 }}><Image source={WORLD_ART[world.id]} style={s.img} resizeMode="contain" accessibilityLabel={`Themenbild: ${world.title}`} /></View></View>
        <Text style={s.heroTitle}>{world.title}</Text>
        <Text style={s.subtitle}>{SUB[world.id] ?? world.subtitle}</Text>
        <Text style={s.description}>{world.description}</Text>
        <View style={s.books}>{world.books.map((b) => <View key={b} style={s.bookChip}><Text style={s.bookText}>{b}</Text></View>)}</View>
        {playable ? (
          <>
            <View style={s.panel}>
              <View style={s.metaRow}><Text style={s.meta}>{done} von {stations.length} Stationen</Text><Text style={s.pct}>{pct} %</Text></View>
              <Progress pct={pct} />
              {next ? (
                <Pressable testID="study-continue" accessibilityRole="button" style={s.cta} onPress={() => open(next.id)}>
                  <Icon name="play" size={16} color={colors.onBrandPrimary} /><Text style={s.ctaText} numberOfLines={2}>Weiterlernen: {next.title}</Text>
                </Pressable>
              ) : <Text style={s.small}>Alle freigeschalteten Stationen sind abgeschlossen.</Text>}
              <Pressable testID="study-detail-map" accessibilityRole="button" style={s.mapRow} onPress={() => router.push({ pathname: "/world/[id]", params: { id: world.id, view: "map" } })}>
                <Icon name="map" size={18} color={colors.brandPrimary} /><Text style={s.link}>Abenteuerkarte und historische Karte</Text>
              </Pressable>
            </View>
            {campaigns.map((c) => (
              <View key={c.id} style={{ gap: spacing.sm }}>
                <Text style={s.section}>{c.title}</Text>
                {c.stations.map((st, i) => {
                  const status = stationStatus(st, state.stations);
                  const missing = st.requires.filter((id) => !state.stations[id]).map((id) => stations.find((x) => x.id === id)?.title ?? id);
                  const img = st.image ? STATION_IMAGES[st.image] : undefined;
                  return (
                    <Pressable key={st.id} testID={`study-station-${st.id}`} disabled={status === "locked"} accessibilityRole="button" accessibilityState={{ disabled: status === "locked" }} onPress={() => open(st.id)} style={[s.station, status === "locked" && { opacity: 0.6 }]}>
                      {img ? <View style={s.stationImg}><Image source={img} style={s.img} resizeMode="contain" /></View> : <View style={s.stationNum}><Text style={s.meta}>{i + 1}</Text></View>}
                      <View style={s.cardBody}>
                        <Text style={s.stTitle} numberOfLines={2}>{st.title}</Text>
                        <Text style={s.small} numberOfLines={2}>{status === "locked" ? `Zuerst: ${missing.join(", ")}` : status === "completed" ? "Abgeschlossen · Wiederholen" : `${st.tasks.length} Aufgaben · ${st.exam.length} Prüfungsfragen`}</Text>
                      </View>
                      <Icon name={status === "locked" ? "lock" : status === "completed" ? "check-circle" : "chevron-right"} size={20} color={status === "completed" ? colors.success : colors.brandPrimary} />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </>
        ) : (
          <View style={s.panel}><Text style={s.section}>Geplante Stationen</Text>{world.planned.map((p) => <Text key={p} style={s.description}>• {p}</Text>)}</View>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  scroll: { flex: 1, backgroundColor: c.surface },
  content: { padding: spacing.lg, gap: spacing.lg, width: "100%", maxWidth: 820, alignSelf: "center" },
  banner: { padding: spacing.xl, borderRadius: 24, backgroundColor: PETROL, gap: spacing.sm, borderWidth: 1, borderColor: GOLD },
  bannerTitle: { fontFamily: fonts.display, fontWeight: "700", fontSize: 30, color: "#F3E9D5" },
  bannerSub: { fontFamily: fonts.text, fontSize: 15, lineHeight: 22, color: "#E4D8BE" },
  mapBtn: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, alignSelf: "flex-start", paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: GOLD },
  mapBtnText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 14, color: GOLD },
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: 24, borderWidth: 1, borderColor: GOLD + "88", backgroundColor: c.surfaceSecondary, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  thumb: { width: "36%", maxWidth: 170, aspectRatio: 1, borderRadius: 18, overflow: "hidden", backgroundColor: c.surfaceTertiary },
  img: { width: "100%", height: "100%" },
  cardBody: { flex: 1, minWidth: 0, gap: 6 },
  title: { fontFamily: fonts.display, fontWeight: "700", fontSize: 20, color: c.onSurface },
  stTitle: { fontFamily: fonts.display, fontWeight: "700", fontSize: 17, color: c.onSurface },
  subtitle: { fontFamily: fonts.text, fontSize: 14, lineHeight: 20, color: c.onSurfaceSecondary },
  description: { fontFamily: fonts.text, fontSize: 16, lineHeight: 25, color: c.onSurface },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  meta: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurfaceSecondary },
  pct: { fontFamily: fonts.text, fontSize: 14, fontWeight: "900", color: c.brandPrimary },
  small: { fontFamily: fonts.text, fontSize: 12.5, color: c.muted },
  track: { height: 8, backgroundColor: c.surfaceTertiary, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, backgroundColor: GOLD, borderRadius: 4 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderStrong },
  badgeText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: PETROL, borderBottomWidth: 1, borderBottomColor: GOLD },
  headerTitle: { flex: 1, fontFamily: fonts.display, fontWeight: "700", fontSize: 21, color: "#F3E9D5" },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(243,233,213,0.12)" },
  hero: { width: "100%", maxWidth: 420, alignSelf: "center", borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: GOLD + "88", backgroundColor: c.surfaceTertiary },
  heroTitle: { fontFamily: fonts.display, fontWeight: "700", fontSize: 30, color: c.onSurface },
  books: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  bookChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  bookText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: c.onSurface },
  panel: { padding: spacing.lg, borderRadius: 22, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, gap: spacing.md },
  cta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, backgroundColor: c.brandPrimary, paddingHorizontal: spacing.lg, borderRadius: 16 },
  ctaText: { flex: 1, color: c.onBrandPrimary, fontFamily: fonts.text, fontWeight: "800", fontSize: 15 },
  mapRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  link: { fontFamily: fonts.text, fontWeight: "800", fontSize: 14, color: c.brandPrimary, flexShrink: 1 },
  section: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: c.onSurface, marginTop: spacing.sm },
  station: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: spacing.md, minHeight: 72, backgroundColor: c.surfaceSecondary },
  stationImg: { width: 64, height: 64, borderRadius: 12, overflow: "hidden", backgroundColor: c.surfaceTertiary },
  stationNum: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: c.surfaceTertiary },
}));
