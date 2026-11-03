// „Mein geistlicher Weg“ – Persönliches Register (privates Tagebuch).
// Getrennt vom allgemeinen App-Zustand gespeichert, nur auf diesem Gerät,
// AES-256-GCM-verschlüsselt (Schlüssel im sicheren Geräte-Speicher).

import { aesDecryptAsync, aesEncryptAsync, AESEncryptionKey, AESSealedData } from "expo-crypto";
import { useSyncExternalStore } from "react";

import { storage } from "@/src/utils/storage";

export type EntryKind = "checkin" | "insight" | "question" | "prayer" | "step";
export const ENTRY_KINDS: { id: EntryKind; label: string; icon: string; hint: string }[] = [
  { id: "checkin", label: "Check-in", icon: "edit-3", hint: "Wie geht es mir gerade?" },
  { id: "insight", label: "Erkenntnis", icon: "zap", hint: "Was ist mir klar geworden?" },
  { id: "question", label: "Frage", icon: "help-circle", hint: "Was beschäftigt mich, ohne Antwort?" },
  { id: "prayer", label: "Gebet", icon: "feather", hint: "Was möchte ich Gott sagen?" },
  { id: "step", label: "Schritt", icon: "navigation", hint: "Was möchte ich bewusst tun?" },
];
export const KIND_BY_ID = Object.fromEntries(ENTRY_KINDS.map((k) => [k.id, k])) as Record<EntryKind, (typeof ENTRY_KINDS)[number]>;

export type WayEntry = {
  id: string;
  kind: EntryKind;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, optional */
  time?: string;
  createdAt: string;
  updatedAt: string;
  /** Wie geht es mir gerade? / Haupttext bei anderen Arten */
  mood?: string;
  feelings: string[];
  customFeelings: string[];
  /** 1–5, null = möchte ich nicht einstufen */
  intensity?: number | null;
  concern?: string;
  selfView?: string;
  goodBad?: string;
  thought?: string;
  toGod?: string;
  nextStep?: string;
  talk?: "yes" | "no" | "unsure";
  /** Verknüpfungen */
  refs: string[];
  topics: string[];
  stations: string[];
  lexicon: string[];
  note?: string;
  /** Offene Frage als beantwortet/erledigt markiert */
  resolved?: boolean;
};

export type WayData = { v: 1; entries: WayEntry[]; introSeenAt?: string };
const empty = (): WayData => ({ v: 1, entries: [] });

const DATA_KEY = "biblia_way_v1";
const KEY_KEY = "biblia_way_key";

// ---------- Verschlüsselte Speicherung ----------
let key: AESEncryptionKey | null = null;
let encrypted = false;
async function getKey(): Promise<AESEncryptionKey | null> {
  if (key) return key;
  try {
    const stored = await storage.secureGet(KEY_KEY, null as string | null);
    key = typeof stored === "string" ? await AESEncryptionKey.import(stored, "base64") : await AESEncryptionKey.generate();
    if (typeof stored !== "string") await storage.secureSet(KEY_KEY, await key.encoded("base64"));
    return key;
  } catch {
    return null; // Verschlüsselung auf diesem Gerät nicht verfügbar
  }
}

async function readData(): Promise<WayData> {
  const raw = await storage.getItem(DATA_KEY, null as string | null);
  if (typeof raw !== "string") return empty();
  // Fehler werden bewusst weitergereicht: niemals verschlüsselte Daten mit einem leeren Tagebuch überschreiben
  if (raw.startsWith("enc1:")) {
    const k = await getKey();
    if (!k) throw new Error("no key");
    const sealed = AESSealedData.fromCombined(raw.slice(5));
    const b64 = await aesDecryptAsync(sealed, k, { output: "base64" });
    return normalize(JSON.parse(b64ToUtf8(b64)));
  }
  return normalize(JSON.parse(raw.replace(/^plain:/, "")));
}

async function writeData(d: WayData) {
  if (broken) return;
  const json = JSON.stringify(d);
  const k = await getKey();
  if (k) {
    try {
      const sealed = await aesEncryptAsync(utf8ToB64(json), k);
      await storage.setItem(DATA_KEY, "enc1:" + (await sealed.combined("base64")));
      encrypted = true;
      return;
    } catch {
      /* fällt auf unverschlüsselt zurück – wird in den Einstellungen offen angezeigt */
    }
  }
  encrypted = false;
  await storage.setItem(DATA_KEY, "plain:" + json);
}

// UTF-8 <-> Base64 ohne zusätzliche Bibliotheken
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function utf8ToB64(s: string): string {
  const bytes = unescape(encodeURIComponent(s));
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes.charCodeAt(i), b = bytes.charCodeAt(i + 1), c = bytes.charCodeAt(i + 2);
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=") + (i + 2 < bytes.length ? B64[n & 63] : "=");
  }
  return out;
}
function b64ToUtf8(b64: string): string {
  let bin = "";
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) | ((B64.indexOf(clean[i + 2]) & 63) << 6) | (B64.indexOf(clean[i + 3]) & 63);
    bin += String.fromCharCode((n >> 16) & 255);
    if (clean[i + 2]) bin += String.fromCharCode((n >> 8) & 255);
    if (clean[i + 3]) bin += String.fromCharCode(n & 255);
  }
  return decodeURIComponent(escape(bin));
}

const arr = (x: unknown) => (Array.isArray(x) ? x.filter((y) => typeof y === "string") : []);
function normalize(d: any): WayData {
  const entries: WayEntry[] = Array.isArray(d?.entries)
    ? d.entries.filter((e: any) => e && typeof e.id === "string" && typeof e.date === "string").map((e: any) => ({
        ...e,
        kind: KIND_BY_ID[e.kind as EntryKind] ? e.kind : "checkin",
        feelings: arr(e.feelings), customFeelings: arr(e.customFeelings),
        refs: arr(e.refs), topics: arr(e.topics), stations: arr(e.stations), lexicon: arr(e.lexicon),
      }))
    : [];
  return { v: 1, entries, introSeenAt: typeof d?.introSeenAt === "string" ? d.introSeenAt : undefined };
}

// ---------- Kleiner Store ----------
let data: WayData = empty();
let ready = false;
/** true, wenn gespeicherte Einträge nicht gelesen werden konnten – dann wird nichts überschrieben. */
let broken = false;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
let snapshot = { data, ready, encrypted, broken };
const emit = () => { snapshot = { data, ready, encrypted, broken }; subs.forEach((f) => f()); };

function ensureLoaded() {
  if (!loading) {
    loading = readData()
      .then(async (d) => { data = d; encrypted = !!(await getKey()); if (d.entries.length) await writeData(d); })
      .catch(() => { broken = true; })
      .finally(() => { ready = true; emit(); });
  }
  return loading;
}
function set(next: WayData) { data = next; emit(); writeData(next).then(emit); }

export const uidW = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const nowTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

export const way = {
  ensureLoaded,
  get: () => data,
  saveEntry(e: Partial<WayEntry> & { kind: EntryKind }): string {
    const now = new Date().toISOString();
    const id = e.id ?? uidW();
    const exists = data.entries.find((x) => x.id === id);
    const base: WayEntry = exists ?? { id, kind: e.kind, date: todayISO(), createdAt: now, updatedAt: now, feelings: [], customFeelings: [], refs: [], topics: [], stations: [], lexicon: [] };
    const merged = { ...base, ...e, id, updatedAt: now } as WayEntry;
    set({ ...data, entries: exists ? data.entries.map((x) => (x.id === id ? merged : x)) : [merged, ...data.entries] });
    return id;
  },
  deleteEntry(id: string) { set({ ...data, entries: data.entries.filter((x) => x.id !== id) }); },
  markIntroSeen() { set({ ...data, introSeenAt: new Date().toISOString() }); },
  /** Wiederherstellen aus einer Sicherungsdatei. mode=merge ergänzt fehlende Einträge. */
  restore(d: WayData, mode: "merge" | "replace") {
    if (mode === "replace") return set({ ...d, introSeenAt: data.introSeenAt ?? d.introSeenAt });
    const ids = new Set(data.entries.map((e) => e.id));
    set({ ...data, entries: [...data.entries, ...d.entries.filter((e) => !ids.has(e.id))] });
  },
  async wipe() {
    data = empty(); broken = false; emit();
    await storage.removeItem(DATA_KEY);
    await storage.secureRemove(KEY_KEY);
    key = null;
  },
};

export function useWay() {
  ensureLoaded();
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => snapshot, () => snapshot);
}

// ---------- Export / Import ----------
export function buildWayBackup(d: WayData) {
  return JSON.stringify({ app: "biblia", kind: "mein-geistlicher-weg", exportedAt: new Date().toISOString(), data: d }, null, 2);
}
export function parseWayBackup(text: string): { ok: true; data: WayData } | { ok: false; error: string } {
  try {
    const j = JSON.parse(text);
    if (j?.kind !== "mein-geistlicher-weg" || !j.data) return { ok: false, error: "Diese Datei ist keine Sicherung von „Mein geistlicher Weg“." };
    return { ok: true, data: normalize(j.data) };
  } catch {
    return { ok: false, error: "Die Datei konnte nicht gelesen werden." };
  }
}

export const fmtDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const fmtDay = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return `${WD[new Date(y, m - 1, d).getDay()]}, ${fmtDate(iso)}`; };

// ---------- Sicherheitshinweis ----------
// Rein lokaler Wortabgleich, ohne Speicherung, Übertragung oder Bewertung.
const DANGER = [
  /suizid/i, /selbstmord/i, /umbringen/i, /bringe? mich um/i, /mich (zu )?töten/i, /töte mich/i, /mir das leben (zu )?nehmen/i, /nicht mehr (weiter)?leben/i,
  /nicht mehr (da )?sein/i, /(will|möchte|wäre|wär|würde) (am liebsten |lieber |einfach |nur |einfach nur )*(tot|sterben)/i, /keine kraft mehr (zu|zum) leben/i, /(mache|machen) schluss mit (mir|meinem leben|allem)/i, /sterben (will|möchte)/i, /lebensmüde/i,
  /mir (etwas|was) an(tun|zutun)/i, /tu(e)? mir (etwas|was) an/i, /selbstverletz/i, /ritze mich/i, /mich (selbst )?(ritzen|geritzt)/i, /schneide mich/i,
  /alles beenden/i, /(dem|meinem) leben ein ende/i, /keinen (ausweg|sinn mehr)/i, /von der brücke/i,
];
const ABUSE = [/schlägt mich/i, /(hat|haben|wurde|werde) mich (wieder |oft )?geschlagen/i, /mich geschlagen/i, /missbrauch/i, /misshandel/i, /vergewaltig/i, /bedroht mich/i, /droht mir/i, /habe angst vor (ihm|ihr|meinem|meiner)/i, /\bgewalt(\b|tät)/i, /häusliche gewalt/i, /(hat|hatte) mich angefasst/i];
export function safetyCheck(texts: (string | undefined)[]): { danger: boolean; abuse: boolean } {
  const t = texts.filter(Boolean).join(" \n ");
  return { danger: DANGER.some((r) => r.test(t)), abuse: ABUSE.some((r) => r.test(t)) };
}
