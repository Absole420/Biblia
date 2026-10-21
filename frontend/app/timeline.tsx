import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { useInfo } from "@/src/components/InfoSheet";
import { KIND_META, LEXICON } from "@/src/data/lexicon";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const EVENTS = LEXICON.filter((e) => e.year !== undefined).sort((a, b) => a.year! - b.year!);

/** Zeitstrahl aller datierbaren Personen und Ereignisse; Tippen öffnet die Infotafel. */
export default function TimelineScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { open } = useInfo();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const ref = useRef<ScrollView>(null);
  const ys = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => ref.current?.scrollTo({ y: Math.max(0, (ys.current[focus] ?? 0) - 120), animated: true }), 400);
    return () => clearTimeout(t);
  }, [focus]);
  return (
    <View style={styles.root} testID="timeline-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="timeline-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color={colors.onSurface} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Zeitstrahl</Text>
          <Text style={styles.sub}>Jahresangaben sind Näherungen – Unsicherheiten stehen auf der Infotafel</Text>
        </View>
      </View>
      <ScrollView ref={ref} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
        {EVENTS.map((e, i) => (
          <View key={e.id} style={styles.row} onLayout={(ev) => { ys.current[e.id] = ev.nativeEvent.layout.y; }}>
            <View style={styles.rail}>
              <View style={[styles.line, i === 0 && { top: 22 }, i === EVENTS.length - 1 && { bottom: "50%" }]} />
              <View style={[styles.dot, { backgroundColor: e.year! < 0 ? colors.stationNarrative : colors.brandPrimary }, focus === e.id && styles.dotFocus]} />
            </View>
            <Pressable testID={`timeline-item-${e.id}`} onPress={() => open(e.id)} style={[styles.card, focus === e.id && { borderColor: colors.brandPrimary, borderWidth: 2 }]}>
              <Text style={styles.year}>{e.yearLabel}</Text>
              <View style={styles.nameRow}><Icon name={KIND_META[e.kind].icon} size={14} color={colors.brandPrimary} /><Text style={styles.name}>{e.name}</Text>{e.uncertain ? <Icon name="help-circle" size={14} color={colors.warning} /> : null}</View>
              <Text style={styles.summary} numberOfLines={2}>{e.summary}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface },
  sub: { fontFamily: fonts.text, fontSize: 12, color: c.muted, fontWeight: "700" },
  row: { flexDirection: "row", gap: spacing.md },
  rail: { width: 24, alignItems: "center" },
  line: { position: "absolute", top: 0, bottom: 0, width: 3, backgroundColor: c.border },
  dot: { marginTop: 22, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: c.surface },
  dotFocus: { width: 22, height: 22, borderRadius: 11, marginTop: 19 },
  card: { flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: c.border },
  year: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  name: { fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  summary: { fontFamily: fonts.text, fontSize: 14, color: c.onSurfaceSecondary, marginTop: 4 },
}));
