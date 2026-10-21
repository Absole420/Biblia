import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { Chip } from "@/src/components/ui";
import { ARTICLE_BY_ID, ARTICLES } from "@/src/data/articles";
import { Article, ArticleKind, EPOCH_LABEL, KIND_LABEL, REGION_LABEL } from "@/src/data/articleTypes";
import { BOOK_BY_CODE } from "@/src/data/books";
import { ILLUSTRATION_LABEL, ILLUSTRATIONS } from "@/src/data/illustrations";
import { LEXICON_PLAN, PLAN_COUNT } from "@/src/data/lexiconPlan";
import { EPOCH_FALLBACK, TIMELINE_YEAR } from "@/src/data/timelineData";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");

type Sort = "alpha" | "time";
const SORTS: { id: Sort; label: string; icon: string }[] = [{ id: "alpha", label: "A–Z", icon: "type" }, { id: "time", label: "Zeitlich", icon: "clock" }];
const timeKey = (a: Article) => TIMELINE_YEAR[a.id] ?? EPOCH_FALLBACK[a.epoch];
const SORTERS: Record<Sort, (a: Article, b: Article) => number> = {
  alpha: (a, b) => a.title.localeCompare(b.title, "de"),
  time: (a, b) => timeKey(a) - timeKey(b) || a.title.localeCompare(b.title, "de"),
};

/** Lexikon: Suche (inkl. alternativer Schreibweisen), Filter, Favoriten, Zuletzt gelesen, Inhaltsplan nach Bibelbüchern. */
export default function LexiconIndex() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useProgress();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<ArticleKind | null>(null);
  const [epoch, setEpoch] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [book, setBook] = useState<string | null>(null);
  const [showPlanned, setShowPlanned] = useState(false);
  const [sort, setSort] = useState<Sort>("alpha");
  const [sheet, setSheet] = useState(false);
  const active = [kind, epoch, region, book].filter(Boolean).length;
  const nq = norm(q.trim());
  const results = useMemo(() => ARTICLES.filter((a) =>
    (!nq || [a.title, ...a.aliases, a.category].some((x) => norm(x).includes(nq))) &&
    (!kind || a.kind === kind) && (!epoch || a.epoch === epoch) && (!region || a.region === region) && (!book || a.books.includes(book)),
  ).sort(SORTERS[sort]), [nq, kind, epoch, region, book, sort]);
  const all = useMemo(() => [...ARTICLES].sort(SORTERS[sort]), [sort]);
  const open = (id: string) => router.push({ pathname: "/lexicon/[id]", params: { id } });
  const filters = !!(nq || kind || epoch || region || book);

  return (
    <View style={styles.root} testID="lexicon-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.round} onPress={() => (router.canGoBack() ? router.back() : router.replace("/library"))} testID="lexicon-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color={colors.onSurface} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Lexikon</Text>
          <Text style={styles.small} testID="lexicon-progress">{ARTICLES.length} von {PLAN_COUNT} geplanten Artikeln ausgearbeitet</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }} keyboardShouldPersistTaps="handled">
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput testID="lexicon-search" value={q} onChangeText={setQ} placeholder="Suchen, z. B. Pessach, Kinneret, Abram …" placeholderTextColor={colors.muted} style={styles.input} />
        </View>
        <View style={styles.toolbar}>
          <Pressable testID="lexicon-filter-open" onPress={() => setSheet(true)} style={[styles.tool, active ? { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary } : null]} accessibilityRole="button" accessibilityLabel={`Filter${active ? `, ${active} aktiv` : ""}`}>
            <Icon name="sliders" size={16} color={active ? colors.onBrandPrimary : colors.onSurface} />
            <Text style={[styles.toolText, active ? { color: colors.onBrandPrimary } : null]}>Filter{active ? ` · ${active}` : ""}</Text>
          </Pressable>
          <View style={styles.segment} accessibilityRole="tablist">
            {SORTS.map((o) => (
              <Pressable key={o.id} testID={`lexicon-sort-${o.id}`} onPress={() => setSort(o.id)} style={[styles.segBtn, sort === o.id && { backgroundColor: colors.brandPrimary }]} accessibilityRole="tab" accessibilityState={{ selected: sort === o.id }}>
                <Icon name={o.icon} size={14} color={sort === o.id ? colors.onBrandPrimary : colors.onSurfaceSecondary} />
                <Text style={[styles.segText, sort === o.id && { color: colors.onBrandPrimary }]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {active ? (
          <View style={styles.activeRow} testID="lexicon-active-filters">
            {kind ? <Chip testID="lex-active-kind" label={`${KIND_LABEL[kind].label} ✕`} selected onPress={() => setKind(null)} /> : null}
            {epoch ? <Chip testID="lex-active-epoch" label={`${EPOCH_LABEL[epoch as keyof typeof EPOCH_LABEL]} ✕`} selected onPress={() => setEpoch(null)} /> : null}
            {region ? <Chip testID="lex-active-region" label={`${REGION_LABEL[region as keyof typeof REGION_LABEL]} ✕`} selected onPress={() => setRegion(null)} /> : null}
            {book ? <Chip testID="lex-active-book" label={`${book} ✕`} selected onPress={() => setBook(null)} /> : null}
          </View>
        ) : null}
        <Sheet visible={sheet} onClose={() => setSheet(false)} title="Filter" testID="lexicon-filter-sheet"
          footer={<View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable testID="lexicon-filter-reset" onPress={() => { setKind(null); setEpoch(null); setRegion(null); setBook(null); }} style={[styles.sheetBtn, { borderColor: colors.border }]}><Text style={styles.toolText}>Zurücksetzen</Text></Pressable>
            <Pressable testID="lexicon-filter-apply" onPress={() => setSheet(false)} style={[styles.sheetBtn, { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}><Text style={[styles.toolText, { color: colors.onBrandPrimary }]}>{results.length} Treffer anzeigen</Text></Pressable>
          </View>}>
          <Text style={styles.fh}>Art</Text>
          <View style={styles.wrap}>{(Object.keys(KIND_LABEL) as ArticleKind[]).map((k) => <Chip key={k} testID={`lex-kind-${k}`} label={KIND_LABEL[k].label} selected={kind === k} onPress={() => setKind(kind === k ? null : k)} />)}</View>
          <Text style={styles.fh}>Epoche</Text>
          <View style={styles.wrap}>{Object.entries(EPOCH_LABEL).map(([k, l]) => <Chip key={k} testID={`lex-epoch-${k}`} label={l} selected={epoch === k} onPress={() => setEpoch(epoch === k ? null : k)} />)}</View>
          <Text style={styles.fh}>Region</Text>
          <View style={styles.wrap}>{Object.entries(REGION_LABEL).map(([k, l]) => <Chip key={k} testID={`lex-region-${k}`} label={l} selected={region === k} onPress={() => setRegion(region === k ? null : k)} />)}</View>
          <Text style={styles.fh}>Bibelbuch</Text>
          <View style={styles.wrap}>{LEXICON_PLAN.map((b) => <Chip key={b.book} testID={`lex-book-${b.book}`} label={b.book} selected={book === b.book} onPress={() => setBook(book === b.book ? null : b.book)} />)}</View>
        </Sheet>

        {filters ? (
          <View testID="lexicon-results">
            <Text style={styles.h2}>{results.length} Treffer</Text>
            {results.map((a) => <ArticleRow onOpen={open} key={a.id} id={a.id} />)}
            {!results.length ? <Text style={styles.small}>Kein ausgearbeiteter Artikel passt. Geplante Artikel siehst du im Inhaltsplan.</Text> : null}
          </View>
        ) : (
          <>
            {state.lexicon.favorites.length ? <><Text style={styles.h2}>Favoriten</Text>{state.lexicon.favorites.map((id) => <ArticleRow onOpen={open} key={id} id={id} />)}</> : null}
            {state.lexicon.recent.length ? <><Text style={styles.h2}>Zuletzt gelesen</Text>{state.lexicon.recent.slice(0, 5).map((id) => <ArticleRow onOpen={open} key={id} id={id} />)}</> : null}
            <Text style={styles.h2}>Ausgearbeitete Artikel</Text>
            <Text style={styles.small} testID="lexicon-sort-note">{sort === "alpha" ? "Alphabetisch sortiert" : "Zeitlich sortiert – Jahresangaben sind Näherungen"}</Text>
            {all.map((a) => <ArticleRow onOpen={open} key={a.id} id={a.id} />)}
          </>
        )}

        <View style={styles.planHead}>
          <Text style={[styles.h2, { flex: 1 }]}>Inhaltsplan nach Bibelbüchern</Text>
          <Pressable testID="lexicon-plan-toggle" onPress={() => setShowPlanned(!showPlanned)} style={styles.toggle}><Text style={styles.toggleText}>{showPlanned ? "Nur verfügbare" : "Alle geplanten"}</Text></Pressable>
        </View>
        {LEXICON_PLAN.map((b) => {
          const list = b.entries.filter((e) => showPlanned || ARTICLE_BY_ID[e.id]);
          if (!list.length) return null;
          return (
            <View key={b.book} style={{ marginBottom: spacing.md }} testID={`plan-book-${b.book}`}>
              <Text style={styles.bookTitle}>{BOOK_BY_CODE[b.book]?.name ?? b.book}</Text>
              <View style={styles.planRow}>
                {list.map((e) => {
                  const ok = !!ARTICLE_BY_ID[e.id];
                  return (
                    <Pressable key={e.id} disabled={!ok} onPress={() => open(e.id)} testID={`plan-${e.id}`} style={[styles.plan, ok ? { borderColor: colors.brandPrimary } : { opacity: 0.55 }]}>
                      <Icon name={ok ? KIND_LABEL[e.kind].icon : "clock"} size={12} color={ok ? colors.brandPrimary : colors.muted} />
                      <Text style={styles.planText}>{e.title}{ok ? "" : " · in Arbeit"}</Text>
                    </Pressable>
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

function ArticleRow({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const a = ARTICLE_BY_ID[id];
  if (!a) return null;
  return (
    <Pressable testID={`lex-article-${id}`} onPress={() => onOpen(id)} style={styles.row}>
      {ILLUSTRATIONS[id] ? (
        <Image source={ILLUSTRATIONS[id]} style={styles.icon} testID={`lex-thumb-${id}`} accessibilityLabel={`${a.title} – ${ILLUSTRATION_LABEL}`} />
      ) : (
        <View style={[styles.icon, { backgroundColor: colors.brandPrimary }]}><Icon name={KIND_LABEL[a.kind].icon} size={16} color={colors.onBrandPrimary} /></View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{a.title}</Text>
        <Text style={styles.small} numberOfLines={1}>{KIND_LABEL[a.kind].label} · {a.summary}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={colors.muted} />
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.divider },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 24, fontWeight: "700", color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 12.5, color: c.muted, fontWeight: "600" },
  search: { flexDirection: "row", alignItems: "center", gap: spacing.sm, height: 48, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  input: { flex: 1, height: 48, fontFamily: fonts.text, fontSize: 16, color: c.onSurface },
  toolbar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" },
  tool: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  toolText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800", color: c.onSurface },
  segment: { flexDirection: "row", marginLeft: "auto", borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, padding: 3 },
  segBtn: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  segText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurfaceSecondary },
  activeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  fh: { fontFamily: fonts.text, fontSize: 13, fontWeight: "900", color: c.muted, textTransform: "uppercase", letterSpacing: 0.6, marginTop: spacing.md, marginBottom: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  sheetBtn: { flex: 1, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  h2: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 60, padding: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, marginBottom: spacing.sm, borderWidth: 1, borderColor: c.border },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  planHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  toggle: { height: 36, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, marginTop: spacing.md },
  toggleText: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: c.brandPrimary },
  bookTitle: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.brandPrimary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  planRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  plan: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 34, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  planText: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: c.onSurface },
}));
