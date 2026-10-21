import React from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";

import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: string;
  disabled?: boolean;
  testID: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = "primary", icon, disabled, testID, style }: BtnProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const bg = { primary: colors.brandPrimary, secondary: colors.surfaceTertiary, ghost: "transparent", danger: colors.error }[variant];
  const fg = { primary: colors.onBrandPrimary, secondary: colors.onSurfaceTertiary, ghost: colors.onSurface, danger: colors.onError }[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        variant === "ghost" && { borderWidth: 1, borderColor: colors.borderStrong },
        variant === "primary" && styles.glow,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, testID, color }: { label: string; selected?: boolean; onPress: () => void; testID: string; color?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? colors.surfaceInverse : colors.surfaceSecondary, borderColor: selected ? colors.surfaceInverse : colors.border }]}
    >
      {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.chipText, { color: selected ? colors.onSurfaceInverse : colors.onSurfaceSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color, height = 8, testID }: { value: number; color?: string; height?: number; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ height, borderRadius: height, backgroundColor: colors.surfaceTertiary, overflow: "hidden" }}>
      <View style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, height, borderRadius: height, backgroundColor: color ?? colors.brandPrimary }} />
    </View>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {right}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  btn: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: spacing.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  glow: { shadowColor: c.brandPrimary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  btnText: { fontFamily: fonts.text, fontSize: 16, fontWeight: "700" },
  chip: { height: 36, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "600" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl, marginBottom: spacing.md },
  section: { fontFamily: fonts.display, fontSize: 20, color: c.onSurface, fontWeight: "600" },
}));
