import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { AvatarCheer } from "@/src/components/StationExtras";
import { Icon } from "@/src/components/Icon";
import { Bar, StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { BOOK_BY_CODE } from "@/src/data/books";
import { planProgress, today } from "@/src/lib/study";
import { useProgress } from "@/src/lib/store";
import { useTheme } from "@/src/theme";

const LINKS = [
  ["plans", "Meine Lesepläne", "calendar"], ["progress", "Lesefortschritt je Buch", "bar-chart-2"], ["collection", "Suche & Sammlung", "search"],
  ["memorize", "Merkliste & offene Fragen", "repeat"], ["journal", "Studienjournal", "edit-3"], ["sources", "Quellen & Nutzungsrechte", "shield"],
] as const;

/** Persönlicher Studienbereich: Weiterlesen, Heute lesen, Zugang zu allen Werkzeugen. */
export default function StudyHub() {
  const s = useStudyStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { state } = useProgress();
  const st = state.study;
  const pos = st.lastPos;
  const t = today();
  const dueReview = st.review.filter((r) => r.due <= t).length;
  return (
    <StudyScreen title="Mein Studium" sub="Leseposition, Pläne, Sammlung und Journal" testID="study-hub">
      {pos ? (
        <Pressable testID="continue-reading" style={[s.card, { borderColor: colors.brandPrimary, borderWidth: 2 }]} onPress={() => router.navigate({ pathname: "/(tabs)/bible", params: { b: pos.book, ch: String(pos.ch), v: String(pos.v) } })} accessibilityRole="button">
          <View style={s.row}><Icon name="book-open" size={20} color={colors.brandPrimary} /><Text style={s.title}>Weiterlesen – zuletzt bei {BOOK_BY_CODE[pos.book]?.name} {pos.ch},{pos.v}</Text></View>
          <Text style={s.sub}>Zuletzt geöffnete Stelle (nicht automatisch „gelesen“)</Text>
        </Pressable>
      ) : <Text style={s.body}>Öffne die Bibel – deine Leseposition wird automatisch gespeichert.</Text>}
      <Text style={s.h2}>Heute lesen</Text>
      {st.plans.filter((p) => !p.finishedAt).length === 0 ? <Text style={s.body}>Noch kein aktiver Leseplan.</Text> : null}
      {st.plans.filter((p) => !p.finishedAt).map((p) => {
        const pr = planProgress(p);
        const day = p.days.find((d) => d.date === t);
        return (
          <Pressable key={p.id} testID={`today-plan-${p.id}`} style={s.card} onPress={() => router.push({ pathname: "/study/plan/[id]", params: { id: p.id } })}>
            <Text style={s.title}>{p.config.title}</Text>
            <Text style={s.body}>{day?.items.length ? `Heute: ${day.items.map((i) => `${BOOK_BY_CODE[i.book].name} ${i.ch}`).join(", ")}${p.done[t] ? " ✓" : ""}` : day ? `Heute: ${day.kind === "rest" ? "Ruhetag" : day.kind === "buffer" ? "Puffertag" : "Wiederholung"}` : "Heute keine Einheit"}</Text>
            {pr.next ? <Text style={s.sub}>Nächster Abschnitt: {pr.next.items.map((i) => `${BOOK_BY_CODE[i.book].name} ${i.ch}`).join(", ")} ({pr.next.date})</Text> : null}
            <Bar value={pr.pct} />
            <Text style={s.sub}>{pr.done} von {pr.total} Einheiten</Text>
          </Pressable>
        );
      })}
      {st.reading.showAvatar && st.readLog.length > 0 ? <AvatarCheer text={`Du hast bisher ${new Set(st.readLog.map((r) => r.book + r.ch)).size} Kapitel bewusst als gelesen markiert.`} testID="study-avatar" /> : null}
      <Text style={s.h2}>Werkzeuge</Text>
      {LINKS.map(([id, label, icon]) => (
        <Pressable key={id} testID={`study-link-${id}`} style={[s.card, s.row]} onPress={() => router.push(`/study/${id}` as never)}>
          <Icon name={icon} size={18} color={colors.brandPrimary} /><Text style={[s.title, { flex: 1 }]}>{label}</Text>
          {id === "memorize" && dueReview ? <Text style={s.warn}>{dueReview} fällig</Text> : null}
          <Icon name="chevron-right" size={18} color={colors.muted} />
        </Pressable>
      ))}
    </StudyScreen>
  );
}
