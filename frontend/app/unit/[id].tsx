import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { VerseSnippet } from "@/src/components/RefText";
import { useToast } from "@/src/components/Toast";
import { Button, Chip, SectionTitle } from "@/src/components/ui";
import { verseKey, verseKeyLabel } from "@/src/data/bible";
import { parseRef } from "@/src/data/books";
import { uid } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

/** Eigene Lerneinheit: Bibelstellen sammeln, Fragen formulieren, mit Lernkarten üben. */
export default function UnitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const p = useProgress();
  const unit = p.state.units.find((u) => u.id === id);
  const [refText, setRefText] = useState("");
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [mode, setMode] = useState<"edit" | "learn">("edit");
  const [card, setCard] = useState(0);
  const [flip, setFlip] = useState(false);

  if (!unit) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl, alignItems: "center" }]}>
        <Text style={styles.title}>Lerneinheit nicht gefunden</Text>
        <Button testID="unit-missing-back" label="Zurück" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }
  const save = (patch: Partial<typeof unit>) => p.saveUnit({ ...unit, ...patch });
  const openRef = (k: string) => {
    const [b, ch, v] = k.split(":");
    router.navigate({ pathname: "/bible", params: { b, ch, v } });
  };
  const qs = unit.questions;

  return (
    <View style={styles.root} testID="unit-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="unit-back-button" accessibilityLabel="Zurück">
          <Icon name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.hTitle} numberOfLines={1}>Eigene Lerneinheit</Text>
        <Pressable testID="unit-delete-button" onPress={() => { p.deleteUnit(unit.id); toast.show("Lerneinheit gelöscht"); router.back(); }} style={styles.back} accessibilityLabel="Lerneinheit löschen">
          <Icon name="trash-2" size={18} color={colors.error} />
        </Pressable>
      </View>
      <View style={styles.modeRow}>
        <Chip testID="unit-mode-edit" label="Bearbeiten" selected={mode === "edit"} onPress={() => setMode("edit")} />
        <Chip testID="unit-mode-learn" label={`Lernen (${qs.length})`} selected={mode === "learn"} onPress={() => { setMode("learn"); setCard(0); setFlip(false); }} />
      </View>
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xxl }} keyboardShouldPersistTaps="handled">
        {mode === "edit" ? (
          <>
            <TextInput testID="unit-title-input" value={unit.title} onChangeText={(t) => save({ title: t })} style={styles.titleInput} placeholder="Titel" placeholderTextColor={colors.muted} />
            <TextInput testID="unit-desc-input" value={unit.description} onChangeText={(t) => save({ description: t })} multiline style={styles.input} placeholder="Worum geht es? Ziel, Thema, Fragestellung …" placeholderTextColor={colors.muted} />

            <SectionTitle>Bibelstellen ({unit.refs.length})</SectionTitle>
            {unit.refs.map((k) => (
              <Pressable key={k} style={styles.card} onPress={() => openRef(k)} testID={`unit-ref-${k}`}>
                <View style={styles.cardHead}>
                  <Icon name="book-open" size={14} color={colors.brandPrimary} />
                  <Text style={styles.cardTitle}>{verseKeyLabel(k)}</Text>
                  <Pressable onPress={() => save({ refs: unit.refs.filter((r) => r !== k) })} hitSlop={10} testID={`unit-ref-remove-${k}`} accessibilityLabel="Stelle entfernen">
                    <Icon name="x" size={16} color={colors.error} />
                  </Pressable>
                </View>
                <VerseSnippet k={k} style={styles.verse} />
              </Pressable>
            ))}
            <View style={styles.inline}>
              <TextInput testID="unit-ref-input" value={refText} onChangeText={setRefText} placeholder="Stelle hinzufügen, z. B. Jes 53,5" placeholderTextColor={colors.muted} style={[styles.inputSm, { flex: 1 }]} autoCapitalize="none" />
              <Pressable
                testID="unit-ref-add"
                style={styles.add}
                accessibilityLabel="Stelle hinzufügen"
                onPress={() => {
                  const r = parseRef(refText);
                  if (!r) return toast.show("Bibelstelle nicht erkannt", "error");
                  const k = verseKey(r.code, r.ch, r.v ?? 1);
                  if (!unit.refs.includes(k)) save({ refs: [...unit.refs, k] });
                  setRefText("");
                }}
              >
                <Icon name="plus" size={20} color={colors.onBrandPrimary} />
              </Pressable>
            </View>

            <SectionTitle>Eigene Fragen ({qs.length})</SectionTitle>
            {qs.map((x) => (
              <View key={x.id} style={styles.card} testID={`unit-question-${x.id}`}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{x.q}</Text>
                  <Pressable onPress={() => save({ questions: qs.filter((y) => y.id !== x.id) })} hitSlop={10} accessibilityLabel="Frage löschen">
                    <Icon name="trash-2" size={16} color={colors.error} />
                  </Pressable>
                </View>
                <Text style={styles.answer}>{x.a}</Text>
              </View>
            ))}
            <TextInput testID="unit-q-input" value={q} onChangeText={setQ} placeholder="Frage" placeholderTextColor={colors.muted} style={styles.inputSm} />
            <TextInput testID="unit-a-input" value={a} onChangeText={setA} placeholder="Antwort / Musterantwort" placeholderTextColor={colors.muted} multiline style={[styles.input, { minHeight: 80, marginTop: spacing.sm }]} />
            <Button testID="unit-q-add" label="Frage hinzufügen" icon="plus" variant="secondary" disabled={!q.trim() || !a.trim()} style={{ marginTop: spacing.sm }} onPress={() => { save({ questions: [...qs, { id: uid(), q: q.trim(), a: a.trim() }] }); setQ(""); setA(""); }} />
          </>
        ) : qs.length === 0 ? (
          <Text style={styles.answer}>Lege zuerst unter „Bearbeiten“ eigene Fragen an.</Text>
        ) : card >= qs.length ? (
          <View style={{ alignItems: "center", gap: spacing.lg }} testID="unit-learn-done">
            <Icon name="check-circle" size={48} color={colors.success} />
            <Text style={styles.title}>Alle Karten durchgearbeitet!</Text>
            <Button testID="unit-learn-restart" label="Noch einmal" icon="refresh-cw" onPress={() => { setCard(0); setFlip(false); }} />
          </View>
        ) : (
          <View>
            <Text style={styles.counter}>Karte {card + 1} von {qs.length}</Text>
            <Pressable testID="unit-flashcard" onPress={() => setFlip(!flip)} style={[styles.flash, flip && { backgroundColor: colors.surfaceTertiary }]}>
              <Animated.View key={String(flip) + card} entering={FadeIn}>
                <Text style={styles.flashLabel}>{flip ? "Antwort" : "Frage"}</Text>
                <Text style={styles.flashText}>{flip ? qs[card].a : qs[card].q}</Text>
                {!flip ? <Text style={styles.counter}>Tippen zum Umdrehen</Text> : null}
              </Animated.View>
            </Pressable>
            {flip ? (
              <View style={styles.inline}>
                {["Gewusst", "Teilweise", "Wiederholen"].map((r) => (
                  <Button key={r} testID={`unit-rate-${r}`} label={r} variant={r === "Gewusst" ? "primary" : "secondary"} style={{ flex: 1, paddingHorizontal: spacing.sm }} onPress={() => { setFlip(false); setCard(card + 1); }} />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  hTitle: { flex: 1, fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface },
  modeRow: { height: 56, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  titleInput: { fontFamily: fonts.display, fontSize: 24, fontWeight: "700", color: c.onSurface, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: spacing.sm, marginBottom: spacing.md },
  input: { minHeight: 100, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
  inputSm: { height: 48, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
  inline: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginTop: spacing.sm },
  add: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: c.border },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { flex: 1, fontFamily: fonts.display, fontSize: 16, fontWeight: "700", color: c.onSurface },
  verse: { fontFamily: fonts.display, fontSize: 15, lineHeight: 23, color: c.onSurfaceSecondary, marginTop: spacing.sm },
  answer: { fontFamily: fonts.text, fontSize: 15, color: c.onSurfaceSecondary, marginTop: spacing.sm, lineHeight: 22 },
  counter: { fontFamily: fonts.text, fontSize: 13, color: c.muted, fontWeight: "700", marginVertical: spacing.sm },
  flash: { minHeight: 220, borderRadius: 28, padding: spacing.xl, backgroundColor: c.surfaceSecondary, borderWidth: 2, borderColor: c.brandPrimary, justifyContent: "center", marginBottom: spacing.lg },
  flashLabel: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary },
  flashText: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface, marginTop: spacing.sm, lineHeight: 30 },
}));
