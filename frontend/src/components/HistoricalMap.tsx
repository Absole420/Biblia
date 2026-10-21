import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";

import { COASTLINE, DEAD_SEA, GALILEE_SEA, JORDAN, project } from "@/src/data/historical";
import { HistoricalMap } from "@/src/data/types";
import { fonts, useTheme } from "@/src/theme";

import { Shimmer } from "./MapAnimations";
import { smoothClosed, smoothOpen } from "./mapShapes";

/** Historische Karte mit projizierten Koordinaten (äquirektangulär, Näherung). */
export function HistoricalMapContent({ map, onSelect, highlight }: { map: HistoricalMap; onSelect: (id: string) => void; highlight?: string[] }) {
  const { colors } = useTheme();
  const P = (lat: number, lon: number) => project(map, lat, lon);
  const toPts = (arr: [number, number][]) => arr.map(([la, lo]) => {
    const p = P(la, lo);
    return [p.x, p.y] as [number, number];
  });
  const geo = useMemo(() => {
    const coast = toPts(COASTLINE);
    const sea = `M0 0 L${coast[0][0]} 0 ` + coast.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + ` L0 ${map.height} Z`;
    return { sea, galilee: smoothClosed(toPts(GALILEE_SEA)), dead: smoothClosed(toPts(DEAD_SEA)), jordan: smoothOpen(toPts(JORDAN)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  const gal = P(32.8, 35.59);
  const dead = P(31.45, 35.5);
  const med = P(32.3, 34.45);

  return (
    <View style={{ width: map.width, height: map.height }}>
      <Svg width={map.width} height={map.height}>
        <Rect width={map.width} height={map.height} fill={colors.mapLand} />
        {/* Gitternetz (Breiten-/Längengrade) */}
        {[31.5, 32, 32.5, 33].map((lat) => {
          const y = P(lat, 34.2).y;
          return <Path key={lat} d={`M0 ${y} L${map.width} ${y}`} stroke={colors.mapInk} strokeOpacity={0.12} strokeWidth={1} strokeDasharray="6 6" />;
        })}
        {[34.5, 35, 35.5].map((lon) => {
          const x = P(31, lon).x;
          return <Path key={lon} d={`M${x} 0 L${x} ${map.height}`} stroke={colors.mapInk} strokeOpacity={0.12} strokeWidth={1} strokeDasharray="6 6" />;
        })}
        {[31.5, 32, 32.5, 33].map((lat) => (
          <SvgText key={"l" + lat} x={map.width - 8} y={P(lat, 34.2).y - 4} fontSize={13} fill={colors.mapInk} fillOpacity={0.6} textAnchor="end">{`${lat}° N`}</SvgText>
        ))}
        <Path d={geo.sea} fill={colors.mapSea} stroke={colors.mapInk} strokeOpacity={0.5} strokeWidth={2} />
        <Path d={geo.jordan} stroke={colors.mapRiver} strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d={geo.galilee} fill={colors.mapSea} stroke={colors.mapRiver} strokeWidth={2} />
        <Path d={geo.dead} fill={colors.mapSeaDeep} stroke={colors.mapRiver} strokeWidth={2} />
        <SvgText x={med.x} y={med.y} fontSize={22} fontStyle="italic" fill={colors.mapInk} fillOpacity={0.7} textAnchor="middle" fontFamily={fonts.display} transform={`rotate(-70 ${med.x} ${med.y})`}>Mittelmeer</SvgText>
        <SvgText x={gal.x + 60} y={gal.y + 6} fontSize={14} fontStyle="italic" fill={colors.mapInk} fillOpacity={0.75}>See Genezareth</SvgText>
        <SvgText x={dead.x + 30} y={dead.y} fontSize={14} fontStyle="italic" fill={colors.mapInk} fillOpacity={0.75}>Totes Meer</SvgText>
        {map.regions.map((r) => {
          const p = P(r.lat, r.lon);
          return (
            <SvgText key={r.name} x={p.x} y={p.y} fontSize={24} letterSpacing={6} fill={colors.mapInk} fillOpacity={0.35} textAnchor="middle" fontWeight="700" fontFamily={fonts.display}>{r.name}</SvgText>
          );
        })}
      </Svg>
      <Shimmer x={gal.x - 25} y={gal.y - 8} w={40} color={colors.surface} />
      {map.places.map((pl) => {
        const p = P(pl.lat, pl.lon);
        const hl = highlight?.includes(pl.id);
        const size = 26;
        const fill = pl.certainty === "secure" ? colors.mapInk : pl.certainty === "traditional" ? colors.brandPrimary : colors.surface;
        return (
          <Pressable
            key={pl.id}
            testID={`place-node-${pl.id}`}
            accessibilityLabel={`${pl.name}, ${pl.certainty === "secure" ? "gesichert" : pl.certainty === "traditional" ? "Tradition" : "umstritten"}`}
            onPress={() => onSelect(pl.id)}
            hitSlop={14}
            style={[styles.place, { left: p.x - size / 2, top: p.y - size / 2, width: size, height: size }]}
          >
            {hl ? <View style={[styles.hl, { borderColor: colors.stationNarrative }]} /> : null}
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: fill,
                borderWidth: 3,
                borderColor: colors.mapInk,
                borderStyle: pl.certainty === "disputed" ? "dashed" : "solid",
              }}
            />
            <View
              pointerEvents="none"
              style={[
                styles.label,
                (pl.labelDx ?? 14) < 0 ? { right: size + 4, alignItems: "flex-end" } : { left: size + 4, alignItems: "flex-start" },
                { top: (pl.labelDy ?? -4) - 2 },
              ]}
            >
              <Text numberOfLines={1} style={[styles.labelText, { color: colors.mapInk, backgroundColor: colors.glass }]}>{pl.name}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  place: { position: "absolute", alignItems: "center", justifyContent: "center" },
  hl: { position: "absolute", width: 48, height: 48, borderRadius: 24, borderWidth: 4, left: -11, top: -11 },
  label: { position: "absolute", width: 220 },
  labelText: { fontFamily: fonts.text, fontSize: 15, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: "hidden" },
});
