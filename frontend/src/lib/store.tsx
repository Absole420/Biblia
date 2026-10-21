import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { setColorScheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";

import type { Avatar } from "./avatar";
import type { StudyState } from "./study";
import { AppState, Category, defaultState, migrate, Note, Photo, StudyUnit, uid } from "./progress-logic";

const KEY = "biblia_state";

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
  replaceState: (s: AppState) => void;
  setAvatar: (a: Avatar) => void;
  updateStudy: (fn: (s: StudyState) => StudyState) => void;
  toggleFavorite: (kind: "bible" | "lessons", key: string) => void;
  savePhoto: (p: Omit<Photo, "createdAt">) => void;
  deletePhoto: (id: string) => void;
  updateLexicon: (fn: (l: AppState["lexicon"]) => AppState["lexicon"]) => void;
  reset: () => void;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem(KEY, null as string | null);
      if (typeof raw === "string") {
        try {
          setState(migrate(JSON.parse(raw)));
        } catch {
          setState(defaultState());
        }
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);

  // Automatische Speicherung nach jeder Änderung
  useEffect(() => {
    if (!loaded.current) return;
    storage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    setColorScheme(state.settings.theme === "system" ? null : state.settings.theme);
  }, [state.settings.theme]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const completeStation = useCallback(
    (id: string, xp: number, score: number, total: number) => {
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
      replaceState: (ns) => setState(ns),
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
      reset: () => setState(defaultState()),
    }),
    [ready, state, completeStation, update],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}
