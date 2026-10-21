import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { getVerse } from "@/src/data/bible";
import { Task } from "@/src/data/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { RefText } from "./RefText";
import { Button } from "./ui";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleDifferent<T>(arr: T[]): T[] {
  if (arr.length < 2) return arr;
  let s = shuffle(arr);
  let guard = 0;
  while (s.every((x, i) => x === arr[i]) && guard++ < 10) s = shuffle(arr);
  return s;
}

type Props = { task: Task; onAnswered: (correct: boolean) => void; fontScale?: number; testPrefix?: string };

/** Rendert alle interaktiven Aufgabentypen mit Auswertung und Erklärung. */
export function TaskView({ task, onAnswered, fontScale = 1, testPrefix = "task" }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [result, setResult] = useState<null | boolean>(null);
  const [selfRated, setSelfRated] = useState<string | null>(null);
  const fs = (n: number) => n * fontScale;

  // Zustände der Aufgabentypen
  const [sel, setSel] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [filled, setFilled] = useState<(string | null)[]>(task.type === "gap" ? task.blanks.map(() => null) : []);
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [leftSel, setLeftSel] = useState<number | null>(null);
  const [seq, setSeq] = useState<number[]>([]);
  const [free, setFree] = useState("");
  const [showModel, setShowModel] = useState(false);

  const prepared = useMemo(() => {
    switch (task.type) {
      case "gap":
        return { bank: shuffle([...task.blanks, ...task.distractors]) };
      case "verse": {
        const text = getVerse("Joh", task.verse.ch, task.verse.v);
        const idx = text.indexOf(task.blank);
        return { before: text.slice(0, idx), after: text.slice(idx + task.blank.length), options: shuffle(task.options) };
      }
      case "match":
        return { right: shuffle(task.pairs.map((p, i) => i)) };
      case "order":
        return { items: shuffleDifferent(task.items.map((_, i) => i)) };
      default:
        return {};
    }
  }, [task]);

  const finish = (ok: boolean) => {
    if (result !== null) return;
    setResult(ok);
    onAnswered(ok);
  };
  const answered = result !== null;

  const check = () => {
    switch (task.type) {
      case "mc":
        return finish(sel === task.answer);
      case "verse":
        return finish(sel !== null && (prepared as any).options[sel] === task.blank);
      case "multi":
        return finish(multi.length === task.answers.length && task.answers.every((a) => multi.includes(a)));
      case "gap":
        return finish(filled.every((f, i) => f === task.blanks[i]));
      case "match":
        return finish(task.pairs.every((_, i) => pairs[i] === i));
      case "order":
        return finish(seq.every((v, i) => v === i));
      case "error":
        return finish(sel === task.wrongIndex);
    }
  };

  const canCheck =
    (task.type === "mc" || task.type === "verse" || task.type === "error") ? sel !== null
      : task.type === "multi" ? multi.length > 0
      : task.type === "gap" ? filled.every((f) => f !== null)
      : task.type === "match" ? Object.keys(pairs).length === task.pairs.length
      : task.type === "order" ? seq.length === task.items.length
      : false;

  const optionStyle = (i: number, isSel: boolean, isCorrect: boolean) => [
    styles.option,
    isSel && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
    answered && isCorrect && { borderColor: colors.success, backgroundColor: colors.surfaceTertiary },
    answered && isSel && !isCorrect && { borderColor: colors.error },
  ];

  const header = (() => {
    switch (task.type) {
      case "tf": return { kind: "Richtig oder falsch?", q: task.statement };
      case "mc": return { kind: "Multiple Choice", q: task.question };
      case "multi": return { kind: "Mehrfachauswahl", q: task.question };
      case "gap": return { kind: "Lückentext", q: task.question };
      case "verse": return { kind: "Bibelvers vervollständigen", q: task.question };
      case "match": return { kind: "Zuordnung", q: task.question };
      case "order": return { kind: "Chronologisch sortieren", q: task.question };
      case "error": return { kind: "Fehler finden", q: task.question };
      case "free": return { kind: "Freitext", q: task.question };
    }
  })();

  return (
    <Animated.View entering={FadeInDown.duration(300)} testID={`${testPrefix}-${task.id}`}>
      <Text style={styles.kind}>{header.kind}</Text>
      <Text style={[styles.q, { fontSize: fs(19), lineHeight: fs(27) }]}>{header.q}</Text>

      {task.type === "tf" ? (
        <View style={styles.row}>
          {[true, false].map((v) => (
            <Pressable
              key={String(v)}
              testID={`${testPrefix}-tf-${v ? "true" : "false"}`}
              disabled={answered}
              onPress={() => { setSel(v ? 1 : 0); finish(v === task.answer); }}
              style={[styles.tfBtn, ...optionStyle(0, sel === (v ? 1 : 0), answered && v === task.answer)]}
            >
              <Icon name={v ? "check" : "x"} size={20} color={colors.onSurface} />
              <Text style={[styles.optText, { fontSize: fs(16) }]}>{v ? "Richtig" : "Falsch"}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {task.type === "mc" ? task.options.map((o, i) => (
        <Pressable key={i} testID={`${testPrefix}-option-${i}`} disabled={answered} onPress={() => setSel(i)} style={optionStyle(i, sel === i, i === task.answer)}>
          <View style={[styles.radio, sel === i && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]} />
          <Text style={[styles.optText, { fontSize: fs(16) }]}>{o}</Text>
        </Pressable>
      )) : null}

      {task.type === "multi" ? task.options.map((o, i) => {
        const on = multi.includes(i);
        return (
          <Pressable key={i} testID={`${testPrefix}-option-${i}`} disabled={answered} onPress={() => setMulti((m) => (on ? m.filter((x) => x !== i) : [...m, i]))} style={optionStyle(i, on, task.answers.includes(i))}>
            <View style={[styles.box, on && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>{on ? <Icon name="check" size={14} color={colors.onBrandPrimary} /> : null}</View>
            <Text style={[styles.optText, { fontSize: fs(16) }]}>{o}</Text>
          </Pressable>
        );
      }) : null}

      {task.type === "verse" ? (
        <>
          <View style={styles.verseCard}>
            <Text style={[styles.verseText, { fontSize: fs(17), lineHeight: fs(27) }]}>
              {(prepared as any).before}
              <Text style={styles.blank}>{sel !== null ? (prepared as any).options[sel] : " ______ "}</Text>
              {(prepared as any).after}
            </Text>
            <Text style={styles.verseRef}>Joh {task.verse.ch},{task.verse.v} · Elberfelder 1905</Text>
          </View>
          <View style={styles.wrapRow}>
            {(prepared as any).options.map((o: string, i: number) => (
              <Pressable key={o} testID={`${testPrefix}-option-${i}`} disabled={answered} onPress={() => setSel(i)} style={[styles.word, sel === i && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>
                <Text style={[styles.wordText, { color: sel === i ? colors.onBrandPrimary : colors.onSurface }]}>{o}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {task.type === "gap" ? (
        <>
          <View style={styles.verseCard}>
            <Text style={[styles.verseText, { fontSize: fs(17), lineHeight: fs(30) }]}>
              {task.parts.map((p, i) => (
                <Text key={i}>
                  {p}
                  {i < task.blanks.length ? (
                    <Text
                      testID={`${testPrefix}-blank-${i}`}
                      onPress={() => !answered && setFilled((f) => f.map((x, j) => (j === i ? null : x)))}
                      style={[styles.blank, answered && { color: filled[i] === task.blanks[i] ? colors.success : colors.error }]}
                    >
                      {filled[i] ?? " ______ "}
                    </Text>
                  ) : null}
                </Text>
              ))}
            </Text>
          </View>
          <View style={styles.wrapRow}>
            {(prepared as any).bank.map((w: string, i: number) => {
              const used = filled.includes(w);
              return (
                <Pressable
                  key={w + i}
                  testID={`${testPrefix}-word-${i}`}
                  disabled={answered || used}
                  onPress={() => setFilled((f) => { const k = f.indexOf(null); if (k < 0) return f; const n = [...f]; n[k] = w; return n; })}
                  style={[styles.word, used && { opacity: 0.35 }]}
                >
                  <Text style={styles.wordText}>{w}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {task.type === "match" ? (
        <View style={styles.matchRow}>
          <View style={styles.matchCol}>
            {task.pairs.map((p, i) => {
              const paired = pairs[i] !== undefined;
              return (
                <Pressable key={i} testID={`${testPrefix}-left-${i}`} disabled={answered} onPress={() => setLeftSel(i)}
                  style={[styles.matchItem, leftSel === i && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary }, paired && { borderColor: colors.info }, answered && { borderColor: pairs[i] === i ? colors.success : colors.error }]}>
                  <Text style={[styles.matchText, { fontSize: fs(14) }]}>{p[0]}</Text>
                  {paired ? <Text style={styles.pairedTo}>→ {task.pairs[pairs[i]][1]}</Text> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.matchCol}>
            {(prepared as any).right.map((ri: number) => {
              const used = Object.values(pairs).includes(ri);
              return (
                <Pressable key={ri} testID={`${testPrefix}-right-${ri}`} disabled={answered || leftSel === null}
                  onPress={() => {
                    if (leftSel === null) return;
                    setPairs((p) => { const n = { ...p }; for (const k of Object.keys(n)) if (n[+k] === ri) delete n[+k]; n[leftSel] = ri; return n; });
                    setLeftSel(null);
                  }}
                  style={[styles.matchItem, used && { opacity: 0.45 }, leftSel !== null && !used && { borderColor: colors.brandPrimary }]}>
                  <Text style={[styles.matchText, { fontSize: fs(14) }]}>{task.pairs[ri][1]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      {task.type === "match" && !answered ? <Text style={styles.hint}>Tippe links einen Begriff, dann rechts die passende Bedeutung.</Text> : null}

      {task.type === "order" ? (
        <>
          {(prepared as any).items.map((idx: number) => {
            const pos = seq.indexOf(idx);
            return (
              <Pressable key={idx} testID={`${testPrefix}-order-${idx}`} disabled={answered}
                onPress={() => setSeq((s) => (pos >= 0 ? s.filter((x) => x !== idx) : [...s, idx]))}
                style={[styles.option, pos >= 0 && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary }, answered && { borderColor: seq[idx] === idx ? colors.success : colors.error }]}>
                <View style={[styles.num, pos >= 0 && { backgroundColor: colors.brandPrimary }]}>
                  <Text style={[styles.numText, pos >= 0 && { color: colors.onBrandPrimary }]}>{pos >= 0 ? pos + 1 : "·"}</Text>
                </View>
                <Text style={[styles.optText, { fontSize: fs(15) }]}>{task.items[idx]}</Text>
              </Pressable>
            );
          })}
          {!answered ? <Text style={styles.hint}>Tippe die Ereignisse in der richtigen Reihenfolge an.</Text> : null}
        </>
      ) : null}

      {task.type === "error" ? (
        <View style={[styles.verseCard, styles.wrapRow]}>
          {task.words.map((w, i) => (
            <Pressable key={i} testID={`${testPrefix}-errword-${i}`} disabled={answered} onPress={() => setSel(i)}
              style={[styles.errWord, sel === i && { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary }, answered && i === task.wrongIndex && { borderColor: colors.error, backgroundColor: colors.surfaceTertiary }]}>
              <Text style={[styles.wordText, { fontSize: fs(17) }, answered && i === task.wrongIndex && { textDecorationLine: "line-through", color: colors.error }]}>{w}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {task.type === "free" ? (
        <>
          <TextInput
            testID={`${testPrefix}-free-input`}
            value={free}
            onChangeText={setFree}
            multiline
            placeholder="Deine Antwort …"
            placeholderTextColor={colors.muted}
            style={[styles.input, { fontSize: fs(16) }]}
          />
          {!showModel ? (
            <Button testID={`${testPrefix}-show-model`} label="Musterantwort zeigen" variant="ghost" icon="eye" onPress={() => setShowModel(true)} />
          ) : (
            <Animated.View entering={FadeIn}>
              <View style={[styles.feedback, { borderColor: colors.info }]}>
                <Text style={[styles.fbTitle, { color: colors.info }]}>Musterantwort</Text>
                <Text style={[styles.fbText, { fontSize: fs(15) }]}>{task.model}</Text>
                <RefText text={task.ref} style={styles.fbRef} />
              </View>
              <Text style={styles.hint}>Wie gut passt deine Antwort? (Selbsteinschätzung – keine automatische Bewertung)</Text>
              <View style={styles.row}>
                {["Getroffen", "Teilweise", "Noch nicht"].map((r) => (
                  <Pressable key={r} testID={`${testPrefix}-self-${r}`} onPress={() => { setSelfRated(r); if (result === null) { setResult(true); onAnswered(true); } }}
                    style={[styles.selfBtn, selfRated === r && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>
                    <Text style={[styles.wordText, { color: selfRated === r ? colors.onBrandPrimary : colors.onSurface }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}
        </>
      ) : null}

      {task.type !== "tf" && task.type !== "free" && !answered ? (
        <Button testID={`${testPrefix}-check`} label="Antwort prüfen" icon="check-circle" disabled={!canCheck} onPress={check} style={{ marginTop: spacing.lg }} />
      ) : null}

      {answered && task.type !== "free" ? (
        <Animated.View entering={FadeInDown} testID={`${testPrefix}-feedback`} style={[styles.feedback, { borderColor: result ? colors.success : colors.error }]}>
          <View style={styles.fbHead}>
            <Icon name={result ? "check-circle" : "info"} size={20} color={result ? colors.success : colors.error} />
            <Text style={[styles.fbTitle, { color: result ? colors.success : colors.error }]}>{result ? "Richtig!" : "Nicht ganz richtig"}</Text>
          </View>
          {!result && task.type === "error" ? <Text style={[styles.fbText, { fontWeight: "700" }]}>Richtig wäre: „{task.correction}“</Text> : null}
          {!result && task.type === "order" ? <Text style={styles.fbText}>Richtige Reihenfolge: {task.items.map((t, i) => `${i + 1}. ${t}`).join("  ")}</Text> : null}
          {!result && task.type === "match" ? <Text style={styles.fbText}>{task.pairs.map((p) => `${p[0]} → ${p[1]}`).join(" · ")}</Text> : null}
          {!result && task.type === "gap" ? <Text style={styles.fbText}>Lösung: {task.blanks.join(", ")}</Text> : null}
          {!result && task.type === "verse" ? <Text style={styles.fbText}>Lösung: „{task.blank}“</Text> : null}
          <Text style={[styles.fbText, { fontSize: fs(15) }]}>{task.explain}</Text>
          <RefText text={task.ref} prefix="Bibelstelle: " style={styles.fbRef} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  kind: { fontFamily: fonts.text, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.brandPrimary, fontWeight: "800", marginBottom: spacing.xs },
  q: { fontFamily: fonts.display, color: c.onSurface, fontWeight: "600", marginBottom: spacing.lg },
  row: { flexDirection: "row", gap: spacing.md },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 52, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary, marginBottom: spacing.sm },
  tfBtn: { flex: 1, justifyContent: "center" },
  optText: { flex: 1, fontFamily: fonts.text, color: c.onSurfaceSecondary, fontWeight: "600" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.borderStrong },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: c.borderStrong, alignItems: "center", justifyContent: "center" },
  verseCard: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: c.border, marginBottom: spacing.lg },
  verseText: { fontFamily: fonts.display, color: c.onSurface },
  verseRef: { fontFamily: fonts.text, color: c.muted, fontSize: 12, marginTop: spacing.sm },
  blank: { color: c.brandPrimary, fontWeight: "800", textDecorationLine: "underline" },
  word: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.borderStrong, backgroundColor: c.surface },
  wordText: { fontFamily: fonts.text, color: c.onSurface, fontWeight: "700", fontSize: 15 },
  errWord: { minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderWidth: 1.5, borderColor: "transparent" },
  matchRow: { flexDirection: "row", gap: spacing.sm },
  matchCol: { flex: 1, gap: spacing.sm },
  matchItem: { minHeight: 56, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  matchText: { fontFamily: fonts.text, color: c.onSurfaceSecondary, fontWeight: "700" },
  pairedTo: { fontFamily: fonts.text, color: c.info, fontSize: 12, marginTop: 2 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  numText: { fontFamily: fonts.text, fontWeight: "800", color: c.onSurfaceTertiary },
  hint: { fontFamily: fonts.text, color: c.muted, fontSize: 13, marginTop: spacing.sm, marginBottom: spacing.sm },
  input: { minHeight: 120, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface, marginBottom: spacing.md },
  feedback: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 2, backgroundColor: c.surfaceSecondary, gap: spacing.sm },
  fbHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  fbTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700" },
  fbText: { fontFamily: fonts.text, color: c.onSurfaceSecondary, fontSize: 15, lineHeight: 22 },
  fbRef: { fontFamily: fonts.text, color: c.brandPrimary, fontWeight: "700", fontSize: 13 },
  selfBtn: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.borderStrong },
}));
