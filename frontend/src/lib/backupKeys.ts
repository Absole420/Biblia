/**
 * Unterstütztes Schema der Zusatz-Speicherschlüssel in einer Vollsicherung.
 * Unbekannte oder ungültige Schlüssel werden beim Wiederherstellen übersprungen (ältere Sicherungen bleiben lesbar).
 */
const MAX_LEN = 1_000_000;
const isJsonObject = (v: string) => { try { const x = JSON.parse(v); return !!x && typeof x === "object" && !Array.isArray(x); } catch { return false; } };

export const BACKUP_KEY_SCHEMA: Record<string, (v: string) => boolean> = {
  "biblia.introJourney.done": (v) => v === "1",
  "biblia.introJourney.pos": (v) => /^-?\d{1,4}$/.test(v),
  "biblia.cinematic.seen": (v) => v === "1",
  "biblia_backup_reminder": isJsonObject,
  "biblia.dailyScripture.v1": isJsonObject,
  // Älterer Schlüssel des Tagebuchs (aus früheren Sicherungen) – nur als kurzer Text zulässig
  "biblia_way_key": (v) => /^[A-Za-z0-9+/=_-]{1,512}$/.test(v),
};

export function validBackupKeys(keys: unknown): [string, string][] {
  if (!keys || typeof keys !== "object" || Array.isArray(keys)) return [];
  return Object.entries(keys as Record<string, unknown>).filter(
    (p): p is [string, string] => typeof p[1] === "string" && p[1].length <= MAX_LEN && !!BACKUP_KEY_SCHEMA[p[0]]?.(p[1]),
  );
}
