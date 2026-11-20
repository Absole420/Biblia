// Offline, independently testable rotating snapshots. Call operations serially.
export type Slot = "live-a" | "live-b" | "week-a" | "week-b" | "before-change";
export type GuardianIO = {
  read: (slot: Slot) => Promise<string | null>;
  write: (slot: Slot, text: string) => Promise<void>;
  readLegacy: () => Promise<string | null>;
  digest: (text: string) => Promise<string>;
  valid: (payload: string) => boolean;
  now: () => number;
};
type RecordData = { version: 1; revision: number; at: number; payload: string; hash: string };
const LIVE = ["live-a", "live-b"] as const;
const WEEK = ["week-a", "week-b"] as const;
const SLOTS: Slot[] = [...LIVE, ...WEEK, "before-change"];
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const body = (r: Omit<RecordData, "hash">) => JSON.stringify([r.version, r.revision, r.at, r.payload]);

export class DataGuardian {
  private records = new Map<Slot, RecordData>();
  private current: RecordData | null = null;
  private opened = false;
  private broken = new Set<Slot>();
  private readonly io: GuardianIO;
  constructor(io: GuardianIO) { this.io = io; }

  private async decode(raw: string): Promise<RecordData | null> {
    let r: RecordData;
    try { r = JSON.parse(raw); } catch { return null; }
    if (!r || r.version !== 1 || !Number.isSafeInteger(r.revision) || r.revision < 1 ||
      !Number.isFinite(r.at) || r.at < 0 || typeof r.payload !== "string" ||
      typeof r.hash !== "string" || !this.io.valid(r.payload)) return null;
    return (await this.io.digest(body(r))) === r.hash ? r : null;
  }

  private newest(slots: readonly Slot[], byTime = false): RecordData | null {
    const records = slots.map(s => this.records.get(s)).filter((r): r is RecordData => !!r);
    return records.sort((a, b) => byTime ? b.at - a.at : b.revision - a.revision)[0] ?? null;
  }
  private oldest(slots: readonly Slot[], byTime = false): Slot {
    return [...slots].sort((a, b) =>
      (byTime ? this.records.get(a)?.at ?? -1 : this.records.get(a)?.revision ?? -1) -
      (byTime ? this.records.get(b)?.at ?? -1 : this.records.get(b)?.revision ?? -1))[0]!;
  }
  private async write(slot: Slot, payload: string, revision: number): Promise<RecordData> {
    const data = { version: 1 as const, revision, at: this.io.now(), payload };
    const record = { ...data, hash: await this.io.digest(body(data)) };
    const encoded = JSON.stringify(record);
    // Never discard the other slot. A crash/failed write leaves its last valid copy.
    this.records.delete(slot);
    await this.io.write(slot, encoded);
    const actual = await this.io.read(slot);
    if (actual !== encoded) throw new Error("Speicherprüfung fehlgeschlagen");
    this.records.set(slot, record);
    return record;
  }

  async open(): Promise<{ payload: string | null; recovered: boolean; legacyFallback?: boolean }> {
    this.opened = false;
    this.records.clear();
    this.current = null;
    this.broken.clear();
    let invalid = false;
    for (const slot of SLOTS) {
      const raw = await this.io.read(slot); // I/O error is NOT a missing key; abort.
      if (raw === null) continue;
      const record = await this.decode(raw);
      if (record) this.records.set(slot, record); else { invalid = true; this.broken.add(slot); }
    }
    this.current = this.newest(SLOTS);
    if (this.current) {
      const recovered = invalid || !LIVE.some(s => this.records.get(s) === this.current);
      this.opened = true;
      return { payload: this.current.payload, recovered };
    }
    const legacy = await this.io.readLegacy();
    if (legacy !== null) {
      if (!this.io.valid(legacy)) throw new Error("Alter Speicherstand beschädigt");
      // Alle Kopien defekt, nur der alte Migrationsstand ist lesbar: nicht still übernehmen – Nutzer muss bestätigen
      if (invalid) return { payload: legacy, recovered: true, legacyFallback: true };
      this.opened = true;
      return { payload: legacy, recovered: false };
    }
    if (invalid) throw new Error("Kein gültiger Speicherstand");
    this.opened = true;
    return { payload: null, recovered: false }; // genuinely new installation only
  }

  async save(payload: string): Promise<void> {
    if (!this.opened || !this.io.valid(payload)) throw new Error("Speichern gesperrt");
    if (this.current?.payload === payload && LIVE.some(s => this.records.get(s) === this.current)) return;
    const revision = (this.newest(SLOTS)?.revision ?? 0) + 1;
    this.current = await this.write(this.oldest(LIVE), payload, revision);
  }

  /** Nach Bestätigung des Nutzers den alten Migrationsstand als Grundlage übernehmen. */
  acceptLegacy(): void { this.opened = true; }

  /** Defekte/ältere Live-Kopie mit dem aktuellen gültigen Stand überschreiben (Hinweis verschwindet dauerhaft). */
  async repair(): Promise<void> {
    if (!this.opened || !this.current) return;
    const live = this.current;
    if (!LIVE.some(s => this.records.get(s) === live) || LIVE.some(s => this.broken.has(s))) {
      const target = LIVE.find(s => this.broken.has(s)) ?? this.oldest(LIVE);
      this.current = await this.write(target, live.payload, (this.newest(SLOTS)?.revision ?? 0) + 1);
    }
    for (const slot of [...this.broken]) {
      if (!LIVE.includes(slot as never)) await this.write(slot, this.current.payload, this.current.revision);
      this.broken.delete(slot);
    }
  }

  get lastBackup(): number | null { return this.newest(WEEK, true)?.at ?? null; }
  get backupPayload(): string | null { return this.newest(WEEK, true)?.payload ?? null; }
  get beforeChangePayload(): string | null { return this.records.get("before-change")?.payload ?? null; }

  async weekly(force = false): Promise<void> {
    if (!this.opened || !this.current) throw new Error("Kein gespeicherter Lernstand");
    const last = this.lastBackup;
    const now = this.io.now();
    if (!force && last !== null && now >= last && now - last < WEEK_MS) return;
    await this.write(this.oldest(WEEK, true), this.current.payload, this.current.revision);
  }

  async beforeChange(): Promise<void> {
    if (!this.opened || !this.current) throw new Error("Kein gespeicherter Lernstand");
    await this.write("before-change", this.current.payload, this.current.revision);
  }
}
