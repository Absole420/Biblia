import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  accent?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
};

export function Sheet({ visible, onClose, title, accent, children, footer, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} testID={testID ? `${testID}-backdrop` : undefined} accessibilityLabel="Schließen" />
        <Animated.View entering={SlideInDown.duration(260)} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} testID={testID}>
          {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
          <View style={styles.handle} />
          <View style={styles.header}>
            {title ? <Text style={styles.title} numberOfLines={2}>{title}</Text> : <View />}
            <Pressable onPress={onClose} style={styles.close} testID={testID ? `${testID}-close` : "sheet-close"} accessibilityLabel="Schließen" hitSlop={8}>
              <Icon name="x" size={20} color={colors.onSurfaceSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.md }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, justifyContent: "flex-end", backgroundColor: c.scrim },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "86%",
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  accent: { position: "absolute", top: 0, left: 0, right: 0, height: 6 },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: radius.pill, backgroundColor: c.borderStrong, marginTop: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md, marginBottom: spacing.sm },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 22, color: c.onSurface, fontWeight: "600" },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  body: { flexGrow: 0 },
  footer: { paddingTop: spacing.md },
}));
