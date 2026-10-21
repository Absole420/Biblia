import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { radius, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

/** Herz zum Merken als Favorit. Gefüllt = Favorit (Feather hat kein gefülltes Herz → farbiger Kreis). */
export function FavHeart({ active, onPress, label, testID, size = 44 }: { active: boolean; onPress: () => void; label: string; testID: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={active ? `${label} aus Favoriten entfernen` : `${label} als Favorit merken`}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, backgroundColor: active ? colors.error : colors.surfaceSecondary, borderColor: active ? colors.error : colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Animated.View key={active ? "on" : "off"} entering={ZoomIn.duration(220)}>
        <Icon name="heart" size={size * 0.45} color={active ? colors.surface : colors.onSurface} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
