export type Scripture = { id: string; book: string; ch: number; v: number; ref: string; text: string };
export type DailyState = { day: string; id: string; remaining: string[] };
export type DailyResult = { verse: Scripture; newDay: boolean; state: DailyState };

// Use the device's local calendar rather than UTC.
export function localDay(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function selectDaily(pool: readonly Scripture[], raw: unknown, day: string, random = Math.random): DailyResult {
  if (!pool.length) throw new Error("Daily scripture pool is empty");
  const byId = new Map(pool.map(v => [v.id, v]));
  const old = raw && typeof raw === "object" ? raw as Partial<DailyState> : null;
  const current = typeof old?.id === "string" ? byId.get(old.id) : undefined;
  const valid = current && typeof old?.day === "string" && Array.isArray(old.remaining);
  let remaining = valid ? Array.from(new Set(old!.remaining!.filter(id => typeof id === "string" && byId.has(id) && id !== current!.id))) : [];
  if (valid && old!.day === day) {
    return { verse: current!, newDay: false, state: { day, id: current!.id, remaining } };
  }
  if (!remaining.length) remaining = [...byId.keys()];
  const eligible = remaining.length > 1 && current ? remaining.filter(id => id !== current.id) : remaining;
  const chosen = eligible[Math.min(eligible.length - 1, Math.max(0, Math.floor(random() * eligible.length)))];
  return { verse: byId.get(chosen)!, newDay: true, state: { day, id: chosen, remaining: remaining.filter(id => id !== chosen) } };
}

export function fallbackDaily(pool: readonly Scripture[], day: string): DailyResult {
  let hash = 2166136261;
  for (const c of day) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return selectDaily(pool, null, day, () => (hash >>> 0) / 4294967296);
}
