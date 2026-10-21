import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip, SectionTitle } from "@/src/components/ui";
import { TRANSLATIONS } from "@/src/data/bible";
import { exportState, pickImport } from "@/src/lib/backup";
import { CATEGORY_PALETTE, uid } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function SettingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const p = useProgress();
  const { state } = p;
  const [confirmReset, setConfirmReset] = useState(false);
  const [colorFor, setColorFor] = useState<string | null>(null);

  const doExport = async () => {
    try {
      toast.show(await exportState(state));
    } catch {
      toast.show("Export fehlgeschlagen", "error");
    }
  };
  const doImport = async () => {
    try {
      const res = await pickImport();
      if (!res) return;
      if (!res.ok) return toast.show(res.error, "error");
      p.replaceState(res.state);
      toast.show("Lernstand importiert");
    } catch {
      toast.show("Datei konnte nicht gelesen werden", "error");
    }
  };

  return (
    <View style={styles.root} testID="settings-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="settings-back-button" accessibilityLabel="Zurück">
          <Icon name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Einstellungen</Text>
      </View>
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xxl }}>
        <SectionTitle>Darstellung</SectionTitle>
        <View style={styles.row}>
          {([["system", "System"], ["light", "Hell"], ["dark", "Dunkel"]] as const).map(([k, l]) => (
            <Chip key={k} testID={`theme-${k}`} label={l} selected={state.settings.theme === k} onPress={() => p.setSettings({ theme: k })} />
          ))}
        </View>
        <Text style={styles.label}>Schriftgröße</Text>
        <View style={styles.row}>
          {([[0.9, "Klein"], [1, "Normal"], [1.15, "Groß"], [1.3, "Sehr groß"]] as const).map(([k, l]) => (
            <Chip key={k} testID={`font-${k}`} label={l} selected={state.settings.fontScale === k} onPress={() => p.setSettings({ fontScale: k })} />
          ))}
        </View>
        <Text style={[styles.preview, { fontSize: 17 * state.settings.fontScale }]}>Im Anfang war das Wort … (Vorschau)</Text>

        <SectionTitle>Bibelübersetzung</SectionTitle>
        {Object.values(TRANSLATIONS).map((t) => (
          <Pressable key={t.id} testID={`translation-${t.id}`} onPress={() => p.setSettings({ translation: t.id })} style={[styles.option, state.settings.translation === t.id && { borderColor: colors.brandPrimary }]}>
            <Icon name={state.settings.translation === t.id ? "check-circle" : "circle"} size={20} color={state.settings.translation === t.id ? colors.brandPrimary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{t.name}{t.available ? "" : " · Platzhalter"}</Text>
              <Text style={styles.small}>{t.license}</Text>
            </View>
          </Pressable>
        ))}

        <SectionTitle right={
          <Pressable testID="category-add" onPress={() => p.setCategories([...state.categories, { id: uid(), name: "Neues Thema", color: CATEGORY_PALETTE[state.categories.length % CATEGORY_PALETTE.length] }])} hitSlop={8} style={styles.addBtn}>
            <Icon name="plus" size={18} color={colors.onSurface} />
          </Pressable>
        }>Markierungsfarben</SectionTitle>
        {state.categories.map((c) => (
          <View key={c.id} style={styles.catRow} testID={`category-row-${c.id}`}>
            <Pressable testID={`category-color-${c.id}`} onPress={() => setColorFor(c.id)} style={[styles.swatch, { backgroundColor: c.color }]} accessibilityLabel={`Farbe für ${c.name} ändern`} />
            <TextInput
              testID={`category-name-${c.id}`}
              value={c.name}
              onChangeText={(t) => p.setCategories(state.categories.map((x) => (x.id === c.id ? { ...x, name: t } : x)))}
              style={styles.catInput}
            />
            <Pressable testID={`category-delete-${c.id}`} onPress={() => state.categories.length > 1 && p.setCategories(state.categories.filter((x) => x.id !== c.id))} hitSlop={8} accessibilityLabel="Thema löschen">
              <Icon name="trash-2" size={18} color={colors.error} />
            </Pressable>
          </View>
        ))}

        <SectionTitle>Lernstand sichern</SectionTitle>
        <Text style={styles.small}>Alle Daten bleiben lokal auf deinem Gerät. Keine Registrierung nötig.</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button testID="export-button" label="Als JSON exportieren" icon="upload" variant="secondary" onPress={doExport} />
          <Button testID="import-button" label="JSON importieren" icon="download" variant="secondary" onPress={doImport} />
          <Button testID="reset-button" label="Lernstand zurücksetzen" icon="trash-2" variant="ghost" onPress={() => setConfirmReset(true)} />
        </View>

        <SectionTitle>Über BIBLIA</SectionTitle>
        <Text style={styles.small}>Version 0.1 · Bibeltext: Elberfelder 1905 (gemeinfrei). Karten-Koordinaten: OpenBible.info (CC BY 4.0), Pleiades (CC BY 3.0). Illustrationen sind Platzhalter-Vektorgrafiken.</Text>
      </KeyboardAwareScrollView>

      <Sheet visible={!!colorFor} onClose={() => setColorFor(null)} title="Farbe wählen" testID="color-sheet">
        <View style={styles.palette}>
          {CATEGORY_PALETTE.map((col) => (
            <Pressable key={col} testID={`palette-${col}`} style={[styles.bigSwatch, { backgroundColor: col }]} onPress={() => { p.setCategories(state.categories.map((x) => (x.id === colorFor ? { ...x, color: col } : x))); setColorFor(null); }} />
          ))}
        </View>
      </Sheet>
      <Sheet visible={confirmReset} onClose={() => setConfirmReset(false)} title="Lernstand zurücksetzen?" testID="reset-sheet">
        <Text style={styles.small}>Alle EP, Stationen, Notizen und Markierungen werden gelöscht. Exportiere vorher deinen Lernstand, wenn du ihn behalten möchtest.</Text>
        <Button testID="reset-confirm-button" label="Endgültig zurücksetzen" variant="danger" icon="trash-2" style={{ marginTop: spacing.xl }} onPress={() => { p.reset(); setConfirmReset(false); toast.show("Lernstand zurückgesetzt"); }} />
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 24, fontWeight: "700", color: c.onSurface },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  preview: { fontFamily: fonts.display, color: c.onSurface, marginTop: spacing.md },
  option: { flexDirection: "row", gap: spacing.md, alignItems: "center", padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary, marginBottom: spacing.sm },
  optTitle: { fontFamily: fonts.display, fontSize: 16, fontWeight: "700", color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 13, color: c.muted, lineHeight: 19 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  catRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: c.border },
  catInput: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.md, fontFamily: fonts.text, fontSize: 15, color: c.onSurface },
  palette: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  bigSwatch: { width: 56, height: 56, borderRadius: 28 },
}));
