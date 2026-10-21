import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CampaignMapContent } from "@/src/components/CampaignMap";
import { GeoMap } from "@/src/components/GeoMap";
import { Icon } from "@/src/components/Icon";
import { PlaceSheet } from "@/src/components/PlaceSheet";
import { Sheet } from "@/src/components/Sheet";
import { Button, Chip, ProgressBar } from "@/src/components/ui";
import { ZoomableMap } from "@/src/components/ZoomableMap";
import { JOHN_HISTORICAL } from "@/src/data/historical";
import { CAMPAIGNS } from "@/src/data/john";
import { CERTAINTY_META, STATION_META } from "@/src/data/meta";
import { GeoPlace, mapSize, THEME_MAPS } from "@/src/data/themeMaps";
import { WORLDS } from "@/src/data/worlds";
import { stationStatus } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function WorldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const world = WORLDS.find((w) => w.id === id);
  if (!world) return null;
  if (world.status === "playable" && world.campaignIds?.length) return <CampaignScreen worldId={world.id} />;
  return <PreviewScreen worldId={world.id} />;
}

function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable style={styles.back} onPress={() => router.back()} testID="world-back-button" accessibilityLabel="Zurück">
        <Icon name="arrow-left" size={22} color={colors.onSurface} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.hTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.hSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function CampaignScreen({ worldId }: { worldId: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useProgress();
  const world = WORLDS.find((w) => w.id === worldId)!;
  const [campId, setCampId] = useState(world.campaignIds![0]);
  const campaign = CAMPAIGNS[campId];
  const [mode, setMode] = useState<"adventure" | "history">("adventure");
  const hMap = THEME_MAPS[world.id] ?? THEME_MAPS.gospels;
  const [sel, setSel] = useState<string | null>(null);
  const [place, setPlace] = useState<GeoPlace | null>(null);
  const done = campaign.stations.filter((s) => state.stations[s.id]).length;
  const station = campaign.stations.find((s) => s.id === sel);
  const nextAvail = campaign.stations.find((s) => stationStatus(s, state.stations) === "available") ?? campaign.stations[0];
  const { width: vw, height: vh } = useWindowDimensions();
  const gSize = mapSize(hMap);
  const gK = Math.min(3, Math.max(0.8, 1 / Math.min(vw / gSize.width, vh / gSize.height)));
  const highlightPlaces = useMemo(() => campaign.stations.filter((s) => state.stations[s.id]).flatMap((s) => s.placeIds ?? []), [campaign, state.stations]);

  return (
    <View style={styles.root} testID="campaign-screen">
      <Header title={campaign.title} subtitle={`${done} / ${campaign.stations.length} Stationen · ${Math.round((done / campaign.stations.length) * 100)} %`} />
      <View style={styles.toggleRow}>
        <Chip testID="map-mode-adventure" label="Abenteuerkarte" selected={mode === "adventure"} onPress={() => setMode("adventure")} />
        <Chip testID="map-mode-history" label="Historische Karte" selected={mode === "history"} onPress={() => setMode("history")} />
      </View>
      {world.campaignIds!.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.campRow} contentContainerStyle={styles.campContent}>
          {world.campaignIds!.map((cid) => {
            const c = CAMPAIGNS[cid];
            const pct = Math.round((c.stations.filter((s) => state.stations[s.id]).length / c.stations.length) * 100);
            return <Chip key={cid} testID={`campaign-chip-${cid}`} label={`${c.title.replace("Das Evangelium nach ", "")} · ${pct} %`} selected={campId === cid} color={world.palette.base} onPress={() => { setCampId(cid); setSel(null); }} />;
          })}
        </ScrollView>
      ) : null}
      <View style={{ flex: 1 }}>
        {mode === "adventure" ? (
          <ZoomableMap key={"adv" + campId} width={campaign.mapW} height={campaign.mapH} focus={{ x: nextAvail.x, y: nextAvail.y }} controlsBottom={insets.bottom + 16} testID="campaign-map">
            <CampaignMapContent campaign={campaign} palette={world.palette} progress={state.stations} onSelect={setSel} />
          </ZoomableMap>
        ) : (
          <ZoomableMap key="hist" fit="contain" width={gSize.width} height={gSize.height} controlsBottom={insets.bottom + 120} maxZoom={5} testID="historical-map">
            <GeoMap map={hMap} k={gK} onSelect={setPlace} highlight={highlightPlaces} />
          </ZoomableMap>
        )}
        {mode === "history" ? (
          <View style={[styles.legend, { bottom: insets.bottom + 12 }]} testID="historical-legend">
            <Text style={styles.legendTitle}>{hMap.title} · {hMap.era}</Text>
            <View style={styles.legendRow}>
              {(["secure", "traditional", "disputed"] as const).map((k) => (
                <View key={k} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: k === "secure" ? colors.mapInk : k === "traditional" ? colors.brandPrimary : colors.surface, borderStyle: k === "disputed" ? "dashed" : "solid" }]} />
                  <Text style={styles.legendText}>{CERTAINTY_META[k].label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.legendSrc} numberOfLines={2}>Quellen: {JOHN_HISTORICAL.sources.slice(0, 2).join("; ")}</Text>
          </View>
        ) : (
          <View style={[styles.adventureNote, { bottom: insets.bottom + 12 }]}>
            <Text style={styles.legendSrc}>Abenteuerkarte – Stationen sind Lernabschnitte, keine geografischen Orte.</Text>
          </View>
        )}
      </View>

      <Sheet
        visible={!!station}
        onClose={() => setSel(null)}
        title={station?.title}
        accent={station ? colors[STATION_META[station.type].color] : undefined}
        testID="station-sheet"
      >
        {station ? (() => {
          const st = stationStatus(station, state.stations);
          const prog = state.stations[station.id];
          const meta = STATION_META[station.type];
          const missing = station.requires.filter((r) => !state.stations[r]).map((r) => campaign.stations.find((s) => s.id === r)?.title);
          return (
            <View>
              <View style={[styles.typeBadge, { backgroundColor: colors[meta.color], borderColor: colors.border }]}>
                <Text style={[styles.typeText, { color: meta.ink === "dark" ? colors.mapInk : colors.surface }]}>{meta.label}</Text>
              </View>
              <Text style={styles.sSub}>{station.subtitle}</Text>
              <Text style={styles.sBody}>{station.discover}</Text>
              <View style={styles.infoRow}>
                <View style={styles.info}><Icon name="star" size={16} color={colors.brandPrimary} /><Text style={styles.infoText}>{station.xp} EP</Text></View>
                <View style={styles.info}><Icon name="list" size={16} color={colors.brandPrimary} /><Text style={styles.infoText}>{station.tasks.length} Aufgaben · {station.exam.length} Prüfungsfragen</Text></View>
              </View>
              {st === "locked" ? (
                <View style={styles.locked} testID="station-locked-info">
                  <Icon name="lock" size={16} color={colors.muted} />
                  <Text style={styles.lockedText}>Schließe zuerst ab: {missing.join(", ")}</Text>
                </View>
              ) : null}
              {prog ? (
                <View style={styles.locked}>
                  <Icon name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.lockedText}>Abgeschlossen · Beste Prüfung {prog.bestScore}/{prog.examTotal}</Text>
                </View>
              ) : null}
              {st !== "locked" && !prog && (state.phase[station.id] ?? 0) > 0 ? (
                <Text style={styles.resume}>Fortsetzen ab Phase {(state.phase[station.id] ?? 0) + 1} von 7</Text>
              ) : null}
              <Button
                testID="station-start-button"
                label={st === "locked" ? "Noch gesperrt" : prog ? "Station wiederholen" : (state.phase[station.id] ?? 0) > 0 ? "Fortsetzen" : "Station starten"}
                icon={st === "locked" ? "lock" : "play"}
                disabled={st === "locked"}
                style={{ marginTop: spacing.xl }}
                onPress={() => {
                  setSel(null);
                  router.push({ pathname: "/station/[id]", params: { id: station.id } });
                }}
              />
            </View>
          );
        })() : null}
      </Sheet>
      <PlaceSheet place={place} onClose={() => setPlace(null)} />
    </View>
  );
}

function PreviewScreen({ worldId }: { worldId: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const world = WORLDS.find((w) => w.id === worldId)!;
  return (
    <View style={styles.root} testID="preview-screen">
      <Header title={world.title} subtitle={world.subtitle} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        <View style={[styles.hero, { backgroundColor: world.palette.base }]}>
          <View style={[styles.heroGlow, { backgroundColor: world.palette.glow }]} />
          <Icon name={world.icon} size={44} color={world.palette.ink} />
          <Text style={[styles.heroTitle, { color: world.palette.ink }]}>{world.title}</Text>
          <Text style={[styles.heroSub, { color: world.palette.ink }]}>{world.books.join(" · ")}</Text>
        </View>
        <View style={styles.placeholder} testID="preview-placeholder-notice">
          <Icon name="alert-triangle" size={18} color={colors.warning} />
          <Text style={styles.placeholderText}>PLATZHALTER: Diese Lernwelt ist als Modul angelegt. Lerninhalte, Karten und Illustrationen werden in einer späteren Phase ergänzt.</Text>
        </View>
        <Text style={styles.sBody}>{world.description}</Text>
        <Text style={styles.planTitle}>Geplante Stationen</Text>
        {world.planned.map((p, i) => (
          <View key={p} style={styles.planItem} testID={`planned-station-${i}`}>
            <View style={[styles.planNum, { backgroundColor: world.palette.base }]}>
              <Text style={[styles.planNumText, { color: world.palette.ink }]}>{i + 1}</Text>
            </View>
            <Text style={styles.planText}>{p}</Text>
            <Icon name="lock" size={16} color={colors.muted} />
          </View>
        ))}
        <ProgressBar value={0} />
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  hTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface },
  hSub: { fontFamily: fonts.text, fontSize: 13, color: c.muted, fontWeight: "700" },
  campRow: { height: 52, flexGrow: 0, backgroundColor: c.surface },
  campContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  toggleRow: { height: 56, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: c.surface },
  legend: { pointerEvents: "none", position: "absolute", left: spacing.lg, right: 80, backgroundColor: c.glass, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border },
  adventureNote: { pointerEvents: "none", position: "absolute", left: spacing.lg, right: 80, backgroundColor: c.glass, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: c.border },
  legendTitle: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.onSurface },
  legendRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: c.mapInk },
  legendText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: c.onSurfaceSecondary },
  legendSrc: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 4 },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  typeText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 12 },
  sSub: { fontFamily: fonts.text, color: c.muted, fontWeight: "700", fontSize: 14, marginTop: spacing.sm },
  sBody: { fontFamily: fonts.text, color: c.onSurfaceSecondary, fontSize: 15.5, lineHeight: 23, marginTop: spacing.md },
  infoRow: { gap: spacing.sm, marginTop: spacing.lg },
  info: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  infoText: { fontFamily: fonts.text, color: c.onSurface, fontWeight: "700", fontSize: 14 },
  locked: { flexDirection: "row", gap: spacing.sm, alignItems: "center", backgroundColor: c.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg },
  lockedText: { flex: 1, fontFamily: fonts.text, color: c.onSurfaceSecondary, fontSize: 14, fontWeight: "600" },
  resume: { fontFamily: fonts.text, color: c.info, fontWeight: "700", marginTop: spacing.md },
  hero: { borderRadius: 28, padding: spacing.xl, alignItems: "flex-start", gap: spacing.sm, overflow: "hidden", minHeight: 180, justifyContent: "flex-end" },
  heroGlow: { position: "absolute", width: 220, height: 220, borderRadius: 110, right: -60, top: -60, opacity: 0.5 },
  heroTitle: { fontFamily: fonts.display, fontSize: 30, fontWeight: "700" },
  heroSub: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", opacity: 0.85 },
  placeholder: { flexDirection: "row", gap: spacing.sm, backgroundColor: c.surfaceSecondary, padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.xl, borderWidth: 1, borderColor: c.warning },
  placeholderText: { flex: 1, fontFamily: fonts.text, fontSize: 14, color: c.onSurfaceSecondary },
  planTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: "600", color: c.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  planItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.surfaceSecondary, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm },
  planNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  planNumText: { fontFamily: fonts.display, fontWeight: "700", fontSize: 16 },
  planText: { flex: 1, fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: c.onSurfaceSecondary },
}));
