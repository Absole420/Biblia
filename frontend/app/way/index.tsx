import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOOK_THEMES } from "@/src/components/Bookshelf";
import { Icon } from "@/src/components/Icon";
import { Chip } from "@/src/components/ui";
import { DiaryHome } from "@/src/components/way/DiaryHome";
import { diaryColor, regColor, useWayStyles } from "@/src/components/way/WayUI";
import { FEELING_BY_ID, OPEN_TOPICS, TOPIC_CATS, TOPICS, TopicCat } from "@/src/data/way";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Area = "register" | "diary";

export default function WayScreen() {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [area, setAreaState] = useState<Area>(params.tab === "diary" ? "diary" : "register");
  const setArea = (a: Area) => { setAreaState(a); router.setParams({ tab: a }); };
  const theme = BOOK_THEMES.way;

  return (
    <View style={styles.root} testID="way-screen">
      <View style={[w.head, { paddingTop: insets.top + spacing.sm, backgroundColor: theme.cover }]}>
        <Pressable onPress={() => router.back()} style={w.back} testID="way-back" accessibilityLabel="Zurück zur Bibliothek">
          <Icon name="arrow-left" size={22} color={theme.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[w.headTitle, { color: theme.ink }]} accessibilityRole="header">Mein geistlicher Weg</Text>
          <Text style={[styles.sub, { color: theme.ink }]} numberOfLines={2}>Gefühle wahrnehmen, Gottes Wort entdecken und Schritt für Schritt weitergehen</Text>
        </View>
      </View>
      <View style={[styles.trim, { backgroundColor: theme.trim }]} />
      <View style={styles.seg} accessibilityRole="tablist">
        {([["register", "book", "Allgemeines Register", regColor(colors)], ["diary", "lock", "Persönliches Register", diaryColor(colors)]] as const).map(([k, ic, l, col]) => (
          <Pressable key={k} testID={`way-area-${k}`} onPress={() => setArea(k)} accessibilityRole="tab" accessibilityState={{ selected: area === k }}
            style={[styles.segBtn, area === k && { backgroundColor: col }]}>
            <Icon name={ic} size={16} color={area === k ? colors.surface : colors.onSurfaceSecondary} />
            <Text style={[styles.segText, { color: area === k ? colors.surface : colors.onSurfaceSecondary }]} numberOfLines={1}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {area === "register" ? <Register /> : <DiaryHome />}
    </View>
  );
}

function Register() {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<TopicCat | null>(null);
  const ql = q.trim().toLowerCase();
  const list = useMemo(() => TOPICS.filter((t) => (!cat || t.cat === cat) && (!ql || [t.title, t.summary, ...t.aka, ...t.feelings.map((f) => FEELING_BY_ID[f]?.label ?? "")].some((s) => s.toLowerCase().includes(ql)))), [cat, ql]);
  const open = OPEN_TOPICS.filter((t) => (!cat || t.cat === cat) && (!ql || t.title.toLowerCase().includes(ql)));
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }} keyboardShouldPersistTaps="handled" testID="way-register">
      <View style={[styles.banner, { borderLeftColor: regColor(colors) }]}>
        <Icon name="book" size={18} color={regColor(colors)} />
        <Text style={[w.muted, { flex: 1 }]}>Nachschlagewerk für alle: Gefühle, Lebenslagen und Bibelstellen (Elberfelder 1905). Deine persönlichen Einträge verändern es nicht. Es stellt keine Diagnose und ersetzt keine fachliche Hilfe.</Text>
      </View>
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput testID="way-search" value={q} onChangeText={setQ} placeholder="Gefühl oder Situation suchen …" placeholderTextColor={colors.muted} style={styles.search} returnKeyType="search" accessibilityLabel="Themen durchsuchen" />
        {q ? <Pressable onPress={() => setQ("")} hitSlop={10} testID="way-search-clear" accessibilityLabel="Suche leeren"><Icon name="x-circle" size={18} color={colors.muted} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}>
        <Chip testID="way-cat-all" label="Alle" selected={!cat} onPress={() => setCat(null)} />
        {TOPIC_CATS.map((c) => <Chip key={c.id} testID={`way-cat-${c.id}`} label={c.label} selected={cat === c.id} onPress={() => setCat(cat === c.id ? null : c.id)} />)}
      </ScrollView>
      {!list.length && !open.length ? <Text style={w.muted} testID="way-search-empty">Kein Thema gefunden. Versuche einen anderen Begriff, z. B. „Sorge“, „müde“ oder „Vergebung“.</Text> : null}
      {list.map((t) => (
        <Pressable key={t.id} testID={`topic-card-${t.id}`} onPress={() => router.push({ pathname: "/way/topic/[id]", params: { id: t.id } })} style={[w.card, styles.topic]} accessibilityRole="button" accessibilityLabel={t.title}>
          <View style={[styles.topicIcon, { backgroundColor: regColor(colors) + "22" }]}><Icon name={t.icon} size={20} color={regColor(colors)} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={w.cardTitle}>{t.title}</Text>
            <Text style={w.muted} numberOfLines={2}>{t.summary}</Text>
            <Text style={styles.meta}>{TOPIC_CATS.find((c) => c.id === t.cat)?.label} · {t.passages.length + t.people.length + t.jesus.length} Bibelstellen</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.muted} />
        </Pressable>
      ))}
      {open.length ? (
        <View style={{ marginTop: spacing.lg }} testID="way-open-topics">
          <Text style={w.secTitle}>Noch in Arbeit</Text>
          <Text style={[w.muted, { marginBottom: spacing.sm }]}>Diese Themen sind geplant, aber noch nicht ausgearbeitet und ohne geprüfte Bibelverweise.</Text>
          {open.map((t) => (
            <View key={t.title} style={styles.openRow}>
              <Icon name="clock" size={14} color={colors.muted} />
              <Text style={[w.body, { flex: 1 }]}>{t.title}</Text>
              <Text style={styles.openTag}>offen</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  sub: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", opacity: 0.9 },
  trim: { height: 3 },
  seg: { flexDirection: "row", margin: spacing.lg, marginBottom: 0, backgroundColor: c.surfaceSecondary, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: c.border },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44, borderRadius: radius.pill, paddingHorizontal: 6 },
  segText: { flexShrink: 1, fontFamily: fonts.text, fontWeight: "800", fontSize: 13 },
  banner: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderLeftWidth: 4, marginBottom: spacing.md },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 48, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  search: { flex: 1, fontFamily: fonts.text, fontSize: 16, color: c.onSurface, minHeight: 48 },
  topic: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  topicIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  meta: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted },
  openRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.divider },
  openTag: { fontFamily: fonts.text, fontSize: 11, fontWeight: "900", color: c.muted, borderWidth: 1, borderColor: c.borderStrong, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
}));
