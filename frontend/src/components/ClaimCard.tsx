import React from "react";
import { Text, View } from "react-native";

import { CLAIM_META } from "@/src/data/meta";
import { Claim } from "@/src/data/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

/** Gekennzeichnete fachliche Aussage (Bibeltext / Geschichte / Hypothese / Tradition). */
export function ClaimCard({ claim, fontScale = 1, testID }: { claim: Claim; fontScale?: number; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const meta = CLAIM_META[claim.kind];
  const col = colors[meta.color];
  return (
    <View style={[styles.card, { borderLeftColor: col }]} testID={testID}>
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: col }]}>
          <Icon name={meta.icon} size={12} color={colors.surface} />
          <Text style={[styles.tagText, { color: colors.surface }]}>{meta.label}</Text>
        </View>
      </View>
      {claim.title ? <Text style={[styles.title, { fontSize: 18 * fontScale }]}>{claim.title}</Text> : null}
      <Text style={[styles.text, { fontSize: 15.5 * fontScale, lineHeight: 24 * fontScale }]}>{claim.text}</Text>
      {claim.refs?.length ? <Text style={styles.refs}>Vgl. {claim.refs.join(" · ")}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderLeftWidth: 5, marginBottom: spacing.md, borderWidth: 1, borderColor: c.border },
  tagRow: { flexDirection: "row", marginBottom: spacing.sm },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  tagText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  title: { fontFamily: fonts.display, color: c.onSurface, fontWeight: "600", marginBottom: spacing.xs },
  text: { fontFamily: fonts.text, color: c.onSurfaceSecondary },
  refs: { fontFamily: fonts.text, color: c.brandPrimary, fontWeight: "700", fontSize: 13, marginTop: spacing.sm },
}));
