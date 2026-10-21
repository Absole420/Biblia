import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";

import { STATION_META } from "@/src/data/meta";
import { Campaign } from "@/src/data/types";
import { StationProgress, stationStatus } from "@/src/lib/progress-logic";
import { fonts, useTheme } from "@/src/theme";

import { Cloud, Flame, Glow, Shimmer } from "./MapAnimations";
import { MapNode } from "./MapNode";
import { blob, curve, mountain, smoothOpen } from "./mapShapes";

/** Spielerische Abenteuerkarte der Johannes-Kampagne: vom Jordan nach Jerusalem. */
export function CampaignMapContent({ campaign, progress, onSelect }: { campaign: Campaign; progress: Record<string, StationProgress>; onSelect: (id: string) => void }) {
  const { colors } = useTheme();
  const W = campaign.mapW;
  const H = campaign.mapH;
  const byId = useMemo(() => Object.fromEntries(campaign.stations.map((s) => [s.id, s])), [campaign]);
  const edges = useMemo(() => campaign.stations.flatMap((s) => s.requires.map((r) => [r, s.id] as const)), [campaign]);
  const hills = [[120, 1250, 160, 120], [860, 1420, 150, 120], [900, 700, 160, 140], [110, 560, 150, 130], [820, 300, 140, 110], [180, 300, 130, 100]].map(([x, y, w, h]) => mountain(x, y, w, h));
  const olives = [[200, 1000], [240, 1040], [160, 1060], [820, 980], [860, 1010], [420, 640], [460, 660], [760, 460], [720, 500], [140, 820], [880, 1580], [120, 1600]];
  const river: [number, number][] = [[120, 1800], [170, 1700], [140, 1600], [190, 1480], [150, 1380], [200, 1290], [260, 1240]];

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.mapLand} />
            <Stop offset="0.5" stopColor={colors.surface} />
            <Stop offset="1" stopColor={colors.mapLand} />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#sky)" />
        {/* Wüste unten rechts */}
        <Path d={blob(780, 1640, 300, 200, 9, 10, 0.2)} fill={colors.mapMountain} fillOpacity={0.35} />
        {[[680, 1600], [820, 1660], [740, 1720], [900, 1560]].map(([x, y], i) => (
          <Path key={i} d={`M${x - 70} ${y} Q${x} ${y - 36} ${x + 70} ${y}`} stroke={colors.mapMountain} strokeWidth={5} fill="none" strokeLinecap="round" />
        ))}
        {/* Grünes Galiläa */}
        <Path d={blob(560, 960, 420, 300, 21, 12, 0.22)} fill={colors.mapForest} fillOpacity={0.35} />
        {/* Jordan */}
        <Path d={smoothOpen(river)} stroke={colors.mapRiver} strokeWidth={18} fill="none" strokeLinecap="round" />
        <Path d={smoothOpen(river)} stroke={colors.surface} strokeOpacity={0.4} strokeWidth={4} fill="none" strokeDasharray="10 18" />
        {/* See */}
        <Path d={blob(800, 820, 120, 80, 4, 10, 0.18)} fill={colors.mapSea} stroke={colors.mapRiver} strokeWidth={4} />
        {/* Brunnen (Sychar) */}
        <G transform="translate(860 1150)">
          <Circle r={26} fill={colors.mapMountain} stroke={colors.mapInk} strokeWidth={3} />
          <Circle r={14} fill={colors.mapSeaDeep} />
        </G>
        {/* Hügel */}
        {hills.map((m, i) => (
          <G key={i}>
            <Path d={m.body} fill={colors.mapMountain} stroke={colors.mapInk} strokeWidth={2} strokeOpacity={0.5} />
            <Path d={m.shade} fill={colors.mapInk} fillOpacity={0.15} />
          </G>
        ))}
        {/* Olivenbäume */}
        {olives.map(([x, y], i) => (
          <G key={i}>
            <Rect x={x - 3} y={y} width={6} height={18} fill={colors.mapInk} opacity={0.55} />
            <Circle cx={x} cy={y - 6} r={16} fill={colors.mapForest} stroke={colors.mapInk} strokeOpacity={0.35} strokeWidth={2} />
          </G>
        ))}
        {/* Jerusalem mit Tempel (antike Bauweise: Flachdächer, Mauer, Heiligtum) */}
        <G transform="translate(560 80)">
          <Path d="M-300 120 Q-150 40 0 30 Q150 40 300 120 Z" fill={colors.mapMountain} fillOpacity={0.6} />
          <Rect x={-240} y={60} width={480} height={20} fill={colors.borderStrong} stroke={colors.mapInk} strokeWidth={2} />
          {Array.from({ length: 12 }).map((_, i) => (
            <Rect key={i} x={-240 + i * 40} y={50} width={20} height={12} fill={colors.borderStrong} stroke={colors.mapInk} strokeWidth={1.5} />
          ))}
          {[-200, -150, 130, 180].map((x, i) => (
            <Rect key={i} x={x} y={20 + (i % 2) * 10} width={38} height={36} fill={colors.surfaceTertiary} stroke={colors.mapInk} strokeWidth={1.5} />
          ))}
          <Rect x={-70} y={-30} width={140} height={90} fill={colors.surfaceSecondary} stroke={colors.mapInk} strokeWidth={2.5} />
          <Rect x={-30} y={-80} width={60} height={60} fill={colors.surfaceSecondary} stroke={colors.mapInk} strokeWidth={2.5} />
          <Rect x={-14} y={-60} width={28} height={40} fill={colors.brandPrimary} />
          {[-55, -35, 25, 45].map((x) => (
            <Rect key={x} x={x} y={-20} width={8} height={70} fill={colors.surfaceTertiary} stroke={colors.mapInk} strokeWidth={1} />
          ))}
        </G>
        {/* Wege zwischen Stationen */}
        {edges.map(([a, b]) => {
          const A = byId[a];
          const B = byId[b];
          const done = !!progress[a] && !!progress[b];
          const open = !!progress[a];
          return (
            <G key={a + b}>
              <Path d={curve(A, B, 0.2)} stroke={colors.mapInk} strokeOpacity={0.25} strokeWidth={22} fill="none" strokeLinecap="round" />
              <Path
                d={curve(A, B, 0.2)}
                stroke={done ? colors.brandPrimary : open ? colors.surface : colors.mapLocked}
                strokeWidth={done ? 12 : 9}
                strokeDasharray={done ? undefined : "4 18"}
                fill="none"
                strokeLinecap="round"
              />
            </G>
          );
        })}
        {/* Start- & Zielmarken */}
        <SvgText x={500} y={1770} fontSize={26} fontWeight="700" textAnchor="middle" fill={colors.mapInk} fontFamily={fonts.display}>START · Am Jordan</SvgText>
        <SvgText x={560} y={40} fontSize={26} fontWeight="700" textAnchor="middle" fill={colors.mapInk} fontFamily={fonts.display}>ZIEL · Jerusalem</SvgText>
      </Svg>
      <Shimmer x={720} y={800} w={150} color={colors.surface} />
      <Shimmer x={130} y={1560} w={70} color={colors.surface} />
      <Flame x={520} y={140} size={30} color={colors.stationNarrative} core={colors.warning} />
      <Flame x={600} y={140} size={30} color={colors.stationNarrative} core={colors.warning} />
      <Glow x={560} y={60} r={170} color={colors.warning} />
      <Cloud x={80} y={900} w={220} color={colors.surface} duration={28000} drift={180} />
      <Cloud x={640} y={1380} w={200} color={colors.surface} duration={24000} drift={-150} opacity={0.6} />
      <Cloud x={300} y={300} w={180} color={colors.surface} duration={22000} drift={140} opacity={0.6} />
      {campaign.stations.map((s, i) => {
        const meta = STATION_META[s.type];
        const st = stationStatus(s, progress);
        return (
          <MapNode
            key={s.id}
            testID={`station-node-${s.id}`}
            x={s.x}
            y={s.y}
            size={104}
            color={colors[meta.color]}
            iconColor={meta.ink === "dark" ? colors.mapInk : colors.surface}
            icon={s.icon}
            label={`${i + 1}. ${s.title}`}
            sublabel={meta.label}
            status={st}
            labelSize={23}
            onPress={() => onSelect(s.id)}
          />
        );
      })}
    </View>
  );
}
