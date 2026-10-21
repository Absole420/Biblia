import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { refLabel, StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { Button } from "@/src/components/ui";
import { getChapterSync, loadChapter } from "@/src/data/bible";
import { reviewAnswer, today } from "@/src/lib/study";
import { useProgress } from "@/src/lib/store";

/** Merkliste mit Wiederholung in einstellbaren Abständen sowie offene Fragen aus dem Journal. */
export default function Memorize() {
  const s = useStudyStyles();
  const router = useRouter();
  const { state, updateStudy } = useProgress();
  const [shown, setShown] = useState<Record<string, string>>({});
  const t = today();
  const due = state.study.review.filter((r) => r.due <= t);
  const later = state.study.review.filter((r) => r.due > t);
  const reveal = async (key: string) => {
    const [b, c, v] = key.split(":");
    const [from, to] = v.split("-").map(Number);
    const vs = getChapterSync(b, +c) ?? (await loadChapter(b, +c).catch(() => null));
    setShown((x) => ({ ...x, [key]: vs ? vs.slice(from - 1, to || from).join(" ") : "Offline nicht verfügbar." }));
  };
  const upd = (key: string, fn: (r: (typeof due)[number]) => (typeof due)[number] | null) => updateStudy((x) => ({ ...x, review: x.review.map((r) => (r.key === key ? fn(r) : r)).filter(Boolean) as typeof x.review }));
  const questions = state.study.journal.filter((j) => j.unclear.trim());
  return (
    <StudyScreen title="Merkliste" sub={`${due.length} heute fällig · Abstände: 1, 3, 7, 14, 30 Tage`} testID="memorize-screen">
      {due.length === 0 ? <Text style={s.body} testID="memorize-empty">Heute ist nichts fällig. Füge Verse über das Versmenü („Zur Merkliste“) hinzu.</Text> : null}
      {due.map((r) => (
        <View key={r.key} style={s.card} testID={`review-${r.key}`}>
          <Text style={s.title}>{refLabel(r.key)}</Text>
          {shown[r.key] ? <Text style={s.body}>{shown[r.key]}</Text> : <Button testID={`review-reveal-${r.key}`} variant="ghost" icon="eye" label="Text aufdecken" onPress={() => reveal(r.key)} />}
          <View style={s.row}>
            <Button testID={`review-again-${r.key}`} variant="ghost" label="Nochmal (morgen)" onPress={() => upd(r.key, (x) => reviewAnswer(x, false, t))} />
            <Button testID={`review-knew-${r.key}`} variant="secondary" label={`Gewusst (in ${r.intervals[Math.min(r.step + 1, r.intervals.length - 1)]} T.)`} onPress={() => upd(r.key, (x) => reviewAnswer(x, true, t))} />
          </View>
        </View>
      ))}
      {later.length ? <Text style={s.h2}>Später</Text> : null}
      {later.map((r) => (
        <View key={r.key} style={[s.card, s.row]}>
          <Text style={[s.body, { flex: 1 }]}>{refLabel(r.key)} – fällig {r.due}</Text>
          <Pressable testID={`review-remove-${r.key}`} onPress={() => upd(r.key, () => null)} accessibilityLabel="Entfernen"><Text style={s.warn}>Entfernen</Text></Pressable>
        </View>
      ))}
      <Text style={s.h2}>Offene Fragen</Text>
      {questions.length === 0 ? <Text style={s.body}>Fragen aus dem Journal („Was verstehe ich noch nicht?“) erscheinen hier.</Text> : null}
      {questions.map((j) => (
        <Pressable key={j.id} style={s.card} onPress={() => router.push({ pathname: "/study/journal" })}>
          <Text style={s.sub}>{refLabel(j.ref)}</Text><Text style={s.body}>{j.unclear}</Text>
        </Pressable>
      ))}
    </StudyScreen>
  );
}
