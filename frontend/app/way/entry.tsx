import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip } from "@/src/components/ui";
import { DiaryIntro } from "@/src/components/way/DiaryHome";
import { CrisisCard, diaryColor, FeelingPicker, useWayStyles } from "@/src/components/way/WayUI";
import { ARTICLE_BY_ID } from "@/src/data/articles";
import { parseRef } from "@/src/data/books";
import { TOPIC_BY_ID, TOPICS, topicsForFeeling } from "@/src/data/way";
import { STATION_INFO } from "@/src/lib/libraryIndex";
import { EntryKind, fmtDate, KIND_BY_ID, nowTime, safetyCheck, todayISO, way, WayEntry, useWay } from "@/src/lib/way";
import { refLabelW } from "@/src/lib/wayText";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Draft = Omit<WayEntry, "id" | "createdAt" | "updatedAt"> & { id?: string };

const blank = (kind: EntryKind): Draft => ({ kind, date: todayISO(), time: nowTime(), feelings: [], customFeelings: [], refs: [], topics: [], stations: [], lexicon: [], intensity: undefined });

const toISO = (s: string) => {
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [+m[1], +m[2], +m[3]];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};
const hasContent = (d: Draft, custom: string) =>
  !!(d.feelings.length || d.customFeelings.length || custom.trim() || d.refs.length || d.topics.length || d.stations.length || d.lexicon.length || d.intensity || d.talk ||
    [d.mood, d.concern, d.selfView, d.goodBad, d.thought, d.toGod, d.nextStep, d.note].some((x) => x?.trim()));

export default function EntryScreen() {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string; kind?: string; topic?: string; ref?: string }>();
  const { data, ready } = useWay();
  const existing = params.id ? data.entries.find((e) => e.id === params.id) : undefined;
  const initial = useMemo<Draft>(() => {
    if (existing) return { ...existing };
    const d = blank((KIND_BY_ID[params.kind as EntryKind] ? params.kind : "checkin") as EntryKind);
    if (params.topic && TOPIC_BY_ID[params.topic]) d.topics = [params.topic];
    if (params.ref) d.refs = [params.ref];
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, existing?.id]);
  const [d, setD] = useState<Draft>(initial);
  const [dateText, setDateText] = useState(fmtDate(initial.date));
  const [custom, setCustom] = useState("");
  const [refText, setRefText] = useState("");
  const [more, setMore] = useState(!!existing || initial.kind !== "checkin" || !!params.ref || !!params.topic);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [safety, setSafety] = useState<{ danger: boolean; abuse: boolean } | null>(null);
  // Falls das Tagebuch erst nach dem Öffnen geladen wurde: Eintrag übernehmen
  useEffect(() => {
    if (existing && !d.id) { setD({ ...existing }); setDateText(fmtDate(existing.date)); setMore(true); }
  }, [existing, d.id]);
  const accent = diaryColor(colors);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const k = KIND_BY_ID[d.kind];
  const isCheckin = d.kind === "checkin";

  if (ready && params.id && !existing && !safety) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl, padding: spacing.lg, gap: spacing.md }]} testID="entry-missing">
        <Text style={w.secTitle}>Eintrag nicht gefunden</Text>
        <Button testID="entry-missing-back" label="Zurück" icon="arrow-left" onPress={() => router.back()} />
      </View>
    );
  }

  if (ready && !data.introSeenAt) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.md }]} testID="entry-intro-gate">
        <View style={[w.row, { paddingHorizontal: spacing.lg }]}>
          <Pressable onPress={() => router.back()} style={[w.back, { backgroundColor: colors.surfaceSecondary }]} testID="entry-intro-back" accessibilityLabel="Zurück"><Icon name="arrow-left" size={22} color={colors.onSurface} /></Pressable>
        </View>
        <DiaryIntro />
      </View>
    );
  }

  const suggestedTopics = [...new Set(d.feelings.flatMap((f) => topicsForFeeling(f).map((t) => t.id)))];
  const topicPool = [...new Set([...d.topics, ...suggestedTopics, ...TOPICS.map((t) => t.id)])];
  const stationPool = [...new Set([...d.stations, ...d.topics.flatMap((t) => TOPIC_BY_ID[t]?.stations ?? [])])].filter((s) => STATION_INFO[s]);
  const lexPool = [...new Set([...d.lexicon, ...d.topics.flatMap((t) => TOPIC_BY_ID[t]?.lexicon ?? [])])].filter((l) => ARTICLE_BY_ID[l]);
  const toggle = (key: "topics" | "stations" | "lexicon", v: string) => set({ [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] } as Partial<Draft>);

  const addRef = () => {
    const r = parseRef(refText);
    if (!r) return toast.show("Bibelstelle nicht erkannt – z. B. „Ps 23,1“ oder „Joh 11,35“", "error");
    const key = `${r.code}:${r.ch}${r.v ? `:${r.v}${r.vEnd && r.vEnd > r.v ? "-" + r.vEnd : ""}` : ""}`;
    if (!d.refs.includes(key)) set({ refs: [...d.refs, key] });
    setRefText("");
  };
  const save = () => {
    const iso = toISO(dateText);
    if (!iso) return toast.show("Bitte das Datum als gültiges Datum TT.MM.JJJJ eingeben", "error");
    if (!hasContent(d, custom)) return toast.show("Der Eintrag ist noch leer – ein Wort oder ein Gefühl genügt", "error");
    const extra = custom.trim() ? [...d.customFeelings, custom.trim()] : d.customFeelings;
    way.saveEntry({ ...d, date: iso, customFeelings: extra });
    const s = safetyCheck([d.mood, d.concern, d.selfView, d.goodBad, d.thought, d.toGod, d.nextStep, d.note, ...extra]);
    if (s.danger || s.abuse) { setSafety(s); return; }
    toast.show(existing ? "Eintrag aktualisiert" : "Eintrag gespeichert – nur auf diesem Gerät");
    router.back();
  };

  if (safety) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.lg }]} testID="entry-safety">
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Text style={w.body}>Dein Eintrag ist gespeichert. Danke, dass du so ehrlich bist.</Text>
          <Button testID="entry-safety-done-top" variant="ghost" label="Zurück zum Tagebuch" icon="arrow-left" onPress={() => router.back()} />
          <CrisisCard abuse={safety.abuse && !safety.danger} />
          <Button testID="entry-safety-done" variant="secondary" label="Zurück zum Tagebuch" icon="arrow-left" onPress={() => router.back()} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="entry-screen">
      <View style={[w.head, { paddingTop: insets.top + spacing.sm, backgroundColor: accent }]}>
        <Pressable onPress={() => ((existing ? JSON.stringify({ ...existing }) !== JSON.stringify(d) || !!custom.trim() : hasContent(d, custom)) ? setConfirmLeave(true) : router.back())} style={w.back} testID="entry-back" accessibilityLabel="Ohne Speichern zurück">
          <Icon name="x" size={22} color={colors.surface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.over, { color: colors.surface }]}>Persönliches Register · privat</Text>
          <Text style={[w.headTitle, { color: colors.surface }]} accessibilityRole="header">{existing ? `${k.label} bearbeiten` : `Neue/r ${k.label}`}</Text>
        </View>
      </View>
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, maxWidth: 760, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
        <Text style={w.muted}>Alle Felder sind freiwillig. Ein Wort oder ein Gefühl genügt.</Text>
        <View style={[w.wrap, { marginTop: spacing.md }]}>
          {(["checkin", "insight", "question", "prayer", "step"] as EntryKind[]).map((x) => <Chip key={x} testID={`entry-kind-${x}`} label={KIND_BY_ID[x].label} selected={d.kind === x} onPress={() => set({ kind: x })} />)}
        </View>
        <View style={[w.row, { marginTop: spacing.sm }]}>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Text style={w.label}>Datum</Text>
            <TextInput testID="entry-date" value={dateText} onChangeText={setDateText} placeholder="TT.MM.JJJJ" placeholderTextColor={colors.muted} style={w.input} keyboardType="numbers-and-punctuation" accessibilityLabel="Datum" />
          </View>
          <View style={{ width: 120 }}>
            <Text style={w.label}>Uhrzeit</Text>
            <TextInput testID="entry-time" value={d.time ?? ""} onChangeText={(t) => set({ time: t || undefined })} placeholder="HH:MM" placeholderTextColor={colors.muted} style={w.input} keyboardType="numbers-and-punctuation" accessibilityLabel="Uhrzeit" />
          </View>
        </View>

        <Field id="mood" label={isCheckin ? "Wie geht es mir gerade?" : k.hint} value={d.mood} onChange={(t) => set({ mood: t })} lines={3} />

        {isCheckin || more ? (
          <>
            <Text style={w.label}>Welche Gefühle sind da?</Text>
            <FeelingPicker value={d.feelings} onChange={(f) => set({ feelings: f })} />
            <View style={[w.row, { marginTop: spacing.sm }]}>
              <TextInput testID="entry-custom-feeling" value={custom} onChangeText={setCustom} placeholder="Eigener Begriff …" placeholderTextColor={colors.muted} style={[w.input, { flex: 1 }]} onSubmitEditing={() => { if (custom.trim()) { set({ customFeelings: [...d.customFeelings, custom.trim()] }); setCustom(""); } }} accessibilityLabel="Eigenes Gefühl" />
              <Pressable testID="entry-custom-add" onPress={() => { if (custom.trim()) { set({ customFeelings: [...d.customFeelings, custom.trim()] }); setCustom(""); } }} style={styles.round} accessibilityLabel="Eigenes Gefühl hinzufügen"><Icon name="plus" size={20} color={colors.onBrandPrimary} /></Pressable>
            </View>
            {d.customFeelings.length ? <View style={[w.wrap, { marginTop: spacing.sm }]}>{d.customFeelings.map((f) => <Chip key={f} testID={`entry-custom-${f}`} label={`${f}  ✕`} onPress={() => set({ customFeelings: d.customFeelings.filter((x) => x !== f) })} />)}</View> : null}
            <Text style={w.label}>Wie stark ist das Gefühl?</Text>
            <View style={w.wrap} accessibilityRole="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => <Chip key={n} testID={`entry-intensity-${n}`} label={`${n}`} selected={d.intensity === n} onPress={() => set({ intensity: d.intensity === n ? undefined : n })} />)}
              <Chip testID="entry-intensity-none" label="möchte ich nicht einstufen" selected={d.intensity === null} onPress={() => set({ intensity: d.intensity === null ? undefined : null })} />
            </View>
            <Text style={w.muted}>1 = kaum spürbar, 5 = sehr stark. Keine Stufe ist besser oder schlechter.</Text>
          </>
        ) : null}

        {!more ? <Button testID="entry-more" variant="ghost" icon="chevron-down" label="Vertiefen (weitere Fragen)" onPress={() => setMore(true)} style={{ marginTop: spacing.md }} /> : (
          <>
            <Field id="concern" label="Was beschäftigt mich heute?" value={d.concern} onChange={(t) => set({ concern: t })} />
            <Field id="selfview" label="Wie sehe ich mich selbst in diesem Moment?" value={d.selfView} onChange={(t) => set({ selfView: t })} />
            <Field id="goodbad" label="Was hat mir heute gutgetan oder Kraft genommen?" value={d.goodBad} onChange={(t) => set({ goodBad: t })} />
            <Field id="thought" label="Welche Bibelstelle oder welcher Gedanke spricht mich an?" value={d.thought} onChange={(t) => set({ thought: t })} />
            <Field id="togod" label="Was möchte ich Gott sagen oder fragen?" value={d.toGod} onChange={(t) => set({ toGod: t })} />
            <Field id="nextstep" label="Was wäre ein kleiner, hilfreicher nächster Schritt?" value={d.nextStep} onChange={(t) => set({ nextStep: t })} lines={2} />
            <Text style={w.label}>Möchte ich mit jemandem darüber sprechen?</Text>
            <View style={w.wrap}>
              {([["yes", "Ja"], ["unsure", "Vielleicht"], ["no", "Nein"]] as const).map(([v, l]) => <Chip key={v} testID={`entry-talk-${v}`} label={l} selected={d.talk === v} onPress={() => set({ talk: d.talk === v ? undefined : v })} />)}
            </View>
            {d.kind === "question" ? (
              <View style={{ marginTop: spacing.md }}><Chip testID="entry-resolved" label={d.resolved ? "✓ Für mich beantwortet" : "Frage ist noch offen"} selected={!!d.resolved} onPress={() => set({ resolved: !d.resolved })} /></View>
            ) : null}

            <Text style={[w.secTitle, { marginTop: spacing.xl }]}>Verknüpfungen</Text>
            <Text style={w.muted}>Nur für dich. Das allgemeine Register wird dadurch nicht verändert.</Text>
            <Text style={w.label}>Bibelstellen</Text>
            <View style={w.row}>
              <TextInput testID="entry-ref-input" value={refText} onChangeText={setRefText} placeholder="z. B. Ps 23,1" placeholderTextColor={colors.muted} style={[w.input, { flex: 1 }]} onSubmitEditing={addRef} accessibilityLabel="Bibelstelle hinzufügen" />
              <Pressable testID="entry-ref-add" onPress={addRef} style={styles.round} accessibilityLabel="Bibelstelle hinzufügen"><Icon name="plus" size={20} color={colors.onBrandPrimary} /></Pressable>
            </View>
            {d.refs.length ? (
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                {d.refs.map((r) => {
                  const [b, c, v] = r.split(":");
                  return (
                    <View key={r} style={styles.linkRow}>
                      <Pressable style={{ flex: 1, minHeight: 44, justifyContent: "center" }} testID={`entry-ref-open-${r}`} onPress={() => router.navigate({ pathname: "/bible", params: { b, ch: c, ...(v ? { v: v.split("-")[0] } : {}) } })} accessibilityRole="link">
                        <Text style={w.ref}>{refLabelW(r)} ↗</Text>
                      </Pressable>
                      <Pressable testID={`entry-ref-remove-${r}`} onPress={() => set({ refs: d.refs.filter((x) => x !== r) })} hitSlop={10} accessibilityLabel={`${refLabelW(r)} entfernen`}><Icon name="x" size={18} color={colors.muted} /></Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
            <Text style={w.label}>Themen aus dem Register{suggestedTopics.length ? " (passende zuerst)" : ""}</Text>
            <View style={w.wrap}>{topicPool.map((t) => <Chip key={t} testID={`entry-topic-${t}`} label={TOPIC_BY_ID[t].title} selected={d.topics.includes(t)} onPress={() => toggle("topics", t)} />)}</View>
            {d.topics.length ? (
              <View style={[w.wrap, { marginTop: spacing.sm }]}>
                {d.topics.map((t) => <Pressable key={t} testID={`entry-topic-open-${t}`} onPress={() => router.push({ pathname: "/way/topic/[id]", params: { id: t } })} style={styles.openLink}><Icon name="book" size={13} color={colors.info} /><Text style={[styles.openText, { color: colors.info }]}>{TOPIC_BY_ID[t].title} öffnen</Text></Pressable>)}
              </View>
            ) : null}
            {stationPool.length ? (
              <>
                <Text style={w.label}>Lerneinheiten</Text>
                <View style={w.wrap}>{stationPool.map((s) => <Chip key={s} testID={`entry-station-${s}`} label={STATION_INFO[s].station.title} selected={d.stations.includes(s)} onPress={() => toggle("stations", s)} />)}</View>
              </>
            ) : null}
            {lexPool.length ? (
              <>
                <Text style={w.label}>Lexikon</Text>
                <View style={w.wrap}>{lexPool.map((l) => <Chip key={l} testID={`entry-lex-${l}`} label={ARTICLE_BY_ID[l].title} selected={d.lexicon.includes(l)} onPress={() => toggle("lexicon", l)} />)}</View>
              </>
            ) : null}
            <Field id="note" label="Eigene Notiz" value={d.note} onChange={(t) => set({ note: t })} lines={2} />
          </>
        )}

        <Button testID="entry-save" label="Speichern" icon="save" onPress={save} style={{ marginTop: spacing.xl }} />
        {existing ? (
          confirmDel ? (
            <View style={[w.card, { marginTop: spacing.md, borderColor: colors.error }]} testID="entry-delete-confirm-box">
              <Text style={w.body}>Diesen Eintrag endgültig löschen? Das kann nicht rückgängig gemacht werden. Eine Sicherung kannst du vorher unter „Daten & Sicherung“ anlegen.</Text>
              <View style={w.row}>
                <Button testID="entry-delete-confirm" variant="danger" icon="trash-2" label="Endgültig löschen" onPress={() => { way.deleteEntry(existing.id); toast.show("Eintrag gelöscht"); router.back(); }} style={{ flexGrow: 1 }} />
                <Button testID="entry-delete-cancel" variant="ghost" label="Abbrechen" onPress={() => setConfirmDel(false)} style={{ flexGrow: 1 }} />
              </View>
            </View>
          ) : <Button testID="entry-delete" variant="ghost" icon="trash-2" label="Eintrag löschen" onPress={() => setConfirmDel(true)} style={{ marginTop: spacing.md }} />
        ) : null}
      </KeyboardAwareScrollView>
      <Sheet visible={confirmLeave} onClose={() => setConfirmLeave(false)} title="Ohne Speichern schließen?" testID="entry-leave-sheet">
        <View style={{ gap: spacing.sm }}>
          <Text style={w.body}>Was du geschrieben hast, wird nicht gespeichert.</Text>
          <Button testID="entry-leave-save" icon="save" label="Speichern" onPress={() => { setConfirmLeave(false); save(); }} />
          <Button testID="entry-leave-discard" variant="ghost" icon="x" label="Verwerfen" onPress={() => { setConfirmLeave(false); router.back(); }} />
        </View>
      </Sheet>
    </View>
  );
}

function Field({ label, value, onChange, id, lines = 3 }: { label: string; value?: string; onChange: (s: string) => void; id: string; lines?: number }) {
  const w = useWayStyles();
  const { colors } = useTheme();
  return (
    <View>
      <Text style={w.label}>{label}</Text>
      <TextInput testID={`entry-${id}`} value={value ?? ""} onChangeText={onChange} multiline={lines > 1} placeholder="Optional …" placeholderTextColor={colors.muted}
        style={[w.input, { minHeight: lines > 1 ? 24 * lines + 24 : 48 }]} accessibilityLabel={label} maxLength={4000} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  over: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", opacity: 0.9 },
  round: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: c.brandPrimary },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  openLink: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36 },
  openText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800" },
}));
