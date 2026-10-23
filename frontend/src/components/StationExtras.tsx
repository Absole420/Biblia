import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ARTICLE_BY_ID } from "@/src/data/articles";
import { Connection, ConnectionKind } from "@/src/data/types";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { AvatarView } from "./AvatarView";
import { Icon } from "./Icon";
import { InfoChip } from "./InfoSheet";
import { RefText } from "./RefText";

export const CONNECTION_META: Record<ConnectionKind, { label: string; icon: string; desc: string }> = {
  quote: { label: "Direktes Zitat", icon: "message-square", desc: "Der Text wird wörtlich oder nahezu wörtlich angeführt." },
  allusion: { label: "Erkennbare Anspielung", icon: "corner-down-right", desc: "Wörter oder Bilder werden deutlich aufgegriffen, ohne Zitat." },
  parallel: { label: "Thematische Parallele", icon: "git-merge", desc: "Ähnliches Motiv oder Muster, keine direkte Abhängigkeit." },
  interpretation: { label: "Spätere Auslegung", icon: "book-open", desc: "Deutung durch spätere Texte oder Traditionen." },
  nt: { label: "Im Neuen Testament auf Jesus bezogen", icon: "check-square", desc: "Das NT bezieht die Stelle ausdrücklich auf Jesus (konkrete Stelle genannt)." },
  foreshadow: { label: "Christliche Vorausdeutung", icon: "sunrise", desc: "Christliche Auslegung über den ursprünglichen Zusammenhang hinaus." },
  theme: { label: "Thematische Verbindung zu Jesus", icon: "git-merge", desc: "Gemeinsames Motiv, keine Prophetie-Behauptung." },
};

export function GoalBox({ goal }: { goal?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (!goal) return null;
  return (
    <View style={styles.goal} testID="station-goal">
      <Icon name="target" size={18} color={colors.brandPrimary} />
      <View style={{ flex: 1 }}><Text style={styles.goalLabel}>Lernziel</Text><Text style={styles.goalText}>{goal}</Text></View>
    </View>
  );
}

export function InfoChips({ ids }: { ids?: string[] }) {
  const styles = useStyles();
  if (!ids?.length) return null;
  return (
    <View testID="station-info-chips">
      <Text style={styles.label}>Infotafeln – Personen, Orte, Begriffe</Text>
      <View style={styles.wrap}>{ids.map((id) => <InfoChip key={id} id={id} />)}</View>
    </View>
  );
}

/** Links zu ausgearbeiteten Lexikonartikeln. */
export function LexiconLinks({ ids }: { ids?: string[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const list = (ids ?? []).filter((id) => ARTICLE_BY_ID[id]);
  if (!list.length) return null;
  return (
    <View testID="station-lexicon-links">
      <Text style={styles.label}>Im Lexikon nachlesen</Text>
      <View style={styles.wrap}>
        {list.map((id) => (
          <Pressable key={id} testID={`lexicon-link-${id}`} accessibilityRole="link" onPress={() => router.push({ pathname: "/lexicon/[id]", params: { id } })} style={styles.lexChip}>
            <Icon name="book" size={14} color={colors.brandPrimary} />
            <Text style={styles.lexText}>{ARTICLE_BY_ID[id].title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Connections({ list }: { list?: Connection[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (!list?.length) return null;
  return (
    <View testID="station-connections" style={{ marginTop: spacing.lg }}>
      <Text style={styles.h2}>Bezüge zwischen den Testamenten</Text>
      {list.map((c, i) => {
        const m = CONNECTION_META[c.kind];
        return (
          <View key={i} style={styles.conn} testID={`connection-${i}`}>
            <View style={styles.connHead}><Icon name={m.icon} size={14} color={colors.info} /><Text style={styles.connKind}>{m.label}</Text></View>
            <RefText text={`${c.from} → ${c.to}`} style={styles.connRefs} />
            <Text style={styles.connNote}>{c.note}</Text>
            {c.jewish ? <Text style={styles.connJewish}>Jüdische Perspektive: {c.jewish}</Text> : null}
          </View>
        );
      })}
      <Text style={styles.legend}>{[...new Set(list.map((c) => c.kind))].map((k) => `${CONNECTION_META[k].label}: ${CONNECTION_META[k].desc}`).join("  ·  ")}</Text>
    </View>
  );
}

/** Persönliche Lernfigur mit kurzer, dezenter Rückmeldung. */
export function AvatarCheer({ text, testID }: { text: string; testID?: string }) {
  const styles = useStyles();
  const { state } = useProgress();
  if (!state.avatar) return null;
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.cheer} testID={testID}>
      <View style={styles.cheerAv}><AvatarView a={state.avatar} size={64} mode="head" /></View>
      <View style={styles.bubble}><Text style={styles.bubbleName}>{state.avatar.name}</Text><Text style={styles.bubbleText}>{text}</Text></View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  goal: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderLeftWidth: 4, borderLeftColor: c.brandPrimary, marginTop: spacing.md },
  goalLabel: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.brandPrimary, textTransform: "uppercase", letterSpacing: 1 },
  goalText: { fontFamily: fonts.text, fontSize: 15, color: c.onSurface, lineHeight: 21, marginTop: 2 },
  label: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.muted, marginTop: spacing.lg, marginBottom: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  h2: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface, marginBottom: spacing.sm },
  lexChip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  lexText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: c.onSurface },
  conn: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, marginBottom: spacing.sm, gap: 4 },
  connHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  connKind: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.info, textTransform: "uppercase" },
  connRefs: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: c.onSurface },
  connNote: { fontFamily: fonts.text, fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20 },
  connJewish: { fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary, fontStyle: "italic" },
  legend: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: spacing.xs },
  cheer: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginVertical: spacing.md },
  cheerAv: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", backgroundColor: c.mapLand, borderWidth: 2, borderColor: c.brandPrimary },
  bubble: { flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border },
  bubbleName: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.brandPrimary },
  bubbleText: { fontFamily: fonts.text, fontSize: 14, color: c.onSurface },
}));
