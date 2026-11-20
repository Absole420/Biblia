import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { DataGuardian, Slot } from "./data-guardian-core";
import { isStoredState } from "./progress-logic";

const prefix = "biblia_guardian_";
const dir = () => new Directory(Paths.document, "biblia-guardian");
const file = (slot: Slot) => new File(Paths.document, "biblia-guardian", slot + ".json");
let known: Set<string> | null = null;

export function createGuardian(): DataGuardian {
  known = null;
  return new DataGuardian({
    read: async slot => {
      if (Platform.OS === "web") return AsyncStorage.getItem(prefix + slot);
      // Ordner nur einmal auflisten; danach merkt sich known, welche Slot-Dateien existieren.
      // (File.exists kann nach einem I/O-Fehler false sein – deshalb Auflistung statt exists.)
      if (!known) {
        const root = new Directory(Paths.document);
        known = new Set(root.list().some(x => x.name === "biblia-guardian") ? dir().list().map(x => x.name) : []);
      }
      const f = file(slot);
      return known.has(f.name) ? f.text() : null;
    },
    write: async (slot, text) => {
      if (Platform.OS === "web") { await AsyncStorage.setItem(prefix + slot, text); return; }
      dir().create({ idempotent: true, intermediates: true });
      const f = file(slot);
      if (!f.exists) f.create();
      f.write(text);
      known?.add(f.name);
    },
    readLegacy: async () => {
      const raw = await AsyncStorage.getItem("biblia_state");
      if (raw === null) return null;
      // Old storage wrapper JSON-encoded the already serialized state.
      const payload: unknown = JSON.parse(raw);
      if (typeof payload !== "string") throw new Error("Alter Speicherstand beschädigt");
      return payload;
    },
    digest: text => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text),
    valid: text => { try { return isStoredState(JSON.parse(text)); } catch { return false; } },
    now: Date.now,
  });
}
