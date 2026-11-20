import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { setColorScheme } from "@/src/theme";
import { AppState as NativeAppState } from "react-native";
import { createGuardian } from "./data-guardian";

import type { Avatar } from "./avatar";
import type { StudyState } from "./study";
import { AppState, Category, defaultState, migrate, Note, Photo, PrayerEntry, StudyUnit, uid } from "./progress-logic";

type Ctx = {
  ready: boolean;
  state: AppState;
  completeStation: (id: string, xp: number, score: number, total: number) => { firstTime: boolean };
  setPhase: (id: string, phase: number) => void;
  recordAnswer: (taskId: string, stationId: string, correct: boolean) => void;
  clearWrong: (taskId: string) => void;
  saveReflection: (stationId: string, answers: string[]) => void;
  saveNote: (n: Partial<Note> & { title: string; text: string }) => void;
  deleteNote: (id: string) => void;
  toggleBookmark: (key: string) => void;
  setHighlight: (key: string, cat: string | null) => void;
  setCategories: (c: Category[]) => void;
  setSettings: (p: Partial<AppState["settings"]>) => void;
  setGoal: (n: number) => void;
  addLink: (from: string, to: string, note?: string) => void;
  deleteLink: (id: string) => void;
  saveUnit: (u: Partial<StudyUnit> & { title: string }) => string;
  deleteUnit: (id: string) => void;
  replaceState: (s: AppState) => Promise<void>;
  storageError: string | null;
  backupError: boolean;
  storageBlocked: boolean;
  recovered: boolean;
  lastBackup: number | null;
  hasBeforeChange: boolean;
  backupNow: () => Promise<void>;
  restoreBackup: (beforeChange?: boolean) => Promise<void>;
  setAvatar: (a: Avatar) => void;
  updateStudy: (fn: (s: StudyState) => StudyState) => void;
  toggleFavorite: (kind: "bible" | "lessons", key: string) => void;
  savePhoto: (p: Omit<Photo, "createdAt">) => void;
  deletePhoto: (id: string) => void;
  updateLexicon: (fn: (l: AppState["lexicon"]) => AppState["lexicon"]) => void;
  addPrayer: (e: Omit<PrayerEntry, "id" | "createdAt">) => void;
  updatePrayer: (id: string, patch: Partial<Pick<PrayerEntry, "note" | "cat">>) => void;
  deletePrayer: (id: string) => void;
  movePrayer: (id: string, dir: -1 | 1) => void;
  reset: () => Promise<void>;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const [guardian] = useState(createGuardian);
  const stateRef = useRef(state);
  stateRef.current = state;
  const blocked = useRef(true);
  const changing = useRef(false);
  const tail = useRef<Promise<void>>(Promise.resolve());
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [backupError, setBackupError] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [hasBeforeChange, setHasBeforeChange] = useState(false);

  const enqueue = useCallback((fn: () => Promise<void>) => {
    const next = tail.current.then(fn);
    tail.current = next.catch(() => {});
    return next;
  }, []);

  const refreshBackup = useCallback(() => {
    setLastBackup(guardian.lastBackup);
    setHasBeforeChange(guardian.beforeChangePayload !== null);
  }, [guardian]);

  useEffect(() => {
    let active = true;
    enqueue(async () => {
      try {
        const result = await guardian.open();
        if (!active) return;
        const loaded = result.payload === null ? defaultState() : migrate(JSON.parse(result.payload));
        stateRef.current = loaded;
        setState(loaded);
        blocked.current = false;
        setRecovered(result.recovered);
        refreshBackup();
      } catch {
        if (!active) return;
        setStorageBlocked(true);
        setStorageError("Lernstand nicht lesbar. Unveränderte Dateien bleiben erhalten. Bitte App neu starten.");
      } finally {
        if (active) setReady(true);
      }
    });
    return () => { active = false; };
  }, [guardian, enqueue, refreshBackup]);

  const saveCurrent = useCallback(async (forceBackup = false) => {
    if (blocked.current) throw new Error("Speichern gesperrt");
    try {
      await guardian.save(JSON.stringify(stateRef.current));
      setStorageError(null);
    } catch (error) {
      setStorageError("Änderungen konnten nicht gespeichert werden. Bitte erneut versuchen und App offen lassen.");
      throw error;
    }
    try {
      await guardian.weekly(forceBackup);
      setBackupError(false);
    } catch (error) {
      setBackupError(true);
      if (forceBackup) throw error;
    } finally { refreshBackup(); }
  }, [guardian, refreshBackup]);

  // Initial hydration, every change, and return to foreground; no background service.
  useEffect(() => {
    if (!ready || blocked.current) return;
    enqueue(() => saveCurrent()).catch(() => {});
  }, [ready, state, enqueue, saveCurrent]);
  useEffect(() => {
    if (!ready) return;
    const sub = NativeAppState.addEventListener("change", value => {
      if (value === "active" && !blocked.current) enqueue(() => saveCurrent()).catch(() => {});
    });
    return () => sub.remove();
  }, [ready, enqueue, saveCurrent]);

  const backupNow = useCallback(() => enqueue(() => saveCurrent(true)), [enqueue, saveCurrent]);
  const replace = useCallback(async (next: () => AppState) => {
    if (blocked.current || changing.current) throw new Error("Vorgang derzeit nicht möglich");
    changing.current = true;
    try {
      await enqueue(async () => {
        const replacement = next(); // read selected backup BEFORE creating the pre-change copy
        await saveCurrent();
        await guardian.beforeChange();
        refreshBackup();
        await guardian.save(JSON.stringify(replacement));
        stateRef.current = replacement;
        setState(replacement);
        setStorageError(null);
      });
    } finally { changing.current = false; }
  }, [enqueue, saveCurrent, guardian, refreshBackup]);

  const restoreBackup = useCallback((beforeChange = false) => replace(() => {
    const payload = beforeChange ? guardian.beforeChangePayload : guardian.backupPayload;
    if (payload === null) throw new Error("Keine Sicherung vorhanden");
    return migrate(JSON.parse(payload));
  }), [replace, guardian]);

  useEffect(() => {
    setColorScheme(state.settings.theme === "system" ? null : state.settings.theme);
  }, [state.settings.theme]);

  const update = useCallback((fn: (s: AppState) => AppState) => { if (!blocked.current && !changing.current) setState(fn); }, []);

  const completeStation = useCallback(
    (id: string, xp: number, score: number, total: number) => {
      if (blocked.current || changing.current) return { firstTime: false };
      let firstTime = false;
      setState((s) => {
        const prev = s.stations[id];
        firstTime = !prev;
        return {
          ...s,
          xp: s.xp + (prev ? 0 : xp),
          stations: {
            ...s.stations,
            [id]: {
              completedAt: prev?.completedAt ?? new Date().toISOString(),
              examScore: score,
              examTotal: total,
              bestScore: Math.max(prev?.bestScore ?? 0, score),
              attempts: (prev?.attempts ?? 0) + 1,
            },
          },
          phase: { ...s.phase, [id]: 0 },
          activity: [...s.activity, { date: new Date().toISOString(), stationId: id }].slice(-500),
        };
      });
      return { firstTime };
    },
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      state,
      storageError, storageBlocked, recovered, lastBackup, backupError, hasBeforeChange,
      backupNow, restoreBackup,
      completeStation,
      setPhase: (id, phase) => update((s) => (s.phase[id] === phase ? s : { ...s, phase: { ...s.phase, [id]: phase } })),
      recordAnswer: (taskId, stationId, correct) =>
        update((s) => {
          const wrong = { ...s.wrong };
          if (!correct) wrong[taskId] = { stationId, count: (wrong[taskId]?.count ?? 0) + 1, lastAt: new Date().toISOString() };
          return { ...s, wrong, answered: { total: s.answered.total + 1, correct: s.answered.correct + (correct ? 1 : 0) } };
        }),
      clearWrong: (taskId) =>
        update((s) => {
          const wrong = { ...s.wrong };
          delete wrong[taskId];
          return { ...s, wrong };
        }),
      saveReflection: (stationId, answers) => update((s) => ({ ...s, reflections: { ...s.reflections, [stationId]: answers } })),
      saveNote: (n) =>
        update((s) => {
          const now = new Date().toISOString();
          if (n.id && s.notes.some((x) => x.id === n.id)) {
            return { ...s, notes: s.notes.map((x) => (x.id === n.id ? { ...x, ...n, updatedAt: now } as Note : x)) };
          }
          return { ...s, notes: [{ id: uid(), title: n.title, text: n.text, ref: n.ref, stationId: n.stationId, createdAt: now, updatedAt: now }, ...s.notes] };
        }),
      deleteNote: (id) => update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) })),
      toggleBookmark: (key) =>
        update((s) => ({
          ...s,
          bookmarks: s.bookmarks.some((b) => b.key === key)
            ? s.bookmarks.filter((b) => b.key !== key)
            : [{ key, createdAt: new Date().toISOString() }, ...s.bookmarks],
        })),
      setHighlight: (key, cat) =>
        update((s) => {
          const highlights = { ...s.highlights };
          if (cat) highlights[key] = cat;
          else delete highlights[key];
          return { ...s, highlights };
        }),
      setCategories: (categories) => update((s) => ({ ...s, categories })),
      setSettings: (p) => update((s) => ({ ...s, settings: { ...s.settings, ...p } })),
      setGoal: (n) => update((s) => ({ ...s, goal: { weeklyStations: Math.max(1, Math.min(14, n)) } })),
      addLink: (from, to, note) => update((s) => ({ ...s, links: [...s.links, { id: uid(), from, to, note, createdAt: new Date().toISOString() }] })),
      deleteLink: (id) => update((s) => ({ ...s, links: s.links.filter((l) => l.id !== id) })),
      saveUnit: (u) => {
        const id = u.id ?? uid();
        update((s) => {
          const now = new Date().toISOString();
          const exists = s.units.some((x) => x.id === id);
          const units = exists
            ? s.units.map((x) => (x.id === id ? { ...x, ...u, id, updatedAt: now } : x))
            : [{ id, title: u.title, description: u.description ?? "", refs: u.refs ?? [], questions: u.questions ?? [], createdAt: now, updatedAt: now }, ...s.units];
          return { ...s, units };
        });
        return id;
      },
      deleteUnit: (id) => update((s) => ({ ...s, units: s.units.filter((x) => x.id !== id) })),
      replaceState: (ns) => replace(() => ns),
      setAvatar: (avatar) => update((s) => ({ ...s, avatar })),
      updateStudy: (fn) => update((s) => ({ ...s, study: fn(s.study) })),
      toggleFavorite: (kind, key) =>
        update((s) => {
          const list = s.favorites[kind];
          const next = list.some((f) => f.key === key) ? list.filter((f) => f.key !== key) : [{ key, createdAt: new Date().toISOString() }, ...list];
          return { ...s, favorites: { ...s.favorites, [kind]: next } };
        }),
      savePhoto: (ph) =>
        update((s) => {
          const exists = s.photos.find((x) => x.id === ph.id);
          return { ...s, photos: exists ? s.photos.map((x) => (x.id === ph.id ? { ...x, ...ph } : x)) : [{ ...ph, createdAt: new Date().toISOString() }, ...s.photos] };
        }),
      deletePhoto: (id) => update((s) => ({ ...s, photos: s.photos.filter((x) => x.id !== id) })),
      updateLexicon: (fn) => update((s) => ({ ...s, lexicon: fn(s.lexicon) })),
      addPrayer: (e) => update((s) => (s.prayers.some((x) => x.ref === e.ref && x.cat === e.cat) ? s : { ...s, prayers: [...s.prayers, { ...e, id: uid(), createdAt: new Date().toISOString() }] })),
      updatePrayer: (id, patch) => update((s) => ({ ...s, prayers: s.prayers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deletePrayer: (id) => update((s) => ({ ...s, prayers: s.prayers.filter((x) => x.id !== id) })),
      movePrayer: (id, dir) =>
        update((s) => {
          // innerhalb derselben Rubrik mit dem Nachbarn tauschen
          const list = [...s.prayers];
          const i = list.findIndex((x) => x.id === id);
          if (i < 0) return s;
          let j = i + dir;
          while (j >= 0 && j < list.length && list[j].cat !== list[i].cat) j += dir;
          if (j < 0 || j >= list.length) return s;
          [list[i], list[j]] = [list[j], list[i]];
          return { ...s, prayers: list };
        }),
      reset: () => replace(defaultState),
    }),
    [ready, state, completeStation, update, storageError, storageBlocked, recovered, lastBackup, backupError, hasBeforeChange, backupNow, restoreBackup, replace],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}
