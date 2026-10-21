import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, LogBox, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { IntroAnimation } from "@/src/components/IntroAnimation";
import { refreshTranslations } from "@/src/data/bible";
import { InfoProvider } from "@/src/components/InfoSheet";
import { ToastProvider } from "@/src/components/Toast";
import { ProgressProvider, useProgress } from "@/src/lib/store";
import { queryClient } from "@/src/query-client";
import { useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

function AppStack() {
  const { ready } = useProgress();
  const { colors, scheme } = useTheme();
  if (!ready) {
    return (
      <View style={[styles.root, { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }
  return (
    <>
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
        <Stack.Screen name="avatar" options={{ gestureEnabled: false }} />
      </Stack>
      </InfoProvider>
    </>
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
  const endIntro = useCallback(() => setIntro(false), []);
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
