import React, { useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, Text, View } from "react-native";

import { fonts, makeStyles, radius, spacing } from "@/src/theme";

import { Icon } from "./Icon";

/** Einband-Farben: wie echte Lederbände – bewusst in hellem und dunklem Modus identisch. */
export type BookTheme = { cover: string; spine: string; ink: string; trim: string };
export const BOOK_THEMES = {
  lexicon: { cover: "#2F4A3A", spine: "#203328", ink: "#F3E6C4", trim: "#D9B45A" }, // grünes Leder, Gold
  timeline: { cover: "#2C3E5C", spine: "#1E2B41", ink: "#EAF0F7", trim: "#C9A55A" }, // Nachtblau, Messing
  mine: { cover: "#7A4E2D", spine: "#5A3820", ink: "#F7EBD9", trim: "#E2C08A" }, // Tagebuch, braunes Leder
  favBible: { cover: "#8A2F3C", spine: "#66212C", ink: "#FBE9EC", trim: "#E8C77A" }, // Bordeaux, Herz
  favLessons: { cover: "#2F6F6A", spine: "#21504C", ink: "#E6F5F3", trim: "#E8C77A" }, // Petrol, Kompass
  photos: { cover: "#B9802F", spine: "#8E6020", ink: "#FFF6E6", trim: "#5A3E14" }, // Fotoalbum, Ocker
  prayer: { cover: "#3F5E8C", spine: "#2C4466", ink: "#EEF3FA", trim: "#E2C08A" }, // Gebetsheft, Taubenblau
  units: { cover: "#5B4372", spine: "#432F56", ink: "#F1E9F8", trim: "#D9B45A" }, // Lila, Lernheft
} satisfies Record<string, BookTheme>;

const WOOD = { plank: "#8B5E34", edge: "#6B4424", back: "#4A3020" };

export function Shelf({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.shelf} testID={testID}>
      <View style={styles.row}>{children}</View>
      <View style={styles.plank} />
      <View style={styles.plankEdge} />
    </View>
  );
}

type BookProps = { title: string; subtitle?: string; icon: string; theme: BookTheme; size: "large" | "small"; onPress: () => void; testID: string; badge?: number };

export function Book({ title, subtitle, icon, theme, size, onPress, testID, badge }: BookProps) {
  const styles = useStyles();
  const large = size === "large";
  const [pull] = useState(() => new Animated.Value(0));
  const busy = useRef(false);
  // Antippen: Buch kippt oben aus dem Regal und hebt sich leicht – danach öffnet es sich.
  const open = async () => {
    if (busy.current) return;
    if (await AccessibilityInfo.isReduceMotionEnabled()) return onPress();
    busy.current = true;
    Animated.timing(pull, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start(() => {
      onPress();
      setTimeout(() => { pull.setValue(0); busy.current = false; }, 350);
    });
  };
  const anim = {
    transformOrigin: "50% 100%",
    transform: [
      { translateY: pull.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
      { rotate: pull.interpolate({ inputRange: [0, 1], outputRange: ["0deg", large ? "-5deg" : "-9deg"] }) },
      { scale: pull.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
    ],
  };
  return (
    <Animated.View style={[styles.bookWrap, anim]}>
    <Pressable testID={testID} onPress={open} accessibilityRole="button" accessibilityLabel={`${title.replace(/-?\n/g, (m) => (m === "\n" ? " " : ""))}${subtitle ? ", " + subtitle : ""}`}
      style={({ pressed }) => [styles.book, large ? styles.bookLarge : styles.bookSmall, { backgroundColor: theme.cover, transform: [{ translateY: pressed ? -4 : 0 }] }]}>
      <View style={[styles.spine, { backgroundColor: theme.spine, width: large ? 16 : 10 }]}>
        <View style={[styles.band, { backgroundColor: theme.trim }]} />
        <View style={[styles.band, { backgroundColor: theme.trim }]} />
      </View>
      <View style={[styles.frame, { borderColor: theme.trim }]}>
        <View style={[styles.emblem, { borderColor: theme.trim, width: large ? 56 : 38, height: large ? 56 : 38 }]}>
          <Icon name={icon} size={large ? 26 : 18} color={theme.trim} />
        </View>
        <Text style={[large ? styles.titleLarge : styles.titleSmall, { color: theme.ink }]} numberOfLines={large ? 2 : 3}>{title}</Text>
        {subtitle ? <Text style={[styles.sub, { color: theme.ink }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {badge ? <View style={[styles.ribbon, { backgroundColor: theme.trim }]}><Text style={[styles.ribbonText, { color: theme.spine }]}>{badge}</Text></View> : null}
    </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles(() => ({
  shelf: { marginBottom: spacing.lg },
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, paddingHorizontal: spacing.sm, paddingTop: spacing.md, backgroundColor: WOOD.back, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  plank: { height: 14, backgroundColor: WOOD.plank, borderTopWidth: 2, borderTopColor: "#A87445" },
  plankEdge: { height: 6, backgroundColor: WOOD.edge, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, boxShadow: "0px 4px 8px rgba(0,0,0,0.25)" },
  bookWrap: { flex: 1 },
  book: { flex: 1, flexDirection: "row", borderTopRightRadius: 6, borderBottomRightRadius: 3, borderTopLeftRadius: 2, overflow: "hidden", boxShadow: "2px 2px 6px rgba(0,0,0,0.35)" },
  bookLarge: { minHeight: 210 },
  bookSmall: { minHeight: 150 },
  spine: { justifyContent: "space-between", paddingVertical: 14, alignItems: "center" },
  band: { width: "100%", height: 3, opacity: 0.85 },
  frame: { flex: 1, margin: 5, borderWidth: 1.5, borderRadius: 3, alignItems: "center", justifyContent: "center", paddingVertical: spacing.sm, paddingHorizontal: 4, gap: 6 },
  emblem: { borderRadius: 999, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  titleLarge: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", textAlign: "center" },
  titleSmall: { fontFamily: fonts.display, fontSize: 13, fontWeight: "700", textAlign: "center", lineHeight: 18 },
  sub: { fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", textAlign: "center", opacity: 0.85 },
  ribbon: { position: "absolute", top: 0, right: 10, minWidth: 22, paddingHorizontal: 4, height: 26, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: "center", justifyContent: "center" },
  ribbonText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "900" },
}));
