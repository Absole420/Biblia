import React from "react";
import { LayoutChangeEvent, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

type Props = {
  side: boolean; // Tablet: seitlich statt unten
  title?: string;
  accent?: string;
  summary: React.ReactNode;
  children?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSize: (n: number) => void;
  testID: string;
};

/**
 * Nicht-modale Infotafel über der Karte: zunächst kompakte Zusammenfassung, aufklappbar.
 * Smartphone: unten · größere Displays: seitlich. Die Karte bleibt bedienbar.
 */
export function MapPanel({ side, title, accent, summary, children, expanded, onToggle, onClose, onSize, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const onLayout = (e: LayoutChangeEvent) => onSize(Math.round(side ? e.nativeEvent.layout.width : e.nativeEvent.layout.height));
  const head = (
    <View style={styles.header}>
      {title ? <Text style={styles.title} numberOfLines={2}>{title}</Text> : <View style={{ flex: 1 }} />}
      {!side && children ? (
        <Pressable onPress={onToggle} style={styles.round} testID={`${testID}-toggle`} accessibilityRole="button" accessibilityLabel={expanded ? "Weniger anzeigen" : "Mehr anzeigen"} hitSlop={6}>
          <Icon name={expanded ? "chevron-down" : "chevron-up"} size={20} color={colors.onSurfaceSecondary} />
        </Pressable>
      ) : null}
      <Pressable onPress={onClose} style={styles.round} testID={`${testID}-close`} accessibilityRole="button" accessibilityLabel="Schließen" hitSlop={6}>
        <Icon name="x" size={20} color={colors.onSurfaceSecondary} />
      </Pressable>
    </View>
  );
  if (side) {
    return (
      <Animated.View entering={SlideInRight.duration(240)} style={[styles.side, { paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md }]} onLayout={onLayout} testID={testID}>
        {accent ? <View style={[styles.accentSide, { backgroundColor: accent }]} /> : null}
        {head}
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
          {summary}
          {children}
        </ScrollView>
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={SlideInDown.duration(240)} style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md, maxHeight: expanded ? "64%" : "46%" }]} onLayout={onLayout} testID={testID}>
      {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
      <Pressable onPress={children ? onToggle : undefined} style={styles.handleHit} accessibilityElementsHidden importantForAccessibility="no">
        <View style={styles.handle} />
      </Pressable>
      {head}
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: spacing.sm }} scrollEnabled={expanded} keyboardShouldPersistTaps="handled">
        {summary}
        {expanded && children ? <Animated.View entering={FadeIn.duration(200)}>{children}</Animated.View> : null}
      </ScrollView>
      {!expanded && children ? (
        <Pressable onPress={onToggle} style={styles.more} testID={`${testID}-more`} accessibilityRole="button">
          <Text style={styles.moreText}>Mehr anzeigen</Text>
          <Icon name="chevron-up" size={16} color={colors.brandPrimary} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  bottom: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: c.border, overflow: "hidden", boxShadow: "0px -4px 16px rgba(0,0,0,0.16)",
  },
  side: {
    position: "absolute", top: 0, right: 0, bottom: 0, width: 380, backgroundColor: c.surface, paddingHorizontal: spacing.lg,
    borderLeftWidth: 1, borderColor: c.border, boxShadow: "-4px 0px 16px rgba(0,0,0,0.14)",
  },
  accent: { position: "absolute", top: 0, left: 0, right: 0, height: 5 },
  accentSide: { position: "absolute", top: 0, left: 0, bottom: 0, width: 5 },
  handleHit: { alignSelf: "stretch", alignItems: "center", paddingTop: spacing.sm, paddingBottom: 2 },
  handle: { width: 44, height: 5, borderRadius: radius.pill, backgroundColor: c.borderStrong },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 20, color: c.onSurface, fontWeight: "600" },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  scroll: { flexGrow: 0, flexShrink: 1 },
  more: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, height: 40 },
  moreText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 14, color: c.brandPrimary },
}));

