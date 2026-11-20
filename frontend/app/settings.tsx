import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip, SectionTitle } from "@/src/components/ui";
import { TRANSLATIONS } from "@/src/data/bible";
import { exportState, pickImport } from "@/src/lib/backup";
import { useBackupReminder } from "@/src/lib/backupReminder";
import { exportFullBackup, pickAndRestoreFullBackup } from "@/src/lib/fullBackup";
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
  const [confirmFull, setConfirmFull] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<"weekly" | "before" | null>(null);
  const [pendingImport, setPendingImport] = useState<typeof state | null>(null);
  const [busy, setBusy] = useState(false);
  const [colorFor, setColorFor] = useState<string | null>(null);
  const reminder = useBackupReminder();

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
      setPendingImport(res.state);
    } catch {
      toast.show("Datei konnte nicht gelesen werden", "error");
    }
  };

  const doFull = async () => {
    try {
      toast.show(await exportFullBackup(state));
    } catch {
      toast.show("Vollsicherung fehlgeschlagen", "error");
    }
  };
  const doRestore = async () => {
    try {
      const r = await pickAndRestoreFullBackup();
      if (!r) return;
      if (!r.ok) return toast.show(r.error, "error");
      try {
        await p.replaceState(r.state);
      } catch {
        await r.rollback();
        return toast.show("Wiederherstellung fehlgeschlagen. Der vorherige Stand wurde wiederhergestellt.", "error");
      }
      await r.commit();
      toast.show(`Wiederhergestellt: Lernstand, ${r.entries} ${r.entries === 1 ? "Tagebucheintrag" : "Tagebucheinträge"}, ${r.photos} ${r.photos === 1 ? "Foto" : "Fotos"}${r.media ? `, ${r.media} Mediendateien` : ""}. Bitte App einmal neu starten.`);
    } catch {
      toast.show("Wiederherstellung fehlgeschlagen", "error");
    }
  };
  const run = async (action: () => Promise<void>, success: string) => {
    if (busy) return;
    setBusy(true);
    try { await action(); toast.show(success); }
    catch { toast.show("Vorgang fehlgeschlagen. Bitte Speicher prüfen.", "error"); }
    finally { setBusy(false); }
  };

  return (
    <View style={styles.root} testID="settings-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} testID="settings-back-button" accessibilityLabel="Zurück">
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
        <Text style={styles.label}>Kartenanimationen (Wellen, Schiffe, Bäume)</Text>
        <View style={styles.row}>
          {([[true, "An"], [false, "Aus"]] as const).map(([k, l]) => (
            <Chip key={l} testID={`map-motion-${l}`} label={l} selected={(state.settings.mapMotion !== false) === k} onPress={() => p.setSettings({ mapMotion: k })} />
          ))}
        </View>

        <SectionTitle>Bibelübersetzung</SectionTitle>
        {Object.values(TRANSLATIONS).map((t) => (
          <Pressable key={t.id} testID={`translation-${t.id}`} onPress={() => p.setSettings({ translation: t.id })} style={[styles.option, state.settings.translation === t.id && { borderColor: colors.brandPrimary }]}>
            <Icon name={state.settings.translation === t.id ? "check-circle" : "circle"} size={20} color={state.settings.translation === t.id ? colors.brandPrimary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{t.name}{t.available ? " · verfügbar" : " · nicht lizenziert – Anzeige: Elberfelder 1905"}</Text>
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
        <Text style={styles.small}>Alle 7 Tage bei geöffneter App wird automatisch ein lokaler Lernstand gesichert. Die zwei jüngsten Sicherungen bleiben erhalten.</Text>
        <Text style={styles.small} testID="guardian-last-backup">Letzte Sicherung: {p.lastBackup === null ? "Noch keine" : new Date(p.lastBackup).toLocaleString("de-DE")}</Text>
        {p.backupError ? <Text style={[styles.small, { color: colors.error }]}>Wochensicherung fehlgeschlagen.</Text> : null}
        <Text style={styles.small}>Für Gerätewechsel exportiere die JSON-Datei außerhalb der App. Fotos sind nur als Verweise enthalten; Bilddateien werden nicht mitgesichert. Sicherungen sind nicht separat verschlüsselt.</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button testID="guardian-backup" label="Jetzt sichern" icon="save" variant="secondary" disabled={busy || p.storageBlocked} onPress={() => run(p.backupNow, "Sicherung erstellt")} />
          <Button testID="guardian-restore" label="Letzte Wochensicherung wiederherstellen" icon="clock" variant="secondary" disabled={busy || p.storageBlocked || p.lastBackup === null} onPress={() => setConfirmRestore("weekly")} />
          {p.hasBeforeChange ? <Button testID="guardian-undo" label="Stand vor letzter Wiederherstellung / Import / Reset" icon="clock" variant="secondary" disabled={busy || p.storageBlocked} onPress={() => setConfirmRestore("before")} /> : null}
          <Button disabled={busy || p.storageBlocked} testID="export-button" label="Als JSON exportieren" icon="upload" variant="secondary" onPress={doExport} />
          <Button disabled={busy || p.storageBlocked} testID="import-button" label="JSON importieren" icon="download" variant="secondary" onPress={doImport} />
          <Text style={[styles.small, { marginTop: spacing.md }]}>Vollsicherung: alles in einer Datei – Lernstand, Notizen, Gebetsheft, Tagebuch „Mein geistlicher Weg“, eigene Fotos und eigene MP3/MP4-Dateien bis zusammen 60 MB (größere Medien bitte separat aufbewahren). Auf einem anderen Gerät wiederherstellbar; schlägt die Wiederherstellung fehl, bleibt der vorherige Stand erhalten. Die Datei ist nicht passwortgeschützt; bewahre sie sicher auf.</Text>
          <Button testID="full-backup-button" label="Vollsicherung erstellen" icon="archive" variant="secondary" disabled={busy || p.storageBlocked} onPress={doFull} />
          <Button testID="full-restore-button" label="Vollsicherung wiederherstellen" icon="refresh-cw" variant="secondary" disabled={busy || p.storageBlocked} onPress={() => setConfirmFull(true)} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 }}>
            <Text style={[styles.small, { flex: 1 }]}>Monatlich an eine Vollsicherung erinnern{reminder.lastExport ? ` · zuletzt ${new Date(reminder.lastExport).toLocaleDateString("de-DE")}` : ""}</Text>
            <Switch testID="backup-reminder-switch" value={reminder.enabled} onValueChange={reminder.setEnabled} trackColor={{ true: colors.brandPrimary, false: colors.borderStrong }} />
          </View>
          <Button disabled={busy || p.storageBlocked} testID="reset-button" label="Lernstand zurücksetzen" icon="trash-2" variant="ghost" onPress={() => setConfirmReset(true)} />
        </View>

        <SectionTitle>Hören & Sehen</SectionTitle>
        <View style={{ marginTop: spacing.sm }}>
          <Button testID="settings-open-media" label="Audio & Video (MP3/MP4)" icon="headphones" variant="secondary" onPress={() => router.push("/media")} />
        </View>

        <SectionTitle>Auf den Spuren Jesu</SectionTitle>
        <Text style={styles.small}>15 Stationen aus dem Leben Jesu nach den Evangelien – in deinem eigenen Tempo. Auch in der Bibliothek erreichbar.</Text>
        <View style={{ marginTop: spacing.md }}>
          <Button testID="settings-replay-intro" label="Auf den Spuren Jesu (15 Stationen)" icon="play-circle" variant="secondary" onPress={() => router.push("/intro")} />
        </View>

        <SectionTitle>Über BIBLIA</SectionTitle>
        <Text style={styles.small}>Version 0.1 · Permanent Offline Edition: alle Inhalte liegen auf dem Gerät, keine Konten, keine Telemetrie, keine automatischen Updates. Bibeltext: Elberfelder 1905 (gemeinfrei). Karten-Koordinaten: OpenBible.info (CC BY 4.0), Pleiades (CC BY 3.0). Intro- und Personenbilder: KI-generiert (OpenAI GPT Image 1), künstlerische Rekonstruktion.</Text>
      </KeyboardAwareScrollView>

      <Sheet visible={!!colorFor} onClose={() => setColorFor(null)} title="Farbe wählen" testID="color-sheet">
        <View style={styles.palette}>
          {CATEGORY_PALETTE.map((col) => (
            <Pressable key={col} testID={`palette-${col}`} style={[styles.bigSwatch, { backgroundColor: col }]} onPress={() => { p.setCategories(state.categories.map((x) => (x.id === colorFor ? { ...x, color: col } : x))); setColorFor(null); }} />
          ))}
        </View>
      </Sheet>
      <Sheet visible={confirmFull} onClose={() => setConfirmFull(false)} title="Vollsicherung wiederherstellen?" testID="restore-sheet">
        <Text style={styles.small}>Lernstand, Notizen, Gebetsheft und Tagebuch auf diesem Gerät werden durch den Stand der Sicherung ersetzt. Was du seitdem neu angelegt hast, geht verloren. Erstelle vorher eine Vollsicherung, wenn du es behalten möchtest.</Text>
        <Button testID="restore-confirm-button" label="Sicherungsdatei auswählen" icon="refresh-cw" style={{ marginTop: spacing.xl }} onPress={() => { setConfirmFull(false); doRestore(); }} />
      </Sheet>
      <Sheet visible={!!pendingImport} onClose={() => setPendingImport(null)} title="Lernstand importieren?" testID="import-sheet">
        <Text style={styles.small}>Der aktuelle Lernstand wird vorher lokal gesichert und anschließend ersetzt.</Text>
        <Button testID="import-confirm-button" label="Importieren" disabled={busy} onPress={() => { const next = pendingImport; setPendingImport(null); if (next) void run(() => p.replaceState(next), "Lernstand importiert"); }} />
      </Sheet>
      <Sheet visible={!!confirmRestore} onClose={() => setConfirmRestore(null)} title="Sicherung wiederherstellen?" testID="guardian-restore-sheet">
        <Text style={styles.small}>Dein aktueller Lernstand wird vorher gesichert.</Text>
        <Button testID="guardian-restore-confirm" label="Wiederherstellen" disabled={busy} onPress={() => { const before = confirmRestore === "before"; setConfirmRestore(null); void run(() => p.restoreBackup(before), "Lernstand wiederhergestellt"); }} />
      </Sheet>
      <Sheet visible={confirmReset} onClose={() => setConfirmReset(false)} title="Lernstand zurücksetzen?" testID="reset-sheet">
        <Text style={styles.small}>Alle EP, Stationen, Notizen und Markierungen werden gelöscht. Exportiere vorher deinen Lernstand, wenn du ihn behalten möchtest.</Text>
        <Button testID="reset-confirm-button" label="Endgültig zurücksetzen" variant="danger" icon="trash-2" style={{ marginTop: spacing.xl }} disabled={busy} onPress={() => { setConfirmReset(false); void run(p.reset, "Lernstand zurückgesetzt"); }} />
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
