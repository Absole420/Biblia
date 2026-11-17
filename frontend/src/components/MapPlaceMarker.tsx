import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { Certainty } from "@/src/data/types";
import { FAR_SLOT } from "@/src/lib/mapLayout";
import { fonts, useTheme } from "@/src/theme";

import { useMapZoom } from "./AnchoredMarker";
import { Icon } from "./Icon";

const ease = { duration: 320, easing: Easing.out(Easing.cubic) };

/** Ortssymbol: Füllung, Randart und Zeichen unterscheiden „gesichert“, „Tradition“ und „umstritten“. */
export function PlaceDot({ certainty, size, events, selected }: { certainty: Certainty; size: number; events?: boolean; selected?: boolean }) {
  const { colors } = useTheme();
  const fill = certainty === "secure" ? colors.mapInk : certainty === "traditional" ? colors.brandPrimary : colors.surface;
  const bw = Math.max(2, size * 0.11);
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: fill, borderWidth: bw,
        borderColor: selected ? colors.stationNarrative : colors.mapInk,
        borderStyle: certainty === "disputed" ? "dashed" : certainty === "traditional" ? "dotted" : "solid",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {events ? (
        <Icon name="star" size={size * 0.52} color={certainty === "secure" ? colors.warning : colors.mapInk} />
      ) : certainty === "disputed" ? (
        <Text style={{ fontFamily: fonts.text, fontWeight: "900", fontSize: size * 0.55, lineHeight: size * 0.7, color: colors.mapInk }}>?</Text>
      ) : certainty === "traditional" ? (
        <View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size, backgroundColor: colors.surface }} />
      ) : null}
    </View>
  );
}

type Props = {
  ax: number; // geografischer Anker (Kartenpixel)
  ay: number;
  hit: number; // Antippradius (Bildschirmpixel)
  shown: boolean; // Marker sichtbar (nicht in einer Gruppe verborgen)
  count: number; // Anzahl zusammengefasster Orte
  label: { dx: number; dy: number; slot: number } | null;
  labelW: number;
  labelH: number;
  markerR: number;
  name: string;
  fontSize: number;
  selected?: boolean;
  /** Atlas-Schrift: 1 = Hauptort (Serif, kräftig) · 2 = Serif · 3 = ruhige Kursive */
  tier?: 1 | 2 | 3;
  onPress: () => void;
  testID: string;
  a11y: string;
  children: React.ReactNode;
};

/**
 * Marker mit konstanter Bildschirmgröße exakt am geografischen Ort. Marker, Beschriftung und
 * Antippfläche nutzen dieselbe Transformation (1/scale), daher laufen sie beim Zoomen nie auseinander.
 */
export function MapPlaceMarker({ ax, ay, hit, shown, count, label, labelW, labelH, markerR, name, fontSize, selected, tier = 2, onPress, testID, a11y, children }: Props) {
  const { colors } = useTheme();
  const { scale } = useMapZoom();
  // Sanftes Pulsieren des Auswahlrings
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = selected ? withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true) : withTiming(0, ease);
  }, [selected, pulse]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: 0.85 - pulse.value * 0.5, transform: [{ scale: 1 + pulse.value * 0.18 }] }));
  const dx = useSharedValue(label?.dx ?? markerR + 4);
  const dy = useSharedValue(label?.dy ?? -labelH / 2);
  const lop = useSharedValue(label && shown ? 1 : 0);
  const mop = useSharedValue(shown ? 1 : 0);
  const far = useSharedValue(label && label.slot >= FAR_SLOT ? 1 : 0);

  useEffect(() => {
    if (label) {
      dx.value = withTiming(label.dx, ease);
      dy.value = withTiming(label.dy, ease);
      far.value = withTiming(label.slot >= FAR_SLOT ? 1 : 0, ease);
    }
    lop.value = withTiming(label && shown ? 1 : 0, ease);
    mop.value = withTiming(shown ? 1 : 0, ease);
  }, [label, shown, dx, dy, lop, mop, far]);

  const mStyle = useAnimatedStyle(() => ({ opacity: mop.value, transform: [{ scale: 1 / scale.value }] }));
  const lStyle = useAnimatedStyle(() => ({ opacity: lop.value, transform: [{ scale: 1 / scale.value }, { translateX: dx.value }, { translateY: dy.value }] }));
  const line = useAnimatedStyle(() => {
    // Linie vom nächsten Punkt der Beschriftung zum Markerrand
    const px = Math.min(Math.max(-dx.value, 0), labelW);
    const py = Math.min(Math.max(-dy.value, 0), labelH);
    const vx = -dx.value - px;
    const vy = -dy.value - py;
    const len = Math.max(0, Math.hypot(vx, vy) - markerR);
    return { left: px, top: py - 0.75, width: len, opacity: far.value * 0.8, transform: [{ rotate: `${Math.atan2(vy, vx)}rad` }] };
  });

  return (
    <>
      <Animated.View style={[styles.abs, { left: ax, top: ay, width: labelW, height: labelH, transformOrigin: "left top", pointerEvents: label && shown ? "auto" : "none" }, lStyle]}>
        <Animated.View style={[styles.line, { backgroundColor: colors.mapInk }, line]} />
        <Pressable onPress={onPress} testID={`place-label-${testID}`} accessibilityElementsHidden importantForAccessibility="no" style={styles.fill}>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1}
            style={[
              styles.label,
              { fontSize, lineHeight: labelH - 2, borderRadius: labelH / 2, color: colors.mapInk, backgroundColor: tier === 3 ? "transparent" : colors.glass, shadowColor: colors.mapInk },
              tier === 3 ? [styles.labelMinor, { textShadowColor: colors.surface }] : { fontFamily: fonts.display, fontWeight: tier === 1 ? "800" : "700", letterSpacing: tier === 1 ? 0.4 : 0.2 },
              selected && { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.stationNarrative },
            ]}
          >
            {name}
          </Text>
        </Pressable>
      </Animated.View>
      <Animated.View style={[styles.abs, { left: ax - hit, top: ay - hit, width: hit * 2, height: hit * 2, pointerEvents: shown ? "box-none" : "none" }, mStyle]}>
        <Pressable testID={`place-node-${testID}`} disabled={!shown} accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} style={styles.hit}>
          {selected ? <Animated.View style={[styles.ring, { width: markerR * 3, height: markerR * 3, borderRadius: markerR * 1.5, borderColor: colors.stationNarrative }, ringStyle]} /> : null}
          {children}
          {count > 1 ? (
            <View style={[styles.badge, { backgroundColor: colors.surfaceInverse, borderColor: colors.surface }]}>
              <Text maxFontSizeMultiplier={1} style={[styles.badgeText, { color: colors.onSurfaceInverse }]}>+{count - 1}</Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  fill: { flex: 1, alignItems: "flex-start" },
  hit: { flex: 1, alignItems: "center", justifyContent: "center" },
  line: { position: "absolute", height: 1.5, transformOrigin: "left center", pointerEvents: "none" },
  label: { fontFamily: fonts.text, fontWeight: "800", paddingHorizontal: 8, shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  labelMinor: { fontStyle: "italic", fontWeight: "600", paddingHorizontal: 4, shadowOpacity: 0, elevation: 0, textShadowRadius: 3 },
  ring: { position: "absolute", borderWidth: 2.5 },
  badge: { position: "absolute", right: 0, top: 2, minWidth: 20, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  badgeText: { fontFamily: fonts.text, fontWeight: "900", fontSize: 10 },
});
