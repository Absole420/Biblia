import React, { useState } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, Text, View } from "react-native";

import { CERTAINTY_META } from "@/src/data/meta";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { MapRect } from "./AnchoredMarker";
import { Icon } from "./Icon";
import { PlaceDot } from "./MapPlaceMarker";

type Props = {
  top: number;
  maxWidth: number;
  maxHeight: number;
  kind: "history" | "adventure";
  title: string;
  sources?: string[];
  placeCount?: number;
  placesLabel?: string;
  onPlaces?: () => void;
  onRect: (r: MapRect) => void;
};

/** Aufklappbare Legende + Quellen + Ortsliste oben links auf der Karte. */
export function MapLegend({ top, maxWidth, maxHeight, kind, title, sources, placeCount, placesLabel = "Orte", onPlaces, onRect }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => {
    const l = e.nativeEvent.layout;
    onRect({ x: l.x, y: l.y, w: l.width, h: l.height });
  };
  return (
    <View style={[styles.root, { top, maxWidth }]} onLayout={onLayout}>
      <View style={styles.row}>
        <Pressable testID="map-legend-toggle" accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[styles.pill, open && { backgroundColor: colors.surfaceInverse }]}>
          <Icon name="info" size={16} color={open ? colors.onSurfaceInverse : colors.onSurface} />
          <Text style={[styles.pillText, open && { color: colors.onSurfaceInverse }]}>Legende</Text>
        </Pressable>
        {onPlaces ? (
          <Pressable testID="map-places-toggle" accessibilityRole="button" accessibilityLabel={`${placesLabel}: Liste, ${placeCount} Einträge`} onPress={onPlaces} style={styles.pill}>
            <Icon name="list" size={16} color={colors.onSurface} />
            <Text style={styles.pillText}>{placesLabel} · {placeCount}</Text>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View style={[styles.card, { maxHeight }]} testID="historical-legend">
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <Text style={styles.title}>{title}</Text>
            {kind === "history" ? (
              <>
                <Text style={styles.section}>Orte</Text>
                {(["secure", "traditional", "disputed"] as const).map((c) => (
                  <View key={c} style={styles.item}>
                    <PlaceDot certainty={c} size={18} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemText}>{CERTAINTY_META[c].label}</Text>
                      <Text style={styles.small} numberOfLines={2}>{CERTAINTY_META[c].desc}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.item}>
                  <PlaceDot certainty="secure" size={18} events />
                  <Text style={styles.itemText}>Ort mit biblischen Ereignissen</Text>
                </View>
                <View style={styles.item}>
                  <View style={[styles.badge, { backgroundColor: colors.surfaceInverse }]}><Text style={[styles.badgeText, { color: colors.onSurfaceInverse }]}>+3</Text></View>
                  <Text style={[styles.itemText, { flex: 1 }]}>Gruppe dicht beieinanderliegender Orte – antippen zum Vergrößern</Text>
                </View>
                <Text style={styles.section}>Wege</Text>
                {([["solid", "Gesicherter Weg"], ["dotted", "Überlieferter Weg (Tradition)"], ["dashed", "Vermuteter / umstrittener Weg"]] as const).map(([st, l]) => (
                  <View key={st} style={styles.item}>
                    <View style={[styles.line, { borderColor: colors.mapInk, borderStyle: st }]} />
                    <Text style={styles.itemText}>{l}</Text>
                  </View>
                ))}
                <Text style={styles.small}>Nicht jeder Name ist bei jeder Zoomstufe beschriftet. Alle Orte bleiben über Antippen oder die Ortsliste erreichbar.</Text>
              </>
            ) : (
              <>
                <Text style={styles.section}>Stationen</Text>
                {([["play", colors.brandPrimary, "Verfügbar – pulsierender Ring = als Nächstes"], ["check", colors.success, "Abgeschlossen"], ["lock", colors.mapLocked, "Gesperrt – erst vorherige Station abschließen"]] as const).map(([ic, col, l]) => (
                  <View key={ic} style={styles.item}>
                    <View style={[styles.stDot, { backgroundColor: col }]}><Icon name={ic} size={11} color={colors.surface} /></View>
                    <Text style={[styles.itemText, { flex: 1 }]}>{l}</Text>
                  </View>
                ))}
                <Text style={styles.section}>Wege</Text>
                {([["solid", "Begangener Weg"], ["dashed", "Noch offener Weg"]] as const).map(([st, l]) => (
                  <View key={st} style={styles.item}>
                    <View style={[styles.line, { borderColor: colors.mapInk, borderStyle: st }]} />
                    <Text style={styles.itemText}>{l}</Text>
                  </View>
                ))}
                <Text style={styles.small}>Abenteuerkarte – Stationen sind Lernabschnitte, keine geografischen Orte. Die historische Karte zeigt die tatsächlichen Schauplätze.</Text>
              </>
            )}
            {sources?.length ? (
              <>
                <Pressable testID="map-sources-toggle" accessibilityRole="button" accessibilityState={{ expanded: src }} onPress={() => setSrc(!src)} style={styles.srcBtn}>
                  <Icon name="book-open" size={14} color={colors.brandPrimary} />
                  <Text style={styles.srcText}>Quellen</Text>
                  <Icon name={src ? "chevron-up" : "chevron-down"} size={14} color={colors.brandPrimary} />
                </Pressable>
                {src ? sources.map((s) => <Text key={s} style={styles.small} testID="map-source-item">• {s}</Text>) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { position: "absolute", left: spacing.md, gap: spacing.sm, pointerEvents: "box-none" },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, height: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.glass, borderWidth: 1, borderColor: c.border },
  pillText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 13, color: c.onSurface },
  card: { backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, boxShadow: "0px 4px 14px rgba(0,0,0,0.16)" },
  title: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurface },
  section: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.md, marginBottom: 2 },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 6 },
  itemText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary },
  small: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 4 },
  line: { width: 28, borderTopWidth: 3 },
  badge: { minWidth: 22, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontFamily: fonts.text, fontWeight: "900", fontSize: 10 },
  stDot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  srcBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md, height: 36 },
  srcText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 13, color: c.brandPrimary },
}));
