import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";

import geo from "@/src/data/geo.json";
import { GeoPlace, mapSize, projectGeo, ThemeMap } from "@/src/data/themeMaps";
import { LayoutItem, Rect as Box, solveLayout, textWidth } from "@/src/lib/mapLayout";
import { fonts, useTheme } from "@/src/theme";

import { Avatar } from "@/src/lib/avatar";

import { AnchoredMarker, useMapZoom } from "./AnchoredMarker";
import { AvatarView } from "./AvatarView";
import { Icon } from "./Icon";
import { Cloud, Shimmer } from "./MapAnimations";
import { decoFigures, MapDecor } from "./MapDecor";

type Ring = number[][];
const G = geo as { land: Ring[]; rivers: { name: string; pts: Ring }[]; lakes: { name: string; pts: Ring }[] };

/** Geografisch korrekte Themenkarte (Natural Earth, gemeinfrei) mit Orten, Ereignissen und Routen. */
export function GeoMap({ map, k = 1, onSelect, highlight, children, me }: { map: ThemeMap; k?: number; onSelect: (p: GeoPlace) => void; highlight?: string[]; children?: React.ReactNode; me?: { lat: number; lon: number; avatar: Avatar } | null }) {
  const { colors } = useTheme();
  const { width, height } = mapSize(map);

  const paths = useMemo(() => {
    const { latMin, latMax, lonMin, lonMax } = map.bounds;
    const pad = 1;
    const visible = (r: Ring) => r.some(([lo, la]) => la > latMin - pad && la < latMax + pad && lo > lonMin - pad && lo < lonMax + pad);
    const toPath = (r: Ring, close: boolean) => {
      let d = "";
      r.forEach(([lo, la], i) => {
        const p = projectGeo(map, la, lo);
        d += `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      });
      return close ? d + "Z" : d;
    };
    return {
      land: G.land.filter(visible).map((r) => toPath(r, true)).join(" "),
      lakes: G.lakes.filter((l) => visible(l.pts)).map((l) => toPath(l.pts, true)).join(" "),
      rivers: G.rivers.filter((l) => visible(l.pts)).map((l) => toPath(l.pts, false)).join(" "),
      routes: map.routes.map((r) => ({ ...r, d: toPath(r.pts.map(([la, lo]) => [lo, la]), false) })),
    };
  }, [map]);

  const P = (lat: number, lon: number) => projectGeo(map, lat, lon);
  const marker = 22 * k;
  const { zoom } = useMapZoom();
  const labelFs = 13 * k;
  const labelH = labelFs * 1.45;
  const labelW = (name: string) => textWidth(name, labelFs) + 12 * k;

  // Zoomabhängige Kollisionslage: Marker behalten ihre Bildschirmgröße, daher
  // schrumpft ihr Platzbedarf in Kartenpixeln mit 1/zoom.
  const figures = useMemo(() => decoFigures(map, k), [map, k]);
  const meP = me ? projectGeo(map, me.lat, me.lon) : null;
  const obstacles = useMemo(() => regionLabelRects(map, k), [map, k]);
  const layout = useMemo(() => {
    const z = zoom;
    const items: LayoutItem[] = [
      ...map.places.map((pl, i) => {
        const p = projectGeo(map, pl.lat, pl.lon);
        return { id: "p" + i, ax: p.x, ay: p.y, size: marker / z, pad: 9 * k / z, weight: 1 + Math.min(2, pl.events?.length ?? 0) * 0.5, label: { w: labelW(pl.name) / z, h: labelH / z, prefer: pl.left ? ("left" as const) : ("right" as const) } };
      }),
      ...figures.map((f) => ({ id: f.id, ax: f.x, ay: f.y, size: f.r * 2, soft: true })),
      ...(meP ? [{ id: "me", ax: meP.x, ay: meP.y - 34 * k, size: 40 * k / z, pad: 4 * k / z, weight: 0.6, label: { w: 34 * k / z, h: labelH / z, prefer: "below" as const } }] : []),
    ];
    return solveLayout(items, obstacles, { w: width, h: height }, 3 * k / z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, k, zoom, figures, obstacles, width, height, meP?.x, meP?.y]);
  const shift = useMemo(() => Object.fromEntries(figures.map((f) => [f.id, { dx: layout[f.id].x - f.x, dy: layout[f.id].y - f.y }])), [figures, layout]);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="vig" cx="50%" cy="50%" r="70%">
            <Stop offset="0.6" stopColor={colors.mapInk} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.mapInk} stopOpacity={0.22} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill={colors.mapSea} />
        {/* Küsten-Halo + Landfläche */}
        <Path d={paths.land} fill={colors.mapSeaDeep} stroke={colors.mapSeaDeep} strokeWidth={6 * k} strokeLinejoin="round" />
        <Path d={paths.land} fill={colors.mapLand} stroke={colors.mapMountain} strokeOpacity={0.35} strokeWidth={0} />
        <Path d={paths.rivers} stroke={colors.mapRiver} strokeWidth={2.5 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={paths.lakes} fill={colors.mapSea} stroke={colors.mapRiver} strokeWidth={1.5 * k} />
        <MapDecor map={map} k={k} colors={colors} shift={shift} />
        {/* Beschriftungen von Regionen, Meeren, Stämmen */}
        {map.labels.map((l) => {
          const p = P(l.lat, l.lon);
          const sea = l.kind === "sea";
          const tribe = l.kind === "tribe";
          const fs = (sea ? 15 : tribe ? 12 : 16) * (l.size ?? 1) * k;
          return (
            <SvgText key={l.name} x={p.x} y={p.y} fontSize={fs} textAnchor="middle" fontFamily={fonts.display} fontStyle={sea ? "italic" : "normal"}
              fontWeight={tribe ? "700" : "600"} letterSpacing={sea || tribe ? 0 : 4 * k} fill={tribe ? colors.stationChallenge : sea ? colors.surface : colors.mapInk} fillOpacity={tribe ? 0.85 : sea ? 0.95 : 0.4}>
              {l.name}
            </SvgText>
          );
        })}
        {/* Routen */}
        {paths.routes.map((r) => (
          <React.Fragment key={r.id}>
            <Path d={r.d} stroke={colors.surface} strokeOpacity={0.7} strokeWidth={7 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={r.d} stroke={r.color} strokeWidth={4 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.certainty === "hypothetical" ? `${10 * k} ${8 * k}` : r.certainty === "traditional" ? `${3 * k} ${6 * k}` : undefined} />
          </React.Fragment>
        ))}
        <Rect width={width} height={height} fill="url(#vig)" />
      </Svg>
      <Shimmer x={width * 0.08} y={height * 0.4} w={80 * k} color={colors.surface} />
      <Cloud x={width * 0.1} y={height * 0.15} w={150 * k} color={colors.surface} duration={30000} drift={120 * k} opacity={0.45} />
      <Cloud x={width * 0.55} y={height * 0.7} w={170 * k} color={colors.surface} duration={26000} drift={-120 * k} opacity={0.4} />
      {map.places.map((pl, i) => {
        const a = P(pl.lat, pl.lon);
        const ev = (pl.events?.length ?? 0) > 0;
        const fill = pl.certainty === "secure" ? colors.mapInk : pl.certainty === "traditional" ? colors.brandPrimary : colors.surface;
        const hl = highlight?.includes(pl.id);
        const lw = labelW(pl.name);
        return (
          <AnchoredMarker
            key={pl.id + pl.name}
            ax={a.x}
            ay={a.y}
            p={layout["p" + i]}
            size={marker}
            labelW={lw}
            lineColor={colors.mapInk}
            dotSize={7 * k}
            label={<Text numberOfLines={1} style={[styles.labelText, { fontSize: labelFs, lineHeight: labelH - 2, paddingHorizontal: 5 * k, borderRadius: 6 * k, color: colors.mapInk, backgroundColor: colors.glass }]}>{pl.name}</Text>}
          >
            <Pressable
              testID={`place-node-${pl.id}`}
              accessibilityLabel={`${pl.name}${ev ? `, ${pl.events!.length} Ereignisse` : ""}`}
              onPress={() => onSelect(pl)}
              hitSlop={12}
              style={{ width: marker, height: marker }}
            >
              {hl ? <View style={[styles.hl, { borderColor: colors.stationNarrative, width: marker * 1.9, height: marker * 1.9, borderRadius: marker, left: -marker * 0.45, top: -marker * 0.45 }]} /> : null}
              <View style={{ width: marker, height: marker, borderRadius: marker / 2, backgroundColor: fill, borderWidth: 2.5 * k, borderColor: colors.mapInk, borderStyle: pl.certainty === "disputed" ? "dashed" : "solid", alignItems: "center", justifyContent: "center" }}>
                {ev ? <Icon name="star" size={marker * 0.55} color={pl.certainty === "secure" ? colors.warning : colors.mapInk} /> : null}
              </View>
            </Pressable>
          </AnchoredMarker>
        );
      })}
      {me && meP ? (
        <AnchoredMarker ax={meP.x} ay={meP.y} p={layout.me} size={40 * k} labelW={34 * k} lineColor={colors.brandPrimary} dotSize={6 * k}
          label={<Text style={[styles.labelText, { fontSize: labelFs, lineHeight: labelH - 2, paddingHorizontal: 5 * k, borderRadius: 6 * k, color: colors.onBrandPrimary, backgroundColor: colors.brandPrimary }]}>Du</Text>}>
          <View testID="map-me-marker" accessibilityLabel={`Deine Position: ${me.avatar.name}`} style={{ width: 40 * k, height: 40 * k, borderRadius: 20 * k, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 2.5 * k, borderColor: colors.brandPrimary, borderStyle: "dashed", pointerEvents: "none" }}>
            <AvatarView a={me.avatar} size={35 * k} mode="head" />
          </View>
        </AnchoredMarker>
      ) : null}
      {children}
    </View>
  );
}

/** Kollisionsboxen der Regions-, Meeres- und Stammesbeschriftungen (Kartenpixel). */
export function regionLabelRects(map: ThemeMap, k: number): Box[] {
  return map.labels.map((l) => {
    const p = projectGeo(map, l.lat, l.lon);
    const sea = l.kind === "sea";
    const tribe = l.kind === "tribe";
    const fs = (sea ? 15 : tribe ? 12 : 16) * (l.size ?? 1) * k;
    const w = textWidth(l.name, fs) + l.name.length * (sea || tribe ? 0 : 4 * k);
    return { x: p.x - w / 2, y: p.y - fs * 0.85, w, h: fs };
  });
}

const styles = StyleSheet.create({
  hl: { position: "absolute", borderWidth: 3 },
  labelText: { fontFamily: fonts.text, fontWeight: "800", overflow: "hidden" },
});
