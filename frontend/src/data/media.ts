/**
 * Mitgelieferte Medien (Permanent Offline Edition).
 * Eigene MP3/MP4-Dateien hier eintragen, z. B. nach frontend/assets/media/ kopieren und:
 *   { id: "psalm23", title: "Psalm 23 – gelesen", kind: "audio", source: require("../../assets/media/psalm23.mp3") },
 * Jede Datei vergrößert die App. Nur Dateien mit geklärten Nutzungsrechten aufnehmen.
 */
export type BundledMedia = { id: string; title: string; kind: "audio" | "video"; source: number; note?: string };

export const BUNDLED_MEDIA: BundledMedia[] = [];
