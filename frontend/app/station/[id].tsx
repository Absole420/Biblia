import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClaimCard } from "@/src/components/ClaimCard";
import { Icon } from "@/src/components/Icon";
import { PlaceSheet } from "@/src/components/PlaceSheet";
import { RefText } from "@/src/components/RefText";
import { TaskView } from "@/src/components/TaskView";
import { Button, ProgressBar } from "@/src/components/ui";
import { formatRef, getVerses, TRANSLATIONS } from "@/src/data/bible";
import { JOHN_HISTORICAL } from "@/src/data/historical";
import { findStation } from "@/src/data/john";
import { STATION_META } from "@/src/data/meta";
import { THEME_MAPS } from "@/src/data/themeMaps";
import { levelInfo, stationStatus } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const PHASES = ["Entdecken", "Bibelstudium", "Hintergrund", "Verstehen", "Prüfung", "Reflexion", "Abschluss"];

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = findStation(id);
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useProgress();
  const { state } = p;
  const fontScale = state.settings.fontScale;
  const completedBefore = useRef(found ? !!state.stations[found.station.id] : false);
  const [phase, setPhaseLocal] = useState(() => (found && !state.stations[found.station.id] ? Math.min(state.phase[found.station.id] ?? 0, 5) : 0));
  const [taskIdx, setTaskIdx] = useState(0);
  const [taskDone, setTaskDone] = useState(false);
  const [examIdx, setExamIdx] = useState(0);
  const [examDone, setExamDone] = useState(false);
  const [score, setScore] = useState(0);
  const [examAttempt, setExamAttempt] = useState(0);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [place, setPlace] = useState<string | null>(null);
  const [refl, setRefl] = useState<string[]>(() => (found ? state.reflections[found.station.id] ?? found.station.reflection.map(() => "") : []));
  const [result, setResult] = useState<{ passed: boolean; firstTime: boolean; unlocked: string[] } | null>(null);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [phase, taskIdx, examIdx]);

  const unlockedBefore = useMemo(
    () => (found ? found.campaign.stations.filter((s) => stationStatus(s, state.stations) !== "locked").map((s) => s.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!found) return null;
  const { station, campaign } = found;
  const meta = STATION_META[station.type];
  const accent = colors[meta.color];
  const accentInk = meta.ink === "dark" ? colors.mapInk : colors.surface;
  const passMark = Math.ceil(station.exam.length / 2);

  const goPhase = (n: number) => {
    setPhaseLocal(n);
    if (n < 6) p.setPhase(station.id, n);
  };

  const finishStation = () => {
    const passed = score >= passMark;
    if (!passed) {
      setResult({ passed: false, firstTime: false, unlocked: [] });
      setPhaseLocal(6);
      return;
    }
    const { firstTime } = p.completeStation(station.id, station.xp, score, station.exam.length);
    const nextState = { ...state.stations, [station.id]: { completedAt: "", examScore: score, examTotal: station.exam.length, bestScore: score, attempts: 1 } };
    const unlocked = campaign.stations.filter((s) => !unlockedBefore.includes(s.id) && stationStatus(s, nextState) !== "locked").map((s) => s.title);
    setResult({ passed: true, firstTime: firstTime || !completedBefore.current, unlocked });
    setPhaseLocal(6);
  };

  const retryExam = () => {
    setExamIdx(0);
    setExamDone(false);
    setScore(0);
    setExamAttempt((a) => a + 1);
    setResult(null);
    goPhase(4);
  };

  // ---- CTA ----
  let cta: { label: string; onPress: () => void; disabled?: boolean; icon?: string } = { label: "Weiter", onPress: () => goPhase(phase + 1), icon: "arrow-right" };
  if (phase === 3) {
    const last = taskIdx >= station.tasks.length - 1;
    cta = { label: last ? "Weiter zur Prüfung" : "Nächste Aufgabe", disabled: !taskDone, icon: "arrow-right", onPress: () => { if (last) goPhase(4); else { setTaskIdx(taskIdx + 1); setTaskDone(false); } } };
  } else if (phase === 4) {
    const last = examIdx >= station.exam.length - 1;
    cta = { label: last ? "Prüfung abschließen" : "Nächste Frage", disabled: !examDone, icon: "arrow-right", onPress: () => { if (last) goPhase(5); else { setExamIdx(examIdx + 1); setExamDone(false); } } };
  } else if (phase === 5) {
    cta = { label: "Station abschließen", icon: "flag", onPress: () => { p.saveReflection(station.id, refl); finishStation(); } };
  } else if (phase === 6) {
    cta = result?.passed
      ? { label: "Zurück zur Karte", icon: "map", onPress: () => router.back() }
      : { label: "Prüfung wiederholen", icon: "refresh-cw", onPress: retryExam };
  }

  const placeObj = THEME_MAPS.gospels.places.find((x) => x.id === place) ?? null;
  const lvl = levelInfo(state.xp);

  return (
    <View style={styles.root} testID="station-screen">
      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headRow}>
          <Pressable style={styles.close} onPress={() => router.back()} testID="station-close-button" accessibilityLabel="Station verlassen (Fortschritt wird gespeichert)">
            <Icon name="x" size={22} color={colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.hTitle} numberOfLines={1}>{station.title}</Text>
            <Text style={styles.hSub} testID="station-phase-label">Phase {phase + 1}/7 · {PHASES[phase]}</Text>
          </View>
        </View>
        <View style={styles.dots}>
          {PHASES.map((ph, i) => (
            <View key={ph} style={[styles.dot, { backgroundColor: i <= phase ? colors.brandPrimary : colors.surfaceTertiary }]} />
          ))}
        </View>
      </View>

      <KeyboardAwareScrollView ref={scrollRef} bottomOffset={96} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {phase === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} testID="phase-discover">
            <View style={[styles.hero, { backgroundColor: accent }]}>
              <View style={[styles.heroSun, { backgroundColor: colors.warning }]} />
              <View style={[styles.heroHill, { backgroundColor: colors.mapForest }]} />
              <View style={[styles.heroHill2, { backgroundColor: colors.mapMountain }]} />
              <View style={[styles.heroIcon, { borderColor: accentInk }]}>
                <Icon name={station.icon} size={40} color={accentInk} />
              </View>
              <Text style={[styles.heroType, { color: accentInk }]}>{meta.label}</Text>
            </View>
            <Text style={styles.h1}>{station.title}</Text>
            <Text style={styles.sub}>{station.subtitle}</Text>
            <Text style={[styles.body, { fontSize: 17 * fontScale, lineHeight: 27 * fontScale }]}>{station.discover}</Text>
            <Text style={styles.label}>Bibelstellen dieser Station</Text>
            {station.readings.map((r) => (
              <Text key={formatRef(r)} style={styles.refLine}>• {formatRef(r)}</Text>
            ))}
            <Text style={styles.illuNote}>Illustration: Platzhalter-Grafik (lizenzierte Illustrationen folgen).</Text>
          </Animated.View>
        ) : null}

        {phase === 1 ? (
          <Animated.View entering={FadeIn.duration(300)} testID="phase-study">
            <Text style={styles.label}>Bibeltext · {TRANSLATIONS[state.settings.translation].available ? TRANSLATIONS[state.settings.translation].name : TRANSLATIONS.elb1905.name}</Text>
            {station.readings.map((r) => (
              <View key={formatRef(r)} style={styles.reading}>
                <Text style={styles.readingRef}>{formatRef(r)}</Text>
                <Text style={[styles.verses, { fontSize: 17 * fontScale, lineHeight: 28 * fontScale }]}>
                  {getVerses(state.settings.translation, r).map((v) => (
                    <Text key={v.v}>
                      <Text style={styles.vnum}>{v.v} </Text>
                      {v.text}{" "}
                    </Text>
                  ))}
                </Text>
                <Pressable testID={`open-reader-${r.ch}-${r.from}`} onPress={() => router.navigate({ pathname: "/bible", params: { b: r.book, ch: String(r.ch), v: String(r.from) } })} style={styles.linkRow}>
                  <Icon name="external-link" size={14} color={colors.brandPrimary} />
                  <Text style={styles.link}>Im Bibelleser öffnen (Notizen & Markierungen)</Text>
                </Pressable>
              </View>
            ))}
            <Text style={styles.label}>Begriffskarten – tippe zum Umdrehen</Text>
            {station.terms.map((t, i) => (
              <Pressable key={t.term} testID={`term-card-${i}`} onPress={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))} style={[styles.term, flipped[i] && { backgroundColor: colors.surfaceTertiary }]}>
                {flipped[i] ? (
                  <Animated.View entering={FadeIn}>
                    <Text style={[styles.body, { fontSize: 15 * fontScale }]}>{t.explanation}</Text>
                    {t.ref ? <RefText text={t.ref} style={styles.refSmall} /> : null}
                  </Animated.View>
                ) : (
                  <View style={styles.termFront}>
                    <Text style={styles.termTitle}>{t.term}</Text>
                    <Icon name="rotate-cw" size={16} color={colors.muted} />
                  </View>
                )}
              </Pressable>
            ))}
            {station.placeIds?.length ? (
              <>
                <Text style={styles.label}>Orte</Text>
                <View style={styles.wrap}>
                  {station.placeIds.map((pid) => {
                    const pl = JOHN_HISTORICAL.places.find((x) => x.id === pid);
                    if (!pl) return null;
                    return (
                      <Pressable key={pid} testID={`place-chip-${pid}`} onPress={() => setPlace(pid)} style={styles.placeChip}>
                        <Icon name="map-pin" size={14} color={colors.brandPrimary} />
                        <Text style={styles.placeChipText}>{pl.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </Animated.View>
        ) : null}

        {phase === 2 ? (
          <Animated.View entering={FadeIn.duration(300)} testID="phase-background">
            <Text style={styles.h2}>Historischer Hintergrund</Text>
            <Text style={styles.sub}>Jede Aussage ist gekennzeichnet: Bibeltext, gesicherte Geschichte, Hypothese oder Auslegungstradition.</Text>
            {station.background.map((c, i) => (
              <ClaimCard key={i} claim={c} fontScale={fontScale} testID={`claim-${i}`} />
            ))}
          </Animated.View>
        ) : null}

        {phase === 3 ? (
          <View testID="phase-tasks">
            <View style={styles.counterRow}>
              <Text style={styles.counter}>Aufgabe {taskIdx + 1} von {station.tasks.length}</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ProgressBar value={(taskIdx + (taskDone ? 1 : 0)) / station.tasks.length} />
              </View>
            </View>
            <TaskView
              key={station.tasks[taskIdx].id}
              task={station.tasks[taskIdx]}
              fontScale={fontScale}
              onAnswered={(ok) => { setTaskDone(true); if (station.tasks[taskIdx].type !== "free") p.recordAnswer(station.tasks[taskIdx].id, station.id, ok); }}
            />
          </View>
        ) : null}

        {phase === 4 ? (
          <View testID="phase-exam">
            <View style={[styles.examBanner, { borderColor: colors.stationExam }]}>
              <Icon name="award" size={18} color={colors.stationExam} />
              <Text style={styles.examText}>Lernkontrolle · Frage {examIdx + 1}/{station.exam.length} · Bestanden ab {passMark} richtigen</Text>
            </View>
            <TaskView
              key={station.exam[examIdx].id + examAttempt}
              task={station.exam[examIdx]}
              fontScale={fontScale}
              testPrefix="exam"
              onAnswered={(ok) => { setExamDone(true); if (ok) setScore((s) => s + 1); p.recordAnswer(station.exam[examIdx].id, station.id, ok); }}
            />
          </View>
        ) : null}

        {phase === 5 ? (
          <Animated.View entering={FadeIn.duration(300)} testID="phase-reflection">
            <Text style={styles.h2}>Reflexion</Text>
            <View style={styles.reflNote}>
              <Icon name="lock" size={14} color={colors.muted} />
              <Text style={styles.small}>Persönliche Reflexion – nur lokal auf deinem Gerät gespeichert, ohne Bewertung.</Text>
            </View>
            {station.reflection.map((q, i) => (
              <View key={q} style={{ marginBottom: spacing.lg }}>
                <Text style={[styles.reflQ, { fontSize: 17 * fontScale }]}>{q}</Text>
                <TextInput
                  testID={`reflection-input-${i}`}
                  multiline
                  value={refl[i] ?? ""}
                  onChangeText={(t) => setRefl((r) => r.map((x, j) => (j === i ? t : x)))}
                  onBlur={() => p.saveReflection(station.id, refl)}
                  placeholder="Deine Gedanken, Fragen, Erkenntnisse …"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { fontSize: 16 * fontScale }]}
                />
              </View>
            ))}
          </Animated.View>
        ) : null}

        {phase === 6 && result ? (
          <View testID="phase-complete" style={{ alignItems: "center" }}>
            <Animated.View entering={ZoomIn.springify()} style={[styles.medal, { backgroundColor: result.passed ? colors.brandPrimary : colors.surfaceTertiary }]}>
              <Icon name={result.passed ? "award" : "refresh-cw"} size={56} color={result.passed ? colors.onBrandPrimary : colors.onSurfaceTertiary} />
            </Animated.View>
            <Text style={[styles.h1, { textAlign: "center" }]} testID="complete-title">{result.passed ? "Station abgeschlossen!" : "Noch nicht bestanden"}</Text>
            <Text style={[styles.body, { textAlign: "center" }]} testID="complete-score">Prüfung: {score} von {station.exam.length} richtig</Text>
            {result.passed ? (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.xpCard}>
                <Text style={styles.xpBig} testID="complete-xp">{result.firstTime ? `+${station.xp} EP` : "Wiederholung"}</Text>
                <Text style={styles.small}>{result.firstTime ? `Stufe ${lvl.level} · ${lvl.name}` : "Für Wiederholungen werden keine weiteren EP vergeben – dein bestes Ergebnis wird gespeichert."}</Text>
                <View style={{ alignSelf: "stretch", marginTop: spacing.md }}><ProgressBar value={lvl.progress} /></View>
              </Animated.View>
            ) : (
              <Text style={[styles.small, { textAlign: "center", marginTop: spacing.md }]}>Du brauchst mindestens {passMark} richtige Antworten. Schau dir die Erklärungen noch einmal an – falsch beantwortete Fragen findest du auch unter „Wiederholung“.</Text>
            )}
            {result.unlocked.length ? (
              <Animated.View entering={FadeInDown.delay(400)} style={styles.unlock} testID="complete-unlocked">
                <Icon name="unlock" size={18} color={colors.success} />
                <Text style={styles.unlockText}>Neuer Weg frei: {result.unlocked.join(", ")}</Text>
              </Animated.View>
            ) : null}
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {phase > 0 && phase < 3 ? (
          <Pressable style={styles.prev} onPress={() => goPhase(phase - 1)} testID="station-prev-button" accessibilityLabel="Zurück">
            <Icon name="arrow-left" size={20} color={colors.onSurface} />
          </Pressable>
        ) : null}
        <Button testID="station-next-button" label={cta.label} icon={cta.icon} disabled={cta.disabled} onPress={cta.onPress} style={{ flex: 1 }} />
      </View>
      <PlaceSheet place={placeObj} onClose={() => setPlace(null)} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.divider },
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  hTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: "700", color: c.onSurface },
  hSub: { fontFamily: fonts.text, fontSize: 13, color: c.brandPrimary, fontWeight: "800" },
  dots: { flexDirection: "row", gap: 6, marginTop: spacing.md },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  hero: { height: 190, borderRadius: 28, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  heroSun: { position: "absolute", width: 120, height: 120, borderRadius: 60, top: -30, right: 30, opacity: 0.55 },
  heroHill: { position: "absolute", width: 420, height: 200, borderRadius: 200, bottom: -150, left: -80, opacity: 0.6 },
  heroHill2: { position: "absolute", width: 360, height: 200, borderRadius: 200, bottom: -160, right: -100, opacity: 0.6 },
  heroIcon: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  heroType: { fontFamily: fonts.text, fontWeight: "800", marginTop: spacing.sm, letterSpacing: 1, textTransform: "uppercase", fontSize: 12 },
  h1: { fontFamily: fonts.display, fontSize: 28, fontWeight: "700", color: c.onSurface, marginTop: spacing.md },
  h2: { fontFamily: fonts.display, fontSize: 24, fontWeight: "700", color: c.onSurface, marginBottom: spacing.sm },
  sub: { fontFamily: fonts.text, fontSize: 14, color: c.muted, fontWeight: "700", marginTop: spacing.xs, marginBottom: spacing.lg },
  body: { fontFamily: fonts.text, fontSize: 16, lineHeight: 25, color: c.onSurfaceSecondary },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  refLine: { fontFamily: fonts.text, fontSize: 16, color: c.onSurface, fontWeight: "700", marginBottom: 4 },
  illuNote: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: spacing.xl, fontStyle: "italic" },
  reading: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: c.border },
  readingRef: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onSurface, marginBottom: spacing.sm },
  verses: { fontFamily: fonts.display, color: c.onSurface },
  vnum: { fontFamily: fonts.text, fontSize: 12, color: c.brandPrimary, fontWeight: "800" },
  linkRow: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: spacing.md, minHeight: 32 },
  link: { fontFamily: fonts.text, color: c.brandPrimary, fontWeight: "700", fontSize: 13 },
  term: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: c.border, minHeight: 64, justifyContent: "center" },
  termFront: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  termTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onSurface, flex: 1 },
  refSmall: { fontFamily: fonts.text, fontSize: 12, color: c.brandPrimary, fontWeight: "700", marginTop: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  placeChip: { flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  placeChipText: { fontFamily: fonts.text, fontWeight: "700", color: c.onSurface },
  counterRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  counter: { fontFamily: fonts.text, fontWeight: "800", color: c.muted, fontSize: 13 },
  examBanner: { flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, marginBottom: spacing.lg, backgroundColor: c.surfaceSecondary },
  examText: { flex: 1, fontFamily: fonts.text, fontWeight: "700", color: c.onSurface, fontSize: 13 },
  reflNote: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: spacing.lg },
  small: { fontFamily: fonts.text, fontSize: 13, color: c.muted, flexShrink: 1 },
  reflQ: { fontFamily: fonts.display, fontWeight: "600", color: c.onSurface, marginBottom: spacing.sm },
  input: { minHeight: 110, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface },
  medal: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginTop: spacing.xl, shadowColor: c.brandPrimary, shadowOpacity: 0.5, shadowRadius: 24, elevation: 8 },
  xpCard: { alignSelf: "stretch", alignItems: "center", backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.xl, borderWidth: 1, borderColor: c.brandPrimary },
  xpBig: { fontFamily: fonts.display, fontSize: 34, fontWeight: "700", color: c.brandPrimary },
  unlock: { flexDirection: "row", gap: spacing.sm, alignItems: "center", alignSelf: "stretch", backgroundColor: c.surfaceSecondary, padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.lg, borderWidth: 1, borderColor: c.success },
  unlockText: { flex: 1, fontFamily: fonts.text, fontWeight: "700", color: c.onSurface },
  footer: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.divider },
  prev: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" },
}));
