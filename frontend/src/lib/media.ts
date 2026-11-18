import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { storage } from "@/src/utils/storage";

/** Eigene Audio-/Videodateien: werden in den App-Speicher kopiert und spielen danach offline. */
export type MediaItem = { id: string; title: string; kind: "audio" | "video"; uri: string; createdAt: string };

const KEY = "biblia_media_v1";
let items: MediaItem[] = [];
let loaded = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

async function ensure() {
  if (loaded) return;
  loaded = true;
  const raw = await storage.getItem(KEY, null as string | null);
  // Im Web-Vorschaumodus sind kopierte Dateien nur für diese Sitzung gültig
  if (typeof raw === "string" && Platform.OS !== "web") items = JSON.parse(raw);
  emit();
}
function save(next: MediaItem[]) {
  items = next;
  emit();
  storage.setItem(KEY, JSON.stringify(next));
}

export function useMedia(): MediaItem[] {
  ensure();
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => items, () => items);
}

const isVideo = (name: string, mime?: string | null) => (mime ? mime.startsWith("video") : /\.(mp4|m4v|mov)$/i.test(name));

export async function importMedia(): Promise<number> {
  const res = await DocumentPicker.getDocumentAsync({ type: ["audio/*", "video/*"], multiple: true, copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return 0;
  const added: MediaItem[] = [];
  for (const a of res.assets) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let uri = a.uri;
    if (Platform.OS !== "web") {
      const dir = new Directory(Paths.document, "media");
      if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
      const ext = a.name.includes(".") ? a.name.slice(a.name.lastIndexOf(".")) : "";
      const dest = new File(dir, `${id}${ext}`);
      const tmp = new File(a.uri);
      tmp.copy(dest);
      try { tmp.delete(); } catch { /* Zwischenkopie bleibt bis zur Systembereinigung */ }
      uri = dest.uri;
    }
    added.push({ id, title: a.name.replace(/\.[^.]+$/, ""), kind: isVideo(a.name, a.mimeType) ? "video" : "audio", uri, createdAt: new Date().toISOString() });
  }
  save([...added, ...items]);
  return added.length;
}

export function removeMedia(id: string) {
  const it = items.find((x) => x.id === id);
  if (it && Platform.OS !== "web" && it.uri.startsWith("file:")) {
    try { const f = new File(it.uri); if (f.exists) f.delete(); } catch { /* bereits entfernt */ }
  }
  save(items.filter((x) => x.id !== id));
}
