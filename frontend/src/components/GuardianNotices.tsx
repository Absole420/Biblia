import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Button } from "@/src/components/ui";
import { useBackupReminder } from "@/src/lib/backupReminder";
import { useProgress } from "@/src/lib/store";
import { fonts, spacing, useTheme } from "@/src/theme";

/** Sperr-/Warnbildschirm, wenn kein sicherer Lernstand geladen werden konnte. */
export function GuardianBlocked() {
  const { colors } = useTheme();
  const p = useProgress();
  return (
    <View style={[styles.full, { backgroundColor: colors.surface }]} testID="guardian-blocked">
      <Text accessibilityRole="alert" style={[styles.title, { color: colors.onSurface }]}>
        {p.legacyPending ? "Nur ein älterer Speicherstand ist lesbar" : p.storageError}
      </Text>
      <Text style={[styles.text, { color: colors.onSurface }]}>
        {p.legacyPending
          ? "Alle aktuellen Sicherungen sind beschädigt. Lesbar ist nur noch der alte Stand aus der Zeit vor dem Datenschutz-Update – er kann deutlich älter sein. Neuere Fortschritte, Notizen oder Gebete fehlen dann. Wenn du eine Vollsicherung als Datei hast, ist deren Stand meist neuer."
          : "Keine leeren Daten wurden gespeichert. Falls der Fehler bleibt, die App-Daten nicht löschen."}
      </Text>
      {p.legacyPending ? <Button testID="guardian-accept-legacy" label="Älteren Stand trotzdem laden" icon="alert-triangle" variant="secondary" style={{ marginTop: spacing.xl }} onPress={p.acceptLegacy} /> : null}
    </View>
  );
}

/** Hinweise über dem App-Inhalt: Wiederherstellung, Speicherfehler, laufende Änderung, Sicherungserinnerung. */
export function GuardianNotices({ part }: { part: "banner" | "overlay" }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const p = useProgress();
  const rem = useBackupReminder();
  const notice = p.storageError ?? (p.recovered ? "Ein älterer intakter Speicherstand wurde geladen. Bitte Lernstand prüfen." : null);
  if (part === "overlay") return p.busy ? (
        <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.scrim }]} testID="guardian-busy">
          <View style={[styles.busyCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator color={colors.brandPrimary} />
            <Text style={[styles.text, { color: colors.onSurface, marginTop: spacing.md, textAlign: "center" }]}>Lernstand wird gesichert und ersetzt … Bitte warten – Änderungen sind währenddessen gesperrt.</Text>
          </View>
        </View>
  ) : null;
  return (
    <>
      {notice ? (
        <View style={[styles.bar, { backgroundColor: colors.surfaceSecondary, paddingTop: insets.top + spacing.sm }]} testID="guardian-notice">
          <Text accessibilityRole="alert" style={[styles.barText, { color: colors.onSurface }]}>{notice}</Text>
          {!p.storageError ? (
            <Pressable testID="guardian-notice-dismiss" accessibilityLabel="Hinweis schließen" hitSlop={8} style={styles.close} onPress={p.dismissRecovery}>
              <Icon name="x" size={18} color={colors.onSurface} />
            </Pressable>
          ) : null}
        </View>
      ) : rem.due ? (
        <View style={[styles.bar, { backgroundColor: colors.surfaceSecondary, paddingTop: insets.top + spacing.sm }]} testID="backup-reminder">
          <Pressable style={{ flex: 1 }} onPress={() => router.push("/settings")} accessibilityRole="button">
            <Text style={[styles.barText, { color: colors.onSurface }]}>Zeit für eine Vollsicherung als Datei außerhalb des Handys. Tippen für Einstellungen.</Text>
          </Pressable>
          <Pressable testID="backup-reminder-dismiss" accessibilityLabel="Später erinnern" hitSlop={8} style={styles.close} onPress={rem.snooze}>
            <Icon name="x" size={18} color={colors.onSurface} />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, justifyContent: "center", padding: spacing.xl },
  title: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700" },
  text: { fontFamily: fonts.text, fontSize: 15, lineHeight: 22, marginTop: spacing.md },
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  barText: { flex: 1, fontFamily: fonts.text, fontSize: 13, lineHeight: 18 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  overlay: { alignItems: "center", justifyContent: "center", zIndex: 100 },
  busyCard: { padding: spacing.xl, borderRadius: 20, maxWidth: 320, alignItems: "center" },
});
