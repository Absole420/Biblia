// Hilfsfunktionen für organische, "handgemalte" SVG-Formen.

/** Deterministischer Pseudozufall. */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Organischer Blob als geschlossener, geglätteter Pfad. */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, points = 10, wobble = 0.22) {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const k = 1 - wobble / 2 + r() * wobble;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts);
}

export function smoothClosed(pts: [number, number][]) {
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + " Z";
}

export function smoothOpen(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  const l = pts[pts.length - 1];
  return d + ` L${l[0].toFixed(1)} ${l[1].toFixed(1)}`;
}

/** Geschwungene Verbindung zwischen zwei Punkten. */
export function curve(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.25) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return `M${a.x} ${a.y} Q${mx - dy * bend} ${my + dx * bend} ${b.x} ${b.y}`;
}

export function mountain(x: number, y: number, w: number, h: number) {
  return {
    body: `M${x - w / 2} ${y} Q${x - w / 4} ${y - h * 0.55} ${x} ${y - h} Q${x + w / 5} ${y - h * 0.6} ${x + w / 2} ${y} Z`,
    shade: `M${x} ${y - h} Q${x + w / 5} ${y - h * 0.6} ${x + w / 2} ${y} L${x + w * 0.08} ${y} Q${x + w * 0.1} ${y - h * 0.5} ${x} ${y - h} Z`,
    snow: `M${x - w * 0.09} ${y - h * 0.78} Q${x - w * 0.03} ${y - h * 0.97} ${x} ${y - h} Q${x + w * 0.06} ${y - h * 0.9} ${x + w * 0.1} ${y - h * 0.78} Q${x + w * 0.02} ${y - h * 0.84} ${x - w * 0.09} ${y - h * 0.78} Z`,
  };
}
