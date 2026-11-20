import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/** Optionale monatliche Erinnerung an eine externe Vollsicherung (nur lokal, keine Mitteilungen). */
const KEY = "biblia_backup_reminder";
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
type Reminder = { enabled: boolean; lastExport: number | null; snoozedUntil?: number };
let data: Reminder = { enabled: false, lastExport: null };
const subs = new Set<(r: Reminder) => void>();

async function persist(next: Reminder) {
  data = next;
  subs.forEach((f) => f(next));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

const loaded = AsyncStorage.getItem(KEY).then((raw) => {
  try { if (raw) data = { ...data, ...JSON.parse(raw) }; } catch { /* Standardwerte behalten */ }
  subs.forEach((f) => f(data));
}).catch(() => {});

export function useBackupReminder() {
  const [r, setR] = useState(data);
  useEffect(() => { subs.add(setR); loaded.then(() => setR(data)); return () => { subs.delete(setR); }; }, []);
  const [now] = useState(() => Date.now());
  const due = r.enabled && (r.lastExport === null || now - r.lastExport > MONTH_MS) && (r.snoozedUntil ?? 0) < now;
  return {
    ...r,
    due,
    setEnabled: (enabled: boolean) => persist({ ...data, enabled }),
    snooze: () => persist({ ...data, snoozedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
  };
}

export function markFullBackupExported() {
  return persist({ ...data, lastExport: Date.now(), snoozedUntil: undefined });
}
