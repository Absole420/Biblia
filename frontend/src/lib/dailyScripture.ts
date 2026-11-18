import AsyncStorage from "@react-native-async-storage/async-storage";
import entries from "@/src/data/daily-scripture-elb1905.json";
import { fallbackDaily, localDay, selectDaily } from "./dailyScriptureLogic";
import type { DailyResult, Scripture } from "./dailyScriptureLogic";

export const DAILY_SCRIPTURE_POOL: Scripture[] = entries;
export const DAILY_SCRIPTURE_KEY = "biblia.dailyScripture.v1";
let pending: { day: string; promise: Promise<DailyResult> } | undefined;

/** Offline selection, independent of the personal prayer-book verse. */
export function loadDailyScripture(now = new Date()): Promise<DailyResult> {
  const day = localDay(now);
  if (pending?.day === day) return pending.promise;
  const prior = pending?.promise ?? Promise.resolve();
  const promise = prior.catch(() => undefined).then(async () => {
    try {
      const saved = await AsyncStorage.getItem(DAILY_SCRIPTURE_KEY);
      let previous: unknown = null;
      if (saved) { try { previous = JSON.parse(saved); } catch { /* repair only our own key */ } }
      const result = selectDaily(DAILY_SCRIPTURE_POOL, previous, day);
      if (result.newDay) await AsyncStorage.setItem(DAILY_SCRIPTURE_KEY, JSON.stringify(result.state));
      return result;
    } catch {
      return fallbackDaily(DAILY_SCRIPTURE_POOL, day);
    }
  });
  pending = { day, promise };
  return promise;
}
