import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { Button, ProgressBar } from "@/src/components/ui";
import { WorldMapContent } from "@/src/components/WorldMap";
import { ZoomableMap } from "@/src/components/ZoomableMap";
import { CAMPAIGNS } from "@/src/data/john";
import { WORLD_MAP_H, WORLD_MAP_W, WORLDS } from "@/src/data/worlds";
import { levelInfo } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function WorldMapScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useProgress();
  const [selected, setSelected] = useState<string | null>(null);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const lvl = levelInfo(state.xp);

  const progress = useMemo(() => {
    const out: Record<string, number> = {};
    for (const w of WORLDS) {
      const c = w.campaignId ? CAMPAIGNS[w.campaignId] : null;
      out[w.id] = c ? c.stations.filter((s) => state.stations[s.id]).length / c.stations.length : 0;
    }
    return out;
  }, [state.stations]);

  const world = WORLDS.find((w) => w.id === selected);
  const gospels = WORLDS.find((w) => w.id === "gospels")!;

  return (
    <View style={styles.root} testID="world-map-screen">
      <ZoomableMap width={WORLD_MAP_W} height={WORLD_MAP_H} focus={{ x: gospels.x, y: gospels.y + 120 }} controlsBottom={bottomChrome + 16} testID="world-map">
        <WorldMapContent progress={progress} onSelect={setSelected} />
      </ZoomableMap>

      <View style={[styles.hud, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable style={styles.pill} testID="hud-level-pill" onPress={() => router.push("/profile")} accessibilityLabel={`Stufe ${lvl.level}, ${state.xp} Erfahrungspunkte`}>
          <View style={styles.lvl}>
            <Text style={styles.lvlText}>{lvl.level}</Text>
          </View>
          <View style={{ width: 130 }}>
            <Text style={styles.pillTitle} numberOfLines={1}>{lvl.name}</Text>
            <ProgressBar value={lvl.progress} height={6} />
            <Text style={styles.pillSub}>{state.xp} EP</Text>
          </View>
        </Pressable>
        <Pressable style={styles.round} testID="hud-settings-button" onPress={() => router.push("/settings")} accessibilityLabel="Einstellungen">
          <Icon name="settings" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <Sheet visible={!!world} onClose={() => setSelected(null)} title={world?.title} accent={world?.palette.base} testID="world-sheet">
        {world ? (
          <View>
            <Text style={styles.sub}>{world.subtitle}</Text>
            <Text style={styles.body}>{world.description}</Text>
            <Text style={styles.label}>Bücher</Text>
            <Text style={styles.body}>{world.books.join(" · ")}</Text>
            {world.status === "playable" ? (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.label}>Fortschritt Johannes</Text>
                <ProgressBar value={progress[world.id]} color={world.palette.base} testID="world-progress" />
              </View>
            ) : (
              <View style={styles.notice}>
                <Icon name="clock" size={16} color={colors.warning} />
                <Text style={styles.noticeText}>In Vorbereitung – Inhalte folgen in einer späteren Version.</Text>
              </View>
            )}
            <Button
              testID="world-enter-button"
              label={world.status === "playable" ? "Lernwelt betreten" : "Vorschau ansehen"}
              icon={world.status === "playable" ? "arrow-right" : "eye"}
              style={{ marginTop: spacing.xl }}
              onPress={() => {
                setSelected(null);
                router.push({ pathname: "/world/[id]", params: { id: world.id } });
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.mapSea },
  hud: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.glass, borderRadius: radius.pill, paddingVertical: spacing.sm, paddingLeft: spacing.sm, paddingRight: spacing.xl, borderWidth: 1, borderColor: c.border },
  lvl: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  lvlText: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onBrandPrimary },
  pillTitle: { fontFamily: fonts.display, fontSize: 15, fontWeight: "700", color: c.onSurface, marginBottom: 3 },
  pillSub: { fontFamily: fonts.text, fontSize: 11, color: c.muted, marginTop: 2, fontWeight: "700" },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.glass, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border },
  sub: { fontFamily: fonts.text, color: c.muted, fontSize: 15, marginBottom: spacing.md, fontWeight: "700" },
  body: { fontFamily: fonts.text, color: c.onSurfaceSecondary, fontSize: 15.5, lineHeight: 23 },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.lg, marginBottom: spacing.xs },
  notice: { flexDirection: "row", gap: spacing.sm, alignItems: "center", backgroundColor: c.surfaceSecondary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg },
  noticeText: { flex: 1, fontFamily: fonts.text, color: c.onSurfaceSecondary, fontSize: 14 },
}));
