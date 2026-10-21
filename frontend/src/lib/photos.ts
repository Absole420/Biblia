import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

/** Kopiert ein aufgenommenes/ausgewähltes Bild dauerhaft in den App-Speicher (nur lokal). */
export function persistPhoto(id: string, uri: string, base64?: string | null): string {
  if (Platform.OS === "web") return base64 ? `data:image/jpeg;base64,${base64}` : uri;
  const dir = new Directory(Paths.document, "photos");
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  const dest = new File(dir, `${id}.jpg`);
  if (dest.exists) dest.delete();
  new File(uri).copy(dest);
  return dest.uri;
}

export function deletePhotoFile(uri: string) {
  if (Platform.OS === "web" || !uri.startsWith("file:")) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Datei bereits entfernt
  }
}
