import React, { useState } from "react";
import { Image, ImageSourcePropType, ImageStyle, Modal, Platform, Pressable, StyleProp, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "./Icon";

/** Lehrillustration im Originalseitenverhältnis („contain“); Antippen öffnet die Vollbildansicht. */
export function ZoomableImage({ source, style, label, testID, maxHeight = 480 }: { source: ImageSourcePropType; style?: StyleProp<ImageStyle>; label: string; testID?: string; maxHeight?: number }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  // Web: require() liefert {uri,width,height}; nativ: resolveAssetSource
  const a: any = source && typeof source === "object" && !Array.isArray(source) && (source as any).width ? source : Platform.OS === "web" ? undefined : Image.resolveAssetSource?.(source);
  const [ratio, setRatio] = useState(a?.width && a?.height ? a.width / a.height : 4 / 3);
  // Natürliches Seitenverhältnis nach dem Laden übernehmen (zuverlässig auf Web und nativ)
  // Web (react-native-web): nativeEvent ist das DOM-Load-Event → Maße über target.naturalWidth/Height
  const onLoad = (e: any) => { const ne = e?.nativeEvent;  const w = ne?.source?.width ?? ne?.target?.naturalWidth, h = ne?.source?.height ?? ne?.target?.naturalHeight; if (w && h) setRatio(w / h); };
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="imagebutton" accessibilityLabel={`${label} – im Vollbild öffnen`} testID={testID}>
        {/* Wrapper trägt das Seitenverhältnis: react-native-web setzt sonst die Bild-Eigenhöhe (z. B. 900px) und ignoriert aspectRatio */}
        <View style={[{ width: "100%", aspectRatio: ratio, maxHeight }, style as any]}>
          <Image source={source} style={{ width: "100%", height: "100%" }} resizeMode="contain" accessibilityLabel={label} onLoad={onLoad} />
        </View>
        <View style={[styles.hint, { pointerEvents: "none" }]}><Icon name="maximize-2" size={14} color="#F3E9D5" /></View>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent supportedOrientations={["portrait", "landscape"]}>
        <View style={styles.backdrop} testID={testID ? `${testID}-fullscreen` : undefined}>
          <Image source={source} style={styles.full} resizeMode="contain" accessibilityLabel={label} />
          <Pressable onPress={() => setOpen(false)} style={[styles.close, { top: insets.top + 12 }]} accessibilityRole="button" accessibilityLabel="Vollbild schließen" testID={testID ? `${testID}-close` : undefined}>
            <Icon name="x" size={24} color="#F3E9D5" />
          </Pressable>
          <Text style={[styles.cap, { bottom: insets.bottom + 16 }]} numberOfLines={2}>{label}</Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hint: { position: "absolute", right: 10, bottom: 10, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(16,19,14,0.55)" },
  backdrop: { flex: 1, backgroundColor: "rgba(10,12,9,0.96)", alignItems: "center", justifyContent: "center" },
  full: { width: "100%", height: "100%" },
  close: { position: "absolute", right: 16, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(243,233,213,0.15)" },
  cap: { position: "absolute", left: 24, right: 24, textAlign: "center", color: "#E4D8BE", fontSize: 13 },
});
