import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";

import { WORLD_MAP_H, WORLD_MAP_W, WORLD_PATH, WORLDS } from "@/src/data/worlds";
import { fonts, useTheme } from "@/src/theme";

import { Cloud, Glow, Shimmer } from "./MapAnimations";
import { MapNode } from "./MapNode";
import { blob, curve, mountain } from "./mapShapes";

const W = WORLD_MAP_W;
const H = WORLD_MAP_H;

/** Fantasievolle Abenteuer-Weltkarte aller Lernwelten (keine reale Geografie). */
export function WorldMapContent({ progress, onSelect }: { progress: Record<string, number>; onSelect: (id: string) => void }) {
  const { colors } = useTheme();
  const byId = useMemo(() => Object.fromEntries(WORLDS.map((w) => [w.id, w])), []);
  const land = useMemo(() => blob(W / 2, H / 2 + 20, W * 0.47, H * 0.46, 7, 16, 0.12), []);
  const regions = useMemo(() => WORLDS.map((w, i) => ({ w, d: blob(w.x, w.y + 10, 165, 135, 31 + i * 13, 11, 0.3) })), []);
  const mountains = [
    [130, 760, 120, 110], [210, 720, 150, 150], [300, 770, 110, 95], [880, 1240, 100, 90], [940, 1190, 90, 80],
    [690, 470, 90, 80], [350, 260, 100, 90], [260, 300, 80, 70],
  ].map(([x, y, w, h]) => mountain(x, y, w, h));
  const dunes = [[140, 1280], [300, 1300], [200, 1340], [380, 1260]];
  const trees = [[560, 760], [600, 790], [470, 780], [430, 700], [700, 640], [740, 600], [860, 520], [880, 600], [760, 1080], [540, 1110], [600, 1220], [680, 1240]];

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <RadialGradient id="sea" cx="50%" cy="50%" r="75%">
            <Stop offset="0" stopColor={colors.mapSea} />
            <Stop offset="1" stopColor={colors.mapSeaDeep} />
          </RadialGradient>
          <RadialGradient id="parch" cx="50%" cy="45%" r="70%">
            <Stop offset="0" stopColor={colors.surface} />
            <Stop offset="1" stopColor={colors.mapLand} />
          </RadialGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#sea)" />
        {/* Wellenlinien */}
        {Array.from({ length: 22 }).map((_, i) => (
          <Path key={i} d={`M${(i * 137) % W} ${(i * 211) % H} q12 -8 24 0 t24 0`} stroke={colors.surface} strokeOpacity={0.35} strokeWidth={2} fill="none" />
        ))}
        <Path d={land} fill="url(#parch)" stroke={colors.mapInk} strokeWidth={4} strokeOpacity={0.5} />
        <Path d={land} fill="none" stroke={colors.mapInk} strokeWidth={1.5} strokeOpacity={0.25} strokeDasharray="2 8" transform="translate(0 10)" />
        {/* Regionen in Farbwelten */}
        {regions.map(({ w, d }) => (
          <G key={w.id}>
            <Path d={d} fill={w.palette.base} fillOpacity={0.55} stroke={w.palette.base} strokeWidth={3} strokeOpacity={0.9} />
            <Path d={d} fill="none" stroke={w.palette.accent} strokeWidth={1.5} strokeDasharray="6 6" strokeOpacity={0.7} />
          </G>
        ))}
        {/* Fluss & See */}
        <Path d="M820 820 Q760 760 700 760 Q640 755 600 700 Q570 660 520 690" stroke={colors.mapRiver} strokeWidth={10} fill="none" strokeLinecap="round" />
        <Path d={blob(500, 560, 70, 40, 5, 9, 0.2)} fill={colors.mapSea} stroke={colors.mapRiver} strokeWidth={3} />
        <Path d={blob(130, 470, 70, 120, 77, 9, 0.25)} fill={colors.mapSea} stroke={colors.mapRiver} strokeWidth={3} />
        {/* Wüstendünen */}
        {dunes.map(([x, y], i) => (
          <Path key={i} d={`M${x - 60} ${y} Q${x} ${y - 34} ${x + 60} ${y}`} stroke={colors.mapMountain} strokeWidth={5} fill="none" strokeLinecap="round" />
        ))}
        {/* Berge */}
        {mountains.map((m, i) => (
          <G key={i}>
            <Path d={m.body} fill={colors.mapMountain} stroke={colors.mapInk} strokeWidth={2} strokeOpacity={0.6} />
            <Path d={m.shade} fill={colors.mapInk} fillOpacity={0.18} />
            <Path d={m.snow} fill={colors.surface} fillOpacity={0.9} />
          </G>
        ))}
        {/* Olivenbäume & Palmen */}
        {trees.map(([x, y], i) => (
          <G key={i}>
            <Rect x={x - 2} y={y} width={4} height={14} fill={colors.mapInk} opacity={0.6} />
            <Circle cx={x} cy={y - 4} r={12} fill={colors.mapForest} stroke={colors.mapInk} strokeOpacity={0.4} strokeWidth={1.5} />
          </G>
        ))}
        {/* Wege */}
        {WORLD_PATH.map(([a, b]) => {
          const A = byId[a];
          const B = byId[b];
          return <Path key={a + b} d={curve(A, B, 0.18)} stroke={colors.mapInk} strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" fill="none" strokeOpacity={0.75} />;
        })}
        {/* Kompassrose */}
        <G transform="translate(880 120)">
          <Circle r={56} fill={colors.surface} fillOpacity={0.6} stroke={colors.mapInk} strokeWidth={2} />
          <Path d="M0 -50 L10 0 L0 50 L-10 0 Z" fill={colors.brandPrimary} stroke={colors.mapInk} strokeWidth={1.5} />
          <Path d="M-50 0 L0 -10 L50 0 L0 10 Z" fill={colors.mapInk} opacity={0.6} />
          <SvgText y={-60} fontSize={20} fontWeight="700" fill={colors.mapInk} textAnchor="middle" fontFamily={fonts.display}>N</SvgText>
        </G>
        {/* Titelkartusche */}
        <G transform="translate(70 70)">
          <Rect width={420} height={92} rx={20} fill={colors.surface} fillOpacity={0.85} stroke={colors.brandPrimary} strokeWidth={3} />
          <SvgText x={210} y={44} fontSize={34} fontWeight="700" fill={colors.mapInk} textAnchor="middle" fontFamily={fonts.display}>BIBLIA</SvgText>
          <SvgText x={210} y={74} fontSize={17} fill={colors.mapInk} textAnchor="middle" fontFamily={fonts.text}>Abenteuerkarte · keine reale Geografie</SvgText>
        </G>
        {/* Schiff in der See (Apostelgeschichte) */}
        <G transform="translate(70 600)">
          <Path d="M0 0 L70 0 L58 18 L12 18 Z" fill={colors.mapInk} opacity={0.75} />
          <Path d="M34 -4 L34 -60 L64 -10 Z" fill={colors.surface} stroke={colors.mapInk} strokeWidth={2} />
        </G>
      </Svg>
      {/* Animierte Details */}
      <Shimmer x={450} y={552} w={100} color={colors.surface} />
      <Shimmer x={90} y={440} w={80} color={colors.surface} />
      <Shimmer x={40} y={980} w={120} color={colors.surface} />
      <Glow x={520} y={640} r={200} color={byId.gospels.palette.glow} />
      <Glow x={820} y={900} r={130} color={byId.psalms.palette.glow} />
      <Cloud x={120} y={380} w={200} color={colors.surface} duration={26000} drift={160} />
      <Cloud x={600} y={1000} w={240} color={colors.surface} duration={30000} drift={-140} opacity={0.6} />
      <Cloud x={520} y={190} w={170} color={colors.surface} duration={20000} drift={120} opacity={0.65} />
      {WORLDS.map((w) => (
        <MapNode
          key={w.id}
          testID={`world-node-${w.id}`}
          x={w.x}
          y={w.y}
          size={112}
          color={w.palette.base}
          iconColor={w.palette.ink}
          icon={w.icon}
          label={w.title}
          sublabel={w.status === "playable" ? `${Math.round((progress[w.id] ?? 0) * 100)} % erkundet` : "Vorschau"}
          status={w.status === "playable" ? ((progress[w.id] ?? 0) >= 1 ? "completed" : "available") : "available"}
          labelSize={24}
          onPress={() => onSelect(w.id)}
        />
      ))}
    </View>
  );
}
