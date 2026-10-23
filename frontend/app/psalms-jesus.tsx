import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { RefText } from "@/src/components/RefText";
import { CONNECTION_META } from "@/src/components/StationExtras";
import { ConnectionKind } from "@/src/data/types";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

// Sammlung „Jesus in den Psalmen“: Einträge erscheinen vollständig, sobald die zugehörige Einheit abgeschlossen ist.
const ENTRIES: { psalm: string; title: string; unit: string; unitTitle: string; kind: ConnectionKind; refs: string; israel: string; nt: string }[] = [
  { psalm: "Psalm 2", title: "Der Gesalbte und Sohn", unit: "ps1-3", unitTitle: "1.3 Psalm 2", kind: "nt", refs: "Ps 2,1–2.7 → Apg 4,25–26; Apg 13,33; Hebr 1,5", israel: "Lied zur Einsetzung des Davidkönigs auf dem Zion.", nt: "Die Gemeinde deutet den Aufruhr gegen Jesus; Paulus bezieht „Du bist mein Sohn“ auf die Auferweckung." },
  { psalm: "Psalm 8", title: "Die Berufung des Menschen", unit: "ps1-10", unitTitle: "1.10 Psalm 8 und 145", kind: "nt", refs: "Ps 8,4–6 → Hebr 2,6–9", israel: "Staunen über die geschenkte Würde jedes Menschen.", nt: "Hebräer 2: In Jesus, „mit Herrlichkeit und Ehre gekrönt“, kommt die menschliche Berufung zum Ziel." },
  { psalm: "Psalm 16", title: "Nicht dem Tod überlassen", unit: "ps2-10", unitTitle: "2.10 Psalm 16, 69 und 110", kind: "nt", refs: "Ps 16,8–11 → Apg 2,25–31", israel: "Vertrauen des Frommen, nicht dem Scheol zu verfallen.", nt: "Petrus: David ist begraben – er sprach von der Auferstehung des Christus." },
  { psalm: "Psalm 22", title: "Verlassenheit und Lob", unit: "ps2-2", unitTitle: "2.2 Psalm 22", kind: "nt", refs: "Ps 22,1 → Mt 27,46; Ps 22,7–8 → Mt 27,39–43; Ps 22,18 → Joh 19,24; Ps 22,22 → Hebr 2,12", israel: "Klage eines Leidenden, die in Lob und Hoffnung für die Völker mündet.", nt: "Jesus betet V. 1 am Kreuz; Johannes zitiert V. 18; Hebr 2 nimmt V. 22 auf. V. 16 ist textlich schwierig und wird nicht zitiert." },
  { psalm: "Psalm 23", title: "Der Hirte", unit: "ps1-4", unitTitle: "1.4 Psalm 23", kind: "theme", refs: "Ps 23,1 ↔ Joh 10,11–14", israel: "Gott als Hirte und Gastgeber, auch im dunklen Tal.", nt: "Jesus nennt sich der gute Hirte – gemeinsames Motiv, kein Zitat." },
  { psalm: "Psalm 69", title: "Eifer und Durst", unit: "ps2-10", unitTitle: "2.10 Psalm 16, 69 und 110", kind: "nt", refs: "Ps 69,9 → Joh 2,17; Ps 69,21 → Joh 19,28–29", israel: "Klage eines Gerechten, der wegen seiner Treue verspottet wird.", nt: "Tempelreinigung (Zitat) und Essig am Kreuz (erkennbare Bezugnahme)." },
  { psalm: "Psalm 110", title: "König und Priester", unit: "ps2-10", unitTitle: "2.10 Psalm 16, 69 und 110", kind: "nt", refs: "Ps 110,1 → Mk 12,36; Apg 2,34–35; Ps 110,4 → Hebr 7,17", israel: "Königspsalm: Der König sitzt zur Rechten Gottes, Priester nach der Weise Melchisedeks.", nt: "Erhöhung Jesu zur Rechten Gottes; ewiges Priestertum im Hebräerbrief." },
  { psalm: "Psalm 118", title: "Der verworfene Stein", unit: "ps1-8", unitTitle: "1.8 Psalm 118", kind: "nt", refs: "Ps 118,25–26 → Mk 11,9; Ps 118,22–23 → Mk 12,10–11; Apg 4,11", israel: "Dankfest: Gott macht den Verworfenen zum Eckstein.", nt: "Einzug in Jerusalem, Gleichnis von den Weingärtnern, Predigt des Petrus." },
];

export default function JesusInPsalms() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useProgress();
  const open = ENTRIES.filter((e) => state.stations[e.unit]).length;
  return (
    <View style={styles.root} testID="jesus-psalms-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} testID="jesus-psalms-back" accessibilityLabel="Zurück">
          <Icon name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.hTitle}>Jesus in den Psalmen</Text>
          <Text style={styles.hSub}>{open} von {ENTRIES.length} Einträgen freigeschaltet</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
        <Text style={styles.intro}>Die Psalmen sind zuerst Gebete Israels. Diese Sammlung zeigt, wie das Neue Testament sie auf Jesus bezieht – ohne ihren ursprünglichen Sinn unsichtbar zu machen. Einträge werden nach Abschluss der jeweiligen Einheit freigeschaltet.</Text>
        {ENTRIES.map((e) => {
          const done = !!state.stations[e.unit];
          const m = CONNECTION_META[e.kind];
          return (
            <View key={e.psalm} style={[styles.card, !done && { opacity: 0.75 }]} testID={`jesus-entry-${e.psalm.replace(" ", "-")}`}>
              <View style={styles.row}>
                <Text style={styles.psalm}>{e.psalm}</Text>
                <Icon name={done ? "unlock" : "lock"} size={16} color={done ? colors.success : colors.muted} />
              </View>
              <Text style={styles.title}>{e.title}</Text>
              <View style={styles.tag}><Icon name={m.icon} size={12} color={colors.info} /><Text style={styles.tagText}>{m.label}</Text></View>
              {done ? (
                <>
                  <RefText text={e.refs} style={styles.refs} />
                  <Text style={styles.label}>Als Text Israels</Text>
                  <Text style={styles.body}>{e.israel}</Text>
                  <Text style={styles.label}>Im Neuen Testament</Text>
                  <Text style={styles.body}>{e.nt}</Text>
                </>
              ) : (
                <Text style={styles.body}>Wird freigeschaltet nach Einheit {e.unitTitle}.</Text>
              )}
              <Pressable onPress={() => router.push({ pathname: "/station/[id]", params: { id: e.unit } })} style={styles.link} testID={`jesus-open-${e.unit}-${e.psalm.replace(" ", "-")}`}>
                <Text style={styles.linkText}>{done ? "Einheit wiederholen" : "Zur Einheit"}</Text>
                <Icon name="chevron-right" size={14} color={colors.brandPrimary} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  hTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface },
  hSub: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: c.muted },
  intro: { fontFamily: fonts.text, fontSize: 14.5, lineHeight: 21, color: c.onSurfaceSecondary },
  card: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  psalm: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.brandPrimary, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: 19, fontWeight: "700", color: c.onSurface },
  tag: { flexDirection: "row", alignItems: "center", gap: 4 },
  tagText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.info, textTransform: "uppercase" },
  refs: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: c.onSurface },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted, marginTop: 4 },
  body: { fontFamily: fonts.text, fontSize: 14.5, lineHeight: 21, color: c.onSurfaceSecondary },
  link: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 },
  linkText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800", color: c.brandPrimary },
}));
