import { ThemeColors } from "@/src/theme";

import { ClaimKind, StationType } from "./types";

export const STATION_META: Record<StationType, { label: string; color: keyof ThemeColors; ink: "dark" | "light" }> = {
  event: { label: "Biblisches Ereignis", color: "stationEvent", ink: "dark" },
  narrative: { label: "Geschichte & Erzählung", color: "stationNarrative", ink: "light" },
  study: { label: "Bibelstudium", color: "stationStudy", ink: "light" },
  practice: { label: "Übung", color: "stationPractice", ink: "light" },
  exam: { label: "Prüfung", color: "stationExam", ink: "dark" },
  challenge: { label: "Besondere Herausforderung", color: "stationChallenge", ink: "light" },
};

export const CLAIM_META: Record<ClaimKind, { label: string; icon: string; color: keyof ThemeColors }> = {
  text: { label: "Wortlaut des Bibeltextes", icon: "book", color: "brandPrimary" },
  history: { label: "Historisch gesichert", icon: "check-circle", color: "success" },
  hypothesis: { label: "Wissenschaftliche Hypothese", icon: "help-circle", color: "warning" },
  jewish: { label: "Jüdische Tradition", icon: "star", color: "info" },
  christian: { label: "Christliche Auslegung", icon: "plus", color: "stationChallenge" },
  reflection: { label: "Persönliche Reflexion", icon: "edit-3", color: "brandSecondary" },
  teach: { label: "Lehrtext", icon: "book-open", color: "brandPrimary" },
  info: { label: "Infotafel", icon: "info", color: "info" },
};

export const CERTAINTY_META = {
  secure: { label: "Gesichert", desc: "Archäologisch bzw. historisch gut belegt" },
  traditional: { label: "Tradition", desc: "Alte Ortstradition, weitgehend anerkannt" },
  disputed: { label: "Umstritten", desc: "Lokalisierung unsicher – mehrere Vorschläge" },
} as const;
