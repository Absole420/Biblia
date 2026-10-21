import React, { useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDecay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { radius, spacing, useTheme } from "@/src/theme";

import { MapZoomContext } from "./AnchoredMarker";
import { Icon } from "./Icon";

// Neuberechnung der Kollisionslage in Zoomstufen von je 25 %.
const ZOOM_STEP = 1.25;

type Props = {
  width: number;
  height: number;
  focus?: { x: number; y: number };
  children: React.ReactNode;
  controlsBottom?: number;
  maxZoom?: number;
  fit?: "cover" | "contain";
  testID?: string;
};

/** Zoom- und verschiebbare Kartenfläche: Pinch-to-Zoom, Wischen mit Schwung, Doppeltipp, Zoomknöpfe. */
export function ZoomableMap(props: Props) {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!vp || Math.abs(vp.w - width) > 1 || Math.abs(vp.h - height) > 1) setVp({ w: width, h: height });
  };
  return (
    <View style={styles.root} onLayout={onLayout} testID={props.testID}>
      {vp ? <Inner key={`${Math.round(vp.w)}x${Math.round(vp.h)}`} {...props} vw={vp.w} vh={vp.h} /> : null}
    </View>
  );
}

function Inner({ width, height, focus, children, vw, vh, controlsBottom = 16, maxZoom = 4, fit = "cover" }: Props & { vw: number; vh: number }) {
  const { colors } = useTheme();
  const minS = fit === "contain" ? Math.min(vw / width, vh / height) : Math.max(vw / width, vh / height);
  const maxS = minS * maxZoom;
  const initS = minS;
  const clampX = (x: number, s: number) => {
    "worklet";
    const cw = width * s;
    if (cw <= vw) return (vw - cw) / 2;
    return Math.min(0, Math.max(vw - cw, x));
  };
  const clampY = (y: number, s: number) => {
    "worklet";
    const ch = height * s;
    if (ch <= vh) return (vh - ch) / 2;
    return Math.min(0, Math.max(vh - ch, y));
  };
  const fx = focus?.x ?? width / 2;
  const fy = focus?.y ?? height / 2;
  const scale = useSharedValue(initS);
  const tx = useSharedValue(clampX(vw / 2 - fx * initS, initS));
  const ty = useSharedValue(clampY(vh / 2 - fy * initS, initS));
  const start = useSharedValue({ s: initS, x: 0, y: 0, fx: 0, fy: 0 });
  const [zoom, setZoom] = useState(1);
  useAnimatedReaction(
    () => Math.floor(Math.log(scale.value / minS) / Math.log(ZOOM_STEP) + 1e-3),
    (b, prev) => {
      if (b !== prev) scheduleOnRN(setZoom, Math.pow(ZOOM_STEP, Math.max(0, b)));
    },
  );
  const zoomCtx = { scale, minS, zoom };

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      start.value = { s: scale.value, x: tx.value, y: ty.value, fx: e.focalX, fy: e.focalY };
    })
    .onUpdate((e) => {
      const s = Math.min(maxS, Math.max(minS, start.value.s * e.scale));
      const k = s / start.value.s;
      scale.value = s;
      tx.value = clampX(e.focalX - (start.value.fx - start.value.x) * k, s);
      ty.value = clampY(e.focalY - (start.value.fy - start.value.y) * k, s);
    });

  const pan = Gesture.Pan()
    .minDistance(6)
    .averageTouches(true)
    .onStart(() => {
      start.value = { s: scale.value, x: tx.value, y: ty.value, fx: 0, fy: 0 };
    })
    .onUpdate((e) => {
      tx.value = clampX(start.value.x + e.translationX, scale.value);
      ty.value = clampY(start.value.y + e.translationY, scale.value);
    })
    .onEnd((e) => {
      const s = scale.value;
      const cx = clampX(-1e9, s);
      const cy = clampY(-1e9, s);
      tx.value = withDecay({ velocity: e.velocityX, clamp: [cx, Math.max(cx, clampX(1e9, s))] });
      ty.value = withDecay({ velocity: e.velocityY, clamp: [cy, Math.max(cy, clampY(1e9, s))] });
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const s0 = scale.value;
      const s = s0 * 1.8 > maxS ? minS : s0 * 1.8;
      const k = s / s0;
      scale.value = withTiming(s);
      tx.value = withTiming(clampX(e.x - (e.x - tx.value) * k, s));
      ty.value = withTiming(clampY(e.y - (e.y - ty.value) * k, s));
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const zoomBy = (factor: number) => {
    const s0 = scale.value;
    const s = Math.min(maxS, Math.max(minS, s0 * factor));
    const k = s / s0;
    const cx = vw / 2;
    const cy = vh / 2;
    scale.value = withTiming(s);
    tx.value = withTiming(clampX(cx - (cx - tx.value) * k, s));
    ty.value = withTiming(clampY(cy - (cy - ty.value) * k, s));
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Animated.View style={[{ width, height, transformOrigin: "left top" }, style]}>
            <MapZoomContext.Provider value={zoomCtx}>{children}</MapZoomContext.Provider>
          </Animated.View>
        </View>
      </GestureDetector>
      <View style={[styles.controls, { bottom: controlsBottom }]}>
        {[
          { icon: "plus", f: 1.5, id: "map-zoom-in", label: "Hineinzoomen" },
          { icon: "minus", f: 1 / 1.5, id: "map-zoom-out", label: "Herauszoomen" },
        ].map((b) => (
          <Pressable
            key={b.id}
            testID={b.id}
            accessibilityLabel={b.label}
            onPress={() => zoomBy(b.f)}
            style={({ pressed }) => [styles.btn, { backgroundColor: colors.glass, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name={b.icon} size={20} color={colors.onSurface} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  controls: { position: "absolute", right: spacing.lg, gap: spacing.sm, pointerEvents: "box-none" },
  btn: { width: 46, height: 46, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
