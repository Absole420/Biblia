import React, { useMemo } from "react";
import { Image, PixelRatio, StyleSheet, Text, View } from "react-native";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import Svg, { ClipPath, Defs, G as SvgG, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";

import { RELIEF } from "@/src/data/atlasAssets";
import geo from "@/src/data/geo.json";
import { matchesFilter, PlaceFilter, placeKind, placeTier } from "@/src/data/placeKinds";
import { GeoPlace, mapSize, projectGeo, ThemeMap } from "@/src/data/themeMaps";
import { Avatar } from "@/src/lib/avatar";
import { useProgress } from "@/src/lib/store";
import { LabelItem, LabelPlaced, Rect as Box, solveLabels, textWidth } from "@/src/lib/mapLayout";
import { fonts, useTheme } from "@/src/theme";

import { MapRect, useMapZoom } from "./AnchoredMarker";
import { ART_ZOOM, AtlasLife, PlaceArtView } from "./AtlasLayers";
import { AvatarView } from "./AvatarView";
import { Cloud, Shimmer } from "./MapAnimations";
import { decoFigures, MapDecor } from "./MapDecor";
import { MapPlaceMarker } from "./MapPlaceMarker";
import { PlaceGlyph } from "./PlaceGlyph";

type Ring = number[][];
const G = geo as { land: Ring[]; rivers: { name: string; pts: Ring }[]; lakes: { name: string; pts: Ring }[] };

// Bildschirmmaße (unabhängig von der Zoomstufe) je Hierarchieebene: Hauptort · bedeutender Ort · Detailort
const SIZE = { 1: 34, 2: 26, 3: 20 } as const;
const MARKER = 22;
const HIT = 22;
const ME = 40;
// Ab dieser Zoomstufe erscheinen Detailorte bzw. die Namen bedeutender Orte
const ZOOM_TIER3 = 1.6;
const ZOOM_TIER2_LABEL = 1.2;
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
  /** Ebenenfilter (Standard: alle Orte) */
  filter?: PlaceFilter;
  /** Routen ein-/ausblenden */
  showRoutes?: boolean;
};

/** Geografisch korrekte Themenkarte (Natural Earth, gemeinfrei) mit Orten, Ereignissen und Routen. */
export function GeoMap({ map, k: kProp, onSelect, onCluster, highlight, important, selected, children, me, routeIds, filter = "all", showRoutes = true }: Props) {
  const { colors, scheme } = useTheme();
  const { width, height } = mapSize(map);
  const relief = RELIEF[map.id];
  const motion = useProgress().state.settings.mapMotion !== false;
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
  const fsc = Math.min(1.3, PixelRatio.getFontScale());
  const FS = { 1: 14.5 * fsc, 2: 13 * fsc, 3: 11.5 * fsc } as const;
  const lh = (t: 1 | 2 | 3) => Math.round(FS[t] * 1.45) + 2;
  const labelW = (name: string, t: 1 | 2 | 3 = 2) => textWidth(name, FS[t]) * (t === 3 ? 1 : 1.14) + (t === 3 ? 10 : 18);
  // Karten mit wenigen Ereignisorten (z. B. sieben Gemeinden) zeigen alle Orte schon im Überblick
  const meta = useMemo(() => {
    const sparse = map.places.filter((pl) => pl.events?.length).length < 4;
    return Object.fromEntries(map.places.map((pl) => { const t = placeTier(pl); return [pl.id, { kind: placeKind(pl), tier: (sparse && t === 3 ? 2 : t) as 1 | 2 | 3 }]; }));
  }, [map]);

  // Symbole wachsen beim Zoomen gedämpft mit (bleiben erkennbar, ohne die Karte zu überfrachten)
  const kd = k / Math.sqrt(zoom);
  const figures = useMemo(() => decoFigures(map, kd, zoom, !!relief), [map, kd, zoom, relief]);
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
    const items: LabelItem[] = map.places.filter((pl) => {
      const imp = pl.id === selected || important?.includes(pl.id) || highlight?.includes(pl.id);
      if (!imp && !matchesFilter(pl, filter)) return false;
      return imp || meta[pl.id].tier < 3 || zoom >= ZOOM_TIER3;
    }).map((pl) => {
      const p = projectGeo(map, pl.lat, pl.lon);
      const imp = important?.includes(pl.id);
      const t = meta[pl.id].tier;
      const quiet = t === 2 && map.places.length > 10 && zoom < ZOOM_TIER2_LABEL && (pl.events?.length ?? 0) < 2 && pl.id !== selected && !imp;
      return {
        id: pl.id,
        x: p.x * S,
        y: p.y * S,
        r: SIZE[t] / 2 + 2,
        w: labelW(pl.name, t),
        h: lh(t),
        priority: (pl.id === selected ? 1000 : 0) + (imp ? 100 : 0) + (highlight?.includes(pl.id) ? 20 : 0) + (4 - t) * 12 + Math.min(5, pl.events?.length ?? 0) * 3 + (pl.certainty === "secure" ? 2 : 0),
        pinned: pl.id === selected || imp,
        noLabel: quiet,
      };
    });
    const out = solveLabels(items, { view, reserved: res, obstacles: obstacles.map(toL), prev: PREV.get(map.id), gap: 3, clusterGap: 4 });
    PREV.set(map.id, out);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, S, snap, vw, vh, reserved, important, highlight, selected, obstacles, meP?.x, meP?.y, fsc, filter, zoom, meta]);

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
      {relief ? <Image source={relief} style={[styles.abs, { left: 0, top: 0, width, height }]} resizeMode="stretch" testID="atlas-relief" /> : null}
      <Svg width={width} height={height} style={[styles.abs, { left: 0, top: 0 }]}>
        <Defs>
          <RadialGradient id="vig" cx="50%" cy="50%" r="70%">
            <Stop offset="0.6" stopColor={colors.mapInk} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.mapInk} stopOpacity={0.22} />
          </RadialGradient>
          <LinearGradient id="sea" x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={colors.mapSea} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.mapSeaDeep} stopOpacity={1} />
          </LinearGradient>
          {/* Licht von Nordwesten: hellere Mitte, warme Ränder – gibt der Landfläche Tiefe */}
          <RadialGradient id="landLight" cx="45%" cy="35%" r="75%">
            <Stop offset="0" stopColor={colors.surface} stopOpacity={0.35} />
            <Stop offset="0.65" stopColor={colors.surface} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.mapMountain} stopOpacity={0.35} />
          </RadialGradient>
          <Pattern id="grain" patternUnits="userSpaceOnUse" width={14 * k} height={14 * k}>
            <Rect x={2 * k} y={3 * k} width={1.1 * k} height={1.1 * k} fill={colors.mapInk} fillOpacity={0.09} />
            <Rect x={9 * k} y={8 * k} width={0.9 * k} height={0.9 * k} fill={colors.mapInk} fillOpacity={0.07} />
            <Rect x={5 * k} y={11 * k} width={0.8 * k} height={0.8 * k} fill={colors.mapInk} fillOpacity={0.06} />
          </Pattern>
          <ClipPath id="landClip"><Path d={paths.land} /></ClipPath>
        </Defs>
        {relief ? (
          <>
            {/* Ebene 1+2 liegt als Reliefbild darunter: hier nur Papierstruktur, Nachtlicht und Brandungssaum */}
            {scheme === "dark" ? <Rect width={width} height={height} fill={colors.mapSeaDeep} fillOpacity={0.5} /> : null}
            <Path d={paths.land} fill="none" stroke={colors.surface} strokeOpacity={scheme === "dark" ? 0.15 : 0.45} strokeWidth={4 * k} strokeLinejoin="round" />
            <SvgG clipPath="url(#landClip)"><Rect width={width} height={height} fill="url(#grain)" /></SvgG>
          </>
        ) : (
          <>
            <Rect width={width} height={height} fill="url(#sea)" />
            {/* Gestochene Küstenlinien im Wasser (klassischer Atlas-Stil) */}
            {[30, 20, 12].map((w, i) => (
              <Path key={w} d={paths.land} fill="none" stroke={colors.mapSeaDeep} strokeOpacity={0.18 + i * 0.12} strokeWidth={w * k} strokeLinejoin="round" />
            ))}
            <Path d={paths.land} fill="none" stroke={colors.surface} strokeOpacity={0.35} strokeWidth={5 * k} strokeLinejoin="round" />
            <Path d={paths.land} fill={colors.mapLand} />
            <SvgG clipPath="url(#landClip)">
              <Rect width={width} height={height} fill="url(#landLight)" />
              <Rect width={width} height={height} fill="url(#grain)" />
              <Path d={paths.land} fill="none" stroke={colors.mapMountain} strokeOpacity={0.35} strokeWidth={7 * k} strokeLinejoin="round" />
            </SvgG>
          </>
        )}
        <Path d={paths.land} fill="none" stroke={colors.mapInk} strokeOpacity={relief ? 0.3 : 0.5} strokeWidth={(relief ? 0.8 : 1.1) * k} strokeLinejoin="round" />
        <Path d={paths.rivers} stroke={colors.surface} strokeOpacity={0.5} strokeWidth={5 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={paths.rivers} stroke={colors.mapRiver} strokeWidth={2.4 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={paths.lakes} fill={relief ? colors.mapRiver : "url(#sea)"} stroke={colors.mapInk} strokeOpacity={0.45} strokeWidth={1.1 * k} />
        <MapDecor map={map} k={kd} colors={colors} shift={shift} zoom={zoom} relief={!!relief} />
        {/* Beschriftungen von Regionen, Meeren, Stämmen – mit weichem Lichthof für Lesbarkeit */}
        {map.labels.map((l) => {
          const p = P(l.lat, l.lon);
          const sea = l.kind === "sea";
          const tribe = l.kind === "tribe";
          const lfs = (sea ? 15 : tribe ? 12 : 16) * (l.size ?? 1) * k;
          return (
            <SvgText key={l.name} x={p.x} y={p.y} fontSize={lfs} textAnchor="middle" fontFamily={fonts.display} fontStyle={sea || relief ? "italic" : "normal"}
              stroke={sea ? colors.mapSeaDeep : colors.surface} strokeWidth={sea ? 0 : (relief ? 1.2 : 3) * k} strokeOpacity={relief ? 0.35 : 0.6}
              fontWeight={tribe ? "700" : "600"} letterSpacing={sea || tribe ? 0 : (relief ? 2.5 : 4) * k} fill={tribe ? colors.stationChallenge : sea ? colors.surface : colors.mapInk} fillOpacity={tribe ? 0.85 : sea ? 0.95 : relief ? (scheme === "dark" ? 0.85 : 0.62) : 0.45}>
              {l.name}
            </SvgText>
          );
        })}
        {map.compass ? <Compass {...P(map.compass.lat, map.compass.lon)} r={34 * k} ink={colors.mapInk} gold={colors.brandPrimary} paper={colors.surface} /> : null}
        {/* Routen im Atlas-Stil: Tuschekontur, Pergamentband, farbige Linie (Linienart = Gewissheit) */}
        {showRoutes && paths.routes.filter((r) => !routeIds || routeIds.includes(r.id)).map((r) => {
          const a = r.pts[0];
          const b = r.pts[r.pts.length - 1];
          const pa = P(a[0], a[1]);
          const pb = P(b[0], b[1]);
          return (
            <React.Fragment key={r.id}>
              <Path d={r.d} stroke={colors.mapInk} strokeOpacity={0.28} strokeWidth={7.5 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d={r.d} stroke={colors.surface} strokeOpacity={0.85} strokeWidth={5.5 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d={r.d} stroke={r.color} strokeWidth={3.2 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.certainty === "hypothetical" || r.certainty === "disputed" ? `${10 * k} ${7 * k}` : r.certainty === "traditional" ? `${0.5 * k} ${6 * k}` : undefined} />
              <Rect x={pa.x - 4 * k} y={pa.y - 4 * k} width={8 * k} height={8 * k} rx={4 * k} fill={colors.surface} stroke={r.color} strokeWidth={2.2 * k} />
              <Rect x={pb.x - 4.5 * k} y={pb.y - 4.5 * k} width={9 * k} height={9 * k} rx={1.5 * k} fill={r.color} stroke={colors.surface} strokeWidth={1.6 * k} transform={`rotate(45 ${pb.x} ${pb.y})`} />
            </React.Fragment>
          );
        })}
        <Rect width={width} height={height} fill="url(#vig)" />
        {/* Doppelter Atlasrahmen */}
        <Rect x={6 * k} y={6 * k} width={width - 12 * k} height={height - 12 * k} fill="none" stroke={colors.mapInk} strokeOpacity={0.35} strokeWidth={1.6 * k} />
        <Rect x={11 * k} y={11 * k} width={width - 22 * k} height={height - 22 * k} fill="none" stroke={colors.mapInk} strokeOpacity={0.2} strokeWidth={0.8 * k} />
      </Svg>
      {relief ? <AtlasLife map={map} k={k} motion={motion} /> : null}
      {motion && !relief ? (
        <>
          <Shimmer x={width * 0.08} y={height * 0.4} w={80 * k} color={colors.surface} />
          <Cloud x={width * 0.1} y={height * 0.15} w={150 * k} color={colors.surface} duration={30000} drift={120 * k} opacity={0.35} />
          <Cloud x={width * 0.55} y={height * 0.7} w={170 * k} color={colors.surface} duration={26000} drift={-120 * k} opacity={0.3} />
        </>
      ) : null}
      {/* Ebene 5: Ortsillustrationen (unter Markern und Beschriftungen) */}
      {relief ? map.places.map((pl) => {
        const { kind, tier } = meta[pl.id];
        const a = P(pl.lat, pl.lon);
        const lay = layout[pl.id];
        const vis = !!lay?.head && (zoom >= ART_ZOOM[tier] || pl.id === selected || !!important?.includes(pl.id));
        return <PlaceArtView key={"art" + pl.id + pl.name} place={pl} ax={a.x} ay={a.y} kind={kind} tier={tier} shown={vis} glow={pl.id === selected} dim={scheme === "dark"} onPress={() => onSelect(pl)} />;
      }) : null}
      {map.places.map((pl) => {
        const a = P(pl.lat, pl.lon);
        const lay = layout[pl.id];
        const ev = (pl.events?.length ?? 0) > 0;
        const count = lay?.members.length ?? 1;
        const sel = pl.id === selected;
        const { kind, tier } = meta[pl.id];
        return (
          <MapPlaceMarker
            key={pl.id + pl.name}
            testID={pl.id}
            ax={a.x}
            ay={a.y}
            hit={HIT}
            markerR={SIZE[tier] / 2}
            shown={!!lay?.head}
            count={count}
            label={lay?.label ?? null}
            labelW={labelW(pl.name, tier)}
            labelH={lh(tier)}
            name={pl.name}
            fontSize={FS[tier]}
            tier={tier}
            selected={sel}
            a11y={count > 1 ? `${pl.name} und ${count - 1} weitere Orte – antippen zum Vergrößern` : `${pl.name}${ev ? `, ${pl.events!.length} Ereignisse` : ""}`}
            onPress={() => (count > 1 && onCluster ? onCluster(clusterBox(lay.members)) : onSelect(pl))}
          >
            {relief ? <AnchorDot tier={tier} certainty={pl.certainty} events={ev} selected={sel || !!highlight?.includes(pl.id)} /> : <PlaceGlyph kind={kind} tier={tier} certainty={pl.certainty} size={SIZE[tier]} events={ev} selected={sel || highlight?.includes(pl.id)} />}
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

/** Atlas-Ankerpunkt: Sepia-Punkt mit hellem Rand (gold = mit Ereignissen; hohl = Lage umstritten). */
function AnchorDot({ tier, certainty, events, selected }: { tier: 1 | 2 | 3; certainty: string; events: boolean; selected: boolean }) {
  const { colors } = useTheme();
  const d = tier === 1 ? 13 : tier === 2 ? 11 : 9;
  const hollow = certainty === "disputed";
  return (
    <View style={{ width: d, height: d, borderRadius: d / 2, borderWidth: hollow ? 2.5 : 2, borderStyle: certainty === "traditional" ? "dotted" : "solid", borderColor: selected ? colors.stationNarrative : hollow ? colors.mapInk : colors.surface, backgroundColor: hollow ? colors.surface : events ? colors.brandPrimary : colors.mapInk, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
  );
}

/** Dezente Windrose mit Nordpfeil (rein dekorativ). */
function Compass({ x, y, r, ink, gold, paper }: { x: number; y: number; r: number; ink: string; gold: string; paper: string }) {
  const star = (len: number, w: number) => `M${x} ${y - len}L${x + w} ${y}L${x} ${y + len}L${x - w} ${y}Z`;
  return (
    <SvgG opacity={0.75}>
      <Path d={`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`} fill={paper} fillOpacity={0.35} stroke={ink} strokeOpacity={0.5} strokeWidth={r * 0.03} />
      <Path d={star(r * 0.72, r * 0.1)} fill={ink} fillOpacity={0.35} transform={`rotate(45 ${x} ${y})`} />
      <Path d={star(r * 0.95, r * 0.15)} fill={ink} fillOpacity={0.65} />
      <Path d={star(r * 0.95, r * 0.15)} fill={ink} fillOpacity={0.65} transform={`rotate(90 ${x} ${y})`} />
      <Path d={`M${x} ${y - r * 0.95}L${x + r * 0.15} ${y}L${x - r * 0.15} ${y}Z`} fill={gold} />
      <SvgText x={x} y={y - r * 1.08} fontSize={r * 0.36} textAnchor="middle" fontFamily={fonts.display} fontWeight="700" fill={ink} fillOpacity={0.8}>N</SvgText>
    </SvgG>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  meTag: { alignSelf: "center", marginTop: 2, paddingHorizontal: 6, borderRadius: 6 },
  meText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 12 },
});
