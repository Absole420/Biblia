import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { exportTextFile, pickTextFile } from "./backup";
import { validBackupKeys } from "./backupKeys";
import { markFullBackupExported } from "./backupReminder";
import { listMedia, MediaItem, mergeRestoredMedia, setMediaItems } from "./media";
import { AppState, buildExport, parseImport } from "./progress-logic";
import { way, WayData } from "./way";

/**
 * Vollständige Datensicherung (Permanent Offline Edition): Lernstand, Gebetsheft, Notizen, Tagebuch
 * „Mein geistlicher Weg“, Tagesvers-Verlauf, eigene Fotos und – bis zu einer Gesamtgröße von 60 MB –
 * eigene MP3/MP4-Dateien (alles als Base64 eingebettet).
 * Bewusst ohne Passwort (Nutzerentscheidung) – die Datei ist lesbar, sie muss daher sicher aufbewahrt werden.
 * Wiederherstellung: erst vollständig prüfen und in einen Zwischenordner schreiben, dann übernehmen;
 * bei einem Fehler wird der vorherige Zustand (Einstellungen, Tagebuch, Fotos, Medien) zurückgesetzt.
 */
const KIND = "biblia-vollsicherung";
const MEDIA_LIMIT = 60 * 1024 * 1024; // Rohgröße aller eingebetteten Mediendateien
const FILE_LIMIT_B64 = 90 * 1024 * 1024;
// Medienliste ausgenommen: sie wird separat (mit den Dateien) gesichert
const SKIP = (k: string) => k === "biblia_state" || k === "biblia_media_v1" || k.startsWith("biblia_guardian_") || k === "biblia_way_v1" || k.startsWith("study-content:") || k.startsWith("bible_elb_");

type MediaBackup = { items: MediaItem[]; files: Record<string, string>; skipped: number };
type Backup = { app: "BIBLIA"; kind: typeof KIND; version: 1; exportedAt: string; state: string; way: WayData; keys: Record<string, string>; photos: Record<string, string>; media?: MediaBackup };

const fileName = (uri: string) => uri.split("/").pop() ?? uri;
const safeName = (n: string) => /^[A-Za-z0-9._-]{1,120}$/.test(n) && !n.startsWith(".");
const isB64 = (s: unknown): s is string => typeof s === "string" && s.length <= FILE_LIMIT_B64 && s.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(s);
const b64Bytes = (s: string) => (s.length / 4) * 3 - (s.endsWith("==") ? 2 : s.endsWith("=") ? 1 : 0);
const isObj = (v: unknown): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray(v);

export async function exportFullBackup(state: AppState): Promise<string> {
  const photos: Record<string, string> = {};
  const media: MediaBackup = { items: [], files: {}, skipped: 0 };
  if (Platform.OS !== "web") {
    for (const ph of state.photos) {
      if (!ph.uri.startsWith("file:")) continue;
      try {
        const f = new File(ph.uri);
        if (f.exists) photos[fileName(ph.uri)] = await f.base64();
      } catch { /* Foto fehlt – wird übersprungen */ }
    }
    let total = 0;
    for (const m of await listMedia()) {
      try {
        const f = new File(m.uri);
        const size = f.exists ? f.size ?? 0 : 0;
        if (!f.exists || total + size > MEDIA_LIMIT) { media.skipped++; continue; }
        media.files[fileName(m.uri)] = await f.base64();
        media.items.push(m);
        total += size;
      } catch { media.skipped++; }
    }
  }
  const keys: Record<string, string> = {};
  const all = (await AsyncStorage.getAllKeys()).filter((k) => !SKIP(k));
  for (const [k, v] of await AsyncStorage.multiGet(all)) if (v !== null) keys[k] = v;
  await way.ensureLoaded();
  const b: Backup = { app: "BIBLIA", kind: KIND, version: 1, exportedAt: new Date().toISOString(), state: buildExport(state), way: way.get(), keys, photos, media };
  const n = Object.keys(photos).length;
  await exportTextFile(`biblia-vollsicherung-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b), "application/json", "BIBLIA vollständig sichern");
  await markFullBackupExported();
  if (Platform.OS === "web") return `Vollsicherung erstellt (${state.photos.length} Fotos).`;
  return `Vollsicherung erstellt (${n} Bilddateien, ${media.items.length} Mediendateien eingebettet${media.skipped ? `, ${media.skipped} Medien zu groß oder nicht lesbar – bitte separat aufbewahren` : ""}).`;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function validWay(w: unknown): w is WayData {
  return isObj(w) && Array.isArray(w.entries) && w.entries.every((e: unknown) => isObj(e) && typeof e.id === "string" && typeof e.date === "string");
}
function validMediaItem(m: unknown): m is MediaItem {
  return isObj(m) && typeof m.id === "string" && typeof m.title === "string" && (m.kind === "audio" || m.kind === "video") && typeof m.uri === "string" && typeof m.createdAt === "string";
}

export type RestoreResult =
  | { ok: true; state: AppState; photos: number; media: number; entries: number; rollback: () => Promise<void>; commit: () => Promise<void> }
  | { ok: false; error: string };

type Moved = { dest: File; backup: File | null };

/** Datei wählen, vollständig prüfen und alle Daten (inkl. Fotos und Medien) auf diesem Gerät wiederherstellen. */
export async function pickAndRestoreFullBackup(): Promise<RestoreResult | null> {
  const text = await pickTextFile();
  if (text === null) return null;
  let b: Backup;
  try {
    b = JSON.parse(text);
  } catch {
    return { ok: false, error: "Die Datei konnte nicht gelesen werden." };
  }
  // ---------- 1. Prüfen (noch nichts verändert) ----------
  if (!isObj(b) || b.kind !== KIND || typeof b.state !== "string") return { ok: false, error: "Diese Datei ist keine BIBLIA-Vollsicherung." };
  const parsed = parseImport(b.state);
  if (!parsed.ok) return parsed;
  if (b.way !== undefined && !validWay(b.way)) return { ok: false, error: "Das Tagebuch in der Sicherung ist beschädigt. Es wurde nichts verändert." };
  const photoFiles = Object.entries(isObj(b.photos) ? b.photos : {}).filter(([n]) => safeName(n));
  const mediaIn = isObj(b.media) ? b.media : null; // ältere Sicherungen ohne Medien bleiben gültig
  const mediaItems = mediaIn && Array.isArray(mediaIn.items) ? mediaIn.items.filter(validMediaItem) : [];
  const mediaFiles = Object.entries(mediaIn && isObj(mediaIn.files) ? mediaIn.files : {}).filter(([n]) => safeName(n));
  if ([...photoFiles, ...mediaFiles].some(([, d]) => !isB64(d))) return { ok: false, error: "Eine Bild- oder Mediendatei in der Sicherung ist beschädigt. Es wurde nichts verändert." };
  const pairs = validBackupKeys(b.keys).filter(([k]) => !SKIP(k));
  let state = parsed.state;
  const native = Platform.OS !== "web";
  if (native) {
    const need = [...photoFiles, ...mediaFiles].reduce((s, [, d]) => s + b64Bytes(d), 0) * 2; // Zwischenkopie + Reserve
    const free = Paths.availableDiskSpace;
    if (typeof free === "number" && free > 0 && free < need) return { ok: false, error: "Nicht genug freier Speicher für die Wiederherstellung. Es wurde nichts verändert." };
  }

  // ---------- 2. Vorherigen Zustand merken ----------
  await way.ensureLoaded();
  const prevWay = JSON.parse(JSON.stringify(way.get())) as WayData;
  const prevKeys = await AsyncStorage.multiGet(pairs.map(([k]) => k));
  const prevMedia = native ? [...(await listMedia())] : [];
  const moved: Moved[] = [];
  let stage: Directory | null = null;
  let undoDir: Directory | null = null;

  const rollback = async () => {
    for (const m of moved.reverse()) {
      try {
        if (m.dest.exists) m.dest.delete();
        if (m.backup?.exists) await m.backup.move(m.dest);
      } catch { /* bestmöglich zurücksetzen */ }
    }
    try {
      const restoreKeys = prevKeys.filter(([, v]) => v !== null) as [string, string][];
      const removeKeys = prevKeys.filter(([, v]) => v === null).map(([k]) => k);
      if (restoreKeys.length) await AsyncStorage.multiSet(restoreKeys);
      if (removeKeys.length) await AsyncStorage.multiRemove(removeKeys);
    } catch { /* ignorieren */ }
    way.restore(prevWay, "replace");
    if (native) setMediaItems(prevMedia);
    try { if (undoDir?.exists) undoDir.delete(); } catch { /* ignorieren */ }
  };

  let restoredPhotos = native ? 0 : state.photos.length;
  let restoredMedia = 0;
  try {
    // ---------- 3. In Zwischenordner schreiben ----------
    if (native && (photoFiles.length || mediaFiles.length)) {
      stage = new Directory(Paths.document, "restore-stage");
      if (stage.exists) stage.delete();
      stage.create({ idempotent: true, intermediates: true });
      undoDir = new Directory(Paths.document, "restore-undo");
      if (undoDir.exists) undoDir.delete();
      undoDir.create({ idempotent: true, intermediates: true });
      for (const [kind, list] of [["photos", photoFiles], ["media", mediaFiles]] as const) {
        for (const [name, data] of list) {
          const f = new File(stage, `${kind}-${name}`);
          f.create();
          f.write(b64ToBytes(data));
          if (f.size !== b64Bytes(data)) throw new Error("write-size");
        }
      }
      // ---------- 4. Übernehmen (vorhandene Dateien werden zur Rücknahme aufbewahrt) ----------
      const uris: Record<string, string> = {};
      for (const [kind, list] of [["photos", photoFiles], ["media", mediaFiles]] as const) {
        const dir = new Directory(Paths.document, kind);
        if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
        for (const [name] of list) {
          const dest = new File(dir, name);
          let backup: File | null = null;
          if (dest.exists) { backup = new File(undoDir, `${kind}-${name}`); await dest.move(backup); }
          const staged = new File(stage, `${kind}-${name}`);
          moved.push({ dest: new File(dir, name), backup });
          await staged.move(new File(dir, name));
          uris[`${kind}/${name}`] = new File(dir, name).uri;
          if (kind === "photos") restoredPhotos++; else restoredMedia++;
        }
      }
      state = { ...state, photos: state.photos.map((p) => (uris[`photos/${fileName(p.uri)}`] ? { ...p, uri: uris[`photos/${fileName(p.uri)}`] } : p)) };
      const items = mediaItems.filter((m) => uris[`media/${fileName(m.uri)}`]).map((m) => ({ ...m, uri: uris[`media/${fileName(m.uri)}`] }));
      if (items.length) await mergeRestoredMedia(items);
    }
    if (pairs.length) await AsyncStorage.multiSet(pairs);
    if (b.way) way.restore(b.way, "replace");
  } catch {
    await rollback();
    return { ok: false, error: "Wiederherstellung fehlgeschlagen. Der vorherige Stand wurde wiederhergestellt." };
  } finally {
    try { if (stage?.exists) stage.delete(); } catch { /* ignorieren */ }
  }
  const done = async () => { try { if (undoDir?.exists) undoDir.delete(); } catch { /* ignorieren */ } };
  // Erfolgreich: Rücknahme-Dateien erst nach Übernahme des Lernstands löschen (siehe settings.tsx)
  return { ok: true, state, photos: restoredPhotos, media: restoredMedia, entries: b.way?.entries?.length ?? 0, rollback, commit: done };
}
