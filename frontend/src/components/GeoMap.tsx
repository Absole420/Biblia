import React, { useMemo } from "react";
import { PixelRatio, StyleSheet, Text, View } from "react-native";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Defs, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";

import geo from "@/src/data/geo.json";
import { GeoPlace, mapSize, projectGeo, ThemeMap } from "@/src/data/themeMaps";
import { Avatar } from "@/src/lib/avatar";
import { LabelItem, LabelPlaced, Rect as Box, solveLabels, textWidth } from "@/src/lib/mapLayout";
import { fonts, useTheme } from "@/src/theme";

import { MapRect, useMapZoom } from "./AnchoredMarker";
import { AvatarView } from "./AvatarView";
import { Cloud, Shimmer } from "./MapAnimations";
import { decoFigures, MapDecor } from "./MapDecor";
import { MapPlaceMarker, PlaceDot } from "./MapPlaceMarker";

type Ring = number[][];
const G = geo as { land: Ring[]; rivers: { name: string; pts: Ring }[]; lakes: { name: string; pts: Ring }[] };

// Bildschirmmaße (unabhängig von der Zoomstufe)
const MARKER = 22;
const HIT = 22;
const ME = 40;
// Letzte Beschriftungslage je Karte → Hysterese gegen Springen zwischen Layoutpositionen
const PREV = new Map<string, Record<string, LabelPlaced>>();

/** Kartenpixel-Box aller angegebenen Orte (mit Rand und Mindestgröße), für Startausschnitt und „Alle Orte“. */
export function placesBox(map: ThemeMap, ids: string[] | null, minFrac = 0.22): MapRect | undefined {
  const pls = ids ? map.places.filter((p) => ids.includes(p.id)) : map.places;
  if (!pls.length) return undefined;
  const pts = pls.map((p) => projectGeo(map, p.lat, p.lon));
  const { width, height } = mapSize(map);
  const x0 = Math.min(...pts.map((p) => p.x));
  const x1 = Math.max(...pts.map((p) => p.x));
  const y0 = Math.min(...pts.map((p) => p.y));
  const y1 = Math.max(...pts.map((p) => p.y));
  const w = Math.max(x1 - x0, width * minFrac) * 1.25;
  const h = Math.max(y1 - y0, height * minFrac) * 1.25;
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
}

type Props = {
  map: ThemeMap;
  k?: number;
  onSelect: (p: GeoPlace) => void;
  /** Gruppe antippen → hineinzoomen */
  onCluster?: (b: MapRect) => void;
  highlight?: string[];
  /** Für die aktuelle Lektion wichtige Orte (werden bevorzugt beschriftet, nie gruppiert) */
  important?: string[];
  selected?: string | null;
  children?: React.ReactNode;
  me?: { lat: number; lon: number; avatar: Avatar } | null;
  /** Nur diese Routen zeigen (Standard: alle Routen der Karte) */
  routeIds?: string[];
};

/** Geografisch korrekte Themenkarte (Natural Earth, gemeinfrei) mit Orten, Ereignissen und Routen. */
export function GeoMap({ map, k: kProp, onSelect, onCluster, highlight, important, selected, children, me, routeIds }: Props) {
  const { colors } = useTheme();
  const { width, height } = mapSize(map);
  const { zoom, minS, snap, vw, vh, reserved } = useMapZoom();
  const k = kProp ?? (minS > 0 && Number.isFinite(minS) ? 1 / minS : 1);

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
  // Größere Systemschrift berücksichtigen (begrenzt, damit die Karte lesbar bleibt)
  const fs = 13 * Math.min(1.3, PixelRatio.getFontScale());
  const labelH = Math.round(fs * 1.45) + 2;
  const labelW = (name: string) => textWidth(name, fs) + 14;

  // Symbole wachsen beim Zoomen gedämpft mit (bleiben erkennbar, ohne die Karte zu überfrachten)
  const kd = k / Math.sqrt(zoom);
  const figures = useMemo(() => decoFigures(map, kd, zoom), [map, kd, zoom]);
  const meP = me ? projectGeo(map, me.lat, me.lon) : null;
  const obstacles = useMemo(() => regionLabelRects(map, k), [map, k]);

  // Zoomabhängige Beschriftungslage im Bildschirmraum der aktuellen Zoomstufe.
  const S = minS * zoom;
  const layout = useMemo(() => {
    const toL = (r: Box): Box => ({ x: r.x * S, y: r.y * S, w: r.w * S, h: r.h * S });
    const scr = (r: MapRect): Box => (snap ? toL({ x: (r.x - snap.tx) / snap.s, y: (r.y - snap.ty) / snap.s, w: r.w / snap.s, h: r.h / snap.s }) : r);
    const view = snap && vw && vh ? scr({ x: 0, y: 0, w: vw, h: vh }) : { x: 0, y: 0, w: width * S, h: height * S };
    const res = snap ? (reserved ?? []).map(scr) : [];
    if (meP) res.push({ x: meP.x * S - ME / 2 - 2, y: meP.y * S - ME - 30, w: ME + 4, h: ME + 22 });
    const items: LabelItem[] = map.places.map((pl) => {
      const p = projectGeo(map, pl.lat, pl.lon);
      const imp = important?.includes(pl.id);
      return {
        id: pl.id,
        x: p.x * S,
        y: p.y * S,
        r: MARKER / 2 + 3,
        w: labelW(pl.name),
        h: labelH,
        priority: (pl.id === selected ? 1000 : 0) + (imp ? 100 : 0) + (highlight?.includes(pl.id) ? 20 : 0) + Math.min(5, pl.events?.length ?? 0) * 3 + (pl.certainty === "secure" ? 2 : 0),
        pinned: pl.id === selected || imp,
      };
    });
    const out = solveLabels(items, { view, reserved: res, obstacles: obstacles.map(toL), prev: PREV.get(map.id), gap: 3, clusterGap: 4 });
    PREV.set(map.id, out);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, S, snap, vw, vh, reserved, important, highlight, selected, obstacles, meP?.x, meP?.y, fs]);

  // Dekorative Symbole weichen sichtbaren Markern aus (Kartenpixel).
  const shift = useMemo(() => {
    const heads = map.places.filter((pl) => layout[pl.id]?.head).map((pl) => P(pl.lat, pl.lon));
    const mr = (MARKER / 2 + 6) / S;
    return Object.fromEntries(figures.map((f) => {
      let dx = 0;
      let dy = 0;
      for (const h of heads) {
        const vx = f.x + dx - h.x;
        const vy = f.y + dy - h.y;
        const d = Math.hypot(vx, vy) || 1;
        const need = f.r + mr - d;
        if (need > 0) { dx += (vx / d) * need; dy += (vy / d) * need; }
      }
      return [f.id, { dx, dy }];
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figures, layout, S, map]);

  const clusterBox = (ids: string[]): MapRect => {
    const pts = ids.map((id) => map.places.find((p) => p.id === id)!).map((p) => P(p.lat, p.lon));
    const x0 = Math.min(...pts.map((p) => p.x));
    const y0 = Math.min(...pts.map((p) => p.y));
    const w = Math.max(...pts.map((p) => p.x)) - x0;
    const h = Math.max(...pts.map((p) => p.y)) - y0;
    const m = Math.max(w, h, 60 / S) * 0.8;
    return { x: x0 - m, y: y0 - m, w: w + 2 * m, h: h + 2 * m };
  };

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
        <MapDecor map={map} k={kd} colors={colors} shift={shift} zoom={zoom} />
        {/* Beschriftungen von Regionen, Meeren, Stämmen */}
        {map.labels.map((l) => {
          const p = P(l.lat, l.lon);
          const sea = l.kind === "sea";
          const tribe = l.kind === "tribe";
          const lfs = (sea ? 15 : tribe ? 12 : 16) * (l.size ?? 1) * k;
          return (
            <SvgText key={l.name} x={p.x} y={p.y} fontSize={lfs} textAnchor="middle" fontFamily={fonts.display} fontStyle={sea ? "italic" : "normal"}
              fontWeight={tribe ? "700" : "600"} letterSpacing={sea || tribe ? 0 : 4 * k} fill={tribe ? colors.stationChallenge : sea ? colors.surface : colors.mapInk} fillOpacity={tribe ? 0.85 : sea ? 0.95 : 0.4}>
              {l.name}
            </SvgText>
          );
        })}
        {/* Routen: Linienart zeigt die Gewissheit (durchgezogen · gepunktet = Tradition · gestrichelt = hypothetisch) */}
        {paths.routes.filter((r) => !routeIds || routeIds.includes(r.id)).map((r) => (
          <React.Fragment key={r.id}>
            <Path d={r.d} stroke={colors.surface} strokeOpacity={0.7} strokeWidth={7 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={r.d} stroke={r.color} strokeWidth={4 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.certainty === "hypothetical" || r.certainty === "disputed" ? `${10 * k} ${8 * k}` : r.certainty === "traditional" ? `${3 * k} ${6 * k}` : undefined} />
          </React.Fragment>
        ))}
        <Rect width={width} height={height} fill="url(#vig)" />
      </Svg>
      <Shimmer x={width * 0.08} y={height * 0.4} w={80 * k} color={colors.surface} />
      <Cloud x={width * 0.1} y={height * 0.15} w={150 * k} color={colors.surface} duration={30000} drift={120 * k} opacity={0.45} />
      <Cloud x={width * 0.55} y={height * 0.7} w={170 * k} color={colors.surface} duration={26000} drift={-120 * k} opacity={0.4} />
      {map.places.map((pl) => {
        const a = P(pl.lat, pl.lon);
        const lay = layout[pl.id];
        const ev = (pl.events?.length ?? 0) > 0;
        const count = lay?.members.length ?? 1;
        const sel = pl.id === selected;
        return (
          <MapPlaceMarker
            key={pl.id + pl.name}
            testID={pl.id}
            ax={a.x}
            ay={a.y}
            hit={HIT}
            markerR={MARKER / 2}
            shown={!!lay?.head}
            count={count}
            label={lay?.label ?? null}
            labelW={labelW(pl.name)}
            labelH={labelH}
            name={pl.name}
            fontSize={fs}
            selected={sel}
            a11y={count > 1 ? `${pl.name} und ${count - 1} weitere Orte – antippen zum Vergrößern` : `${pl.name}${ev ? `, ${pl.events!.length} Ereignisse` : ""}`}
            onPress={() => (count > 1 && onCluster ? onCluster(clusterBox(lay.members)) : onSelect(pl))}
          >
            <PlaceDot certainty={pl.certainty} size={MARKER} events={ev} selected={sel || highlight?.includes(pl.id)} />
          </MapPlaceMarker>
        );
      })}
      {me && meP ? <MeMarker x={meP.x} y={meP.y} avatar={me.avatar} /> : null}
      {children}
    </View>
  );
}

/** Persönliche Lernfigur: schwebt über dem Ort, verdeckt dessen Marker nicht. */
function MeMarker({ x, y, avatar }: { x: number; y: number; avatar: Avatar }) {
  const { colors } = useTheme();
  const { scale } = useMapZoom();
  const st = useInv(scale);
  return (
    <Animated.View style={[styles.abs, { left: x, top: y, width: ME, height: ME + 26, transformOrigin: "left top", pointerEvents: "none" }, st]}>
      <View testID="map-me-marker" accessibilityLabel={`Deine Position: ${avatar.name}`} style={{ width: ME, height: ME, borderRadius: ME / 2, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 2.5, borderColor: colors.brandPrimary, borderStyle: "dashed" }}>
        <AvatarView a={avatar} size={ME - 5} mode="head" />
      </View>
      <View style={[styles.meTag, { backgroundColor: colors.brandPrimary }]}>
        <Text maxFontSizeMultiplier={1} style={[styles.meText, { color: colors.onBrandPrimary }]}>Du</Text>
      </View>
    </Animated.View>
  );
}

function useInv(scale: SharedValue<number>) {
  return useAnimatedStyle(() => ({ transform: [{ scale: 1 / scale.value }, { translateX: -ME / 2 }, { translateY: -ME - 30 }] }));
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
  abs: { position: "absolute" },
  meTag: { alignSelf: "center", marginTop: 2, paddingHorizontal: 6, borderRadius: 6 },
  meText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 12 },
});
