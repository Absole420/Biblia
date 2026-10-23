// Design tokens for BIBLIA. Light (parchment) + Dark (night parchment).
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F9F3E8",
  onSurface: "#2C2822",
  surfaceSecondary: "#F2E8D5",
  onSurfaceSecondary: "#3A352D",
  surfaceTertiary: "#E8DCC4",
  onSurfaceTertiary: "#4A443A",
  surfaceInverse: "#2C2822",
  onSurfaceInverse: "#F9F3E8",
  muted: "#7A7061",

  brand: "#C28E3A",
  onBrand: "#2C2822",
  brandPrimary: "#C28E3A",
  onBrandPrimary: "#2C2822",
  brandSecondary: "#8A9A7B",
  onBrandSecondary: "#1E2619",
  brandTertiary: "#E0D3BB",
  onBrandTertiary: "#3A352D",

  success: "#607D5B",
  onSuccess: "#F9F3E8",
  warning: "#D4A352",
  onWarning: "#2C2822",
  error: "#B05A4E",
  onError: "#F9F3E8",
  info: "#4A7A8C",
  onInfo: "#F9F3E8",

  border: "#D8C9AE",
  borderStrong: "#BFA882",
  divider: "#E8DCC4",

  stationEvent: "#F9F3E8",
  stationNarrative: "#D97736",
  stationStudy: "#4A7A8C",
  stationPractice: "#607D5B",
  stationExam: "#C28E3A",
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
  scrim: "rgba(44,40,34,0.55)",
  glass: "rgba(242,232,213,0.86)",
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  surface: "#1D1913",
  onSurface: "#F2E8D5",
  surfaceSecondary: "#2A241C",
  onSurfaceSecondary: "#E8DCC4",
  surfaceTertiary: "#3A3227",
  onSurfaceTertiary: "#D8C9AE",
  surfaceInverse: "#F2E8D5",
  onSurfaceInverse: "#2C2822",
  muted: "#A89C88",

  brand: "#D9A54E",
  onBrand: "#1D1913",
  brandPrimary: "#D9A54E",
  onBrandPrimary: "#1D1913",
  brandSecondary: "#8A9A7B",
  onBrandSecondary: "#1E2619",
  brandTertiary: "#4A3F2E",
  onBrandTertiary: "#F2E8D5",

  success: "#7FA078",
  onSuccess: "#14110D",
  warning: "#D4A352",
  onWarning: "#1D1913",
  error: "#D07A6C",
  onError: "#1D1913",
  info: "#6FA0B3",
  onInfo: "#14110D",

  border: "#4A4032",
  borderStrong: "#6B5C45",
  divider: "#3A3227",

  stationEvent: "#F2E8D5",
  stationNarrative: "#D97736",
  stationStudy: "#5A90A4",
  stationPractice: "#6F9169",
  stationExam: "#D9A54E",
  stationChallenge: "#9A74A0",

  mapSea: "#24545A",
  mapSeaDeep: "#1B4449",
  mapLand: "#4B3F2C",
  mapInk: "#EFE3C8",
  mapMountain: "#7A6648",
  mapRiver: "#4FA3AB",
  mapForest: "#5F6E3E",
  mapLocked: "#5E564A",
  scrim: "rgba(10,8,6,0.65)",
  glass: "rgba(42,36,28,0.9)",
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
