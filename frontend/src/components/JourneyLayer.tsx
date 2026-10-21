import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { CAMPAIGNS } from "@/src/data/john";
import { mapSize, projectGeo, ThemeMap } from "@/src/data/themeMaps";
import { WORLDS } from "@/src/data/worlds";
import { LayoutItem, solveLayout, textWidth } from "@/src/lib/mapLayout";
import { StationProgress } from "@/src/lib/progress-logic";
import { fonts, useTheme } from "@/src/theme";

import { AnchoredMarker, useMapZoom } from "./AnchoredMarker";
import { regionLabelRects } from "./GeoMap";
import { Icon } from "./Icon";
import { PulseRing } from "./MapAnimations";
import { blob } from "./mapShapes";

// Position der Themenfelder auf der Studienreise-Karte (symbolisch, nicht geografisch exakt).
export const FIELD_POS: Record<string, { lat: number; lon: number; r: number }> = {
  tora: { lat: 29.3, lon: 33.85, r: 0.55 },
  history: { lat: 32.05, lon: 35.2, r: 0.3 },
  psalms: { lat: 31.25, lon: 35.0, r: 0.3 },
  prophets: { lat: 30.6, lon: 36.1, r: 0.4 },
  gospels: { lat: 32.95, lon: 35.35, r: 0.3 },
  parables: { lat: 33.55, lon: 36.45, r: 0.25 },
  acts: { lat: 32.35, lon: 33.6, r: 0.38 },
  letters: { lat: 33.3, lon: 33.6, r: 0.36 },
  revelation: { lat: 31.45, lon: 33.15, r: 0.36 },
};

/** Farbige Themenfelder der Lernwelten; Tippen öffnet die Lektionen. */
export function JourneyLayer({ map, k, stations }: { map: ThemeMap; k: number; stations: Record<string, StationProgress> }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { zoom } = useMapZoom();
  const med = 46 * k;
  const labelW = (w: (typeof WORLDS)[number]) => Math.max(textWidth(w.title, 13 * k), textWidth("100 % · spielbar", 10 * k)) + 22 * k;
  const labelH = 44 * k;
  const size = mapSize(map);

  const layout = useMemo(() => {
    const z = zoom;
    const items: LayoutItem[] = WORLDS.map((w) => {
      const c = projectGeo(map, FIELD_POS[w.id].lat, FIELD_POS[w.id].lon);
      return { id: w.id, ax: c.x, ay: c.y, size: med / z, pad: 6 * k / z, weight: w.status === "playable" ? 2 : 1, label: { w: labelW(w) / z, h: labelH / z, prefer: "below" as const } };
    });
    return solveLayout(items, regionLabelRects(map, k), { w: size.width, h: size.height }, 4 * k / z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, k, zoom, med, size.width, size.height]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.boxNone]}>
      {WORLDS.map((w, i) => {
        const pos = FIELD_POS[w.id];
        const c = projectGeo(map, pos.lat, pos.lon);
        const r = pos.r * map.pxPerDeg;
        return (
          <View key={w.id + "f"} style={[styles.none, { position: "absolute", left: c.x - r * 1.2, top: c.y - r * 1.2 }]}>
            <Svg width={r * 2.4} height={r * 2.4}>
              <Path d={blob(r * 1.2, r * 1.2, r, r * 0.85, 17 + i * 7, 11, 0.28)} fill={w.palette.base} fillOpacity={0.5} stroke={w.palette.base} strokeWidth={3 * k} />
              <Path d={blob(r * 1.2, r * 1.2, r * 0.82, r * 0.7, 23 + i * 5, 11, 0.25)} fill="none" stroke={w.palette.accent} strokeWidth={1.5 * k} strokeDasharray={`${5 * k} ${5 * k}`} />
            </Svg>
          </View>
        );
      })}
      {WORLDS.map((w) => {
        const pos = FIELD_POS[w.id];
        const c = projectGeo(map, pos.lat, pos.lon);
        const camp = w.campaignId ? CAMPAIGNS[w.campaignId] : null;
        const pct = camp ? camp.stations.filter((s) => stations[s.id]).length / camp.stations.length : 0;
        const lw = labelW(w);
        return (
          <AnchoredMarker
            key={w.id}
            ax={c.x}
            ay={c.y}
            p={layout[w.id]}
            size={med}
            labelW={lw}
            lineColor={w.palette.base}
            dotSize={9 * k}
            label={
              <View style={[styles.label, { width: lw, height: labelH, backgroundColor: colors.glass, borderColor: w.palette.base, paddingHorizontal: 8 * k, borderRadius: 10 * k }]}>
                <Text numberOfLines={1} style={[styles.title, { fontSize: 13 * k, color: colors.onSurface }]}>{w.title}</Text>
                <Text numberOfLines={1} style={[styles.sub, { fontSize: 10 * k, color: colors.muted }]}>{w.status === "playable" ? `${Math.round(pct * 100)} % · spielbar` : "Vorschau"}</Text>
              </View>
            }
          >
            <Pressable
              testID={`journey-field-${w.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${w.title}, Lektionen öffnen`}
              hitSlop={8}
              onPress={() => router.push({ pathname: "/world/[id]", params: { id: w.id } })}
              style={({ pressed }) => ({ width: med, height: med, transform: [{ scale: pressed ? 0.92 : 1 }] })}
            >
              {w.status === "playable" ? <PulseRing size={med} color={colors.brandPrimary} /> : null}
              <View style={[styles.medal, { width: med, height: med, borderRadius: med / 2, backgroundColor: w.palette.base, borderColor: w.status === "playable" ? colors.brandPrimary : colors.mapInk, borderWidth: 3 * k }]}>
                <Icon name={w.icon} size={med * 0.45} color={w.palette.ink} />
              </View>
            </Pressable>
          </AnchoredMarker>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  boxNone: { pointerEvents: "box-none" },
  none: { pointerEvents: "none" },
  medal: { alignItems: "center", justifyContent: "center", boxShadow: "0px 3px 6px rgba(0,0,0,0.3)" },
  label: { borderWidth: 2, justifyContent: "center", alignItems: "center" },
  title: { fontFamily: fonts.display, fontWeight: "700" },
  sub: { fontFamily: fonts.text, fontWeight: "700" },
});
