import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { PulseRing } from "./MapAnimations";

type Props = {
  x: number;
  y: number;
  size: number;
  color: string;
  iconColor: string;
  icon: string;
  label: string;
  sublabel?: string;
  status: "locked" | "available" | "completed";
  labelSize?: number;
  onPress: () => void;
  testID: string;
};

/** Interaktive Lernstation (Medaillon) auf einer Karte – Koordinaten in Kartenpixeln. */
export function MapNode({ x, y, size, color, iconColor, icon, label, sublabel, status, labelSize = 22, onPress, testID }: Props) {
  const { colors } = useTheme();
  const locked = status === "locked";
  return (
    <View style={[styles.wrap, { left: x - 130, top: y - size / 2, width: 260, pointerEvents: "box-none" }]}>
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}${locked ? ", gesperrt" : status === "completed" ? ", abgeschlossen" : ", verfügbar"}`}
        hitSlop={10}
        style={({ pressed }) => [{ width: size, height: size, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
      >
        {status === "available" ? <PulseRing size={size} color={colors.brandPrimary} /> : null}
        <View
          style={[
            styles.medal,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: locked ? colors.mapLocked : color,
              borderColor: status === "completed" ? colors.brandPrimary : colors.mapInk,
              borderWidth: status === "completed" ? size * 0.08 : size * 0.05,
            },
          ]}
        >
          <View style={[styles.inner, { borderRadius: size, borderColor: "rgba(255,255,255,0.35)" }]} />
          <Icon name={locked ? "lock" : icon} size={size * 0.42} color={locked ? colors.surface : iconColor} />
        </View>
        {status === "completed" ? (
          <View style={[styles.check, { backgroundColor: colors.brandPrimary, width: size * 0.38, height: size * 0.38, borderRadius: size, borderColor: colors.surface }]}>
            <Icon name="check" size={size * 0.24} color={colors.onBrandPrimary} />
          </View>
        ) : null}
      </Pressable>
      <View style={[styles.label, { backgroundColor: colors.glass, borderColor: colors.border, pointerEvents: "none" }]}>
        <Text style={[styles.labelText, { fontSize: labelSize, color: locked ? colors.muted : colors.onSurface }]} numberOfLines={2}>
          {label}
        </Text>
        {sublabel ? <Text style={[styles.sub, { fontSize: labelSize * 0.68, color: colors.muted }]} numberOfLines={1}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", alignItems: "center" },
  medal: { alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  inner: { position: "absolute", top: 6, left: 6, right: 6, bottom: 6, borderWidth: 2 },
  check: { position: "absolute", right: -4, bottom: -4, alignItems: "center", justifyContent: "center", borderWidth: 3 },
  label: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, borderWidth: 1, alignItems: "center", maxWidth: 260 },
  labelText: { fontFamily: fonts.display, fontWeight: "700", textAlign: "center" },
  sub: { fontFamily: fonts.text, fontWeight: "600", textAlign: "center" },
});
