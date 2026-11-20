// Design tokens for BIBLIA. Light (parchment) + Dark (night parchment).
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // BIBLIA Farbschema: Royal Green (Primär), Ancient Gold (Akzent), Midnight Blue (Sekundär), Parchment/Ivory Sand, Deep Ink
  surface: "#F6F1E7",
  onSurface: "#101A1C",
  surfaceSecondary: "#ECE5D8",
  onSurfaceSecondary: "#1B2628",
  surfaceTertiary: "#E2D9C6",
  onSurfaceTertiary: "#24302F",
  surfaceInverse: "#101A1C",
  onSurfaceInverse: "#F6F1E7",
  muted: "#565F5B",

  brand: "#1F4A43",
  onBrand: "#F6F1E7",
  brandPrimary: "#1F4A43",
  onBrandPrimary: "#F6F1E7",
  brandSecondary: "#24324F",
  onBrandSecondary: "#F6F1E7",
  brandTertiary: "#E6D5B5",
  onBrandTertiary: "#101A1C",

  success: "#4F6E4A",
  onSuccess: "#F6F1E7",
  warning: "#8A5F14",
  onWarning: "#F6F1E7",
  error: "#A34A3E",
  onError: "#F6F1E7",
  info: "#2F5F7A",
  onInfo: "#F6F1E7",

  border: "#8C816D",
  borderStrong: "#857A66",
  divider: "#E2D9C6",

  stationEvent: "#F9F3E8",
  stationNarrative: "#D97736",
  stationStudy: "#4A7A8C",
  stationPractice: "#607D5B",
  stationExam: "#8A6530",
  stationChallenge: "#7E5B82",

  // Map art
  mapSea: "#7FC1BC",
  mapSeaDeep: "#5FA9A6",
  mapLand: "#EBDDB9",
  mapInk: "#4E3B26",
  mapMountain: "#B49773",
  mapRiver: "#3F9FA8",
  mapForest: "#8A9A5B",
  mapLocked: "#9C9282",
  scrim: "rgba(16,26,28,0.55)",
  glass: "rgba(236,229,216,0.88)",
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  surface: "#101A1C",
  onSurface: "#F6F1E7",
  surfaceSecondary: "#182427",
  onSurfaceSecondary: "#ECE5D8",
  surfaceTertiary: "#223236",
  onSurfaceTertiary: "#DDD5C6",
  surfaceInverse: "#F6F1E7",
  onSurfaceInverse: "#101A1C",
  muted: "#9DA8A4",

  brand: "#6DB5A5",
  onBrand: "#101A1C",
  brandPrimary: "#6DB5A5",
  onBrandPrimary: "#101A1C",
  brandSecondary: "#9AAED6",
  onBrandSecondary: "#101A1C",
  brandTertiary: "#3A3122",
  onBrandTertiary: "#F6F1E7",

  success: "#7FA078",
  onSuccess: "#101A1C",
  warning: "#D4A352",
  onWarning: "#101A1C",
  error: "#D07A6C",
  onError: "#101A1C",
  info: "#6FA0B3",
  onInfo: "#101A1C",

  border: "#5E7275",
  borderStrong: "#667A7C",
  divider: "#223236",

  stationEvent: "#F2E8D5",
  stationNarrative: "#D97736",
  stationStudy: "#5A90A4",
  stationPractice: "#6F9169",
  stationExam: "#C29A63",
  stationChallenge: "#9A74A0",

  mapSea: "#24545A",
  mapSeaDeep: "#1B4449",
  mapLand: "#4B3F2C",
  mapInk: "#EFE3C8",
  mapMountain: "#7A6648",
  mapRiver: "#4FA3AB",
  mapForest: "#5F6E3E",
  mapLocked: "#5E564A",
  scrim: "rgba(6,10,11,0.65)",
  glass: "rgba(24,36,39,0.9)",
};

export const fonts = {
  display: "Fraunces",
  text: "Nunito",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
