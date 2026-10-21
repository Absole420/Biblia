import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

type ToastCtx = { show: (msg: string, kind?: "ok" | "error") => void };
const Ctx = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "error"; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const show = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, kind, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast ? (
        <View style={[styles.wrap, { top: insets.top + spacing.sm, pointerEvents: "none" }]}>
          <Animated.View
            key={toast.id}
            entering={FadeInUp}
            exiting={FadeOutUp}
            testID="toast-message"
            style={[styles.toast, { backgroundColor: toast.kind === "error" ? colors.error : colors.surfaceInverse }]}
          >
            <Icon name={toast.kind === "error" ? "alert-circle" : "check"} size={18} color={toast.kind === "error" ? colors.onError : colors.brandPrimary} />
            <Text style={[styles.text, { color: toast.kind === "error" ? colors.onError : colors.onSurfaceInverse }]}>{toast.msg}</Text>
          </Animated.View>
        </View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: spacing.lg, right: spacing.lg, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, maxWidth: 520 },
  text: { fontFamily: fonts.text, fontSize: 14, fontWeight: "600", flexShrink: 1 },
});
