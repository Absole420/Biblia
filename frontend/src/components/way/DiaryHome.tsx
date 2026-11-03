import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { Button } from "@/src/components/ui";
import { FEELING_BY_ID } from "@/src/data/way";
import { ENTRY_KINDS, fmtDay, KIND_BY_ID, way, WayEntry, useWay } from "@/src/lib/way";
import { refLabelW } from "@/src/lib/wayText";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { CrisisCard, diaryColor, feelingHue, useWayStyles } from "./WayUI";

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function DiaryHome() {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, ready, encrypted, broken } = useWay();
  const [help, setHelp] = useState(false);
  const accent = diaryColor(colors);

  const groups = useMemo(() => {
    const sorted = [...data.entries].sort((a, b) => (b.date + (b.time ?? "") + b.createdAt).localeCompare(a.date + (a.time ?? "") + a.createdAt));
    const out: { key: string; label: string; items: WayEntry[] }[] = [];
    sorted.forEach((e) => {
      const k = e.date.slice(0, 7);
      if (out[out.length - 1]?.key !== k) out.push({ key: k, label: `${MONTHS[parseInt(k.slice(5), 10) - 1]} ${k.slice(0, 4)}`, items: [] });
      out[out.length - 1].items.push(e);
    });
    return out;
  }, [data.entries]);

  if (!ready) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={accent} />;

  if (!data.introSeenAt) return <DiaryIntro />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }} testID="diary-home">
        {broken ? (
          <View style={[styles.banner, { borderLeftColor: colors.error }]} testID="diary-broken">
            <Icon name="alert-triangle" size={16} color={colors.error} />
            <Text style={[w.body, { flex: 1 }]}>Deine gespeicherten Einträge konnten gerade nicht gelesen werden. Sie wurden nicht verändert – neue Einträge werden erst gespeichert, wenn das Lesen wieder gelingt. Starte die App neu oder stelle eine Sicherung wieder her.</Text>
          </View>
        ) : null}
        <View style={[styles.banner, { borderLeftColor: accent }]}>
          <Icon name="lock" size={16} color={accent} />
          <Text style={[w.muted, { flex: 1 }]}>Privat · nur auf diesem Gerät · {encrypted ? "verschlüsselt" : "Verschlüsselung auf diesem Gerät nicht verfügbar"}</Text>
        </View>
        <Button testID="diary-new-checkin" label="Neuer Check-in" icon="edit-3" onPress={() => router.push({ pathname: "/way/entry", params: { kind: "checkin" } })} />
        <View style={[w.wrap, { marginTop: spacing.sm }]}>
          {ENTRY_KINDS.filter((k) => k.id !== "checkin").map((k) => (
            <Pressable key={k.id} testID={`diary-new-${k.id}`} onPress={() => router.push({ pathname: "/way/entry", params: { kind: k.id } })} style={styles.kindBtn} accessibilityRole="button" accessibilityLabel={`Neue ${k.label}`}>
              <Icon name={k.icon} size={16} color={accent} />
              <Text style={styles.kindText}>{k.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[w.wrap, { marginTop: spacing.md }]}>
          <Button testID="diary-review" variant="secondary" icon="bar-chart-2" label="Rückblick" onPress={() => router.push("/way/review")} style={{ flexGrow: 1 }} />
          <Button testID="diary-data" variant="secondary" icon="shield" label="Daten & Sicherung" onPress={() => router.push("/way/data")} style={{ flexGrow: 1 }} />
        </View>
        <Pressable testID="diary-help" onPress={() => setHelp(true)} style={styles.help} accessibilityRole="button">
          <Icon name="life-buoy" size={16} color={colors.error} />
          <Text style={[w.bold, { flex: 1 }]}>Hilfe in akuten Krisen</Text>
          <Icon name="chevron-right" size={16} color={colors.muted} />
        </Pressable>

        <Text style={[w.secTitle, { marginTop: spacing.xl }]}>Mein Weg</Text>
        <Text style={[w.muted, { marginBottom: spacing.md }]}>Jede Station ist ein Eintrag von dir – ohne Bewertung und ohne vorgegebenes Ziel.</Text>
        {!data.entries.length ? (
          <View style={styles.empty} testID="diary-empty">
            <Icon name="map" size={34} color={colors.borderStrong} />
            <Text style={w.body}>Dein Weg beginnt, wann immer du möchtest. Ein einziges Wort oder ein Gefühl genügt.</Text>
          </View>
        ) : null}
        {groups.map((g) => (
          <View key={g.key} testID={`diary-month-${g.key}`}>
            <Text style={styles.month}>{g.label}</Text>
            {g.items.map((e, i) => <Station key={e.id} e={e} last={i === g.items.length - 1} onPress={() => router.push({ pathname: "/way/entry", params: { id: e.id } })} />)}
          </View>
        ))}
      </ScrollView>
      <Sheet visible={help} onClose={() => setHelp(false)} title="Hilfe in akuten Krisen" testID="crisis-sheet"><CrisisCard /></Sheet>
    </View>
  );
}

/** Datenschutz-Erklärung vor dem ersten Eintrag. */
export function DiaryIntro() {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const accent = diaryColor(colors);
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }} testID="diary-intro">
      <View style={[w.card, { borderColor: accent, borderWidth: 2 }]}>
        <View style={w.row}><Icon name="lock" size={20} color={accent} /><Text style={w.secTitle}>Bevor du beginnst</Text></View>
        <Text style={w.body}>Das persönliche Register ist dein privates Tagebuch. So gehen wir mit deinen Einträgen um:</Text>
        {[
          ["smartphone", "Nur auf diesem Gerät gespeichert – es gibt kein Konto und keine Synchronisierung."],
          ["shield", Platform.OS === "web" ? "Verschlüsselt abgelegt. In der Web-Vorschau liegt der Schlüssel im Browser-Speicher; in der installierten App im geschützten Gerätespeicher." : "Verschlüsselt abgelegt; der Schlüssel liegt im geschützten Speicher deines Geräts."],
          ["eye-off", "Niemand sonst – auch nicht die App-Entwickler – kann deine Einträge lesen. Sie werden nicht ausgewertet, geteilt oder für andere Funktionen verwendet."],
          ["download", "Du kannst jederzeit eine Sicherung oder eine lesbare Fassung exportieren und alles vollständig löschen."],
          ["alert-triangle", "Wer dein entsperrtes Gerät in der Hand hat, kann die App öffnen. Eine eigene App-Sperre gibt es nicht."],
          ["heart", "Kein Feld ist Pflicht. Lücken sind völlig in Ordnung – es gibt keine Serien, Punkte oder Erinnerungen."],
        ].map(([ic, t]) => (
          <View key={t} style={styles.li}><Icon name={ic} size={16} color={accent} /><Text style={[w.body, { flex: 1 }]}>{t}</Text></View>
        ))}
        <Text style={w.muted}>Das Tagebuch ist eine Hilfe zur Besinnung. Es stellt keine Diagnose und ersetzt keine medizinische, psychologische oder seelsorgerliche Hilfe.</Text>
        <Button testID="diary-intro-accept" label="Verstanden – Tagebuch öffnen" icon="check" onPress={() => way.markIntroSeen()} />
      </View>
    </ScrollView>
  );
}

function Station({ e, last, onPress }: { e: WayEntry; last: boolean; onPress: () => void }) {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const k = KIND_BY_ID[e.kind];
  const text = e.mood || e.concern || e.toGod || e.thought || e.nextStep || e.note || "";
  return (
    <View style={styles.station}>
      <View style={styles.rail}>
        <View style={[styles.node, { borderColor: diaryColor(colors) }]}><Icon name={k.icon} size={14} color={diaryColor(colors)} /></View>
        {!last ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
      </View>
      <Pressable onPress={onPress} style={[w.card, { flex: 1 }]} testID={`diary-entry-${e.id}`} accessibilityRole="button" accessibilityLabel={`${k.label} vom ${fmtDay(e.date)}`}>
        <Text style={styles.date}>{fmtDay(e.date)}{e.time ? ` · ${e.time}` : ""} · {k.label}</Text>
        {e.feelings.length || e.customFeelings.length ? (
          <View style={w.wrap}>
            {e.feelings.map((f) => FEELING_BY_ID[f] ? (
              <View key={f} style={[styles.tag, { borderColor: feelingHue(colors, FEELING_BY_ID[f].hue) }]}><Icon name={FEELING_BY_ID[f].icon} size={11} color={feelingHue(colors, FEELING_BY_ID[f].hue)} /><Text style={styles.tagText}>{FEELING_BY_ID[f].label}</Text></View>
            ) : null)}
            {e.customFeelings.map((f) => <View key={f} style={[styles.tag, { borderColor: colors.borderStrong }]}><Icon name="tag" size={11} color={colors.muted} /><Text style={styles.tagText}>{f}</Text></View>)}
          </View>
        ) : null}
        {text ? <Text style={w.body} numberOfLines={3}>{text}</Text> : null}
        {e.refs.length ? <Text style={w.ref}>{e.refs.map(refLabelW).join(" · ")}</Text> : null}
        {e.kind === "question" && e.resolved ? <Text style={w.muted}>✓ für mich beantwortet</Text> : null}
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  li: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  banner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderLeftWidth: 4, marginBottom: spacing.md },
  kindBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderStrong, flexGrow: 1, justifyContent: "center" },
  kindText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800", color: c.onSurface },
  help: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 48, marginTop: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border },
  empty: { alignItems: "center", gap: spacing.sm, padding: spacing.xl },
  month: { fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.muted, marginVertical: spacing.sm },
  station: { flexDirection: "row", gap: spacing.md },
  rail: { width: 32, alignItems: "center" },
  node: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: c.surface, marginTop: spacing.md },
  line: { flex: 1, width: 2, borderRadius: 1, marginTop: 2 },
  date: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: c.muted },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, minHeight: 24, borderRadius: radius.pill, borderWidth: 1 },
  tagText: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.onSurface },
}));
