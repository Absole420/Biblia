import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";

import { loadChapter } from "@/src/data/bible";
import { FEELINGS, Feeling, LINK_KIND_LABEL, LinkKind } from "@/src/data/way";
import { refLabelW } from "@/src/lib/wayText";
import { fonts, makeStyles, radius, spacing, ThemeColors, useTheme } from "@/src/theme";

import { Icon } from "../Icon";
import { Sheet } from "../Sheet";
import { Button } from "../ui";

/** Akzentfarben: Allgemeines Register vs. Persönliches Register (immer zusätzlich mit Symbol + Text). */
export const regColor = (c: ThemeColors) => c.info;
export const diaryColor = (c: ThemeColors) => c.stationChallenge;
/** Neutrale, nicht wertende Farbtöne für Gefühle. */
export const feelingHue = (c: ThemeColors, hue: number) => [c.info, c.brandSecondary, c.stationChallenge, c.stationNarrative, c.brandPrimary, c.mapRiver][hue % 6];

const parse = (ref: string) => {
  const [book, ch, vv] = ref.split(":");
  const [from, to] = (vv ?? "1").split("-").map((n) => parseInt(n, 10));
  return { book, ch: parseInt(ch, 10), from, to: to || from };
};

/** Verstext einer Stelle (ELB 1905) – gekürzt, mit Versnummern. */
export function useRefText(ref: string) {
  const [verses, setVerses] = useState<{ v: number; t: string }[] | null>(null);
  useEffect(() => {
    const r = parse(ref);
    let on = true;
    loadChapter(r.book, r.ch).then((vs) => on && setVerses(vs.slice(r.from - 1, r.to).map((t, i) => ({ v: r.from + i, t })))).catch(() => on && setVerses([]));
    return () => { on = false; };
  }, [ref]);
  return verses;
}

export function KindBadge({ kind }: { kind: LinkKind }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const icon = { direct: "align-left", person: "user", theme: "link-2", interp: "message-circle" }[kind];
  return (
    <View style={styles.kind} accessibilityLabel={`Art der Verbindung: ${LINK_KIND_LABEL[kind]}`}>
      <Icon name={icon} size={11} color={colors.onSurfaceSecondary} />
      <Text style={styles.kindText}>{LINK_KIND_LABEL[kind]}</Text>
    </View>
  );
}

/** Bibelstelle mit Vorschau; „Im Zusammenhang“ öffnet das ganze Kapitel, ohne die Seite zu verlassen. */
export function PassageCard({ refKey, title, context, badge, testID, from }: { refKey: string; title?: string; context?: string; badge?: React.ReactNode; testID: string; from?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const verses = useRefText(refKey);
  const [open, setOpen] = useState(false);
  const preview = verses?.slice(0, 3) ?? [];
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.row}>
        <Text style={styles.ref}>{refLabelW(refKey)}</Text>
        {badge}
      </View>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {verses === null ? <ActivityIndicator color={colors.brandPrimary} /> : (
        <Text style={styles.verse}>
          {preview.map((x) => <Text key={x.v}><Text style={styles.vnum}>{x.v} </Text>{x.t} </Text>)}
          {verses.length > 3 ? <Text style={styles.muted}>…</Text> : null}
        </Text>
      )}
      {context ? <Text style={styles.body}><Text style={styles.bold}>Zusammenhang: </Text>{context}</Text> : null}
      <Pressable onPress={() => setOpen(true)} style={styles.linkBtn} testID={`${testID}-context`} accessibilityRole="button" accessibilityLabel={`${refLabelW(refKey)} im Zusammenhang lesen`}>
        <Icon name="book-open" size={16} color={colors.info} />
        <Text style={[styles.linkText, { color: colors.info }]}>Im Zusammenhang lesen</Text>
      </Pressable>
      <ContextSheet refKey={refKey} visible={open} onClose={() => setOpen(false)} from={from} />
    </View>
  );
}

/** Ganzes Kapitel mit hervorgehobener Stelle; Option, im Bibelleser weiterzulesen. */
export function ContextSheet({ refKey, visible, onClose, from }: { refKey: string; visible: boolean; onClose: () => void; from?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const r = parse(refKey);
  const [vs, setVs] = useState<string[] | null>(null);
  useEffect(() => { if (visible) loadChapter(r.book, r.ch).then(setVs).catch(() => setVs([])); }, [visible, r.book, r.ch]);
  return (
    <Sheet visible={visible} onClose={onClose} title={`${refLabelW(`${r.book}:${r.ch}`)} · Elberfelder 1905`} testID="way-context-sheet"
      footer={<Button testID="way-context-open-reader" variant="secondary" icon="external-link" label="Im Bibelleser öffnen" onPress={() => { onClose(); router.navigate({ pathname: "/bible", params: { b: r.book, ch: String(r.ch), v: String(r.from), ...(from ? { way: from } : {}) } }); }} />}>
      {vs === null ? <ActivityIndicator color={colors.brandPrimary} /> : (
        <Text style={styles.chapter}>
          {vs.map((t, i) => {
            const on = i + 1 >= r.from && i + 1 <= r.to;
            return <Text key={i} style={on ? { backgroundColor: colors.warning + "40", color: colors.onSurface } : null}><Text style={styles.vnum}>{i + 1} </Text>{t} </Text>;
          })}
        </Text>
      )}
    </Sheet>
  );
}

/** Gefühle über Symbol + Text (+ Farbton) auswählbar. */
export function FeelingPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} testID="feeling-picker">
      {FEELINGS.map((f: Feeling) => {
        const on = value.includes(f.id);
        const hue = feelingHue(colors, f.hue);
        return (
          <Pressable key={f.id} testID={`feeling-${f.id}`} onPress={() => onChange(on ? value.filter((x) => x !== f.id) : [...value, f.id])}
            accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={f.label}
            style={[styles.feel, { borderColor: on ? hue : colors.border, backgroundColor: on ? hue + "2E" : colors.surfaceSecondary }]}>
            <Icon name={on ? "check" : f.icon} size={15} color={hue} />
            <Text style={[styles.feelText, on && { fontWeight: "900" }]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const CRISIS = [
  { label: "Notruf (Rettungsdienst)", num: "112", note: "bei akuter Gefahr für Leib und Leben" },
  { label: "Polizei", num: "110", note: "bei Bedrohung oder Gewalt" },
  { label: "TelefonSeelsorge", num: "0800 111 0 111", note: "kostenlos, anonym, rund um die Uhr" },
  { label: "TelefonSeelsorge", num: "0800 111 0 222", note: "alternative Nummer" },
  { label: "Nummer gegen Kummer (Kinder & Jugendliche)", num: "116 111", note: "Mo–Sa 14–20 Uhr" },
  { label: "Hilfetelefon Gewalt gegen Frauen", num: "116 016", note: "rund um die Uhr, mehrsprachig" },
  { label: "Hilfetelefon Sexueller Missbrauch", num: "0800 22 55 530", note: "kostenlos und anonym" },
];

/** Ruhige Einladung zu menschlicher Hilfe (Deutschland). Keine Diagnose, keine Überwachung. */
export function CrisisCard({ abuse, compact }: { abuse?: boolean; compact?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const list = compact ? CRISIS.slice(0, 3) : CRISIS;
  return (
    <View style={[styles.crisis, { borderColor: colors.error }]} testID="crisis-card" accessibilityRole="summary">
      <View style={styles.row}>
        <Icon name="life-buoy" size={20} color={colors.error} />
        <Text style={styles.cardTitle}>Du musst das nicht allein tragen</Text>
      </View>
      <Text style={styles.body}>
        {abuse
          ? "Was du beschreibst, klingt nach etwas, das dich verletzt oder gefährdet. Deine Sicherheit geht vor – du musst dich weder versöhnen noch Kontakt halten oder bleiben, wo es gefährlich ist. Bitte wende dich an eine Person deines Vertrauens oder an eine dieser Stellen:"
          : "Wenn du gerade daran denkst, dir etwas anzutun, oder in Gefahr bist: Bitte sprich jetzt mit einem Menschen. Ruf eine vertraute Person an, die TelefonSeelsorge oder in akuter Gefahr den Notruf. Das ist kein Glaubensversagen – Hilfe zu holen ist gut und richtig."}
      </Text>
      {list.map((c) => (
        <Pressable key={c.num} onPress={() => Linking.openURL(`tel:${c.num.replace(/\s/g, "")}`).catch(() => {})} style={styles.callRow} testID={`crisis-call-${c.num.replace(/\s/g, "")}`} accessibilityRole="button" accessibilityLabel={`${c.label} anrufen: ${c.num}`}>
          <View style={[styles.callIcon, { backgroundColor: colors.error }]}><Icon name="phone" size={16} color={colors.onError} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.callNum}>{c.num}</Text>
            <Text style={styles.muted}>{c.label} · {c.note}</Text>
          </View>
        </Pressable>
      ))}
      <Text style={styles.muted}>Dieser Hinweis entsteht nur auf deinem Gerät durch einen einfachen Wortabgleich. Es wird nichts gesendet, gespeichert oder ausgewertet.</Text>
    </View>
  );
}

export function SectionHead({ icon, title, color }: { icon: string; title: string; color?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { marginTop: spacing.xl, marginBottom: spacing.sm }]} accessibilityRole="header">
      <Icon name={icon} size={18} color={color ?? colors.brandPrimary} />
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

export const useWayStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: c.border, gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { flexShrink: 1, fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  secTitle: { flex: 1, fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface },
  body: { fontFamily: fonts.text, fontSize: 15, lineHeight: 23, color: c.onSurfaceSecondary },
  bold: { fontWeight: "800", color: c.onSurface },
  muted: { fontFamily: fonts.text, fontSize: 13, lineHeight: 19, color: c.muted },
  ref: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.brandPrimary },
  verse: { fontFamily: fonts.display, fontSize: 16, lineHeight: 25, color: c.onSurface },
  vnum: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.muted },
  chapter: { fontFamily: fonts.display, fontSize: 17, lineHeight: 28, color: c.onSurfaceSecondary },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, alignSelf: "flex-start" },
  linkText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800" },
  kind: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, minHeight: 22, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary },
  kindText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.onSurfaceSecondary },
  feel: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1.5 },
  feelText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: c.onSurface },
  crisis: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 2, gap: spacing.sm, marginBottom: spacing.md },
  callRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 52, paddingVertical: 4 },
  callIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  callNum: { fontFamily: fonts.text, fontSize: 17, fontWeight: "900", color: c.onSurface },
  input: { minHeight: 48, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.md, fontFamily: fonts.text, fontSize: 16, color: c.onSurface, textAlignVertical: "top" },
  label: { fontFamily: fonts.text, fontSize: 15, fontWeight: "800", color: c.onSurface, marginTop: spacing.md, marginBottom: 6 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" },
  headTitle: { flex: 1, fontFamily: fonts.display, fontSize: 21, fontWeight: "700" },
}));
const useStyles = useWayStyles;
