import React from "react";
import { Text, View } from "react-native";

import { LEXICON } from "@/src/data/lexicon";
import { CERTAINTY_META } from "@/src/data/meta";
import { GeoPlace } from "@/src/data/themeMaps";
import { Place } from "@/src/data/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { InfoChip } from "./InfoSheet";
import { RefText } from "./RefText";
import { Sheet } from "./Sheet";

export function PlaceSheet({ place, onClose }: { place: (Place | GeoPlace) | null; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const meta = place ? CERTAINTY_META[place.certainty] : null;
  const col = place?.certainty === "secure" ? colors.success : place?.certainty === "traditional" ? colors.brandPrimary : colors.warning;
  const g = place as GeoPlace | null;
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
          {LEXICON.some((e) => e.placeId === place.id) ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md }} testID="place-info-chips">
              {LEXICON.filter((e) => e.placeId === place.id).map((e) => <InfoChip key={e.id} id={e.id} />)}
            </View>
          ) : null}
          {g?.events?.length ? (
            <>
              <Text style={styles.label}>Ereignisse</Text>
              {g.events.map((e) => (
                <View key={e.title} style={styles.event}>
                  <Icon name="star" size={14} color={colors.brandPrimary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{e.title}</Text>
                    <RefText text={e.ref} style={styles.small} />
                  </View>
                </View>
              ))}
            </>
          ) : null}
          {g?.figures?.length ? (
            <>
              <Text style={styles.label}>Personen</Text>
              <View style={styles.figs}>
                {g.figures.map((f) => (
                  <View key={f} style={styles.fig}><Icon name="user" size={12} color={colors.onSurfaceSecondary} /><Text style={styles.figText}>{f}</Text></View>
                ))}
              </View>
            </>
          ) : null}
          {place.refs.length ? (
            <>
              <Text style={styles.label}>Bibelstellen (antippen zum Lesen)</Text>
              <RefText text={place.refs.join("; ")} style={styles.refs} testID="place-refs" />
            </>
          ) : null}
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
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.lg, marginBottom: spacing.xs },
  refs: { fontFamily: fonts.text, color: c.onSurface, fontSize: 15, lineHeight: 24 },
  event: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", marginTop: spacing.sm },
  eventTitle: { fontFamily: fonts.display, fontSize: 16, fontWeight: "700", color: c.onSurface },
  figs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  fig: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, height: 30, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary },
  figText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary },
}));
