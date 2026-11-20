import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, LogBox, Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { IntroAnimation } from "@/src/components/IntroAnimation";
import { INTRO_DONE_KEY, IntroJourney } from "@/src/components/IntroJourney";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { refreshTranslations } from "@/src/data/bible";
import { InfoProvider } from "@/src/components/InfoSheet";
import { ToastProvider } from "@/src/components/Toast";
import { ProgressProvider, useProgress } from "@/src/lib/store";
import { queryClient } from "@/src/query-client";
import { useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

function AppStack() {
  const { ready, storageError, storageBlocked, recovered } = useProgress();
  const { colors, scheme } = useTheme();
  if (!ready) {
    return (
      <View style={[styles.root, { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }
  if (storageBlocked) return (
    <View style={[styles.root, { backgroundColor: colors.surface, justifyContent: "center", padding: 24 }]}>
      <Text accessibilityRole="alert" style={{ color: colors.onSurface, fontSize: 18 }}>{storageError}</Text>
      <Text style={{ color: colors.onSurface, marginTop: 12 }}>Keine leeren Daten wurden gespeichert. Falls der Fehler bleibt, die App-Daten nicht löschen.</Text>
    </View>
  );
  return (
    <View style={styles.root}>
      {storageError || recovered ? <Text accessibilityRole="alert" style={{ color: colors.onSurface, backgroundColor: colors.surfaceSecondary, padding: 8 }}>{storageError ?? "Ein älterer intakter Speicherstand wurde geladen. Bitte Lernstand prüfen."}</Text> : null}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <InfoProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="world/[id]" />
        <Stack.Screen name="station/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="review" />
        <Stack.Screen name="unit/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="timeline" />
        <Stack.Screen name="intro" options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="avatar" options={{ gestureEnabled: false }} />
      </Stack>
      </InfoProvider>
    </View>
  );
}

export default function RootLayout() {
  // Vollbild auf Android: Navigationsleiste ausblenden (Wischen vom Rand blendet sie ein)
  useEffect(() => {
    if (Platform.OS === "android") NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    refreshTranslations();
  }, []);
  const [fontsLoaded] = useFonts({
    Fraunces: require("../assets/fonts/Fraunces.ttf"),
    Nunito: require("../assets/fonts/Nunito.ttf"),
  });
  const [intro, setIntro] = useState(true);
  const [journey, setJourney] = useState(false);
  // Beim ersten Start (oder bei unterbrochener Reise) nach der kurzen Logo-Animation die Reise zeigen.
  useEffect(() => {
    AsyncStorage.getItem(INTRO_DONE_KEY).then((v) => { if (!v) setJourney(true); }).catch(() => {});
  }, []);
  const endIntro = useCallback(() => setIntro(false), []);
  const endJourney = useCallback(() => setJourney(false), []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <KeyboardProvider>
              <ProgressProvider>
                <ToastProvider>
                  {fontsLoaded ? <AppStack /> : <View style={styles.root} />}
                  {fontsLoaded && intro ? <IntroAnimation onDone={endIntro} /> : null}
                  {fontsLoaded && !intro && journey ? <IntroJourney onClose={endJourney} /> : null}
                </ToastProvider>
              </ProgressProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
