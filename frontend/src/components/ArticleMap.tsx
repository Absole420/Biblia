import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ARTICLE_BY_ID, ARTICLES } from "@/src/data/articles";
import { Article } from "@/src/data/articleTypes";
import { LEXICON } from "@/src/data/lexicon";
import { CERTAINTY_META } from "@/src/data/meta";
import { GeoPlace, mapSize, THEME_MAPS } from "@/src/data/themeMaps";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { useInfo } from "./InfoSheet";
import { GeoMap, placesBox } from "./GeoMap";
import { Icon } from "./Icon";
import { PlaceDot } from "./MapPlaceMarker";
import { MapHandle, ZoomableMap } from "./ZoomableMap";

/** Interaktive Artikelkarte (gemeinsame Kartenkomponente) mit Zeitständen, Vollbild und Ortsliste. */
export function ArticleMap({ a }: { a: Article }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { open } = useInfo();
  const m = a.map!;
  const map = THEME_MAPS[m.mapId];
  const [stateIdx, setStateIdx] = useState(m.states ? m.states.length - 1 : -1);
  const [full, setFull] = useState(false);
  const [sel, setSel] = useState<GeoPlace | null>(null);
  const [list, setList] = useState(false);
  const ref = useRef<MapHandle>(null);
  const ids = stateIdx >= 0 ? m.states![stateIdx].placeIds : m.placeIds;
  const box = useMemo(() => placesBox(map, ids, 0.12), [map, ids]);
  const size = mapSize(map);
  const places = map.places.filter((p) => ids.includes(p.id));
  const articleFor = (p: GeoPlace) => ARTICLE_BY_ID[p.id]?.id ?? ARTICLES.find((x) => x.placeId === p.id)?.id ?? LEXICON.find((e) => e.placeId === p.id)?.id;
  const openRelated = (p: GeoPlace) => {
    const id = articleFor(p);
    if (!id) return;
    setFull(false);
    if (ARTICLE_BY_ID[id]) router.push({ pathname: "/lexicon/[id]", params: { id } });
    else open(id);
  };

  const renderMap = (fs: boolean) => (
    <ZoomableMap ref={ref} key={`${fs}-${stateIdx}`} width={size.width} height={size.height} initial={box} allBox={box} maxZoom={6} controlsTop={(fs ? insets.top : 0) + spacing.sm}
      fullscreen={fs} onToggleFullscreen={() => setFull(!fs)} keepVisible={null} testID={fs ? "article-map-full" : "article-map"}>
      <GeoMap map={map} onSelect={setSel} onCluster={(b) => ref.current?.fitBox(b)} important={ids} selected={sel?.id ?? null} routeIds={m.routeIds ?? []} />
    </ZoomableMap>
  );
  const selCard = sel ? (
    <View style={styles.sel} testID="article-map-selected">
      <PlaceDot certainty={sel.certainty} size={18} />
      <View style={{ flex: 1 }}>
        <Text style={styles.selTitle}>{sel.name}</Text>
        <Text style={styles.small}>{CERTAINTY_META[sel.certainty].label}</Text>
      </View>
      {articleFor(sel) ? (
        <Pressable testID="article-map-open-related" onPress={() => openRelated(sel)} style={styles.btn} accessibilityRole="button"><Text style={styles.btnText}>Artikel</Text><Icon name="chevron-right" size={14} color={colors.onBrandPrimary} /></Pressable>
      ) : null}
      <Pressable onPress={() => setSel(null)} hitSlop={8} accessibilityLabel="Auswahl schließen"><Icon name="x" size={18} color={colors.muted} /></Pressable>
    </View>
  ) : null;

  return (
    <View testID="article-map-section">
      {m.states ? (
        <View style={styles.states} testID="article-map-states">
          {m.states.map((s, i) => (
            <Pressable key={s.label} testID={`map-state-${i}`} onPress={() => { setStateIdx(i); setSel(null); }} style={[styles.state, i === stateIdx && { backgroundColor: colors.surfaceInverse }]} accessibilityState={{ selected: i === stateIdx }}>
              <Text style={[styles.stateText, i === stateIdx && { color: colors.onSurfaceInverse }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {stateIdx >= 0 ? <Text style={styles.note} testID="map-state-note">{m.states![stateIdx].note}</Text> : null}
      <View style={styles.frame}>{!full ? renderMap(false) : null}</View>
      {selCard}
      <Text style={styles.small}>{m.note}</Text>
      <Pressable testID="article-place-list-toggle" onPress={() => setList(!list)} style={styles.listToggle} accessibilityRole="button" accessibilityState={{ expanded: list }}>
        <Icon name="list" size={15} color={colors.brandPrimary} />
        <Text style={styles.listToggleText}>Ortsliste ({places.length})</Text>
        <Icon name={list ? "chevron-up" : "chevron-down"} size={15} color={colors.brandPrimary} />
      </Pressable>
      {list ? places.map((p) => (
        <Pressable key={p.id} testID={`article-place-${p.id}`} onPress={() => setSel(p)} style={styles.listItem}>
          <PlaceDot certainty={p.certainty} size={18} events={!!p.events?.length} />
          <Text style={styles.listText}>{p.name}</Text>
          <Text style={styles.small}>{CERTAINTY_META[p.certainty].label}</Text>
        </Pressable>
      )) : null}
      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          {full ? renderMap(true) : null}
          {sel ? <View style={[styles.fullSel, { bottom: insets.bottom + spacing.md }]}>{selCard}</View> : null}
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  frame: { height: 320, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: c.border },
  states: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  state: { minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  stateText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurface },
  note: { fontFamily: fonts.text, fontSize: 13.5, color: c.onSurfaceSecondary, marginBottom: spacing.sm, lineHeight: 20 },
  small: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 4 },
  sel: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, marginTop: spacing.sm },
  fullSel: { position: "absolute", left: spacing.md, right: spacing.md },
  selTitle: { fontFamily: fonts.text, fontSize: 15, fontWeight: "800", color: c.onSurface },
  btn: { flexDirection: "row", alignItems: "center", gap: 2, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.brandPrimary },
  btnText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onBrandPrimary },
  listToggle: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  listToggleText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800", color: c.brandPrimary },
  listItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 },
  listText: { flex: 1, fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: c.onSurface },
}));
