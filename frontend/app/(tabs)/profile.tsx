import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { ProgressBar, SectionTitle } from "@/src/components/ui";
import { AvatarView } from "@/src/components/AvatarView";
import { ALL_STATIONS, CAMPAIGNS } from "@/src/data/john";
import { WORLDS } from "@/src/data/worlds";
import { computeBadges, levelInfo, stationsThisWeek } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ProfileScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const p = useProgress();
  const { state } = p;
  const lvl = levelInfo(state.xp);
  const badges = computeBadges(state, ALL_STATIONS.map((s) => s.id));
  const johnDone = ALL_STATIONS.filter((s) => state.stations[s.id]);
  const acc = state.answered.total ? Math.round((state.answered.correct / state.answered.total) * 100) : 0;
  const week = stationsThisWeek(state);
  const wrongCount = Object.keys(state.wrong).length;
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  return (
    <View style={styles.root} testID="profile-screen">
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.screenTitle}>Profil & Fortschritt</Text>
        <Pressable style={styles.round} testID="profile-settings-button" onPress={() => router.push("/settings")} accessibilityLabel="Einstellungen">
          <Icon name="settings" size={20} color={colors.onSurface} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xxl }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient colors={[colors.brandPrimary, colors.stationNarrative]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelCard}>
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}><Text style={styles.levelNum} testID="profile-level">{lvl.level}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.levelName}>{lvl.name}</Text>
                <Text style={styles.levelXp} testID="profile-xp">{state.xp} Erfahrungspunkte</Text>
              </View>
            </View>
            <View style={styles.xpTrack}><View style={[styles.xpFill, { width: `${lvl.progress * 100}%` }]} /></View>
            <Text style={styles.levelHint}>Noch {lvl.needed - lvl.into} EP bis Stufe {lvl.level + 1}</Text>
          </LinearGradient>
          <Pressable testID="profile-avatar-card" style={styles.avatarCard} onPress={() => router.push("/avatar")} accessibilityLabel="Avatar bearbeiten">
            <View style={styles.avatarStage}>{state.avatar ? <AvatarView a={state.avatar} size={96} /> : <Icon name="user-plus" size={40} color={colors.brandPrimary} />}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} testID="profile-avatar-name">{state.avatar?.name ?? "Lernfigur gestalten"}</Text>
              <Text style={styles.small}>{state.avatar ? `Deine Lernfigur · Stufe ${lvl.level} · ${Object.keys(state.stations).length} Stationen geschafft` : "Erstelle deinen persönlichen Avatar – er begleitet dich auf der Reise."}</Text>
            </View>
            <Icon name="edit-2" size={20} color={colors.brandPrimary} />
          </Pressable>
        </Animated.View>

        <View style={styles.statsRow}>
          {[
            { k: "Stationen", v: `${Object.keys(state.stations).length}`, id: "stat-stations" },
            { k: "Trefferquote", v: `${acc} %`, id: "stat-accuracy" },
            { k: "Notizen", v: `${state.notes.length}`, id: "stat-notes" },
          ].map((s) => (
            <View key={s.k} style={styles.stat} testID={s.id}>
              <Text style={styles.statV}>{s.v}</Text>
              <Text style={styles.statK}>{s.k}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Lernziel dieser Woche</SectionTitle>
        <View style={styles.card} testID="weekly-goal-card">
          <View style={styles.goalRow}>
            <Text style={styles.goalText}>{week} von {state.goal.weeklyStations} Stationen</Text>
            <View style={styles.stepper}>
              <Pressable testID="goal-decrease" onPress={() => p.setGoal(state.goal.weeklyStations - 1)} style={styles.stepBtn} accessibilityLabel="Ziel verringern"><Icon name="minus" size={18} color={colors.onSurface} /></Pressable>
              <Text style={styles.stepVal} testID="goal-value">{state.goal.weeklyStations}</Text>
              <Pressable testID="goal-increase" onPress={() => p.setGoal(state.goal.weeklyStations + 1)} style={styles.stepBtn} accessibilityLabel="Ziel erhöhen"><Icon name="plus" size={18} color={colors.onSurface} /></Pressable>
            </View>
          </View>
          <ProgressBar value={week / state.goal.weeklyStations} color={colors.success} />
          <Text style={styles.small}>Dein persönliches Ziel – ohne Streaks, ohne Druck.</Text>
        </View>

        <Pressable style={[styles.card, styles.reviewCard]} testID="review-button" onPress={() => router.push("/review")}>
          <Icon name="refresh-cw" size={22} color={colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Wiederholung schwieriger Fragen</Text>
            <Text style={styles.small}>{wrongCount ? `${wrongCount} Fragen warten auf dich` : "Aktuell keine offenen Fragen"}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.muted} />
        </Pressable>

        <SectionTitle>Fortschritt je Bibelbuch</SectionTitle>
        <View style={styles.card}>
          {Object.values(CAMPAIGNS).map((c) => {
            const d = c.stations.filter((s) => state.stations[s.id]).length / c.stations.length;
            return (
              <View key={c.id} style={styles.bookRow} testID={`book-progress-${c.id}`}>
                <Text style={styles.bookName} numberOfLines={1}>{c.title.replace("Das Evangelium nach ", "").replace("Das Johannesevangelium", "Johannes")}</Text>
                <View style={{ flex: 1 }}><ProgressBar value={d} color={WORLDS.find((w) => w.id === c.worldId)?.palette.base} /></View>
                <Text style={styles.bookPct}>{Math.round(d * 100)} %</Text>
              </View>
            );
          })}
        </View>

        <SectionTitle>Abzeichen</SectionTitle>
        <View style={styles.badgeGrid}>
          {badges.map((b) => (
            <View key={b.id} style={[styles.badge, !b.earned && { opacity: 0.45 }]} testID={`badge-${b.id}`}>
              <View style={[styles.badgeIcon, { backgroundColor: b.earned ? colors.brandPrimary : colors.surfaceTertiary }]}>
                <Icon name={b.earned ? b.icon : "lock"} size={22} color={b.earned ? colors.onBrandPrimary : colors.muted} />
              </View>
              <Text style={styles.badgeTitle} numberOfLines={1}>{b.title}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>{b.description}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Gelernte Themen</SectionTitle>
        {johnDone.length === 0 ? (
          <View style={styles.card}><Text style={styles.small}>Noch keine Station abgeschlossen. Wähle eine Lernwelt auf der Karte und beginne deine Reise.</Text></View>
        ) : johnDone.map((s) => (
          <View key={s.id} style={styles.topic} testID={`learned-topic-${s.id}`}>
            <Icon name="check-circle" size={18} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.small}>{s.subtitle} · Prüfung {state.stations[s.id].bestScore}/{state.stations[s.id].examTotal}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingBottom: spacing.sm, backgroundColor: c.surface },
  screenTitle: { fontFamily: fonts.display, fontSize: 26, fontWeight: "700", color: c.onSurface },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  avatarCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: c.border },
  avatarStage: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", backgroundColor: c.mapLand, alignItems: "center", justifyContent: "flex-end", borderWidth: 2, borderColor: c.brandPrimary },
  levelCard: { borderRadius: 28, padding: spacing.xl },
  levelRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  levelBadge: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(249,243,232,0.9)", alignItems: "center", justifyContent: "center" },
  levelNum: { fontFamily: fonts.display, fontSize: 32, fontWeight: "700", color: "#2C2822" },
  levelName: { fontFamily: fonts.display, fontSize: 24, fontWeight: "700", color: "#2C2822" },
  levelXp: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800", color: "#2C2822", opacity: 0.8 },
  xpTrack: { height: 10, borderRadius: 5, backgroundColor: "rgba(44,40,34,0.2)", marginTop: spacing.lg, overflow: "hidden" },
  xpFill: { height: 10, borderRadius: 5, backgroundColor: "#F9F3E8" },
  levelHint: { fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: "#2C2822", marginTop: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  stat: { flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", borderWidth: 1, borderColor: c.border },
  statV: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: c.onSurface },
  statK: { fontFamily: fonts.text, fontSize: 12, color: c.muted, fontWeight: "700" },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: c.border, gap: spacing.sm },
  cardTitle: { fontFamily: fonts.display, fontSize: 16, fontWeight: "700", color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 13, color: c.muted },
  goalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalText: { fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: c.onSurface },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  stepVal: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onSurface, minWidth: 24, textAlign: "center" },
  reviewCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.lg },
  bookRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 4 },
  bookName: { width: 120, fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: c.onSurface },
  bookPct: { width: 40, textAlign: "right", fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  badge: { width: "31.5%", backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", borderWidth: 1, borderColor: c.border },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  badgeTitle: { fontFamily: fonts.display, fontSize: 13, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  badgeDesc: { fontFamily: fonts.text, fontSize: 11, color: c.muted, textAlign: "center" },
  topic: { flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
}));
