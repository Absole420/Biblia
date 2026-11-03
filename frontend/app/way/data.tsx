import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { useToast } from "@/src/components/Toast";
import { Button } from "@/src/components/ui";
import { diaryColor, useWayStyles } from "@/src/components/way/WayUI";
import { exportTextFile, pickTextFile } from "@/src/lib/backup";
import { buildWayBackup, parseWayBackup, todayISO, way, WayData, useWay } from "@/src/lib/way";
import { buildReadable } from "@/src/lib/wayText";
import { spacing, useTheme } from "@/src/theme";

export default function WayDataScreen() {
  const w = useWayStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { data, encrypted } = useWay();
  const [pending, setPending] = useState<WayData | null>(null);
  const [wipe, setWipe] = useState(0); // 0 = aus, 1 = Hinweis, 2 = letzte Bestätigung
  const accent = diaryColor(colors);

  const exportBackup = async () => {
    try { await exportTextFile(`mein-geistlicher-weg-${todayISO()}.json`, buildWayBackup(data), "application/json", "Tagebuch sichern"); toast.show("Sicherung erstellt"); }
    catch { toast.show("Export nicht möglich", "error"); }
  };
  const exportText = async () => {
    try { await exportTextFile(`mein-geistlicher-weg-${todayISO()}.txt`, buildReadable(data.entries), "text/plain", "Tagebuch als Text"); toast.show("Lesbare Fassung erstellt"); }
    catch { toast.show("Export nicht möglich", "error"); }
  };
  const restore = async () => {
    const text = await pickTextFile().catch(() => null);
    if (text === null) return;
    const r = parseWayBackup(text);
    if (!r.ok) return toast.show(r.error, "error");
    setPending(r.data);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="way-data-screen">
      <View style={[w.head, { paddingTop: insets.top + spacing.sm, backgroundColor: accent }]}>
        <Pressable onPress={() => router.back()} style={w.back} testID="way-data-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color={colors.surface} /></Pressable>
        <Text style={[w.headTitle, { color: colors.surface }]} accessibilityRole="header">Daten & Sicherung</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, maxWidth: 760, width: "100%", alignSelf: "center" }}>
        <View style={w.card} testID="way-privacy-info">
          <View style={w.row}><Icon name="shield" size={18} color={accent} /><Text style={w.cardTitle}>Wo sind meine Einträge?</Text></View>
          <Text style={w.body}>• Nur auf diesem Gerät. Es gibt kein Konto und keine Synchronisierung – auch die App-Entwickler haben keinen Zugriff.</Text>
          <Text style={w.body} testID="way-encryption-state">• {encrypted ? (Platform.OS === "web" ? "Verschlüsselt (AES-256-GCM). In der Web-Vorschau liegt der Schlüssel im Browser-Speicher – das schützt weniger als die installierte App, die ihn im geschützten Gerätespeicher ablegt." : "Verschlüsselt (AES-256-GCM). Der Schlüssel liegt im geschützten Speicher des Geräts.") : "Auf diesem Gerät bzw. in dieser Vorschau ist die Verschlüsselung nicht verfügbar; die Einträge liegen unverschlüsselt im App-Speicher."}</Text>
          <Text style={w.body}>• Getrennt vom übrigen Lernstand: Die Lernstand-Sicherung in den Einstellungen enthält das Tagebuch nicht, und „Lernstand zurücksetzen“ löscht es nicht.</Text>
          <Text style={w.body}>• Einträge werden nicht ausgewertet, geteilt oder für andere Funktionen verwendet. Der Rückblick entsteht nur, wenn du ihn öffnest.</Text>
          <Text style={w.muted}>{data.entries.length} {data.entries.length === 1 ? "Eintrag" : "Einträge"} gespeichert.</Text>
        </View>

        <Text style={w.secTitle}>Exportieren</Text>
        <Text style={[w.muted, { marginBottom: spacing.sm }]}>Exportierte Dateien sind nicht verschlüsselt. Bewahre sie sorgfältig auf.</Text>
        <Button testID="way-export-backup" icon="download" label="Sicherungsdatei (zum Wiederherstellen)" onPress={exportBackup} disabled={!data.entries.length} />
        <Button testID="way-export-text" variant="secondary" icon="file-text" label="Lesbare Fassung (Text)" onPress={exportText} disabled={!data.entries.length} style={{ marginTop: spacing.sm }} />

        <Text style={[w.secTitle, { marginTop: spacing.xl }]}>Wiederherstellen</Text>
        <Button testID="way-restore" variant="secondary" icon="upload" label="Sicherungsdatei auswählen" onPress={restore} />
        {pending ? (
          <View style={[w.card, { marginTop: spacing.sm }]} testID="way-restore-confirm">
            <Text style={w.body}>Die Sicherung enthält {pending.entries.length} Einträge. Wie möchtest du sie übernehmen?</Text>
            <Button testID="way-restore-merge" icon="plus" label="Ergänzen (vorhandene behalten)" onPress={() => { way.restore(pending, "merge"); setPending(null); toast.show("Sicherung ergänzt"); }} />
            <Button testID="way-restore-replace" variant="secondary" icon="refresh-cw" label="Ersetzen (vorhandene verwerfen)" onPress={() => { way.restore(pending, "replace"); setPending(null); toast.show("Sicherung wiederhergestellt"); }} />
            <Button testID="way-restore-cancel" variant="ghost" label="Abbrechen" onPress={() => setPending(null)} />
          </View>
        ) : null}

        <Text style={[w.secTitle, { marginTop: spacing.xl }]}>Vollständig löschen</Text>
        {wipe === 0 ? (
          <Button testID="way-wipe" variant="ghost" icon="trash-2" label="Alle Tagebuch-Einträge löschen" onPress={() => setWipe(1)} disabled={!data.entries.length && !data.introSeenAt} />
        ) : (
          <View style={[w.card, { borderColor: colors.error, borderWidth: 2 }]} testID="way-wipe-box">
            <Text style={w.body}>Alle {data.entries.length} Einträge und der Schlüssel werden endgültig von diesem Gerät entfernt. Das allgemeine Register, Notizen, Gebetsheft und Lernfortschritt bleiben erhalten.</Text>
            {wipe === 1 ? (
              <>
                <Button testID="way-wipe-backup-first" icon="download" label="Vorher Sicherung erstellen" onPress={exportBackup} disabled={!data.entries.length} />
                <Button testID="way-wipe-continue" variant="danger" icon="alert-triangle" label="Weiter zum Löschen" onPress={() => setWipe(2)} />
              </>
            ) : (
              <Button testID="way-wipe-confirm" variant="danger" icon="trash-2" label="Ja, endgültig alles löschen" onPress={async () => { await way.wipe(); setWipe(0); toast.show("Tagebuch vollständig gelöscht"); }} />
            )}
            <Button testID="way-wipe-cancel" variant="ghost" label="Abbrechen" onPress={() => setWipe(0)} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
