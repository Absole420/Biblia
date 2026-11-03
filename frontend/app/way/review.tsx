import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Chip } from "@/src/components/ui";
import { diaryColor, useWayStyles } from "@/src/components/way/WayUI";
import { TOPIC_BY_ID } from "@/src/data/way";
import { fmtDate, fmtDay, todayISO, useWay } from "@/src/lib/way";
import { buildReview, refLabelW } from "@/src/lib/wayText";
import { fonts, makeStyles, spacing, useTheme } from "@/src/theme";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (s: string, n: number) => { const [y, m, d] = s.split("-").map(Number); return iso(new Date(y, m - 1, d + n)); };
const dayDiff = (a: string, b: string) => { const p = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).getTime(); }; return Math.round((p(b) - p(a)) / 864e5); };
const parseDE = (s: string) => { const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null; };

type Range = "week" | "month" | "custom";

export default function ReviewScreen() {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useWay();
  const today = todayISO();
  const [range, setRange] = useState<Range>("week");
  const [fromT, setFromT] = useState(fmtDate(addDays(today, -89)));
  const [toT, setToT] = useState(fmtDate(today));
  const accent = diaryColor(colors);

  const [from, to] = range === "week" ? [addDays(today, -6), today] : range === "month" ? [addDays(today, -29), today] : [parseDE(fromT) ?? addDays(today, -89), parseDE(toT) ?? today];
  const len = dayDiff(from, to) + 1;
  const r = useMemo(() => buildReview(data.entries, from, to, addDays(from, -len), addDays(from, -1)), [data.entries, from, to, len]);

  const Block = ({ title, icon, children, testID }: { title: string; icon: string; children: React.ReactNode; testID: string }) => (
    <View style={w.card} testID={testID}>
      <View style={w.row}><Icon name={icon} size={16} color={accent} /><Text style={w.cardTitle}>{title}</Text></View>
      {children}
    </View>
  );
  const none = <Text style={w.muted}>Nichts gespeichert.</Text>;

  return (
    <View style={styles.root} testID="review-screen">
      <View style={[w.head, { paddingTop: insets.top + spacing.sm, backgroundColor: accent }]}>
        <Pressable onPress={() => router.back()} style={w.back} testID="review-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color={colors.surface} /></Pressable>
        <Text style={[w.headTitle, { color: colors.surface }]} accessibilityRole="header">Rückblick</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, maxWidth: 760, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
        <Text style={w.muted}>Der Rückblick beschreibt nur, was du gespeichert hast. Er bewertet nichts, stellt keine Diagnose und wird nur erstellt, wenn du ihn öffnest.</Text>
        <View style={[w.wrap, { marginTop: spacing.md }]}>
          <Chip testID="review-week" label="Letzte 7 Tage" selected={range === "week"} onPress={() => setRange("week")} />
          <Chip testID="review-month" label="Letzte 30 Tage" selected={range === "month"} onPress={() => setRange("month")} />
          <Chip testID="review-custom" label="Zeitraum wählen" selected={range === "custom"} onPress={() => setRange("custom")} />
        </View>
        {range === "custom" ? (
          <View style={[w.row, { marginTop: spacing.sm }]}>
            <View style={{ flex: 1, minWidth: 130 }}><Text style={w.label}>Von</Text><TextInput testID="review-from" value={fromT} onChangeText={setFromT} placeholder="TT.MM.JJJJ" placeholderTextColor={colors.muted} style={w.input} accessibilityLabel="Von Datum" /></View>
            <View style={{ flex: 1, minWidth: 130 }}><Text style={w.label}>Bis</Text><TextInput testID="review-to" value={toT} onChangeText={setToT} placeholder="TT.MM.JJJJ" placeholderTextColor={colors.muted} style={w.input} accessibilityLabel="Bis Datum" /></View>
          </View>
        ) : null}
        <Text style={[styles.range, { marginTop: spacing.md }]} testID="review-range">{fmtDate(from)} – {fmtDate(to)}</Text>

        <Block title="Zusammenfassung" icon="file-text" testID="review-summary">
          {r.sentences.map((s, i) => <Text key={i} style={w.body}>{s}</Text>)}
        </Block>
        <Block title="Welche Gefühle kamen vor?" icon="heart" testID="review-feelings">
          {r.feelings.length ? r.feelings.map(([f, n]) => (
            <View key={f} style={styles.barRow}>
              <Text style={[w.body, { width: 130 }]} numberOfLines={1}>{f}</Text>
              <View style={[styles.bar, { flex: n, backgroundColor: accent }]} />
              <View style={{ flex: Math.max(0, (r.feelings[0]?.[1] ?? 1) - n) }} />
              <Text style={styles.num}>{n}× {r.prevFeelings[f] !== undefined ? `(davor ${r.prevFeelings[f]}×)` : ""}</Text>
            </View>
          )) : none}
        </Block>
        <Block title="Bibelstellen, die dir wichtig waren" icon="book-open" testID="review-refs">
          {r.refs.length ? r.refs.map(([ref, n]) => <Text key={ref} style={w.body}>{refLabelW(ref)} · {n}×</Text>) : none}
          {r.topics.length ? <Text style={w.muted}>Themen: {r.topics.map(([t, n]) => `${TOPIC_BY_ID[t]?.title ?? t} (${n}×)`).join(", ")}</Text> : null}
        </Block>
        <Block title="Gebete" icon="feather" testID="review-prayers">
          {r.prayers.length ? r.prayers.slice(0, 8).map((e) => <Text key={e.id} style={w.body} numberOfLines={2}><Text style={w.bold}>{fmtDay(e.date)}: </Text>{e.toGod || e.mood}</Text>) : none}
        </Block>
        <Block title="Offene Fragen" icon="help-circle" testID="review-questions">
          {r.questions.length ? r.questions.map((e) => (
            <Pressable key={e.id} onPress={() => router.push({ pathname: "/way/entry", params: { id: e.id } })} style={{ minHeight: 44, justifyContent: "center" }} accessibilityRole="button">
              <Text style={w.body} numberOfLines={2}>{e.resolved ? "✓ " : "• "}{e.mood || e.concern || "(ohne Text)"}</Text>
            </Pressable>
          )) : none}
        </Block>
        <Block title="Selbst gewählte Schritte und Unterstützung" icon="navigation" testID="review-steps">
          {r.steps.length ? r.steps.map((s, i) => <Text key={i} style={w.body}><Text style={w.bold}>{fmtDate(s.date)}: </Text>{s.text}</Text>) : none}
          {r.talk ? <Text style={w.muted}>Bei {r.talk} {r.talk === 1 ? "Eintrag" : "Einträgen"} wolltest du mit jemandem sprechen.</Text> : null}
        </Block>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  range: { fontFamily: fonts.text, fontSize: 14, fontWeight: "900", color: c.onSurface, marginBottom: spacing.sm },
  barRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 28 },
  bar: { height: 10, borderRadius: 5, minWidth: 6 },
  num: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted, minWidth: 90, textAlign: "right" },
}));
