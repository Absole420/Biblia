import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { AppState, buildExport, ImportResult, parseImport } from "./progress-logic";

export async function exportState(state: AppState): Promise<string> {
  const json = buildExport(state);
  const name = `biblia-lernstand-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === "web") {
    const doc = (globalThis as any).document;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return "Lernstand heruntergeladen.";
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "BIBLIA-Lernstand exportieren" });
  }
  return "Lernstand exportiert.";
}

export async function pickImport(): Promise<ImportResult | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain", "*/*"], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.[0]) return null;
  const uri = res.assets[0].uri;
  const text = Platform.OS === "web" ? await (await fetch(uri)).text() : await new File(uri).text();
  return parseImport(text);
}
