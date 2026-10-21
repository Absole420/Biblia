import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { useInfo } from "@/src/components/InfoSheet";
import { Chip } from "@/src/components/ui";
import { ARTICLE_BY_ID, ARTICLES } from "@/src/data/articles";
import { ArticleKind, EPOCH_LABEL, KIND_LABEL } from "@/src/data/articleTypes";
import { ILLUSTRATIONS } from "@/src/data/illustrations";
import { KIND_META, LEXICON } from "@/src/data/lexicon";
import { Epoch, EPOCH_ORDER, EPOCH_STYLE, epochOfYear, TIMELINE_YEAR } from "@/src/data/timelineData";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Item = { id: string; year: number; epoch: Epoch; title: string; when: string; summary: string; icon: string; kind: string; group: Filter; article: boolean; uncertain: boolean };
type Filter = "all" | "person" | "event" | "world";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Alles" }, { id: "person", label: "Personen" }, { id: "event", label: "Ereignisse & Geschichten" }, { id: "world", label: "Reiche, Bauten & Begriffe" },
];
const groupOf = (k: ArticleKind | string): Filter => (k === "person" ? "person" : k === "event" || k === "story" ? "event" : "world");

// Lexikonartikel + ältere Infotafeln mit Jahreszahl, die (noch) keinen Artikel haben
const ITEMS: Item[] = [
  ...ARTICLES.filter((a) => TIMELINE_YEAR[a.id] !== undefined).map((a) => ({
    id: a.id, year: TIMELINE_YEAR[a.id], epoch: a.epoch, title: a.title, when: a.timeframe, summary: a.summary, icon: KIND_LABEL[a.kind].icon,
    kind: KIND_LABEL[a.kind].label, group: groupOf(a.kind), article: true, uncertain: /unsicher|umstritten|Näherung|nicht datierbar/i.test(a.timeframe),
  })),
  ...LEXICON.filter((e) => e.year !== undefined && !ARTICLE_BY_ID[e.id] && TIMELINE_YEAR[e.id] === undefined).map((e) => ({
    id: e.id, year: e.year!, epoch: epochOfYear(e.year!), title: e.name, when: e.yearLabel ?? "", summary: e.summary, icon: KIND_META[e.kind].icon,
    kind: "Infotafel", group: groupOf(e.kind), article: false, uncertain: !!e.uncertain,
  })),
].sort((a, b) => EPOCH_ORDER.indexOf(a.epoch) - EPOCH_ORDER.indexOf(b.epoch) || a.year - b.year);

/** Zeitstrahl: Epochen als farbige Kapitel, Einträge mit Bild, Tippen öffnet den Lexikonartikel. */
export default function TimelineScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { open } = useInfo();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [filter, setFilter] = useState<Filter>("all");
  const ref = useRef<ScrollView>(null);
  const ys = useRef<Record<string, number>>({});
  const list = useMemo(() => ITEMS.filter((i) => filter === "all" || i.group === filter || i.id === focus), [filter, focus]);
  const epochs = EPOCH_ORDER.filter((e) => list.some((i) => i.epoch === e));
  const jump = (k: string) => ref.current?.scrollTo({ y: Math.max(0, (ys.current[k] ?? 0) - 8), animated: true });

  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const it = ITEMS.find((i) => i.id === focus);
      if (!it) return;
      const y = (ys.current[`epoch-${it.epoch}`] ?? 0) + (ys.current[`inner-${it.epoch}`] ?? 0) + (ys.current[`r-${focus}`] ?? 0);
      ref.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
    }, 600);
    return () => clearTimeout(t);
  }, [focus]);

  const openItem = (i: Item) => (i.article ? router.push({ pathname: "/lexicon/[id]", params: { id: i.id } }) : open(i.id));

  return (
    <View style={styles.root} testID="timeline-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headRow}>
          <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/library"))} testID="timeline-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color="#EAF0F7" /></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Zeitstrahl</Text>
            <Text style={styles.sub} testID="timeline-count">{ITEMS.length} Einträge · Jahresangaben sind Näherungen</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.epochRow}>
          {epochs.map((e) => (
            <Pressable key={e} onPress={() => jump(`epoch-${e}`)} testID={`timeline-jump-${e}`} style={[styles.epochChip, { backgroundColor: EPOCH_STYLE[e].color }]}>
              <Icon name={EPOCH_STYLE[e].icon} size={12} color="#FFFFFF" /><Text style={styles.epochChipText}>{EPOCH_LABEL[e]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, minHeight: 56 }} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => <Chip key={f.id} testID={`timeline-filter-${f.id}`} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />)}
      </ScrollView>
      <ScrollView ref={ref} contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxxl }}>
        {epochs.map((e) => {
          const st = EPOCH_STYLE[e];
          const items = list.filter((i) => i.epoch === e);
          return (
            <View key={e} onLayout={(ev) => { ys.current[`epoch-${e}`] = ev.nativeEvent.layout.y; }} testID={`timeline-epoch-${e}`}>
              <View style={[styles.band, { backgroundColor: st.color }]}>
                <Icon name={st.icon} size={18} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bandTitle}>{EPOCH_LABEL[e]}</Text>
                  <Text style={styles.bandSpan}>{st.span}</Text>
                </View>
                <Text style={styles.bandCount}>{items.length}</Text>
              </View>
              <View onLayout={(ev) => { ys.current[`inner-${e}`] = ev.nativeEvent.layout.y; }}>
                {items.map((i, idx) => {
                  const img = ILLUSTRATIONS[i.id];
                  const sel = focus === i.id;
                  return (
                    <View key={i.id} style={styles.row} onLayout={(ev) => { ys.current[`r-${i.id}`] = ev.nativeEvent.layout.y; }}>
                      <View style={styles.rail}>
                        <View style={[styles.line, { backgroundColor: st.color + "55" }, idx === items.length - 1 && { bottom: "50%" }]} />
                        <View style={[styles.dot, { backgroundColor: st.color }, sel && styles.dotFocus]} />
                      </View>
                      <Pressable testID={`timeline-item-${i.id}`} onPress={() => openItem(i)} style={[styles.card, { borderLeftColor: st.color }, sel && { borderColor: st.color, borderWidth: 2 }]}>
                        {img ? <Image source={img} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, styles.thumbIcon, { backgroundColor: st.color + "22" }]}><Icon name={i.icon} size={20} color={st.color} /></View>}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.year, { color: st.color }]} numberOfLines={2}>{i.when}</Text>
                          <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={2}>{i.title}</Text>
                            {i.uncertain ? <Icon name="help-circle" size={14} color={colors.warning} /> : null}
                          </View>
                          <Text style={styles.summary} numberOfLines={2}>{i.summary}</Text>
                          <Text style={styles.kind}>{i.kind}{i.article ? " · Lexikonartikel" : ""}</Text>
                        </View>
                        <Icon name="chevron-right" size={16} color={colors.muted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: "#2C3E5C", paddingBottom: spacing.md, borderBottomWidth: 3, borderBottomColor: "#C9A55A" },
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  title: { fontFamily: fonts.display, fontSize: 24, fontWeight: "700", color: "#EAF0F7" },
  sub: { fontFamily: fonts.text, fontSize: 12, color: "#C9D3E2", fontWeight: "700" },
  epochRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  epochChip: { flexDirection: "row", alignItems: "center", gap: 5, height: 34, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  epochChipText: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: "#FFFFFF" },
  filterRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: "center" },
  band: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  bandTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: "700", color: "#FFFFFF" },
  bandSpan: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)" },
  bandCount: { fontFamily: fonts.text, fontSize: 13, fontWeight: "900", color: "#FFFFFF" },
  row: { flexDirection: "row", gap: spacing.sm },
  rail: { width: 22, alignItems: "center" },
  line: { position: "absolute", top: 0, bottom: 0, width: 3 },
  dot: { marginTop: 28, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: c.surface },
  dotFocus: { width: 22, height: 22, borderRadius: 11, marginTop: 24 },
  card: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: c.border, borderLeftWidth: 4 },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  thumbIcon: { alignItems: "center", justifyContent: "center" },
  year: { fontFamily: fonts.text, fontSize: 11.5, fontWeight: "800" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  name: { flexShrink: 1, fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  summary: { fontFamily: fonts.text, fontSize: 13.5, color: c.onSurfaceSecondary, marginTop: 2, lineHeight: 19 },
  kind: { fontFamily: fonts.text, fontSize: 11, fontWeight: "700", color: c.muted, marginTop: 4 },
}));
