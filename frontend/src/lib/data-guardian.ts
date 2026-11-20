import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { DataGuardian, Slot } from "./data-guardian-core";
import { isStoredState } from "./progress-logic";

const prefix = "biblia_guardian_";
const file = (slot: Slot) => new File(Paths.document, "biblia-guardian", slot + ".json");

export function createGuardian(): DataGuardian {
  return new DataGuardian({
    read: async slot => {
      if (Platform.OS === "web") return AsyncStorage.getItem(prefix + slot);
      const f = file(slot);
      // File.exists can be false after an I/O error; list the directory to distinguish.
      const dir = new Directory(Paths.document, "biblia-guardian");
      const root = new Directory(Paths.document);
      if (!root.list().some(x => x.name === "biblia-guardian")) return null;
      if (!dir.list().some(x => x.name === f.name)) return null;
      return f.text();
    },
    write: async (slot, text) => {
      if (Platform.OS === "web") { await AsyncStorage.setItem(prefix + slot, text); return; }
      const dir = new Directory(Paths.document, "biblia-guardian");
      dir.create({ idempotent: true, intermediates: true });
      const f = file(slot);
      if (!f.exists) f.create();
      f.write(text);
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
