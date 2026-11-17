import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Chip } from "@/src/components/ui";
import { useRefText } from "@/src/components/way/WayUI";
import { BOOK_BY_CODE } from "@/src/data/books";
import { PERICOPES, SYN_GROUPS, SynRef } from "@/src/data/synoptics";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

// Synoptischer Vergleich: Parallelabschnitte der Evangelien nebeneinander (Elberfelder 1905).
const label = (r: SynRef) => `${BOOK_BY_CODE[r.book]?.name ?? r.book} ${r.ch},${r.from}–${r.to}`;

export default function SynopsisScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ p?: string }>();
  const [group, setGroup] = useState<string | null>(null);
  const sel = PERICOPES.find((p) => p.id === params.p);

  const header = (title: string, sub: string, onBack: () => void) => (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable style={styles.back} onPress={onBack} testID="synopsis-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color={colors.onSurface} /></Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.hTitle} accessibilityRole="header">{title}</Text>
        <Text style={styles.hSub}>{sub}</Text>
      </View>
    </View>
  );

  if (sel) {
    return (
      <View style={styles.root} testID={`synopsis-detail-${sel.id}`}>
        {header(sel.title, sel.refs.map((r) => r.book).join(" · ") + " · Elberfelder 1905", () => (router.canGoBack() ? router.back() : router.replace("/synopsis")))}
        <Detail id={sel.id} />
      </View>
    );
  }

  const list = PERICOPES.filter((p) => !group || p.group === group);
  return (
    <View style={styles.root} testID="synopsis-screen">
      {header("Evangelien nebeneinander", `${PERICOPES.length} Parallelabschnitte · Elberfelder 1905`, () => (router.canGoBack() ? router.back() : router.replace("/")))}
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }}>
        <Text style={styles.body}>Wähle einen Abschnitt. Lies zuerst alle Spalten und achte auf Gemeinsamkeiten und Unterschiede – die Erklärung steht darunter.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}>
          <Chip testID="synopsis-group-all" label="Alle" selected={!group} onPress={() => setGroup(null)} />
          {SYN_GROUPS.map((g) => <Chip key={g} testID={`synopsis-group-${g}`} label={g} selected={group === g} onPress={() => setGroup(group === g ? null : g)} />)}
        </ScrollView>
        {list.map((p) => (
          <Pressable key={p.id} testID={`synopsis-item-${p.id}`} onPress={() => router.push({ pathname: "/synopsis", params: { p: p.id } })} style={styles.item} accessibilityRole="button" accessibilityLabel={p.title}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.itemTitle}>{p.title}</Text>
              <Text style={styles.muted}>{p.refs.map(label).join(" · ")}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Detail({ id }: { id: string }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const p = PERICOPES.find((x) => x.id === id)!;
  const wide = width >= 900;
  const colW = wide ? undefined : Math.min(340, width - 56);
  const cols = p.refs.map((r) => <Column key={r.book} r={r} width={colW} />);
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}>
      {wide ? (
        <View style={{ flexDirection: "row", gap: spacing.md, padding: spacing.lg }}>{cols}</View>
      ) : (
        <>
          <Text style={[styles.muted, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>Wische nach links, um die Spalten zu vergleichen.</Text>
          <ScrollView horizontal snapToInterval={(colW ?? 0) + spacing.md} decelerationRate="fast" showsHorizontalScrollIndicator contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }} testID="synopsis-columns">{cols}</ScrollView>
        </>
      )}
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <View style={styles.note} testID="synopsis-same"><Text style={styles.noteTitle}>Gemeinsam</Text><Text style={styles.body}>{p.same}</Text></View>
        <View style={styles.note} testID="synopsis-diff"><Text style={styles.noteTitle}>Unterschiede und Schwerpunkte</Text><Text style={styles.body}>{p.diff}</Text></View>
        <Text style={styles.muted}>Unterschiede sind Beobachtungen am Text, keine Wertung. Erklärungen dazu findest du in der Kampagne „Synoptischer Vergleich“.</Text>
      </View>
    </ScrollView>
  );
}

function Column({ r, width }: { r: SynRef; width?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const verses = useRefText(`${r.book}:${r.ch}:${r.from}-${r.to}`);
  return (
    <View style={[styles.col, width ? { width } : { flex: 1 }]} testID={`synopsis-col-${r.book}`}>
      <Text style={styles.colTitle}>{label(r)}</Text>
      {verses === null ? <ActivityIndicator color={colors.brandPrimary} /> : (
        <Text style={styles.verse}>{verses.map((v) => <Text key={v.v}><Text style={styles.vnum}>{v.v} </Text>{v.t} </Text>)}</Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  hTitle: { fontFamily: fonts.display, fontSize: 21, fontWeight: "700", color: c.onSurface },
  hSub: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: c.muted },
  body: { fontFamily: fonts.text, fontSize: 15, lineHeight: 23, color: c.onSurfaceSecondary },
  muted: { fontFamily: fonts.text, fontSize: 13, lineHeight: 19, color: c.muted },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 56, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, marginBottom: spacing.sm },
  itemTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  col: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: spacing.lg, gap: spacing.sm },
  colTitle: { fontFamily: fonts.text, fontSize: 14, fontWeight: "900", color: c.brandPrimary },
  verse: { fontFamily: fonts.display, fontSize: 16, lineHeight: 26, color: c.onSurface },
  vnum: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.muted },
  note: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs, borderLeftWidth: 4, borderLeftColor: c.info },
  noteTitle: { fontFamily: fonts.text, fontSize: 14, fontWeight: "900", color: c.onSurface },
}));
