import React, { createContext, useContext, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Placed } from "@/src/lib/mapLayout";

// Zoomzustand der umgebenden Karte (wird von ZoomableMap bereitgestellt).
export type MapZoom = { scale: SharedValue<number>; minS: number; zoom: number };
export const MapZoomContext = createContext<MapZoom | null>(null);

export function useMapZoom(): MapZoom {
  const fallback = useSharedValue(1);
  return useContext(MapZoomContext) ?? { scale: fallback, minS: 1, zoom: 1 };
}

const ease = { duration: 480, easing: Easing.out(Easing.cubic) };

type Props = {
  ax: number;
  ay: number;
  p: Placed;
  size: number; // Markergröße bei Zoom 1 (Kartenpixel)
  labelW?: number; // Beschriftungsbreite bei Zoom 1
  lineColor: string;
  dotSize: number;
  children: React.ReactNode;
  label?: React.ReactNode;
};

/**
 * Marker mit konstanter Bildschirmgröße. Er gleitet sanft an die berechnete Position;
 * ist er vom geografischen Anker verschoben, zeigen Punkt + Linie den echten Ort.
 */
export function AnchoredMarker({ ax, ay, p, size, labelW = 0, lineColor, dotSize, children, label }: Props) {
  const { scale, minS, zoom } = useMapZoom();
  const x = useSharedValue(p.x);
  const y = useSharedValue(p.y);
  const lx = useSharedValue(p.lx * zoom);
  const ly = useSharedValue(p.ly * zoom);
  const show = useSharedValue(p.displaced ? 1 : 0);

  useEffect(() => {
    x.value = withTiming(p.x, ease);
    y.value = withTiming(p.y, ease);
    lx.value = withTiming(p.lx * zoom, ease);
    ly.value = withTiming(p.ly * zoom, ease);
    show.value = withTiming(p.displaced ? 1 : 0, ease);
  }, [p.x, p.y, p.lx, p.ly, p.displaced, zoom, x, y, lx, ly, show]);

  const line = useAnimatedStyle(() => {
    const dx = x.value - ax;
    const dy = y.value - ay;
    return { width: Math.hypot(dx, dy), opacity: show.value * 0.75, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] };
  });
  const dot = useAnimatedStyle(() => ({ opacity: show.value, transform: [{ scale: minS / scale.value }] }));
  const box = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - size / 2 }, { translateY: y.value - size / 2 }, { scale: minS / scale.value }],
  }));
  const lab = useAnimatedStyle(() => ({ transform: [{ translateX: size / 2 + lx.value }, { translateY: size / 2 + ly.value }] }));
  const align = p.lx >= 0 ? "flex-start" : p.lx + labelW / zoom <= 0 ? "flex-end" : "center";

  return (
    <>
      <Animated.View style={[styles.line, { left: ax, top: ay - dotSize * 0.12, height: dotSize * 0.24, backgroundColor: lineColor }, line]} />
      <Animated.View style={[styles.abs, styles.none, { left: ax - dotSize / 2, top: ay - dotSize / 2, width: dotSize, height: dotSize, borderRadius: dotSize, backgroundColor: lineColor }, dot]} />
      <Animated.View style={[styles.abs, styles.box, { width: size, height: size }, box]}>
        {label ? <Animated.View style={[styles.abs, styles.none, { left: 0, top: 0, width: labelW, alignItems: align }, lab]}>{label}</Animated.View> : null}
        {children}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  box: { left: 0, top: 0, pointerEvents: "box-none" },
  none: { pointerEvents: "none" },
  line: { position: "absolute", transformOrigin: "left center", pointerEvents: "none" },
});
