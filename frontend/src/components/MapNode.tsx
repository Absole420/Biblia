import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

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
        {status === "available" ? (
          <View style={[styles.availableHalo, { width: size + 14, height: size + 14, borderRadius: (size + 14) / 2, borderColor: colors.brandPrimary }]} />
        ) : null}
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
  medal: { alignItems: "center", justifyContent: "center", shadowColor: "#17221d", shadowOpacity: 0.16, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  availableHalo: { position: "absolute", top: -7, left: -7, borderWidth: 2, opacity: 0.45 },
  inner: { position: "absolute", top: 5, left: 5, right: 5, bottom: 5, borderWidth: 1.5 },
  check: { position: "absolute", right: -3, bottom: -3, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  label: { marginTop: 7, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, alignItems: "center", maxWidth: 232 },
  labelText: { fontFamily: fonts.display, fontWeight: "700", textAlign: "center" },
  sub: { fontFamily: fonts.text, fontWeight: "600", textAlign: "center" },
});
