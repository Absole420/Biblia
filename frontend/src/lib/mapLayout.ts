// Zoomabhängige Kollisionsauflösung für Kartenmarker, Symbole und Beschriftungen.
// Die geografischen Ankerpunkte bleiben unverändert; verschoben wird nur die
// Darstellung (Marker + Beschriftung). Alle Werte in Kartenpixeln der aktuellen Zoomstufe.

export type Rect = { x: number; y: number; w: number; h: number };
export type LayoutItem = {
  id: string;
  ax: number;
  ay: number;
  size: number; // sichtbarer Markerdurchmesser
  pad?: number; // zusätzlicher Tippbereich rundum
  label?: { w: number; h: number; prefer?: "left" | "right" | "below" };
  weight?: number; // höher = bewegt sich weniger
  soft?: boolean; // dekoratives Symbol: weicht aus, verdrängt aber nichts
};
export type Placed = { x: number; y: number; lx: number; ly: number; displaced: boolean };

const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

function candidates(it: LayoutItem, g: number): [number, number][] {
  const s = it.size / 2;
  const { w, h, prefer } = it.label!;
  const d = s * 0.7;
  const right: [number, number] = [s + g, -h / 2];
  const left: [number, number] = [-s - g - w, -h / 2];
  const below: [number, number] = [-w / 2, s + g];
  const above: [number, number] = [-w / 2, -s - g - h];
  const diag: [number, number][] = [[d + g, -d - h], [d + g, d], [-d - g - w, -d - h], [-d - g - w, d]];
  if (prefer === "below") return [below, above, right, left, ...diag];
  if (prefer === "left") return [left, right, above, below, ...diag];
  return [right, left, above, below, ...diag];
}

export function solveLayout(items: LayoutItem[], obstacles: Rect[], bounds: { w: number; h: number }, gap: number): Record<string, Placed> {
  const n = items.length;
  const pos = items.map((a) => ({ x: a.ax, y: a.ay }));
  const lab: ([number, number] | null)[] = items.map(() => null);

  const markerBox = (i: number): Rect => {
    const r = items[i].size / 2 + (items[i].pad ?? 0);
    return { x: pos[i].x - r, y: pos[i].y - r, w: r * 2, h: r * 2 };
  };
  const labelBox = (i: number): Rect | null => {
    const l = lab[i];
    const L = items[i].label;
    return l && L ? { x: pos[i].x + l[0], y: pos[i].y + l[1], w: L.w, h: L.h } : null;
  };
  const outside = (r: Rect) => r.w * r.h - overlap(r, { x: 0, y: 0, w: bounds.w, h: bounds.h });

  const placeLabels = () => {
    const order = items.map((_, i) => i).filter((i) => items[i].label).sort((a, b) => (items[b].weight ?? 1) - (items[a].weight ?? 1));
    const markers = items.map((it, i) => (it.soft ? null : markerBox(i)));
    const placed: Rect[] = [];
    for (const i of order) {
      const L = items[i].label!;
      const area = L.w * L.h;
      let best: [number, number] = [0, 0];
      let bestCost = Infinity;
      candidates(items[i], gap).forEach((c, ci) => {
        const r = { x: pos[i].x + c[0], y: pos[i].y + c[1], w: L.w, h: L.h };
        let cost = ci * 0.04 * area + outside(r) * 4;
        markers.forEach((m, j) => { if (m && j !== i) cost += overlap(r, m) * 4; });
        placed.forEach((p) => { cost += overlap(r, p) * 4; });
        obstacles.forEach((o) => { cost += overlap(r, o) * 0.6; });
        if (cost < bestCost) { bestCost = cost; best = c; }
      });
      lab[i] = best;
      placed.push({ x: pos[i].x + best[0], y: pos[i].y + best[1], w: L.w, h: L.h });
    }
  };

  const relax = (iters: number, spring: number) => {
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const A = items[i];
          const B = items[j];
          if (A.soft && B.soft) continue;
          const ba = [markerBox(i), labelBox(i)];
          const bb = [markerBox(j), labelBox(j)];
          for (const a of ba) {
            if (!a) continue;
            for (const b of bb) {
              if (!b) continue;
              const dx = a.x + a.w / 2 - (b.x + b.w / 2);
              const dy = a.y + a.h / 2 - (b.y + b.h / 2);
              const ox = (a.w + b.w) / 2 + gap - Math.abs(dx);
              const oy = (a.h + b.h) / 2 + gap - Math.abs(dy);
              if (ox <= 0 || oy <= 0) continue;
              const wi = A.soft ? 0 : A.weight ?? 1;
              const wj = B.soft ? 0 : B.weight ?? 1;
              const mi = wj / (wi + wj);
              const mj = 1 - mi;
              // Sanft entlang der kürzeren Achse trennen; leichte Diagonale wirkt organischer.
              const alongX = ox < oy;
              const sx = dx === 0 ? (i % 2 ? 1 : -1) : Math.sign(dx);
              const sy = dy === 0 ? (j % 2 ? 1 : -1) : Math.sign(dy);
              const push = (alongX ? ox : oy) * 0.5;
              const px = alongX ? sx * push : sx * push * 0.25;
              const py = alongX ? sy * push * 0.25 : sy * push;
              pos[i].x += px * mi; pos[i].y += py * mi;
              pos[j].x -= px * mj; pos[j].y -= py * mj;
            }
          }
        }
      }
      for (let i = 0; i < n; i++) {
        const s = items[i].soft ? spring * 2 : spring;
        pos[i].x += (items[i].ax - pos[i].x) * s;
        pos[i].y += (items[i].ay - pos[i].y) * s;
        const r = items[i].size / 2;
        const l = lab[i];
        const L = items[i].label;
        const minX = Math.max(r, l && L ? -l[0] : r);
        const maxX = Math.min(bounds.w - r, l && L ? bounds.w - l[0] - L.w : bounds.w - r);
        const minY = Math.max(r, l && L ? -l[1] : r);
        const maxY = Math.min(bounds.h - r, l && L ? bounds.h - l[1] - L.h : bounds.h - r);
        if (minX <= maxX) pos[i].x = Math.min(maxX, Math.max(minX, pos[i].x));
        if (minY <= maxY) pos[i].y = Math.min(maxY, Math.max(minY, pos[i].y));
      }
    }
  };

  placeLabels();
  relax(60, 0.06);
  placeLabels();
  relax(40, 0.02);
  placeLabels();
  relax(30, 0);

  const out: Record<string, Placed> = {};
  items.forEach((it, i) => {
    const l = lab[i] ?? [0, 0];
    out[it.id] = { x: pos[i].x, y: pos[i].y, lx: l[0], ly: l[1], displaced: Math.hypot(pos[i].x - it.ax, pos[i].y - it.ay) > it.size * 0.5 };
  });
  return out;
}

/** Grobe Textbreite für Kollisionsboxen (fette Schrift). */
export const textWidth = (text: string, fontSize: number) => text.length * fontSize * 0.62;
