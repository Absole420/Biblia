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

// ---------------------------------------------------------------------------
// Beschriftungslayout für Karten mit festen Markern (historische Orte).
// Marker bleiben exakt an ihren Koordinaten; verschoben werden nur Beschriftungen.
// Alle Werte im „Layoutraum“ = Bildschirmpixel der aktuellen Zoomstufe.

export type LabelItem = {
  id: string;
  x: number;
  y: number;
  r: number; // Marker-Radius inkl. Antippfläche
  w: number; // Beschriftungsbreite
  h: number; // Beschriftungshöhe
  priority: number; // höher = zuerst platziert, nie gruppiert
  pinned?: boolean; // ausgewählt / lektionsrelevant: wird nicht in Gruppen aufgenommen
};
export type LabelPlaced = {
  head: boolean; // Marker sichtbar (eigenständig oder als Gruppenkopf)
  members: string[]; // ids der zusammengefassten Orte (inkl. Kopf)
  label: { dx: number; dy: number; slot: number } | null; // null = Beschriftung ausgeblendet
};

const inter = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inside = (a: Rect, b: Rect) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;

/** 8 nahe Positionen direkt am Marker, danach 8 entfernte (mit Verbindungslinie). */
export function labelSlots(r: number, w: number, h: number, g: number): [number, number][] {
  const out: [number, number][] = [];
  for (const far of [0, h * 1.5 + 8]) {
    const d = r + g + far;
    const dd = (r + far) * 0.72 + g;
    out.push(
      [d, -h / 2], [-d - w, -h / 2], [-w / 2, -d - h], [-w / 2, d],
      [dd, -dd - h], [dd, dd], [-dd - w, -dd - h], [-dd - w, dd],
    );
  }
  return out;
}
export const FAR_SLOT = 8;

export function solveLabels(
  items: LabelItem[],
  opts: { view: Rect; reserved: Rect[]; obstacles: Rect[]; prev?: Record<string, LabelPlaced>; gap: number; clusterGap: number },
): Record<string, LabelPlaced> {
  const order = [...items].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : 1));
  const out: Record<string, LabelPlaced> = {};
  // 1) Gruppieren: dicht beieinanderliegende Marker werden vom wichtigsten Ort angeführt.
  const heads: LabelItem[] = [];
  for (const it of order) {
    const h = !it.pinned && heads.find((hd) => Math.hypot(hd.x - it.x, hd.y - it.y) < hd.r + it.r + opts.clusterGap);
    if (h) out[h.id].members.push(it.id);
    else {
      heads.push(it);
      out[it.id] = { head: true, members: [it.id], label: null };
    }
    if (h) out[it.id] = { head: false, members: [], label: null };
  }
  // 2) Beschriftungen in Prioritätsreihenfolge platzieren.
  const markers = heads.map((h) => ({ id: h.id, b: { x: h.x - h.r, y: h.y - h.r, w: h.r * 2, h: h.r * 2 } }));
  const placed: Rect[] = [];
  const m = opts.gap;
  for (const it of heads) {
    const anchorIn = inside({ x: it.x, y: it.y, w: 0, h: 0 }, opts.view);
    const slots = labelSlots(it.r, it.w, it.h, opts.gap);
    const prevSlot = opts.prev?.[it.id]?.label?.slot;
    let best = -1;
    let bestCost = Infinity;
    let soft = -1;
    let softCost = Infinity;
    slots.forEach(([dx, dy], si) => {
      const r = { x: it.x + dx, y: it.y + dy, w: it.w, h: it.h };
      const rm = { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
      let hard = 0;
      if (anchorIn && !inside(r, opts.view)) hard++;
      for (const p of placed) if (inter(rm, p)) hard++;
      for (const mk of markers) if (mk.id !== it.id && inter(r, mk.b)) hard++;
      for (const o of opts.reserved) if (inter(r, o)) hard++;
      let obstacleArea = 0;
      for (const o of opts.obstacles) {
        const area = inter(r, o) ? Math.max(0, Math.min(r.x + r.w, o.x + o.w) - Math.max(r.x, o.x)) * Math.max(0, Math.min(r.y + r.h, o.y + o.h) - Math.max(r.y, o.y)) : 0;
        if (area > 0) hard++;
        obstacleArea += area;
      }
      let cost = si * 1 + (si >= FAR_SLOT ? 6 : 0) + obstacleArea * 0.6;
      if (si === prevSlot) cost -= 5; // Hysterese gegen Springen
      if (hard === 0 && cost < bestCost) { bestCost = cost; best = si; }
      const sc = cost + hard * 100;
      if (sc < softCost) { softCost = sc; soft = si; }
    });
    const pick = best >= 0 ? best : it.pinned ? soft : -1;
    if (pick >= 0) {
      const [dx, dy] = slots[pick];
      out[it.id].label = { dx, dy, slot: pick };
      placed.push({ x: it.x + dx, y: it.y + dy, w: it.w, h: it.h });
    }
  }
  return out;
}

/** Grobe Textbreite für Kollisionsboxen (fette Schrift). */
export const textWidth = (text: string, fontSize: number) => text.length * fontSize * 0.62;
