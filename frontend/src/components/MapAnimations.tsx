import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Ellipse, Path } from "react-native-svg";

/** Langsam ziehende Wolke (in Kartenkoordinaten). */
export function Cloud({ x, y, w, duration = 22000, drift = 120, color, opacity = 0.75 }: { x: number; y: number; w: number; duration?: number; drift?: number; color: string; opacity?: number }) {
  const t = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) { t.value = 0.5; return; }
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration, t, still]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * drift }] }));
  const h = w * 0.45;
  return (
    <Animated.View style={[{ pointerEvents: "none" }, { position: "absolute", left: x, top: y, width: w, height: h, opacity }, st]}>
      <Svg width={w} height={h} viewBox="0 0 100 45">
        <Path d="M10 38 Q2 38 4 30 Q6 22 16 24 Q18 10 34 12 Q42 2 56 8 Q70 2 76 16 Q92 14 94 28 Q100 38 88 38 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** Pulsierender Lichtring für die nächste erreichbare Station. */
export function PulseRing({ size, color }: { size: number; color: string }) {
  const t = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) { t.value = 0.5; return; }
    t.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [t, still]);
  const st = useAnimatedStyle(() => ({ opacity: 0.7 * (1 - t.value), transform: [{ scale: 1 + t.value * 0.7 }] }));
  return <Animated.View style={[{ pointerEvents: "none" }, StyleSheet.absoluteFill, { borderRadius: size, borderWidth: 4, borderColor: color }, st]} />;
}

/** Flackernde Flamme (Fackel, Altarfeuer). */
export function Flame({ x, y, size = 24, color, core }: { x: number; y: number; size?: number; color: string; core: string }) {
  const t = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) { t.value = 0.5; return; }
    t.value = withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.3, { duration: 260 }), withTiming(0.8, { duration: 320 })), -1, true);
  }, [t, still]);
  const st = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.85 + t.value * 0.25 }, { scaleX: 1 - t.value * 0.1 }], opacity: 0.8 + t.value * 0.2 }));
  return (
    <Animated.View style={[{ pointerEvents: "none" }, { position: "absolute", left: x - size / 2, top: y - size, width: size, height: size, transformOrigin: "bottom" }, st]}>
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path d="M10 1 Q15 7 14 12 Q14 19 10 19 Q6 19 6 12 Q5 7 10 1 Z" fill={color} />
        <Path d="M10 8 Q12.5 11 12 14 Q11.5 17.5 10 17.5 Q8.5 17.5 8 14 Q7.5 11 10 8 Z" fill={core} />
      </Svg>
    </Animated.View>
  );
}

/** Glitzernde Wasserwellen. */
export function Shimmer({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  const t = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) { t.value = 0.5; return; }
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t, still]);
  const st = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.6, transform: [{ translateX: t.value * 14 }] }));
  return (
    <Animated.View style={[{ pointerEvents: "none" }, { position: "absolute", left: x, top: y, width: w, height: 16 }, st]}>
      <Svg width={w} height={16} viewBox={`0 0 ${w} 16`}>
        <Path d={`M0 8 Q${w * 0.125} 0 ${w * 0.25} 8 T${w * 0.5} 8 T${w * 0.75} 8 T${w} 8`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

/** Sanfter goldener Lichtschein. */
export function Glow({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const t = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) { t.value = 0.5; return; }
    t.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t, still]);
  const st = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.35 }));
  return (
    <Animated.View style={[{ pointerEvents: "none" }, { position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2 }, st]}>
      <Svg width={r * 2} height={r * 2}>
        <Ellipse cx={r} cy={r} rx={r} ry={r} fill={color} opacity={0.35} />
        <Ellipse cx={r} cy={r} rx={r * 0.6} ry={r * 0.6} fill={color} opacity={0.45} />
      </Svg>
    </Animated.View>
  );
}

export const AnimLayer = ({ children }: { children: React.ReactNode }) => (
  <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
    {children}
  </View>
);
