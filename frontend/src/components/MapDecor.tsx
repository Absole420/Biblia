import React from "react";
import { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

import { projectGeo, ThemeMap } from "@/src/data/themeMaps";
import { ThemeColors } from "@/src/theme";

import { blob, mountain } from "./mapShapes";

// Illustrative Landschaftsdetails (lat/lon). Rein dekorativ – keine Ortsangaben.
type Deco = { k: "desert" | "green" | "mount" | "palm" | "olive" | "shepherd" | "camel" | "boat" | "houses"; lat: number; lon: number; s?: number };

const DECO: Deco[] = [
  // Wüsten
  ...[[30.6, 34.8, 1.4], [29.4, 33.7, 2.2], [30.3, 38.5, 4], [31.5, 35.3, 0.6], [27.5, 31.0, 3], [33.0, 40.0, 3.5], [31.0, 36.6, 1.6]].map(([lat, lon, s]) => ({ k: "desert" as const, lat, lon, s })),
  // Fruchtbares Land / Gärten
  ...[[32.8, 35.35, 0.55], [32.6, 35.25, 0.35], [31.0, 31.0, 1.4], [33.4, 44.2, 1.6], [35.6, 41.5, 1.4], [32.1, 34.85, 0.35], [33.2, 35.6, 0.3], [32.4, 35.75, 0.4], [38.0, 28.0, 1.5], [41.5, 13.2, 1.2]].map(([lat, lon, s]) => ({ k: "green" as const, lat, lon, s })),
  // Gebirge
  ...[[33.42, 35.86, 1.2], [28.55, 33.97, 1.1], [32.73, 35.05, 0.6], [31.65, 35.12, 0.7], [32.2, 35.27, 0.6], [32.69, 35.39, 0.5], [37.4, 33.0, 2], [37.8, 37.5, 2], [36.8, 44.3, 1.8], [30.4, 35.5, 0.8], [33.8, 35.9, 1]].map(([lat, lon, s]) => ({ k: "mount" as const, lat, lon, s })),
  // Palmen & Ölbäume
  ...[[31.87, 35.46], [31.46, 35.4], [30.5, 31.3], [29.3, 32.85], [30.63, 34.45], [32.5, 44.4]].map(([lat, lon]) => ({ k: "palm" as const, lat, lon })),
  ...[[31.78, 35.26], [32.9, 35.4], [32.3, 35.15], [31.95, 35.2], [33.05, 35.3]].map(([lat, lon]) => ({ k: "olive" as const, lat, lon })),
  // Figuren
  { k: "shepherd", lat: 31.68, lon: 35.25 }, { k: "shepherd", lat: 32.45, lon: 35.75 }, { k: "camel", lat: 30.2, lon: 34.6 }, { k: "camel", lat: 29.8, lon: 33.3 }, { k: "camel", lat: 32.5, lon: 38.5 },
  { k: "boat", lat: 32.82, lon: 35.59 }, { k: "boat", lat: 32.6, lon: 34.6 }, { k: "boat", lat: 35.0, lon: 25.0 }, { k: "boat", lat: 37.2, lon: 26.0 }, { k: "boat", lat: 31.9, lon: 33.6 },
  // Städte (Häuser mit Flachdach)
  ...[[31.778, 35.235], [32.276, 35.197], [32.5, 34.89], [32.536, 44.421], [36.359, 43.153], [30.8, 31.83], [36.2, 36.16], [37.94, 27.34], [41.9, 12.5], [33.513, 36.292]].map(([lat, lon]) => ({ k: "houses" as const, lat, lon })),
];

const visibleDeco = (map: ThemeMap) => {
  const { latMin, latMax, lonMin, lonMax } = map.bounds;
  return DECO.map((d, i) => [d, i] as const).filter(([d]) => {
    const pad = (d.s ?? 0) + 0.5;
    return d.lat > latMin - pad && d.lat < latMax + pad && d.lon > lonMin - pad && d.lon < lonMax + pad;
  });
};

// Umriss der Figuren (Mittelpunkt dx/dy und Radius in Figureneinheiten), für die Kollisionsprüfung.
const FIG_BOX: Partial<Record<Deco["k"], [number, number, number]>> = {
  shepherd: [1.3, -1.2, 2.0], camel: [-0.3, -1.1, 1.5], boat: [0, -0.7, 1.4], palm: [0, -1.5, 1.4], olive: [0, -1.0, 0.9],
};

/** Bewegliche Kartensymbole (Figuren, Bäume, Boote) mit Kollisionskreis in Kartenpixeln. */
export function decoFigures(map: ThemeMap, k: number) {
  const u = 10 * k;
  return visibleDeco(map).flatMap(([d, i]) => {
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

export function MapDecor({ map, k, colors, shift }: { map: ThemeMap; k: number; colors: ThemeColors; shift?: Record<string, { dx: number; dy: number }> }) {
  const deg = map.pxPerDeg;
  const P = (lat: number, lon: number) => projectGeo(map, lat, lon);
  const u = 10 * k; // Grundgröße der Figuren
  return (
    <G>
      {ROADS.map((r, i) => {
        const d = r.map(([la, lo], j) => { const p = P(la, lo); return `${j ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join("");
        return <Path key={"r" + i} d={d} stroke={colors.mapMountain} strokeWidth={3 * k} strokeDasharray={`${2 * k} ${5 * k}`} strokeLinecap="round" fill="none" />;
      })}
      {visibleDeco(map).map(([d, i]) => {
        const p0 = P(d.lat, d.lon);
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
                  <Path key={j} d={`M${p.x + o * r - 2.2 * u} ${p.y + (j - 1) * r * 0.3} q${2.2 * u} ${-1.4 * u} ${4.4 * u} 0`} stroke={colors.mapMountain} strokeWidth={2 * k} fill="none" strokeLinecap="round" />
                ))}
              </G>
            );
          }
          case "green": {
            const r = s * deg * 0.5;
            return <Path key={i} d={blob(p.x, p.y, r, r * 0.75, 41 + i, 10, 0.3)} fill={colors.mapForest} fillOpacity={0.4} />;
          }
          case "mount": {
            const w = Math.max(3 * u, s * deg * 0.35);
            const m = mountain(p.x, p.y + w * 0.3, w, w * 0.7);
            return (
              <G key={i}>
                <Path d={m.body} fill={colors.mapMountain} stroke={colors.mapInk} strokeOpacity={0.4} strokeWidth={1.2 * k} />
                <Path d={m.shade} fill={colors.mapInk} fillOpacity={0.15} />
                <Path d={m.snow} fill={colors.surface} fillOpacity={0.85} />
              </G>
            );
          }
          case "palm":
            return (
              <G key={i}>
                <Path d={`M${p.x} ${p.y} q${0.3 * u} ${-1 * u} 0 ${-2 * u}`} stroke={colors.mapInk} strokeWidth={1.4 * k} fill="none" />
                {[-1, -0.4, 0.4, 1].map((a) => (
                  <Path key={a} d={`M${p.x} ${p.y - 2 * u} q${a * 0.6 * u} ${-0.6 * u} ${a * 1.3 * u} ${0.2 * u}`} stroke={colors.success} strokeWidth={1.6 * k} fill="none" strokeLinecap="round" />
                ))}
              </G>
            );
          case "olive":
            return (
              <G key={i}>
                <Rect x={p.x - 0.15 * u} y={p.y - 0.6 * u} width={0.3 * u} height={0.8 * u} fill={colors.mapInk} opacity={0.6} />
                <Circle cx={p.x} cy={p.y - 1.1 * u} r={0.75 * u} fill={colors.mapForest} stroke={colors.mapInk} strokeOpacity={0.4} strokeWidth={k} />
              </G>
            );
          case "shepherd":
            return (
              <G key={i}>
                <Circle cx={p.x} cy={p.y - 2.1 * u} r={0.45 * u} fill={colors.stationNarrative} />
                <Path d={`M${p.x - 0.6 * u} ${p.y} L${p.x} ${p.y - 1.7 * u} L${p.x + 0.6 * u} ${p.y} Z`} fill={colors.stationNarrative} />
                <Path d={`M${p.x + 0.9 * u} ${p.y} L${p.x + 0.9 * u} ${p.y - 2.4 * u} q${0.4 * u} 0 ${0.4 * u} ${0.4 * u}`} stroke={colors.mapInk} strokeWidth={k} fill="none" />
                {[1.8, 2.8, 2.3].map((o, j) => <Ellipse key={j} cx={p.x + o * u} cy={p.y - (j === 2 ? 0.9 : 0.3) * u} rx={0.5 * u} ry={0.35 * u} fill={colors.surface} stroke={colors.mapInk} strokeWidth={0.6 * k} />)}
              </G>
            );
          case "camel":
            return (
              <G key={i}>
                <Path d={`M${p.x - 1.4 * u} ${p.y - 1 * u} q${0.4 * u} ${-1.2 * u} ${0.9 * u} 0 q${0.4 * u} ${-1 * u} ${0.9 * u} 0 l${0.5 * u} ${-0.7 * u} l${0.3 * u} ${0.3 * u} l${-0.4 * u} ${0.8 * u} Z`} fill={colors.brandPrimary} stroke={colors.mapInk} strokeWidth={0.6 * k} />
                {[-1.2, -0.7, 0.1, 0.5].map((o) => <Rect key={o} x={p.x + o * u} y={p.y - 1 * u} width={0.18 * u} height={u} fill={colors.mapInk} />)}
              </G>
            );
          case "boat":
            return (
              <G key={i}>
                <Path d={`M${p.x - 1.3 * u} ${p.y} L${p.x + 1.3 * u} ${p.y} L${p.x + 0.9 * u} ${p.y + 0.5 * u} L${p.x - 0.9 * u} ${p.y + 0.5 * u} Z`} fill={colors.mapInk} opacity={0.8} />
                <Path d={`M${p.x} ${p.y} L${p.x} ${p.y - 2 * u} L${p.x + 1.1 * u} ${p.y - 0.3 * u} Z`} fill={colors.surface} stroke={colors.mapInk} strokeWidth={0.6 * k} />
              </G>
            );
          case "houses":
            return (
              <G key={i}>
                {[[-1.6, 0.2, 1.1], [-0.4, -0.3, 1.4], [0.9, 0.1, 1]].map(([dx, dy, h], j) => (
                  <Rect key={j} x={p.x + dx * u} y={p.y + (dy - h) * u + 1.2 * u} width={1.1 * u} height={h * u} fill={colors.surfaceTertiary} stroke={colors.mapInk} strokeWidth={0.6 * k} />
                ))}
              </G>
            );
        }
        return null;
      })}
    </G>
  );
}
