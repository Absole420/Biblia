import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { exportTextFile, pickTextFile } from "./backup";
import { AppState, buildExport, parseImport } from "./progress-logic";
import { way, WayData } from "./way";

/**
 * Vollständige Datensicherung (Permanent Offline Edition): Lernstand, Gebetsheft, Notizen, Tagebuch
 * „Mein geistlicher Weg“, Tagesvers-Verlauf, und alle eigenen Fotos (als Base64 eingebettet).
 * Bewusst ohne Passwort (Nutzerentscheidung) – die Datei ist lesbar, sie muss daher sicher aufbewahrt werden.
 * Eigene MP3/MP4-Dateien werden wegen ihrer Größe nicht gesichert.
 */
const KIND = "biblia-vollsicherung";
// Medienliste ausgenommen: die Dateien selbst sind nicht in der Sicherung enthalten
const SKIP = (k: string) => k === "biblia_state" || k === "biblia_media_v1" || k.startsWith("biblia_guardian_") || k === "biblia_way_v1" || k.startsWith("study-content:") || k.startsWith("bible_elb_");

type Backup = { app: "BIBLIA"; kind: typeof KIND; version: 1; exportedAt: string; state: string; way: WayData; keys: Record<string, string>; photos: Record<string, string> };

const fileName = (uri: string) => uri.split("/").pop() ?? uri;

export async function exportFullBackup(state: AppState): Promise<string> {
  const photos: Record<string, string> = {};
  if (Platform.OS !== "web") {
    for (const ph of state.photos) {
      if (!ph.uri.startsWith("file:")) continue;
      try {
        const f = new File(ph.uri);
        if (f.exists) photos[fileName(ph.uri)] = await f.base64();
      } catch { /* Foto fehlt – wird übersprungen */ }
    }
  }
  const keys: Record<string, string> = {};
  const all = (await AsyncStorage.getAllKeys()).filter((k) => !SKIP(k));
  for (const [k, v] of await AsyncStorage.multiGet(all)) if (v !== null) keys[k] = v;
  await way.ensureLoaded();
  const b: Backup = { app: "BIBLIA", kind: KIND, version: 1, exportedAt: new Date().toISOString(), state: buildExport(state), way: way.get(), keys, photos };
  const n = Object.keys(photos).length;
  await exportTextFile(`biblia-vollsicherung-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b), "application/json", "BIBLIA vollständig sichern");
  return `Vollsicherung erstellt (${state.photos.length} Fotos${Platform.OS !== "web" ? `, ${n} Bilddateien eingebettet` : ""}).`;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type RestoreResult = { ok: true; state: AppState; photos: number; entries: number } | { ok: false; error: string };

/** Datei wählen, prüfen und alle Daten (inkl. Fotos) auf diesem Gerät wiederherstellen. */
export async function pickAndRestoreFullBackup(): Promise<RestoreResult | null> {
  const text = await pickTextFile();
  if (text === null) return null;
  let b: Backup;
  try {
    b = JSON.parse(text);
  } catch {
    return { ok: false, error: "Die Datei konnte nicht gelesen werden." };
  }
  if (b?.kind !== KIND || typeof b.state !== "string") return { ok: false, error: "Diese Datei ist keine BIBLIA-Vollsicherung." };
  const parsed = parseImport(b.state);
  if (!parsed.ok) return parsed;
  let state = parsed.state;
  // Fotos in den App-Speicher dieses Geräts schreiben und Pfade anpassen
  if (Platform.OS !== "web" && b.photos) {
    const dir = new Directory(Paths.document, "photos");
    if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
    const moved: Record<string, string> = {};
    for (const [name, data] of Object.entries(b.photos)) {
      const f = new File(dir, name);
      if (f.exists) f.delete();
      f.create();
      f.write(b64ToBytes(data));
      moved[name] = f.uri;
    }
    state = { ...state, photos: state.photos.map((p) => (moved[fileName(p.uri)] ? { ...p, uri: moved[fileName(p.uri)] } : p)) };
  }
  const pairs = Object.entries(b.keys ?? {}).filter(([k]) => !SKIP(k));
  if (pairs.length) await AsyncStorage.multiSet(pairs);
  if (b.way) way.restore(b.way, "replace");
  return { ok: true, state, photos: Object.keys(b.photos ?? {}).length, entries: b.way?.entries?.length ?? 0 };
}
