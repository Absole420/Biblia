import React from "react";
import { Text, View } from "react-native";

import { CERTAINTY_META } from "@/src/data/meta";
import { Place } from "@/src/data/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

export function PlaceSheet({ place, onClose }: { place: Place | null; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const meta = place ? CERTAINTY_META[place.certainty] : null;
  const col = place?.certainty === "secure" ? colors.success : place?.certainty === "traditional" ? colors.brandPrimary : colors.warning;
  return (
    <Sheet visible={!!place} onClose={onClose} title={place?.name} accent={col} testID="place-sheet">
      {place && meta ? (
        <View>
          <View style={[styles.badge, { backgroundColor: col }]} testID="place-certainty">
            <Icon name={place.certainty === "disputed" ? "help-circle" : "map-pin"} size={14} color={colors.surface} />
            <Text style={[styles.badgeText, { color: colors.surface }]}>{meta.label}</Text>
          </View>
          <Text style={styles.small}>{meta.desc}</Text>
          <Text style={styles.body}>{place.note}</Text>
          <Text style={styles.label}>Bibelstellen</Text>
          <Text style={styles.refs}>{place.refs.join(" · ")}</Text>
          <Text style={styles.label}>Koordinaten (Näherung)</Text>
          <Text style={styles.small}>{place.lat.toFixed(3)}° N, {place.lon.toFixed(3)}° O</Text>
        </View>
      ) : null}
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  badge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 12 },
  small: { fontFamily: fonts.text, color: c.muted, fontSize: 13, marginTop: spacing.xs },
  body: { fontFamily: fonts.text, color: c.onSurfaceSecondary, fontSize: 15.5, lineHeight: 23, marginTop: spacing.md },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.lg },
  refs: { fontFamily: fonts.text, color: c.onSurface, fontWeight: "700", fontSize: 15, marginTop: spacing.xs },
}));
