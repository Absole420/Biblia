import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArticleMap } from "@/src/components/ArticleMap";
import { FavHeart } from "@/src/components/FavHeart";
import { Icon } from "@/src/components/Icon";
import { useInfo } from "@/src/components/InfoSheet";
import { RefLinks } from "@/src/components/RefLinks";
import { Button } from "@/src/components/ui";
import { ARTICLE_BY_ID } from "@/src/data/articles";
import { EPOCH_LABEL, KIND_LABEL, LAYER_LABEL, REGION_LABEL, REL_LABEL, RelationType, Section } from "@/src/data/articleTypes";
import { BOOK_BY_CODE } from "@/src/data/books";
import { ALL_STATIONS } from "@/src/data/john";
import { ILLUSTRATION_LABEL, ILLUSTRATION_SOURCE, ILLUSTRATIONS } from "@/src/data/illustrations";
import { INFO_BY_ID } from "@/src/data/lexicon";
import { TIMELINE_YEAR } from "@/src/data/timelineData";
import { STATION_INFO } from "@/src/lib/libraryIndex";
import { stationStatus } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

// Leseposition je Artikel (Rückkehr aus dem Bibelleser)
const SCROLL: Record<string, number> = {};

export default function ArticleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // key: beim Wechsel zu einem anderen Artikel frischer Zustand (Ebene, Notiz, Scrollposition)
  return <ArticleScreen key={id} id={id} />;
}

function ArticleScreen({ id }: { id: string }) {
  const a = ARTICLE_BY_ID[id];
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { open } = useInfo();
  const p = useProgress();
  const { state } = p;
  const [level, setLevel] = useState<"overview" | "deep">("overview");
  const [note, setNote] = useState(() => state.lexicon.notes[id] ?? "");
  const scrollRef = useRef<ScrollView>(null);
  const pos = useRef<Record<string, number>>({});
  const restored = useRef(false);

  // „Zuletzt gelesen“ – beeinflusst keinen Lernfortschritt
  useEffect(() => {
    if (!a) return;
    p.updateLexicon((l) => ({ ...l, recent: [a.id, ...l.recent.filter((x) => x !== a.id)].slice(0, 20) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.id]);

  if (!a) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl, padding: spacing.xl }]}>
        <Text style={styles.h2}>Dieser Artikel ist noch in Arbeit.</Text>
        <Button testID="article-missing-back" label="Zurück" icon="arrow-left" onPress={() => router.back()} />
      </View>
    );
  }
  const kind = KIND_LABEL[a.kind];
  const illu = ILLUSTRATIONS[a.id];
  const fav = state.lexicon.favorites.includes(a.id);
  const sections: Section[] = level === "overview" ? a.overview : [...a.overview, ...a.deep];
  const linked = ALL_STATIONS.filter((s) => (s.info ?? []).includes(a.id) || a.stationIds?.includes(s.id)).filter((s) => STATION_INFO[s.id]);
  const started = linked.filter((s) => state.stations[s.id] || (state.phase[s.id] ?? 0) > 0);
  const discover = linked.filter((s) => !started.includes(s)).slice(0, 4);
  const relGroups = Object.entries(a.relations.reduce<Record<string, typeof a.relations>>((acc, r) => { (acc[r.type] ??= []).push(r); return acc; }, {}));
  const openRel = (t: string) => (ARTICLE_BY_ID[t] ? router.push(`/lexicon/${t}`) : INFO_BY_ID[t] ? open(t) : null);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => { SCROLL[a.id] = e.nativeEvent.contentOffset.y; };
  const restore = () => { if (!restored.current && SCROLL[a.id]) { restored.current = true; scrollRef.current?.scrollTo({ y: SCROLL[a.id], animated: false }); } };
  const jump = (k: string) => scrollRef.current?.scrollTo({ y: Math.max(0, (pos.current[k] ?? 0) - 8), animated: true });
  const toc = [...sections.map((s) => s.h), "Bibelstellen", ...(a.map ? ["Karte"] : []), "Verbindungen", "Quellen"];

  return (
    <View style={styles.root} testID="article-screen">
      <View style={[styles.hero, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.heroRow}>
          <Pressable style={styles.round} onPress={() => (router.canGoBack() ? router.back() : router.replace("/lexicon"))} testID="article-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color={colors.onSurface} /></Pressable>
          <View style={[styles.kind, { backgroundColor: colors.brandPrimary }]}><Icon name={kind.icon} size={13} color={colors.onBrandPrimary} /><Text style={[styles.kindText, { color: colors.onBrandPrimary }]}>{kind.label}</Text></View>
          <View style={{ flex: 1 }} />
          <FavHeart testID="article-fav" active={fav} label={a.title} onPress={() => p.updateLexicon((l) => ({ ...l, favorites: fav ? l.favorites.filter((x) => x !== a.id) : [a.id, ...l.favorites] }))} />
        </View>
        <Text style={styles.title} testID="article-title">{a.title}</Text>
        <Text style={styles.meta}>{a.category}{a.aliases.length ? ` · auch: ${a.aliases.join(", ")}` : ""}</Text>
      </View>
      <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={100} onContentSizeChange={restore} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }} keyboardShouldPersistTaps="handled">
        {illu ? (
          <View style={styles.illu} testID="article-illustration">
            <Image source={illu} style={styles.illuImg} resizeMode="cover" accessibilityLabel={`${a.title} – ${ILLUSTRATION_LABEL}`} />
            <View style={[styles.illuTag, { backgroundColor: colors.surfaceInverse }]}>
              <Icon name="feather" size={12} color={colors.onSurfaceInverse} />
              <Text style={[styles.illuTagText, { color: colors.onSurfaceInverse }]} testID="article-illustration-label">{ILLUSTRATION_LABEL}</Text>
            </View>
          </View>
        ) : null}
        <Text style={styles.summary}>{a.summary}</Text>
        <View style={styles.facts}>
          <Text style={styles.fact}><Text style={styles.factK}>Zeit: </Text>{a.timeframe}</Text>
          <Text style={styles.fact}><Text style={styles.factK}>Epoche: </Text>{EPOCH_LABEL[a.epoch]} · <Text style={styles.factK}>Region: </Text>{REGION_LABEL[a.region]}</Text>
        </View>
        {TIMELINE_YEAR[a.id] !== undefined ? (
          <Pressable testID="article-timeline" onPress={() => router.push({ pathname: "/timeline", params: { focus: a.id } })} style={styles.tlBtn} accessibilityRole="button">
            <Icon name="clock" size={15} color={colors.info} /><Text style={styles.tlText}>Im Zeitstrahl zeigen</Text><Icon name="chevron-right" size={14} color={colors.info} />
          </Pressable>
        ) : null}
        {a.disambiguation ? <View style={styles.warn} testID="article-disambiguation"><Icon name="alert-circle" size={16} color={colors.warning} /><Text style={styles.warnText}>{a.disambiguation}</Text></View> : null}
        <View style={styles.seg}>
          {(["overview", "deep"] as const).map((l) => (
            <Pressable key={l} testID={`article-level-${l}`} onPress={() => setLevel(l)} style={[styles.segBtn, level === l && { backgroundColor: colors.surfaceInverse }]} accessibilityState={{ selected: level === l }}>
              <Text style={[styles.segText, { color: level === l ? colors.onSurfaceInverse : colors.onSurfaceSecondary }]}>{l === "overview" ? "Überblick" : "Vertiefung"}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }} testID="article-toc">
          {toc.map((t) => <Pressable key={t} onPress={() => jump(t)} style={styles.tocChip}><Text style={styles.tocText}>{t}</Text></Pressable>)}
        </ScrollView>
        {sections.map((s) => (
          <View key={s.h} onLayout={(e) => { pos.current[s.h] = e.nativeEvent.layout.y; }} style={styles.section}>
            <Text style={styles.h2}>{s.h}</Text>
            {s.layer ? <View style={styles.layer}><Icon name={LAYER_LABEL[s.layer].icon} size={12} color={colors.info} /><Text style={styles.layerText}>{LAYER_LABEL[s.layer].label}</Text></View> : null}
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <View onLayout={(e) => { pos.current.Bibelstellen = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.h2}>Bibelstellen</Text>
          <Text style={styles.small}>Antippen zeigt den Text der Elberfelder 1905.</Text>
          <RefLinks refs={a.refs} lexId={a.id} testID="article-refs" />
          <Text style={[styles.small, { marginTop: spacing.sm }]}>Vorkommen in: {a.books.map((b) => BOOK_BY_CODE[b]?.name ?? b).join(" · ")}</Text>
        </View>
        {a.map ? <View onLayout={(e) => { pos.current.Karte = e.nativeEvent.layout.y; }} style={styles.section}><Text style={styles.h2}>Karte</Text><ArticleMap a={a} /></View> : null}
        <View onLayout={(e) => { pos.current.Verbindungen = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.h2}>Verbindungen</Text>
          {relGroups.map(([type, list]) => (
            <View key={type} style={{ marginTop: spacing.sm }}>
              <Text style={styles.relHead}>{REL_LABEL[type as RelationType]} …</Text>
              <View style={styles.relRow}>
                {list.map((r) => {
                  const can = !!(ARTICLE_BY_ID[r.target] || INFO_BY_ID[r.target]);
                  return (
                    <Pressable key={r.target + r.label} disabled={!can} onPress={() => openRel(r.target)} testID={`rel-${r.target}`} style={[styles.rel, !can && { opacity: 0.6 }]}>
                      <Text style={styles.relText}>{r.label ?? r.target}{r.uncertain ? " (unsicher)" : ""}</Text>
                      {can ? <Icon name={ARTICLE_BY_ID[r.target] ? "chevron-right" : "info"} size={14} color={colors.brandPrimary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
        {started.length ? (
          <View style={styles.section} testID="article-journeys">
            <Text style={styles.h2}>Aus deinen Lernreisen</Text>
            {started.map((s) => {
              const info = STATION_INFO[s.id];
              const done = !!state.stations[s.id];
              return (
                <View key={s.id} style={[styles.card, { borderLeftColor: info.world.palette.base }]} testID={`journey-${s.id}`}>
                  <Text style={styles.relHead}>{info.world.title} · {info.campaign.title}</Text>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  <Text style={styles.small}>{done ? "Abgeschlossen" : "Begonnen"} · Diese Station behandelt {a.title}.</Text>
                  <Button testID={`journey-open-${s.id}`} variant="secondary" icon={done ? "rotate-ccw" : "play"} label={done ? "Noch einmal ansehen" : "Fortsetzen"} onPress={() => router.push({ pathname: "/station/[id]", params: { id: s.id } })} style={{ marginTop: spacing.sm }} />
                </View>
              );
            })}
          </View>
        ) : null}
        {discover.length ? (
          <View style={styles.section} testID="article-discover">
            <Text style={styles.h2}>Passende Lernreisen entdecken</Text>
            {discover.map((s) => {
              const info = STATION_INFO[s.id];
              const locked = stationStatus(s, state.stations) === "locked";
              return (
                <Pressable key={s.id} disabled={locked} onPress={() => router.push({ pathname: "/station/[id]", params: { id: s.id } })} style={[styles.card, styles.discover, { borderLeftColor: info.world.palette.base }]} testID={`discover-${s.id}`}>
                  <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{s.title}</Text><Text style={styles.small}>{info.world.title}{locked ? " · noch gesperrt" : ""}</Text></View>
                  <Icon name={locked ? "lock" : "chevron-right"} size={16} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.h2}>Meine Notiz</Text>
          <TextInput testID="article-note-input" value={note} onChangeText={setNote} multiline placeholder="Eigene Gedanken zu diesem Artikel …" placeholderTextColor={colors.muted} style={styles.input} />
          <Button testID="article-note-save" icon="save" label="Notiz speichern" variant="secondary" disabled={note === (state.lexicon.notes[a.id] ?? "")} onPress={() => p.updateLexicon((l) => ({ ...l, notes: { ...l.notes, [a.id]: note } }))} style={{ marginTop: spacing.sm }} />
        </View>
        <View onLayout={(e) => { pos.current.Quellen = e.nativeEvent.layout.y; }} style={styles.section} testID="article-sources">
          <Text style={styles.h2}>Quellen & Bildnachweis</Text>
          {a.sources.map((s) => <Text key={s} style={styles.small}>• {s}</Text>)}
          <Text style={styles.small}>• Artikeltext: Redaktion BIBLIA (eigene Zusammenfassung, keine Übernahme geschützter Texte).</Text>
          {illu ? <Text style={styles.small}>• {ILLUSTRATION_SOURCE}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: c.divider },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  kind: { flexDirection: "row", alignItems: "center", gap: 4, height: 28, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  kindText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800" },
  title: { fontFamily: fonts.display, fontSize: 30, fontWeight: "700", color: c.onSurface, marginTop: spacing.md },
  meta: { fontFamily: fonts.text, fontSize: 13, color: c.muted, fontWeight: "700", marginTop: 2 },
  illu: { borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.lg, backgroundColor: c.surfaceSecondary },
  illuImg: { width: "100%", aspectRatio: 4 / 3, maxHeight: 420 },
  illuTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  illuTagText: { flex: 1, fontFamily: fonts.text, fontSize: 12, fontWeight: "700" },
  summary: { fontFamily: fonts.display, fontSize: 18, lineHeight: 27, color: c.onSurface },
  facts: { marginTop: spacing.md, gap: 4 },
  fact: { fontFamily: fonts.text, fontSize: 13.5, color: c.onSurfaceSecondary, lineHeight: 20 },
  factK: { fontWeight: "800", color: c.onSurface },
  tlBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 40, paddingHorizontal: spacing.md, marginTop: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.info },
  tlText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.info },
  warn: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.warning, backgroundColor: c.surfaceSecondary },
  warnText: { flex: 1, fontFamily: fonts.text, fontSize: 13.5, color: c.onSurfaceSecondary, lineHeight: 20 },
  seg: { flexDirection: "row", backgroundColor: c.surfaceSecondary, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: c.border, marginTop: spacing.lg },
  segBtn: { flex: 1, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  segText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 14 },
  tocChip: { height: 34, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border },
  tocText: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: c.onSurfaceSecondary },
  section: { marginTop: spacing.xl },
  h2: { fontFamily: fonts.display, fontSize: 21, fontWeight: "700", color: c.onSurface, marginBottom: spacing.xs },
  layer: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, height: 22, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, marginBottom: spacing.xs },
  layerText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.info },
  body: { fontFamily: fonts.text, fontSize: 16, lineHeight: 25, color: c.onSurfaceSecondary },
  small: { fontFamily: fonts.text, fontSize: 12.5, color: c.muted, lineHeight: 18, marginTop: 2 },
  relHead: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.brandPrimary, textTransform: "uppercase", letterSpacing: 0.5 },
  relRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 6 },
  rel: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  relText: { fontFamily: fonts.text, fontSize: 13.5, fontWeight: "700", color: c.onSurface },
  card: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderLeftWidth: 5, marginTop: spacing.sm },
  discover: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  input: { minHeight: 100, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.md, fontFamily: fonts.text, color: c.onSurface, fontSize: 15 },
}));
