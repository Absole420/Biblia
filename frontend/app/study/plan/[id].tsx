import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";

import { AvatarCheer } from "@/src/components/StationExtras";
import { Bar, StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { Button } from "@/src/components/ui";
import { BOOK_BY_CODE } from "@/src/data/books";
import { markRead, missedDays, Plan, planProgress, replan, today } from "@/src/lib/study";
import { useProgress } from "@/src/lib/store";
import { useTheme } from "@/src/theme";

const label = (d: Plan["days"][number]) => (d.items.length ? d.items.map((i) => `${BOOK_BY_CODE[i.book].name} ${i.ch}`).join(", ") : d.kind === "rest" ? "Ruhetag" : d.kind === "buffer" ? "Puffertag" : "Wiederholungstag");

/** Leseplan-Detail: Heute lesen, verpasste Tage, Abhaken (nur bewusst), Fortschritt. */
export default function PlanDetail() {
  const s = useStudyStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateStudy } = useProgress();
  const plan = state.study.plans.find((p) => p.id === id);
  if (!plan) return <StudyScreen title="Leseplan" testID="plan-detail"><Text style={s.body}>Plan nicht gefunden.</Text></StudyScreen>;
  const t = today();
  const pr = planProgress(plan);
  const missed = missedDays(plan, t);
  const upd = (fn: (p: Plan) => Plan) => updateStudy((x) => ({ ...x, plans: x.plans.map((p) => (p.id === id ? fn(p) : p)) }));
  const toggle = (date: string) => upd((p) => {
    const done = { ...p.done };
    const day = p.days.find((d) => d.date === date)!;
    if (done[date]) delete done[date]; else done[date] = new Date().toISOString();
    const all = p.days.filter((d) => d.items.length).every((d) => done[d.date]);
    // Planfortschritt ist eigenständig; zusätzlich wird bewusst Gelesenes in den persönlichen Lesefortschritt übernommen.
    if (!p.done[date]) updateStudy((x) => ({ ...x, read: day.items.reduce((r, i) => markRead(r, i.book, i.ch), x.read), readLog: [...x.readLog, ...day.items.map((i) => ({ date: t, book: i.book, ch: i.ch }))] }));
    return { ...p, done, finishedAt: all ? new Date().toISOString() : undefined };
  });
  const remove = () => {
    const go = () => { updateStudy((x) => ({ ...x, plans: x.plans.filter((p) => p.id !== id) })); router.back(); };
    if (Platform.OS === "web") go(); else Alert.alert("Plan löschen?", "Die persönliche Lesehistorie bleibt erhalten.", [{ text: "Abbrechen" }, { text: "Löschen", style: "destructive", onPress: go }]);
  };
  const todayDay = plan.days.find((d) => d.date === t);
  const upcoming = plan.days.filter((d) => d.date >= t).slice(0, 14);
  return (
    <StudyScreen title={plan.config.title} sub={`${plan.days[0]?.date} – ${plan.days[plan.days.length - 1]?.date}`} testID="plan-detail">
      <Bar value={pr.pct} />
      <Text style={s.sub} testID="plan-progress">{pr.done} von {pr.total} Einheiten ({Math.round(pr.pct * 100)} %)</Text>
      {plan.finishedAt ? <AvatarCheer testID="plan-finished-avatar" text="Leseplan abgeschlossen – großartig!" /> : null}
      <Text style={s.h2}>Heute lesen</Text>
      {todayDay ? (
        <View style={[s.card, { borderColor: colors.brandPrimary, borderWidth: 2 }]} testID="plan-today">
          <Text style={s.title}>{label(todayDay)}</Text>
          {todayDay.items.map((i) => <Pressable key={i.book + i.ch} testID={`plan-open-${i.book}-${i.ch}`} onPress={() => router.navigate({ pathname: "/(tabs)/bible", params: { b: i.book, ch: String(i.ch), v: "1" } })}><Text style={s.body}>→ {BOOK_BY_CODE[i.book].name} {i.ch} öffnen</Text></Pressable>)}
          {todayDay.items.length ? <Button testID="plan-today-done" icon={plan.done[t] ? "rotate-ccw" : "check"} variant={plan.done[t] ? "ghost" : "primary"} label={plan.done[t] ? "Als ungelesen zurücksetzen" : "Heute gelesen"} onPress={() => toggle(t)} /> : null}
        </View>
      ) : <Text style={s.body}>{t < plan.days[0].date ? `Der Plan beginnt am ${plan.days[0].date}.` : "Heute ist keine Einheit geplant."}</Text>}
      {missed.length ? (
        <View style={s.card} testID="plan-missed">
          <Text style={s.title}>{missed.length} verpasste Einheit(en)</Text>
          <Text style={s.body}>Verpasste Einheiten gelten nicht als gelesen. Wie möchtest du weitermachen?</Text>
          <Button testID="missed-keep" variant="ghost" label="Am Plan festhalten (nachholen)" onPress={() => upd((p) => replan(p, "keep", t))} />
          <Button testID="missed-redistribute" variant="secondary" label="Rest bis zum Enddatum neu verteilen" onPress={() => upd((p) => replan(p, "redistribute", t))} />
          <Button testID="missed-shift" variant="secondary" label="Enddatum verschieben" onPress={() => upd((p) => replan(p, "shift", t))} />
          {missed.slice(0, 5).map((d) => <Pressable key={d.date} onPress={() => toggle(d.date)} testID={`missed-${d.date}`}><Text style={s.sub}>{d.date}: {label(d)} – nachträglich abhaken</Text></Pressable>)}
        </View>
      ) : null}
      <Text style={s.h2}>Nächste Tage</Text>
      {upcoming.map((d) => (
        <Pressable key={d.date} testID={`plan-day-${d.date}`} style={[s.card, s.row]} onPress={() => d.items.length && toggle(d.date)} accessibilityLabel={`${d.date} ${label(d)} ${plan.done[d.date] ? "gelesen" : ""}`}>
          <Text style={[s.sub, { width: 90 }]}>{d.date}</Text>
          <Text style={[s.body, { flex: 1 }]}>{label(d)}</Text>
          {plan.done[d.date] ? <Text style={s.title}>✓</Text> : null}
        </Pressable>
      ))}
      <Text style={s.sub}>Erinnerungen sind noch nicht verfügbar (benötigen eine App-Build-Version mit Benachrichtigungen).</Text>
      <Button testID="plan-delete" variant="ghost" icon="trash-2" label="Plan löschen" onPress={remove} />
    </StudyScreen>
  );
}
