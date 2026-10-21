import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { BOOK_BY_CODE } from "@/src/data/books";

import { Icon } from "./Icon";

export const refLabel = (key: string) => { const [b, c, v] = key.split(":"); return c ? `${BOOK_BY_CODE[b]?.name ?? b} ${c}${v ? "," + v.replace("-", "–") : ""}` : key; };

export const useStudyStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  h1: { fontFamily: fonts.display, fontSize: 21, fontWeight: "700", color: c.onSurface },
  h2: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm },
  sub: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: c.muted },
  body: { fontFamily: fonts.text, fontSize: 15, color: c.onSurfaceSecondary, lineHeight: 22 },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: c.border, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  title: { fontFamily: fonts.display, fontSize: 16, fontWeight: "700", color: c.onSurface },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  chipOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: c.onSurface },
  input: { minHeight: 44, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontFamily: fonts.text, fontSize: 15, color: c.onSurface, backgroundColor: c.surface },
  bar: { height: 8, borderRadius: 4, backgroundColor: c.border, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: c.brandPrimary },
  warn: { fontFamily: fonts.text, fontSize: 12, color: c.warning, fontWeight: "700" },
}));

export function StudyScreen({ title, sub, testID, children }: { title: string; sub?: string; testID: string; children: React.ReactNode }) {
  const s = useStudyStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={s.root} testID={testID}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={s.back} onPress={() => (router.canGoBack() ? router.back() : router.navigate("/study"))} accessibilityLabel="Zurück" testID={`${testID}-back`}><Icon name="arrow-left" size={22} color={colors.onSurface} /></Pressable>
        <View style={{ flex: 1 }}><Text style={s.h1}>{title}</Text>{sub ? <Text style={s.sub}>{sub}</Text> : null}</View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 80 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </View>
  );
}

export function Bar({ value }: { value: number }) {
  const s = useStudyStyles();
  return <View style={s.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}><View style={[s.barFill, { width: `${Math.round(Math.min(1, value) * 100)}%` }]} /></View>;
}

export function Choice<T extends string | number>({ options, value, onChange, testID }: { options: [T, string][]; value: T | T[]; onChange: (v: T) => void; testID: string }) {
  const s = useStudyStyles();
  const { colors } = useTheme();
  const on = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <View style={s.row}>
      {options.map(([v, l]) => (
        <Pressable key={String(v)} testID={`${testID}-${v}`} onPress={() => onChange(v)} style={[s.chip, on(v) && s.chipOn]} accessibilityState={{ selected: on(v) }}>
          <Text style={[s.chipText, on(v) && { color: colors.onBrandPrimary }]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}
