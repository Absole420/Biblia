import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CampaignMapContent } from "@/src/components/CampaignMap";
import { MapRect } from "@/src/components/AnchoredMarker";
import { FavHeart } from "@/src/components/FavHeart";
import { GeoMap, placesBox } from "@/src/components/GeoMap";
import { Icon } from "@/src/components/Icon";
import { MapLegend } from "@/src/components/MapLegend";
import { MapPanel } from "@/src/components/MapPanel";
import { PlaceDot } from "@/src/components/MapPlaceMarker";
import { CertaintyBadge, certaintyColor, PlaceDetails } from "@/src/components/PlaceSheet";
import { Button, Chip, ProgressBar } from "@/src/components/ui";
import { MapHandle, ZoomableMap } from "@/src/components/ZoomableMap";
import { JOHN_HISTORICAL } from "@/src/data/historical";
import { CAMPAIGNS } from "@/src/data/john";
import { STATION_META } from "@/src/data/meta";
import { GeoPlace, mapSize, projectGeo, THEME_MAPS } from "@/src/data/themeMaps";
import { WORLDS } from "@/src/data/worlds";
import { INFO_BY_ID } from "@/src/data/lexicon";
import { stationStatus } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function WorldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const world = WORLDS.find((w) => w.id === id);
  if (!world) return <NotFound />;
  if (world.status === "playable" && world.campaignIds?.length) return <CampaignScreen worldId={world.id} />;
  return <PreviewScreen worldId={world.id} />;
}

function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} testID="world-back-button" accessibilityLabel="Zurück">
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

// Zuletzt gewählte Ansicht je Lernwelt (Kampagne + Kartenart) bleibt beim Zurückkehren erhalten
const WORLD_VIEW = new Map<string, { campId: string; mode: "adventure" | "history" }>();

function NotFound() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={styles.root} testID="world-not-found">
      <Header title="Lernwelt nicht gefunden" />
      <View style={styles.nf}>
        <Icon name="map" size={40} color={colors.muted} />
        <Text style={styles.sBody}>Diese Lernwelt gibt es nicht (mehr). Bitte wähle eine Lernwelt auf der Startseite.</Text>
        <Button testID="world-not-found-home" label="Zur Startseite" icon="home" onPress={() => router.replace("/")} />
      </View>
    </View>
  );
}

const pad = (b: { x: number; y: number; w: number; h: number }, m: number) => ({ x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m });

function CampaignScreen({ worldId }: { worldId: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, toggleFavorite } = useProgress();
  const world = WORLDS.find((w) => w.id === worldId)!;
  const remembered = WORLD_VIEW.get(worldId);
  const [campId, setCampId] = useState(remembered && CAMPAIGNS[remembered.campId] ? remembered.campId : world.campaignIds![0]);
  const campaign = CAMPAIGNS[campId];
  const [mode, setMode] = useState<"adventure" | "history">(remembered?.mode ?? "adventure");
  useEffect(() => { WORLD_VIEW.set(worldId, { campId, mode }); }, [worldId, campId, mode]);
  const hMap = THEME_MAPS[world.id] ?? THEME_MAPS.gospels;
  const [sel, setSel] = useState<string | null>(null);
  const [place, setPlace] = useState<GeoPlace | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [full, setFull] = useState(false);
  const [panelSize, setPanelSize] = useState(0);
  const [legendRect, setLegendRect] = useState<MapRect | null>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const mapRef = useRef<MapHandle>(null);
  const done = campaign.stations.filter((s) => state.stations[s.id]).length;
  const station = campaign.stations.find((s) => s.id === sel);
  const nextAvail = campaign.stations.find((s) => stationStatus(s, state.stations) === "available") ?? campaign.stations[0];
  const { width: vw } = useWindowDimensions();
  const side = vw >= 720;
  const history = mode === "history";

  // Vollbild: Android-Zurück beendet zuerst das Vollbild
  useEffect(() => {
    if (!full) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { setFull(false); return true; });
    return () => sub.remove();
  }, [full]);

  // Lektionsrelevante Orte: Orte der Stationen + Orte verknüpfter Lexikon-Einträge
  const stationPlaces = (s: (typeof campaign.stations)[number]) =>
    [...(s.placeIds ?? []), ...((s.info ?? []).map((i) => INFO_BY_ID[i]?.placeId).filter(Boolean) as string[])].filter((id) => hMap.places.some((p) => p.id === id));
  const curIds = useMemo(() => stationPlaces(nextAvail), [nextAvail, hMap]); // eslint-disable-line react-hooks/exhaustive-deps
  const relIds = useMemo(() => [...new Set(campaign.stations.flatMap(stationPlaces))], [campaign, hMap]); // eslint-disable-line react-hooks/exhaustive-deps
  const gInitial = useMemo(() => placesBox(hMap, curIds.length ? curIds : relIds.length ? relIds : null), [hMap, curIds, relIds]);
  const gAll = useMemo(() => placesBox(hMap, relIds.length ? relIds : null, 0.08), [hMap, relIds]);
  const aInitial = useMemo(() => ({ x: nextAvail.x - 380, y: nextAvail.y - 380, w: 760, h: 760 }), [nextAvail]);
  const aAll = useMemo(() => {
    const xs = campaign.stations.map((s) => s.x);
    const ys = campaign.stations.map((s) => s.y);
    return pad({ x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }, 120);
  }, [campaign]);

  // Persönliche Positionsmarkierung: Ort der aktuellen Station (sonst erster Ort der Karte)
  const mePos = useMemo(() => {
    if (!state.avatar) return null;
    const pl = hMap.places.find((p) => p.id === curIds[0]) ?? hMap.places[0];
    return pl ? { lat: pl.lat, lon: pl.lon, avatar: state.avatar } : null;
  }, [state.avatar, curIds, hMap]);
  const highlightPlaces = useMemo(() => campaign.stations.filter((s) => state.stations[s.id]).flatMap((s) => s.placeIds ?? []), [campaign, state.stations]);
  const gSize = mapSize(hMap);

  const curPlace = hMap.places.find((p) => p.id === curIds[0]);
  const focus = history ? (curPlace ? projectGeo(hMap, curPlace.lat, curPlace.lon) : undefined) : { x: nextAvail.x, y: nextAvail.y };
  const panelOpen = !!place || listOpen || !!station;
  const padBottom = panelOpen && !side ? panelSize : 0;
  const padRight = panelOpen && side ? panelSize : 0;
  const ctrlTop = (full ? insets.top : 0) + spacing.sm;
  const keep = history
    ? place ? projectGeo(hMap, place.lat, place.lon) : null
    : station ? { x: station.x, y: station.y } : null;
  const reserved = useMemo(() => (legendRect ? [legendRect] : []), [legendRect]);

  const openPlace = useCallback((p: GeoPlace) => { setListOpen(false); setExpanded(false); setPlace(p); }, []);
  const openStation = useCallback((id: string) => { setPlace(null); setListOpen(false); setExpanded(false); setSel(id); }, []);
  const fitCluster = useCallback((b: MapRect) => mapRef.current?.fitBox(b), []);
  const closePanel = () => { setPlace(null); setSel(null); setListOpen(false); setExpanded(false); setPanelSize(0); };
  const switchMode = (m: "adventure" | "history") => { closePanel(); setMode(m); };

  const modeToggle = (
    <View style={styles.seg}>
      {([["adventure", "compass", "Abenteuer", "Abenteuerkarte"], ["history", "map", "Historisch", "Historische Karte"]] as const).map(([m, ic, l, a11y]) => (
        <Pressable key={m} testID={`map-mode-${m}`} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: mode === m }} onPress={() => switchMode(m)}
          style={[styles.segBtn, mode === m && { backgroundColor: colors.surfaceInverse }]}>
          <Icon name={ic} size={15} color={mode === m ? colors.onSurfaceInverse : colors.onSurfaceSecondary} />
          <Text style={[styles.segText, { color: mode === m ? colors.onSurfaceInverse : colors.onSurfaceSecondary }]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={styles.root} testID="campaign-screen">
      {!full ? (
        <>
          <Header title={campaign.title} subtitle={`${done} / ${campaign.stations.length} Stationen · ${Math.round((done / campaign.stations.length) * 100)} %`} right={vw >= 400 ? modeToggle : undefined} />
          {vw < 400 ? <View style={styles.toggleRow}>{modeToggle}</View> : null}
          {world.campaignIds!.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.campRow} contentContainerStyle={styles.campContent}>
              {world.campaignIds!.map((cid) => {
                const c = CAMPAIGNS[cid];
                const pct = Math.round((c.stations.filter((s) => state.stations[s.id]).length / c.stations.length) * 100);
                return <Chip key={cid} testID={`campaign-chip-${cid}`} label={`${c.title.replace("Das Evangelium nach ", "")} · ${pct} %`} selected={campId === cid} color={world.palette.base} onPress={() => { setCampId(cid); closePanel(); }} />;
              })}
              {worldId === "psalms" ? <Chip testID="jesus-psalms-chip" label="Jesus in den Psalmen" selected={false} color={world.palette.accent} onPress={() => router.push("/psalms-jesus")} /> : null}
            </ScrollView>
          ) : null}
        </>
      ) : null}
      <View style={styles.mapArea} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} testID="map-area">
        {!history ? (
          <ZoomableMap ref={mapRef} key={"adv" + campId} width={campaign.mapW} height={campaign.mapH} initial={aInitial} allBox={aAll} focus={focus} persistKey={`${worldId}:adv:${campId}`}
            controlsTop={ctrlTop} padTop={ctrlTop + 52} padBottom={padBottom} padRight={padRight} reserved={reserved} keepVisible={keep}
            fullscreen={full} onToggleFullscreen={() => setFull(!full)} testID="campaign-map">
            <CampaignMapContent campaign={campaign} palette={world.palette} progress={state.stations} onSelect={openStation} avatar={state.avatar} />
          </ZoomableMap>
        ) : (
          <ZoomableMap ref={mapRef} key={"hist" + campId} width={gSize.width} height={gSize.height} initial={gInitial} allBox={gAll} focus={focus} persistKey={`${worldId}:hist:${campId}`} maxZoom={6}
            controlsTop={ctrlTop} padTop={ctrlTop + 52} padBottom={padBottom} padRight={padRight} reserved={reserved} keepVisible={keep}
            fullscreen={full} onToggleFullscreen={() => setFull(!full)} testID="historical-map">
            <GeoMap map={hMap} me={mePos} onSelect={openPlace} onCluster={fitCluster} highlight={highlightPlaces} important={curIds} selected={place?.id ?? null} />
          </ZoomableMap>
        )}
        <MapLegend
          key={mode}
          top={ctrlTop}
          maxWidth={Math.max(200, area.w - 84 - padRight)}
          maxHeight={Math.max(160, area.h - ctrlTop - 64 - padBottom)}
          kind={mode}
          title={history ? `${hMap.title} · ${hMap.era}` : "Abenteuerkarte"}
          sources={history ? [...JOHN_HISTORICAL.sources, ...(hMap.note ? [hMap.note] : [])] : undefined}
          placeCount={history ? hMap.places.length : campaign.stations.length}
          placesLabel={history ? "Orte" : "Stationen"}
          onPlaces={() => { setPlace(null); setSel(null); setExpanded(true); setListOpen(true); }}
          onRect={setLegendRect}
        />

        {history && place ? (
          <MapPanel key={"p" + place.id} side={side} title={place.name} accent={certaintyColor(place.certainty, colors)} expanded={expanded} onToggle={() => setExpanded(!expanded)} onClose={closePanel} onSize={setPanelSize} testID="place-sheet"
            summary={
              <View style={styles.sumRow}>
                <CertaintyBadge place={place} />
                {place.events?.length ? <Text style={styles.sumMeta}>{place.events.length} Ereignisse</Text> : null}
                {!expanded && !side ? <Text style={styles.sumText} numberOfLines={2}>{place.note}</Text> : null}
              </View>
            }>
            <PlaceDetails place={place} />
          </MapPanel>
        ) : null}

        {history && listOpen ? (
          <MapPanel side={side} title="Orte dieser Karte" expanded onToggle={() => setListOpen(false)} onClose={closePanel} onSize={setPanelSize} testID="map-place-list"
            summary={<Text style={styles.sumMeta}>Antippen zeigt den Ort auf der Karte. Orte der aktuellen Lektion stehen oben.</Text>}>
            {[...hMap.places].sort((a, b) => Number(curIds.includes(b.id)) - Number(curIds.includes(a.id)) || a.name.localeCompare(b.name, "de")).map((p) => (
              <Pressable key={p.id} testID={`map-place-item-${p.id}`} onPress={() => openPlace(p)} style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: colors.surfaceSecondary }]}>
                <PlaceDot certainty={p.certainty} size={20} events={!!p.events?.length} />
                <Text style={styles.listText} numberOfLines={1}>{p.name}</Text>
                {curIds.includes(p.id) ? <Text style={styles.listTag}>Lektion</Text> : null}
                <Icon name="chevron-right" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </MapPanel>
        ) : null}

        {!history && listOpen ? (
          <MapPanel side={side} title="Stationen dieser Reise" expanded onToggle={() => setListOpen(false)} onClose={closePanel} onSize={setPanelSize} testID="map-station-list"
            summary={<Text style={styles.sumMeta}>{done} von {campaign.stations.length} abgeschlossen · Antippen zeigt die Station auf der Karte.</Text>}>
            {campaign.stations.map((s, i) => {
              const st = stationStatus(s, state.stations);
              const ic = st === "completed" ? "check-circle" : st === "locked" ? "lock" : "play-circle";
              const col = st === "completed" ? colors.success : st === "locked" ? colors.muted : colors.brandPrimary;
              return (
                <Pressable key={s.id} testID={`map-station-item-${s.id}`} accessibilityRole="button"
                  accessibilityLabel={`${i + 1}. ${s.title}, ${st === "completed" ? "abgeschlossen" : st === "locked" ? "gesperrt" : "verfügbar"}`}
                  onPress={() => openStation(s.id)} style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: colors.surfaceSecondary }]}>
                  <Icon name={ic} size={20} color={col} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listText, st === "locked" && { color: colors.muted }]} numberOfLines={2}>{i + 1}. {s.title}</Text>
                    <Text style={styles.listSub} numberOfLines={1}>{STATION_META[s.type].label} · {s.xp} EP</Text>
                  </View>
                  {s.id === nextAvail.id && st !== "completed" ? <Text style={styles.listTag}>Aktuell</Text> : null}
                  <Icon name="chevron-right" size={16} color={colors.muted} />
                </Pressable>
              );
            })}
          </MapPanel>
        ) : null}

        {!history && station ? (() => {
          const st = stationStatus(station, state.stations);
          const prog = state.stations[station.id];
          const meta = STATION_META[station.type];
          const missing = station.requires.filter((r) => !state.stations[r]).map((r) => campaign.stations.find((s) => s.id === r)?.title);
          return (
            <MapPanel key={"s" + station.id} side={side} title={station.title} accent={colors[meta.color]} expanded={expanded} onToggle={() => setExpanded(!expanded)} onClose={closePanel} onSize={setPanelSize} testID="station-sheet"
              summary={
                <View>
                  <View style={styles.sumRow}>
                    <View style={[styles.typeBadge, { backgroundColor: colors[meta.color], borderColor: colors.border }]}>
                      <Text style={[styles.typeText, { color: meta.ink === "dark" ? colors.mapInk : colors.surface }]}>{meta.label}</Text>
                    </View>
                    <Text style={[styles.sumMeta, { flex: 1 }]}>{station.xp} EP · {station.tasks.length} Aufgaben</Text>
                    <FavHeart testID="station-fav-button" size={40} active={state.favorites.lessons.some((f) => f.key === station.id)} label={station.title} onPress={() => toggleFavorite("lessons", station.id)} />
                  </View>
                  <Text style={styles.sSub} numberOfLines={2}>{station.subtitle}</Text>
                  {st === "locked" ? (
                    <View style={styles.locked} testID="station-locked-info">
                      <Icon name="lock" size={16} color={colors.muted} />
                      <Text style={styles.lockedText}>Schließe zuerst ab: {missing.join(", ")}</Text>
                    </View>
                  ) : null}
                  <Button
                    testID="station-start-button"
                    label={st === "locked" ? "Noch gesperrt" : prog ? "Station wiederholen" : (state.phase[station.id] ?? 0) > 0 ? "Fortsetzen" : "Station starten"}
                    icon={st === "locked" ? "lock" : "play"}
                    disabled={st === "locked"}
                    style={{ marginTop: spacing.md }}
                    onPress={() => {
                      closePanel();
                      router.push({ pathname: "/station/[id]", params: { id: station.id } });
                    }}
                  />
                </View>
              }>
              <Text style={styles.sBody}>{station.discover}</Text>
              <View style={styles.infoRow}>
                <View style={styles.info}><Icon name="list" size={16} color={colors.brandPrimary} /><Text style={styles.infoText}>{station.tasks.length} Aufgaben · {station.exam.length} Prüfungsfragen</Text></View>
              </View>
              {prog ? (
                <View style={styles.locked}>
                  <Icon name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.lockedText}>Abgeschlossen · Beste Prüfung {prog.bestScore}/{prog.examTotal}</Text>
                </View>
              ) : null}
              {st !== "locked" && !prog && (state.phase[station.id] ?? 0) > 0 ? (
                <Text style={styles.resume}>Fortsetzen ab Phase {(state.phase[station.id] ?? 0) + 1} von 7</Text>
              ) : null}
            </MapPanel>
          );
        })() : null}
      </View>
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
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  hTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface },
  hSub: { fontFamily: fonts.text, fontSize: 13, color: c.muted, fontWeight: "700" },
  campRow: { height: 48, flexGrow: 0, flexShrink: 0, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.divider },
  campContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  toggleRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, backgroundColor: c.surface, alignItems: "flex-start" },
  mapArea: { flex: 1, overflow: "hidden" },
  seg: { flexDirection: "row", backgroundColor: c.surfaceSecondary, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: c.border },
  segBtn: { flexDirection: "row", alignItems: "center", gap: 5, height: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  segText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 13 },
  sumRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  sumMeta: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: c.muted },
  sumText: { width: "100%", fontFamily: fonts.text, fontSize: 14.5, lineHeight: 21, color: c.onSurfaceSecondary, marginTop: 2 },
  listItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.sm, borderRadius: radius.md },
  listSub: { fontFamily: fonts.text, fontSize: 12, fontWeight: "600", color: c.muted },
  nf: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.xl },
  listText: { flex: 1, fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: c.onSurface },
  listTag: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.brandPrimary, textTransform: "uppercase" },
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
