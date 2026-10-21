import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Icon } from "@/src/components/Icon";
import { Choice, StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { Button } from "@/src/components/ui";
import { useSources } from "@/src/components/VerseStudy";
import { BIBLE_BOOKS, BOOK_BY_CODE } from "@/src/data/books";
import { buildPlan, NT, OT, PlanConfig, planProgress, previewOf, TEMPLATES, templateConfig, today } from "@/src/lib/study";
import { useProgress } from "@/src/lib/store";
import { useTheme } from "@/src/theme";

const WD: [number, string][] = [[1, "Mo"], [2, "Di"], [3, "Mi"], [4, "Do"], [5, "Fr"], [6, "Sa"], [0, "So"]];
const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime());

/** Meine Lesepläne: Vorlagen, Editor mit Vorschau, aktive Pläne. */
export default function Plans() {
  const s = useStudyStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { state, updateStudy } = useProgress();
  const sources = useSources();
  const [cfg, setCfg] = useState<PlanConfig | null>(null);
  const [part, setPart] = useState<"all" | "ot" | "nt" | "custom">("all");
  const set = (p: Partial<PlanConfig>) => setCfg((c) => (c ? { ...c, ...p } : c));
  const days = useMemo(() => (cfg && validDate(cfg.start) && (!cfg.end || (validDate(cfg.end) && cfg.end >= cfg.start)) && (cfg.books.length || cfg.passages?.length) && cfg.weekdays.length ? buildPlan(cfg) : null), [cfg]);
  const pv = days ? previewOf(days) : null;
  const y = new Date().getFullYear();

  const pick = (id: string, opts?: { year?: number }) => { setCfg(templateConfig(id, opts)); setPart(id === "nt-year" ? "nt" : "all"); };
  const activate = () => {
    if (!cfg || !days) return;
    const id = `plan-${Date.now()}`;
    updateStudy((x) => ({ ...x, plans: [...x.plans, { id, config: cfg, days, done: {}, createdAt: new Date().toISOString() }] }));
    setCfg(null);
    router.push({ pathname: "/study/plan/[id]", params: { id } });
  };

  return (
    <StudyScreen title="Meine Lesepläne" sub="Lesezeiten sind Schätzungen (ca. 180 Wörter/Min.)" testID="plans-screen">
      {state.study.plans.map((p) => {
        const pr = planProgress(p);
        return (
          <Pressable key={p.id} testID={`plan-${p.id}`} style={s.card} onPress={() => router.push({ pathname: "/study/plan/[id]", params: { id: p.id } })}>
            <Text style={s.title}>{p.config.title}{p.finishedAt ? " ✓" : ""}</Text>
            <Text style={s.sub}>{p.days[0]?.date} – {p.days[p.days.length - 1]?.date} · {Math.round(pr.pct * 100)} %</Text>
          </Pressable>
        );
      })}
      {!cfg ? (
        <>
          <Text style={s.h2}>Vorlagen</Text>
          {TEMPLATES.map((t) => (
            <View key={t.id} style={s.card}>
              <Text style={s.title}>{t.title}</Text>
              <Text style={s.body}>{t.desc}</Text>
              <View style={s.row}>
                {t.id.endsWith("year") ? (
                  <>
                    <Button testID={`tpl-${t.id}-${y}`} variant="secondary" label={`1.1.${y}`} onPress={() => pick(t.id, { year: y })} />
                    <Button testID={`tpl-${t.id}-${y + 1}`} variant="secondary" label={`1.1.${y + 1}`} onPress={() => pick(t.id, { year: y + 1 })} />
                    <Button testID={`tpl-${t.id}-today`} variant="ghost" label="Ab heute, 365 Tage" onPress={() => { const c = templateConfig(t.id); setCfg({ ...c, title: c.title.replace(/ \d{4}$/, ""), start: today(), end: undefined, minutes: undefined }); }} />
                  </>
                ) : <Button testID={`tpl-${t.id}`} variant="secondary" label="Anpassen" onPress={() => pick(t.id)} />}
              </View>
            </View>
          ))}
          <Button testID="plan-custom" icon="sliders" label="Eigener Plan" onPress={() => { setCfg({ ...templateConfig("book"), title: "Eigener Leseplan", books: [], template: "custom" }); setPart("custom"); }} />
          <Text style={s.h2}>Pläne von Kirchen und Organisationen</Text>
          <Text style={s.body}>Für diese Pläne liegt keine Einbindungserlaubnis vor – sie öffnen sich extern.</Text>
          {(sources ?? []).filter((x) => x.type === "plan").map((x) => (
            <Pressable key={x.id} testID={`ext-plan-${x.id}`} style={[s.card, s.row]} onPress={() => Linking.openURL(x.url)} accessibilityRole="link">
              <Icon name="external-link" size={16} color={colors.brandPrimary} /><Text style={[s.title, { flex: 1 }]}>{x.title}</Text><Text style={s.sub}>Externer Link</Text>
            </Pressable>
          ))}
        </>
      ) : (
        <View testID="plan-editor">
          <Text style={s.h2}>Plan einstellen</Text>
          <TextInput testID="plan-title" value={cfg.title} onChangeText={(t) => set({ title: t })} style={s.input} accessibilityLabel="Titel" />
          {!cfg.passages?.length ? (
            <>
              <Text style={s.h2}>Bibelteile</Text>
              <Choice testID="plan-part" value={part} options={[["all", "Ganze Bibel"], ["ot", "AT"], ["nt", "NT"], ["custom", "Bücher wählen"]]} onChange={(v) => { setPart(v); if (v !== "custom") set({ books: v === "all" ? BIBLE_BOOKS.map((b) => b.code) : v === "ot" ? OT : NT, parallel: undefined }); }} />
              {part === "custom" ? <Choice testID="plan-book" value={cfg.books} options={BIBLE_BOOKS.map((b) => [b.code, b.code] as [string, string])} onChange={(b) => set({ books: cfg.books.includes(b) ? cfg.books.filter((x) => x !== b) : [...cfg.books, b] })} /> : null}
              <Text style={s.h2}>Reihenfolge</Text>
              <Choice testID="plan-order" value={cfg.parallel ? "par" : "seq"} options={[["seq", "Nacheinander (Bibelreihenfolge)"], ["par", "AT und NT parallel"]]} onChange={(v) => set(v === "par" ? { books: OT, parallel: NT } : { parallel: undefined })} />
            </>
          ) : <Text style={s.body}>{cfg.passages.length} feste Kapitel in vorgegebener Reihenfolge.</Text>}
          {cfg.note ? <Text style={s.warn}>{cfg.note}</Text> : null}
          <Text style={s.h2}>Zeitraum (lokales Datum, JJJJ-MM-TT)</Text>
          <View style={s.row}>
            <TextInput testID="plan-start" value={cfg.start} onChangeText={(t) => set({ start: t })} style={[s.input, { flex: 1 }]} accessibilityLabel="Startdatum" />
            <TextInput testID="plan-end" value={cfg.end ?? ""} placeholder="Zieldatum (optional)" onChangeText={(t) => set({ end: t || undefined })} style={[s.input, { flex: 1 }]} accessibilityLabel="Zieldatum" />
          </View>
          {!cfg.end ? (<><Text style={s.h2}>Tägliche Lesedauer (ca.)</Text><Choice testID="plan-min" value={cfg.minutes ?? 15} options={[[5, "5 Min."], [10, "10 Min."], [15, "15 Min."], [20, "20 Min."], [30, "30 Min."]]} onChange={(m) => set({ minutes: m })} /></>) : null}
          <Text style={s.h2}>Lesetage pro Woche</Text>
          <Choice testID="plan-wd" value={cfg.weekdays} options={WD} onChange={(d) => set({ weekdays: cfg.weekdays.includes(d) ? cfg.weekdays.filter((x) => x !== d) : [...cfg.weekdays, d] })} />
          <Text style={s.h2}>Puffer & Wiederholung</Text>
          <Choice testID="plan-buffer" value={cfg.bufferEvery} options={[[0, "Keine Puffertage"], [2, "alle 2 Wochen"], [4, "alle 4 Wochen"]]} onChange={(b) => set({ bufferEvery: b })} />
          <Choice testID="plan-repeat" value={cfg.repeatWeekly ? 1 : 0} options={[[0, "Ohne Wiederholungstag"], [1, "Wöchentlicher Wiederholungstag"]]} onChange={(r) => set({ repeatWeekly: r === 1 })} />
          <Text style={s.h2}>Vorschau</Text>
          {pv ? (
            <View style={s.card} testID="plan-preview">
              <Text style={s.body}>{pv.chapters} Kapitel · {pv.readingDays} Lesetage · {pv.totalDays} Kalendertage</Text>
              <Text style={s.body}>{pv.start} bis {pv.end}</Text>
              <Text style={s.body}>ca. {Math.round(pv.avgMin)} Min. pro Lesetag (max. ca. {Math.round(pv.maxMin)} Min.) – Schätzung</Text>
              {days!.filter((d) => d.items.length).slice(0, 5).map((d) => <Text key={d.date} style={s.sub}>{d.date}: {d.items.map((i) => `${BOOK_BY_CODE[i.book].name} ${i.ch}`).join(", ")}</Text>)}
            </View>
          ) : <Text style={s.warn} testID="plan-invalid">Bitte gültige Daten, Bücher und mindestens einen Lesetag wählen.</Text>}
          <View style={s.row}>
            <Button testID="plan-cancel" variant="ghost" label="Abbrechen" onPress={() => setCfg(null)} />
            <Button testID="plan-activate" icon="check" label="Plan aktivieren" disabled={!pv} onPress={activate} />
          </View>
        </View>
      )}
    </StudyScreen>
  );
}
