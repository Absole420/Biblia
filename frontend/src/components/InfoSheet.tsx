import { useRouter } from "expo-router";

import { ARTICLE_BY_ID } from "@/src/data/articles";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { INFO_BY_ID, KIND_META, mapForPlace } from "@/src/data/lexicon";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { RefText } from "./RefText";
import { Sheet } from "./Sheet";

const InfoContext = createContext<{ open: (id: string) => void }>({ open: () => {} });
export const useInfo = () => useContext(InfoContext);

/** Globale Infotafel: über Begriffe, Kartenmarker oder Symbole aufrufbar; Schließen führt zur Leseposition zurück. */
export function InfoProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const open = useCallback((x: string) => { if (INFO_BY_ID[x]) setId(x); }, []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <InfoContext.Provider value={value}>
      {children}
      <InfoSheet id={id} onClose={() => setId(null)} onOpen={setId} />
    </InfoContext.Provider>
  );
}

function InfoSheet({ id, onClose, onOpen }: { id: string | null; onClose: () => void; onOpen: (id: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const e = id ? INFO_BY_ID[id] : null;
  const mapId = e?.placeId ? mapForPlace(e.placeId) : null;
  return (
    <Sheet visible={!!e} onClose={onClose} title={e?.name} accent={colors.brandPrimary} testID="info-sheet">
      {e ? (
        <View style={{ gap: spacing.md }}>
          <View style={styles.row}>
            <View style={styles.badge}><Icon name={KIND_META[e.kind].icon} size={13} color={colors.onBrandPrimary} /><Text style={styles.badgeText}>{KIND_META[e.kind].label}</Text></View>
            {e.yearLabel ? <Text style={styles.year}>{e.yearLabel}</Text> : null}
          </View>
          <Text style={styles.summary}>{e.summary}</Text>
          <Text style={styles.body}>{e.details}</Text>
          {e.uncertain ? (
            <View style={styles.warn}><Icon name="help-circle" size={15} color={colors.warning} /><Text style={styles.warnText}>Unsicherheit: {e.uncertain}</Text></View>
          ) : null}
          <Text style={styles.label}>Bibelstellen</Text>
          <RefText text={e.refs} style={styles.body} testID="info-refs" />
          <View style={styles.row}>
            {mapId ? (
              <Pressable testID="info-show-map" style={styles.btn} onPress={() => { onClose(); router.navigate({ pathname: "/", params: { theme: mapId, place: e.placeId } }); }}>
                <Icon name="map-pin" size={15} color={colors.brandPrimary} /><Text style={styles.btnText}>Auf der Karte zeigen</Text>
              </Pressable>
            ) : null}
            {ARTICLE_BY_ID[e.id] ? (
              <Pressable testID="info-open-article" style={styles.btn} onPress={() => { onClose(); router.push({ pathname: "/lexicon/[id]", params: { id: e.id } }); }}>
                <Icon name="book-open" size={15} color={colors.brandPrimary} /><Text style={styles.btnText}>Ganzen Artikel lesen</Text>
              </Pressable>
            ) : null}
            {e.year !== undefined ? (
              <Pressable testID="info-show-timeline" style={styles.btn} onPress={() => { onClose(); router.push({ pathname: "/timeline", params: { focus: e.id } }); }}>
                <Icon name="clock" size={15} color={colors.brandPrimary} /><Text style={styles.btnText}>Im Zeitstrahl</Text>
              </Pressable>
            ) : null}
          </View>
          {e.related?.length ? (
            <>
              <Text style={styles.label}>Verknüpft</Text>
              <View style={styles.row}>
                {e.related.filter((r) => INFO_BY_ID[r]).map((r) => <InfoChip key={r} id={r} onPress={() => onOpen(r)} />)}
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

/** Antippbares Symbol/Chip für eine Infotafel. */
export function InfoChip({ id, onPress }: { id: string; onPress?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { open } = useInfo();
  const e = INFO_BY_ID[id];
  if (!e) return null;
  return (
    <Pressable testID={`info-chip-${id}`} onPress={onPress ?? (() => open(id))} style={styles.chip} accessibilityLabel={`Infotafel ${e.name}`}>
      <Icon name={KIND_META[e.kind].icon} size={13} color={colors.brandPrimary} />
      <Text style={styles.chipText}>{e.name}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.brandPrimary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.onBrandPrimary },
  year: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: c.muted },
  summary: { fontFamily: fonts.display, fontSize: 17, color: c.onSurface, lineHeight: 24 },
  body: { fontFamily: fonts.text, fontSize: 15, color: c.onSurfaceSecondary, lineHeight: 22 },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted, textTransform: "uppercase", letterSpacing: 1 },
  warn: { flexDirection: "row", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: c.warning, backgroundColor: c.surfaceSecondary },
  warnText: { flex: 1, fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.brandPrimary },
  btnText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800", color: c.brandPrimary },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  chipText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurface },
}));
