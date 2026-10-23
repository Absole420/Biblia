import React from "react";
import { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

import { projectGeo, ThemeMap } from "@/src/data/themeMaps";
import { ThemeColors } from "@/src/theme";

import { blob, mountain } from "./mapShapes";

// Illustrative Landschaftsdetails (lat/lon). Rein dekorativ – keine Ortsangaben.
type Kind =
  | "desert" | "green" | "mount" | "ridge" | "palm" | "olive" | "cedar" | "shepherd" | "camel" | "boat" | "houses" | "city"
  | "village" | "vine" | "wheat" | "well" | "tent" | "papyrus" | "wave" | "fish";
type Deco = { k: Kind; lat: number; lon: number; s?: number; lat2?: number; lon2?: number };

const pts = (k: Kind, a: number[][]) => a.map(([lat, lon, s]) => ({ k, lat, lon, s }));
const ridge = (a: number[][]) => a.map(([lat, lon, lat2, lon2, s]) => ({ k: "ridge" as const, lat, lon, lat2, lon2, s }));

const DECO: Deco[] = [
  // Wüsten
  ...pts("desert", [[30.6, 34.8, 1.4], [29.4, 33.7, 2.2], [30.3, 38.5, 4], [31.5, 35.3, 0.6], [27.5, 31.0, 3], [33.0, 40.0, 3.5], [31.0, 36.6, 1.6]]),
  // Fruchtbares Land / Gärten
  ...pts("green", [[32.8, 35.35, 0.55], [32.6, 35.25, 0.35], [31.0, 31.0, 1.4], [33.4, 44.2, 1.6], [35.6, 41.5, 1.4], [32.1, 34.85, 0.35], [33.2, 35.6, 0.3], [32.4, 35.75, 0.4], [38.0, 28.0, 1.5], [41.5, 13.2, 1.2]]),
  // Einzelne Berge (Hermon, Sinai, Karmel, Hebron, Garizim, Tabor …)
  ...pts("mount", [[33.42, 35.86, 1.2], [28.55, 33.97, 1.1], [32.73, 35.05, 0.6], [31.65, 35.12, 0.7], [32.2, 35.27, 0.6], [32.69, 35.39, 0.5], [37.4, 33.0, 2], [37.8, 37.5, 2], [36.8, 44.3, 1.8], [30.4, 35.5, 0.8], [33.8, 35.9, 1]]),
  // Gebirgszüge (Folge kleiner Gipfel zwischen zwei Punkten)
  ...ridge([
    [31.35, 35.08, 32.0, 35.25, 0.5], // Judäisches Bergland
    [32.62, 35.2, 33.0, 35.42, 0.45], // Galiläisches Bergland
    [33.35, 35.5, 34.45, 36.2, 0.7], // Libanon
    [33.3, 35.9, 34.1, 36.45, 0.6], // Antilibanon
    [30.9, 35.72, 32.35, 35.85, 0.5], // Ostjordanisches Hochland
    [29.6, 35.4, 30.6, 35.55, 0.55], // Edom / Seïr
    [28.4, 33.7, 29.1, 34.3, 0.7], // Sinai-Massiv
    [36.9, 32.4, 37.6, 36.2, 1.4], // Taurus
    [33.6, 46.2, 36.6, 45.0, 1.4], // Zagros
  ]),
  // Bäume
  ...pts("palm", [[31.87, 35.46], [31.46, 35.4], [30.5, 31.3], [29.3, 32.85], [30.63, 34.45], [32.5, 44.4], [31.83, 35.5], [30.1, 31.2], [29.6, 31.15], [31.3, 34.35]]),
  ...pts("olive", [[31.78, 35.26], [32.9, 35.4], [32.3, 35.15], [31.95, 35.2], [33.05, 35.3], [32.45, 35.05], [31.55, 35.0], [32.75, 35.2]]),
  ...pts("cedar", [[34.25, 36.05], [34.05, 35.9], [33.85, 35.75], [34.4, 36.15]]),
  // Weinberge und Kornfelder
  ...pts("vine", [[31.6, 35.07], [32.15, 35.22], [32.95, 35.2], [31.42, 35.02], [32.55, 35.0]]),
  ...pts("wheat", [[32.6, 35.33], [32.52, 35.2], [31.68, 34.78], [30.85, 31.15], [33.0, 44.1], [32.4, 35.68]]),
  ...pts("papyrus", [[30.05, 31.23], [29.8, 31.28], [31.2, 31.5], [30.6, 32.1]]),
  // Dörfer, Brunnen, Zelte
  ...pts("village", [[32.55, 35.1], [32.35, 34.98], [31.6, 34.9], [32.0, 35.05], [33.1, 35.45], [32.95, 35.15], [31.45, 34.75], [32.2, 35.6], [31.9, 34.95], [32.45, 35.4]]),
  ...pts("well", [[32.21, 35.29], [31.25, 34.79], [30.9, 34.6]]),
  ...pts("tent", [[31.2, 35.9], [30.0, 35.3], [29.0, 34.2], [30.4, 34.1], [31.4, 36.6]]),
  // Figuren
  { k: "shepherd", lat: 31.68, lon: 35.25 }, { k: "shepherd", lat: 32.45, lon: 35.75 }, { k: "camel", lat: 30.2, lon: 34.6 }, { k: "camel", lat: 29.8, lon: 33.3 }, { k: "camel", lat: 32.5, lon: 38.5 },
  { k: "boat", lat: 32.82, lon: 35.59 }, { k: "boat", lat: 32.6, lon: 34.6 }, { k: "boat", lat: 35.0, lon: 25.0 }, { k: "boat", lat: 37.2, lon: 26.0 }, { k: "boat", lat: 31.9, lon: 33.6 },
  ...pts("fish", [[32.78, 35.56], [32.86, 35.62]]),
  // Wellen auf dem Meer
  ...pts("wave", [[32.9, 34.3], [32.2, 33.95], [33.6, 34.6], [31.6, 33.7], [34.4, 33.2], [35.4, 30.5], [33.9, 28.5], [36.0, 19.0], [38.5, 18.0], [33.8, 25.0], [27.0, 34.3], [28.8, 32.9]]),
  // Ummauerte Großstädte und Städte mit Flachdachhäusern
  ...pts("city", [[31.778, 35.235], [32.536, 44.421], [36.359, 43.153], [33.513, 36.292], [41.9, 12.5]]),
  ...pts("houses", [[32.276, 35.197], [32.5, 34.89], [30.8, 31.83], [36.2, 36.16], [37.94, 27.34]]),
];

// Ab dieser Zoomstufe erscheinen feine Details (Dörfer, Felder …) – hält die Übersicht ruhig.
const MIN_ZOOM: Partial<Record<Kind, number>> = { village: 1.5, vine: 1.5, wheat: 1.2, well: 1.9, tent: 1.2, papyrus: 1.2, fish: 1.9, cedar: 1.2 };

const visibleDeco = (map: ThemeMap, zoom: number) => {
  const { latMin, latMax, lonMin, lonMax } = map.bounds;
  return DECO.map((d, i) => [d, i] as const).filter(([d]) => {
    if ((MIN_ZOOM[d.k] ?? 0) > zoom + 1e-3) return false;
    const pad = (d.s ?? 0) + 0.5;
    const inside = (la: number, lo: number) => la > latMin - pad && la < latMax + pad && lo > lonMin - pad && lo < lonMax + pad;
    return inside(d.lat, d.lon) || (d.lat2 != null && inside(d.lat2, d.lon2!));
  });
};

// Umriss der Figuren (Mittelpunkt dx/dy und Radius in Figureneinheiten), für die Kollisionsprüfung.
const FIG_BOX: Partial<Record<Kind, [number, number, number]>> = {
  shepherd: [1.3, -1.2, 2.0], camel: [-0.3, -1.1, 1.5], boat: [0, -0.7, 1.4], palm: [0, -1.5, 1.4], olive: [0, -1.0, 0.9],
  cedar: [0, -1.4, 1.2], village: [0, -0.5, 1.6], well: [0, -0.4, 0.9], tent: [0, -0.6, 1.3], houses: [-0.2, 0.3, 1.9], city: [0, -0.4, 2.6],
};

/** Bewegliche Kartensymbole (Figuren, Bäume, Boote, Siedlungen) mit Kollisionskreis in Kartenpixeln. */
export function decoFigures(map: ThemeMap, k: number, zoom = 1) {
  const u = 10 * k;
  return visibleDeco(map, zoom).flatMap(([d, i]) => {
    const b = FIG_BOX[d.k];
    if (!b) return [];
    const p = projectGeo(map, d.lat, d.lon);
    return [{ id: "d" + i, x: p.x + b[0] * u, y: p.y + b[1] * u, r: b[2] * u }];
  });
}

// Antike Fernstraßen (Verlauf schematisch)
const ROADS: [number, number][][] = [
  [[30.8, 31.83], [31.1, 32.6], [31.2, 33.8], [31.5, 34.46], [31.75, 34.65], [32.05, 34.8], [32.5, 34.95], [32.585, 35.185], [32.8, 35.5], [33.017, 35.568], [33.513, 36.292]], // Via Maris
  [[29.53, 35.0], [30.3, 35.45], [31.2, 35.75], [31.95, 35.93], [32.6, 36.1], [33.513, 36.292]], // Königsweg
  [[31.245, 34.84], [31.525, 35.11], [31.705, 35.2], [31.778, 35.235], [31.93, 35.22], [32.213, 35.282], [32.556, 35.33]], // Weg über das Bergland
];

type P = { x: number; y: number };

export function MapDecor({ map, k, colors, shift, zoom = 1 }: { map: ThemeMap; k: number; colors: ThemeColors; shift?: Record<string, { dx: number; dy: number }>; zoom?: number }) {
  const deg = map.pxPerDeg;
  const Pg = (lat: number, lon: number) => projectGeo(map, lat, lon);
  const u = 10 * k; // Grundgröße der Figuren
  const sw = (n: number) => n * k;

  const house = (p: P, dx: number, dy: number, w: number, h: number, key: string | number, roof = false) => (
    <G key={key}>
      <Rect x={p.x + dx * u} y={p.y + (dy - h) * u} width={w * u} height={h * u} fill={colors.surfaceTertiary} stroke={colors.mapInk} strokeWidth={sw(0.6)} />
      <Rect x={p.x + (dx + w * 0.35) * u} y={p.y + (dy - h * 0.45) * u} width={w * 0.3 * u} height={h * 0.45 * u} fill={colors.mapInk} fillOpacity={0.55} />
      {roof ? <Rect x={p.x + (dx - 0.08) * u} y={p.y + (dy - h - 0.12) * u} width={(w + 0.16) * u} height={0.16 * u} fill={colors.mapMountain} /> : null}
    </G>
  );

  return (
    <G>
      {ROADS.map((r, i) => {
        const d = r.map(([la, lo], j) => { const p = Pg(la, lo); return `${j ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join("");
        return <Path key={"r" + i} d={d} stroke={colors.mapMountain} strokeWidth={sw(3)} strokeDasharray={`${sw(2)} ${sw(5)}`} strokeLinecap="round" fill="none" />;
      })}
      {visibleDeco(map, zoom).map(([d, i]) => {
        const p0 = Pg(d.lat, d.lon);
        const sh = shift?.["d" + i];
        const p = sh ? { x: p0.x + sh.dx, y: p0.y + sh.dy } : p0;
        const s = d.s ?? 1;
        switch (d.k) {
          case "desert": {
            const r = s * deg * 0.5;
            return (
              <G key={i}>
                <Path d={blob(p.x, p.y, r, r * 0.7, 11 + i, 10, 0.3)} fill={colors.warning} fillOpacity={0.22} />
                {[-0.4, 0, 0.35].map((o, j) => (
                  <Path key={j} d={`M${p.x + o * r - 2.2 * u} ${p.y + (j - 1) * r * 0.3} q${2.2 * u} ${-1.4 * u} ${4.4 * u} 0`} stroke={colors.mapMountain} strokeWidth={sw(2)} fill="none" strokeLinecap="round" />
                ))}
                {[[-0.2, 0.35], [0.25, -0.3]].map(([ox, oy], j) => (
                  <Circle key={"s" + j} cx={p.x + ox * r} cy={p.y + oy * r} r={0.25 * u} fill={colors.mapMountain} fillOpacity={0.7} />
                ))}
              </G>
            );
          }
          case "green": {
            const r = s * deg * 0.5;
            return <Path key={i} d={blob(p.x, p.y, r, r * 0.75, 41 + i, 10, 0.3)} fill={colors.mapForest} fillOpacity={0.4} />;
          }
          case "mount": {
            const w = Math.max(3 * u, Math.min(s * deg * 0.35, 7 * u * s));
            const m = mountain(p.x, p.y + w * 0.3, w, w * 0.7);
            return (
              <G key={i}>
                <Path d={m.body} fill={colors.mapMountain} stroke={colors.mapInk} strokeOpacity={0.4} strokeWidth={sw(1.2)} />
                <Path d={m.shade} fill={colors.mapInk} fillOpacity={0.15} />
                <Path d={m.snow} fill={colors.surface} fillOpacity={0.85} />
              </G>
            );
          }
          case "ridge": {
            const b = Pg(d.lat2!, d.lon2!);
            const len = Math.hypot(b.x - p0.x, b.y - p0.y);
            const w = Math.max(2.4 * u, Math.min(s * deg * 0.18, 4 * u * s));
            // Mehr Gipfel bei stärkerem Zoom (Detailstufe)
            const n = Math.max(3, Math.min(14, Math.round((len / w) * Math.min(1.6, 0.7 + zoom * 0.25))));
            return (
              <G key={i}>
                {Array.from({ length: n }, (_, j) => {
                  const t = n === 1 ? 0.5 : j / (n - 1);
                  const x = p0.x + (b.x - p0.x) * t + (j % 2 ? w * 0.18 : -w * 0.18);
                  const y = p0.y + (b.y - p0.y) * t;
                  const hw = w * (0.75 + ((j * 37) % 10) / 25);
                  const m = mountain(x, y, hw, hw * 0.6);
                  return (
                    <G key={j}>
                      <Path d={m.body} fill={colors.mapMountain} fillOpacity={0.85} stroke={colors.mapInk} strokeOpacity={0.3} strokeWidth={sw(0.9)} />
                      <Path d={m.shade} fill={colors.mapInk} fillOpacity={0.14} />
                    </G>
                  );
                })}
              </G>
            );
          }
          case "palm":
            return (
              <G key={i}>
                <Path d={`M${p.x} ${p.y} q${0.3 * u} ${-1 * u} 0 ${-2 * u}`} stroke={colors.mapInk} strokeWidth={sw(1.4)} fill="none" />
                {[-1, -0.4, 0.4, 1].map((a) => (
                  <Path key={a} d={`M${p.x} ${p.y - 2 * u} q${a * 0.6 * u} ${-0.6 * u} ${a * 1.3 * u} ${0.2 * u}`} stroke={colors.success} strokeWidth={sw(1.6)} fill="none" strokeLinecap="round" />
                ))}
              </G>
            );
          case "olive":
            return (
              <G key={i}>
                <Rect x={p.x - 0.15 * u} y={p.y - 0.6 * u} width={0.3 * u} height={0.8 * u} fill={colors.mapInk} opacity={0.6} />
                <Circle cx={p.x} cy={p.y - 1.1 * u} r={0.75 * u} fill={colors.mapForest} stroke={colors.mapInk} strokeOpacity={0.4} strokeWidth={k} />
                <Circle cx={p.x - 0.25 * u} cy={p.y - 1.3 * u} r={0.18 * u} fill={colors.surface} fillOpacity={0.35} />
              </G>
            );
          case "cedar":
            return (
              <G key={i}>
                <Rect x={p.x - 0.12 * u} y={p.y - 0.5 * u} width={0.24 * u} height={0.6 * u} fill={colors.mapInk} opacity={0.6} />
                {[0, 0.55, 1.05].map((o, j) => (
                  <Path key={j} d={`M${p.x - (1.1 - j * 0.25) * u} ${p.y - (0.4 + o) * u} L${p.x} ${p.y - (1.3 + o) * u} L${p.x + (1.1 - j * 0.25) * u} ${p.y - (0.4 + o) * u} Z`} fill={colors.mapForest} stroke={colors.mapInk} strokeOpacity={0.35} strokeWidth={sw(0.6)} />
                ))}
              </G>
            );
          case "vine":
            return (
              <G key={i}>
                {[0, 1, 2, 3].map((r) => (
                  <G key={r}>
                    <Path d={`M${p.x - 1.6 * u} ${p.y + (r - 1.5) * 0.6 * u} L${p.x + 1.6 * u} ${p.y + (r - 1.5) * 0.6 * u}`} stroke={colors.mapInk} strokeOpacity={0.35} strokeWidth={sw(0.5)} />
                    {[-1.2, -0.4, 0.4, 1.2].map((c) => <Circle key={c} cx={p.x + c * u} cy={p.y + (r - 1.5) * 0.6 * u} r={0.22 * u} fill={colors.mapForest} />)}
                  </G>
                ))}
              </G>
            );
          case "wheat":
            return (
              <G key={i}>
                <Path d={blob(p.x, p.y, 2.2 * u, 1.3 * u, 7 + i, 8, 0.15)} fill={colors.warning} fillOpacity={0.35} stroke={colors.mapMountain} strokeWidth={sw(0.6)} />
                {[-1.2, -0.6, 0, 0.6, 1.2].map((o) => (
                  <Path key={o} d={`M${p.x + o * u} ${p.y + 0.8 * u} L${p.x + (o + 0.3) * u} ${p.y - 0.8 * u}`} stroke={colors.mapMountain} strokeWidth={sw(0.7)} strokeLinecap="round" />
                ))}
              </G>
            );
          case "papyrus":
            return (
              <G key={i}>
                {[-0.6, 0, 0.6].map((o, j) => (
                  <G key={o}>
                    <Path d={`M${p.x + o * u} ${p.y} L${p.x + o * 1.4 * u} ${p.y - (1.4 + (j % 2) * 0.4) * u}`} stroke={colors.success} strokeWidth={sw(0.8)} />
                    <Circle cx={p.x + o * 1.4 * u} cy={p.y - (1.5 + (j % 2) * 0.4) * u} r={0.3 * u} fill={colors.mapForest} />
                  </G>
                ))}
              </G>
            );
          case "village":
            return (
              <G key={i}>
                {house(p, -1.1, 0, 0.9, 0.8, "a", true)}
                {house(p, -0.1, -0.2, 1.1, 1.0, "b", true)}
                {house(p, 0.6, 0.35, 0.7, 0.6, "c")}
              </G>
            );
          case "houses":
            return (
              <G key={i}>
                {[[-1.6, 1.4, 1.1, 1.1], [-0.4, 0.9, 1.1, 1.4], [0.9, 1.3, 1.1, 1.0]].map(([dx, dy, w, h], j) => house(p, dx, dy, w, h, j, j === 1))}
              </G>
            );
          case "city":
            return (
              <G key={i}>
                {/* Stadtmauer mit Türmen und Tor */}
                <Path d={blob(p.x, p.y + 0.2 * u, 2.4 * u, 1.5 * u, 3 + i, 9, 0.08)} fill={colors.surfaceTertiary} fillOpacity={0.6} stroke={colors.mapInk} strokeWidth={sw(1.1)} />
                {[-2.1, -0.7, 0.7, 2.1].map((dx, j) => (
                  <Rect key={j} x={p.x + (dx - 0.3) * u} y={p.y + (j % 3 ? 0.6 : 0.1) * u} width={0.6 * u} height={0.9 * u} fill={colors.mapMountain} stroke={colors.mapInk} strokeWidth={sw(0.6)} />
                ))}
                {house(p, -1.3, 0.3, 0.9, 0.9, "h1")}
                {house(p, 0.5, 0.4, 0.9, 0.8, "h2")}
                {/* Hauptbau (Tempel / Palast) */}
                <Rect x={p.x - 0.6 * u} y={p.y - 1.5 * u} width={1.2 * u} height={1.6 * u} fill={colors.surface} stroke={colors.mapInk} strokeWidth={sw(0.8)} />
                <Rect x={p.x - 0.8 * u} y={p.y - 1.7 * u} width={1.6 * u} height={0.25 * u} fill={colors.brandPrimary} />
                <Rect x={p.x - 0.2 * u} y={p.y - 0.8 * u} width={0.4 * u} height={0.9 * u} fill={colors.mapInk} fillOpacity={0.6} />
              </G>
            );
          case "well":
            return (
              <G key={i}>
                <Ellipse cx={p.x} cy={p.y} rx={0.8 * u} ry={0.4 * u} fill={colors.mapMountain} stroke={colors.mapInk} strokeWidth={sw(0.6)} />
                <Ellipse cx={p.x} cy={p.y - 0.05 * u} rx={0.45 * u} ry={0.2 * u} fill={colors.mapSeaDeep} />
                <Path d={`M${p.x - 0.7 * u} ${p.y} L${p.x - 0.7 * u} ${p.y - 1.2 * u} L${p.x + 0.7 * u} ${p.y - 1.2 * u} L${p.x + 0.7 * u} ${p.y}`} stroke={colors.mapInk} strokeWidth={sw(0.6)} fill="none" />
              </G>
            );
          case "tent":
            return (
              <G key={i}>
                <Path d={`M${p.x - 1.3 * u} ${p.y} L${p.x - 0.6 * u} ${p.y - 1.1 * u} L${p.x + 0.7 * u} ${p.y - 1.1 * u} L${p.x + 1.3 * u} ${p.y} Z`} fill={colors.mapInk} fillOpacity={0.7} />
                <Path d={`M${p.x - 0.25 * u} ${p.y} L${p.x} ${p.y - 0.7 * u} L${p.x + 0.25 * u} ${p.y} Z`} fill={colors.warning} />
              </G>
            );
          case "fish":
            return (
              <G key={i}>
                <Path d={`M${p.x - 0.7 * u} ${p.y} q${0.7 * u} ${-0.5 * u} ${1.2 * u} 0 q${-0.5 * u} ${0.5 * u} ${-1.2 * u} 0 Z M${p.x + 0.5 * u} ${p.y} l${0.4 * u} ${-0.3 * u} l0 ${0.6 * u} Z`} fill={colors.surface} fillOpacity={0.85} />
              </G>
            );
          case "wave":
            return (
              <G key={i}>
                {[0, 1].map((j) => (
                  <Path key={j} d={`M${p.x - 2 * u + j * 1.2 * u} ${p.y + j * 0.9 * u} q${0.5 * u} ${-0.5 * u} ${1 * u} 0 t${1 * u} 0 t${1 * u} 0`} stroke={colors.surface} strokeOpacity={0.55} strokeWidth={sw(1.2)} fill="none" strokeLinecap="round" />
                ))}
              </G>
            );
          case "shepherd":
            return (
              <G key={i}>
                <Circle cx={p.x} cy={p.y - 2.1 * u} r={0.45 * u} fill={colors.stationNarrative} />
                <Path d={`M${p.x - 0.6 * u} ${p.y} L${p.x} ${p.y - 1.7 * u} L${p.x + 0.6 * u} ${p.y} Z`} fill={colors.stationNarrative} />
                <Path d={`M${p.x + 0.9 * u} ${p.y} L${p.x + 0.9 * u} ${p.y - 2.4 * u} q${0.4 * u} 0 ${0.4 * u} ${0.4 * u}`} stroke={colors.mapInk} strokeWidth={k} fill="none" />
                {[1.8, 2.8, 2.3].map((o, j) => <Ellipse key={j} cx={p.x + o * u} cy={p.y - (j === 2 ? 0.9 : 0.3) * u} rx={0.5 * u} ry={0.35 * u} fill={colors.surface} stroke={colors.mapInk} strokeWidth={sw(0.6)} />)}
              </G>
            );
          case "camel":
            return (
              <G key={i}>
                <Path d={`M${p.x - 1.4 * u} ${p.y - 1 * u} q${0.4 * u} ${-1.2 * u} ${0.9 * u} 0 q${0.4 * u} ${-1 * u} ${0.9 * u} 0 l${0.5 * u} ${-0.7 * u} l${0.3 * u} ${0.3 * u} l${-0.4 * u} ${0.8 * u} Z`} fill={colors.brandPrimary} stroke={colors.mapInk} strokeWidth={sw(0.6)} />
                {[-1.2, -0.7, 0.1, 0.5].map((o) => <Rect key={o} x={p.x + o * u} y={p.y - 1 * u} width={0.18 * u} height={u} fill={colors.mapInk} />)}
              </G>
            );
          case "boat":
            return (
              <G key={i}>
                <Path d={`M${p.x - 1.3 * u} ${p.y} L${p.x + 1.3 * u} ${p.y} L${p.x + 0.9 * u} ${p.y + 0.5 * u} L${p.x - 0.9 * u} ${p.y + 0.5 * u} Z`} fill={colors.mapInk} opacity={0.8} />
                <Path d={`M${p.x} ${p.y} L${p.x} ${p.y - 2 * u} L${p.x + 1.1 * u} ${p.y - 0.3 * u} Z`} fill={colors.surface} stroke={colors.mapInk} strokeWidth={sw(0.6)} />
              </G>
            );
        }
        return null;
      })}
    </G>
  );
}
