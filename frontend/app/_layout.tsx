import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, LogBox, Platform, StyleSheet, View, Text, Pressable, Modal } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { GuardianBlocked, GuardianNotices } from "@/src/components/GuardianNotices";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { IntroAnimation } from "@/src/components/IntroAnimation";
import { INTRO_DONE_KEY } from "@/src/components/IntroJourney";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadDailyScripture } from "@/src/lib/dailyScripture";
import type { Scripture } from "@/src/lib/dailyScriptureLogic";
import { InfoProvider } from "@/src/components/InfoSheet";
import { ToastProvider } from "@/src/components/Toast";
import { ProgressProvider, useProgress } from "@/src/lib/store";
import { queryClient } from "@/src/query-client";
import { fonts, useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

function AppStack() {
  const { ready, storageBlocked, legacyPending } = useProgress();
  const { colors, scheme } = useTheme();
  if (!ready) {
    return (
      <View style={[styles.root, { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }
  if (storageBlocked || legacyPending) return <GuardianBlocked />;
  return (
    <View style={styles.root}>
      <GuardianNotices part="banner" />
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
      <GuardianNotices part="overlay" />
    </View>
  );
}

export default function RootLayout() {
  // Vollbild auf Android: Navigationsleiste ausblenden (Wischen vom Rand blendet sie ein)
  useEffect(() => {
    if (Platform.OS === "android") NavigationBar.setVisibilityAsync("hidden").catch(() => {});
  }, []);
  const [fontsLoaded] = useFonts({
    Fraunces: require("../assets/fonts/Fraunces.ttf"),
    Nunito: require("../assets/fonts/Nunito.ttf"),
  });
  const [intro, setIntro] = useState(true);
  const [first, setFirst] = useState<boolean | null>(null);
  const [scripture, setScripture] = useState<Scripture | null>(null);
  const [welcome, setWelcome] = useState(false);
  const router = useRouter();
  useEffect(() => {
    loadDailyScripture().then((r) => setScripture(r.verse));
    AsyncStorage.multiGet(["biblia.cinematic.seen", INTRO_DONE_KEY]).then((pairs) => {
      setFirst(!pairs.some(([, value]) => value === "1"));
    }).catch(() => setFirst(false));
  }, []);
  const endIntro = useCallback(() => {
    setIntro(false);
    if (first) { setWelcome(true); AsyncStorage.setItem("biblia.cinematic.seen", "1").catch(() => {}); }
  }, [first]);
  const dismissWelcome = (journey: boolean) => {
    setWelcome(false);
    AsyncStorage.setItem("biblia.cinematic.seen", "1").catch(() => {});
    if (journey) router.push("/intro");
  };
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <KeyboardProvider>
              <ProgressProvider>
                <ToastProvider>
                  {fontsLoaded ? <AppStack /> : <View style={styles.root} />}
                  {intro && (!fontsLoaded || first === null || !scripture) ? <View style={styles.cover} /> : null}
                  {fontsLoaded && intro && first !== null && scripture ? <IntroAnimation first={first} scripture={scripture} onDone={endIntro} /> : null}
                  {fontsLoaded && !intro && welcome ? <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={() => dismissWelcome(false)}><View style={styles.welcomeBackdrop} testID="welcome-screen"><View style={styles.welcome}>
                    <Text style={styles.welcomeLabel}>BIBLIA</Text>
                    <Text style={styles.welcomeTitle}>Willkommen bei Biblia</Text>
                    <Text style={styles.welcomeText}>Entdecke die Heilige Schrift, ihre Geschichte und die Botschaft Jesu. In deinem eigenen Tempo.</Text>
                    <Pressable accessibilityRole="button" testID="welcome-start" style={styles.primary} onPress={() => dismissWelcome(false)}><Text style={styles.primaryText}>Bibel entdecken</Text></Pressable>
                    <Pressable accessibilityRole="button" testID="welcome-journey" style={styles.secondary} onPress={() => dismissWelcome(true)}><Text style={styles.welcomeLabel}>Auf den Spuren Jesu</Text><Text style={styles.welcomeText}>15 Stationen aus dem Leben Jesu – jederzeit auch in der Bibliothek</Text></Pressable>
                  </View></View></Modal> : null}
                </ToastProvider>
              </ProgressProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 },
 cover:{...StyleSheet.absoluteFill,zIndex:60,backgroundColor:"#10130E"},
 welcomeBackdrop:{flex:1,backgroundColor:"#10130E",justifyContent:"center",alignItems:"center",padding:24},
 welcome:{width:"100%",maxWidth:440,padding:28,borderRadius:24,borderWidth:1,borderColor:"#6F6241",backgroundColor:"#22281B",gap:18},
 welcomeLabel:{color:"#DFC38A",fontFamily:fonts.text,fontSize:14,textAlign:"center"},
 welcomeTitle:{color:"#F3E9D5",fontFamily:fonts.display,fontSize:32,textAlign:"center"},
 welcomeText:{color:"#F3E9D5",fontFamily:fonts.text,fontSize:16,lineHeight:23,textAlign:"center"},
 primary:{backgroundColor:"#DFC38A",padding:16,borderRadius:14},
 primaryText:{color:"#171B12",fontFamily:fonts.text,fontWeight:"700",textAlign:"center",fontSize:16},
 secondary:{padding:12,borderRadius:14,borderWidth:1,borderColor:"#6F6241",gap:6}
});
