import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { placeArt, SPRITES } from "@/src/data/atlasAssets";
import { PlaceKind, PlaceTier } from "@/src/data/placeKinds";
import { GeoPlace, projectGeo, ThemeMap } from "@/src/data/themeMaps";

import { useMapZoom } from "./AnchoredMarker";
import { atlasSpots } from "./MapDecor";

// Living Atlas · Ebene 3 (Vegetation, Schiffe) und Ebene 5 (Ortsillustrationen).
// Alles ist geografisch verankert; Animationen verändern nie die Lage eines Ortes.

/** Bildschirmbreite der Ortsillustration je Ebene beim Überblick (wächst beim Zoomen gedämpft mit). */
const ART_W: Record<PlaceTier, number> = { 1: 80, 2: 52, 3: 40 };
/** Ab dieser Zoomstufe erscheinen Illustrationen der jeweiligen Ebene. */
export const ART_ZOOM: Record<PlaceTier, number> = { 1: 0, 2: 2.3, 3: 3.4 };

function useSway(on: boolean, amp: number, duration: number) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = on ? withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true) : 0;
  }, [on, v, duration]);
  return { v, amp };
}

function Tree({ x, y, w, palm, sway }: { x: number; y: number; w: number; palm: boolean; sway: { v: SharedValue<number>; amp: number } }) {
  const art = palm ? SPRITES.palms : SPRITES.olives;
  const h = w / art.ratio;
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${(sway.v.value - 0.5) * sway.amp}deg` }] }));
  return (
    <Animated.View style={[styles.abs, { left: x - w / 2, top: y - h * 0.9, width: w, height: h, transformOrigin: "center bottom", pointerEvents: "none" }, st]}>
      <Image source={art.src} style={{ width: w, height: h }} resizeMode="contain" />
    </Animated.View>
  );
}

function Ship({ x, y, w, drift, motion, i }: { x: number; y: number; w: number; drift: number; motion: boolean; i: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = motion ? withRepeat(withTiming(1, { duration: 38000 + i * 7000, easing: Easing.inOut(Easing.quad) }), -1, true) : 0;
  }, [motion, t, i]);
  const h = w / SPRITES.ship.ratio;
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: (t.value - 0.5) * drift }, { translateY: Math.sin(t.value * Math.PI * 8) * w * 0.02 }] }));
  return (
    <Animated.View style={[styles.abs, { left: x - w / 2, top: y - h * 0.8, width: w, height: h, pointerEvents: "none" }, st]}>
      <Image source={SPRITES.ship.src} style={{ width: w, height: h }} resizeMode="contain" />
    </Animated.View>
  );
}

/** Gemalte Bäume (Ölbäume, Zypressen, Palmen) und langsam segelnde Schiffe. */
export function AtlasLife({ map, k, motion }: { map: ThemeMap; k: number; motion: boolean }) {
  const { zoom } = useMapZoom();
  const sway = useSway(motion, 3, 4200);
  const spots = React.useMemo(() => atlasSpots(map), [map]);
  const kd = k / Math.sqrt(zoom);
  return (
    <>
      {/* Bäume nur auf Karten im Landmaßstab; auf Großraumkarten wären sie unmaßstäblich groß */}
      {map.pxPerDeg >= 200 && spots.trees.map((t, i) => {
        const p = projectGeo(map, t.lat, t.lon);
        return <Tree key={"t" + i} x={p.x} y={p.y} w={(t.palm ? 34 : 40) * kd} palm={t.palm} sway={sway} />;
      })}
      {spots.ships.map((s, i) => {
        const p = projectGeo(map, s.lat, s.lon);
        return <Ship key={"s" + i} i={i} x={p.x} y={p.y} w={Math.min(38 * kd, 70)} drift={90 * Math.min(k, 1.5)} motion={motion} />;
      })}
    </>
  );
}

/** Freigestellte Ortsillustration, unten mittig am geografischen Punkt verankert. */
export function PlaceArtView({ place, ax, ay, kind, tier, shown, onPress, glow, dim }: { place: GeoPlace; ax: number; ay: number; kind: PlaceKind; tier: PlaceTier; shown: boolean; onPress: () => void; glow?: boolean; dim?: boolean }) {
  const { scale, minS } = useMapZoom();
  const art = placeArt(place.id, kind, tier);
  const w = ART_W[tier];
  const h = w / art.ratio;
  const op = useSharedValue(shown ? 1 : 0);
  const lift = useSharedValue(0);
  useEffect(() => {
    op.value = withTiming(shown ? 1 : 0, { duration: 350 });
  }, [shown, op]);
  useEffect(() => {
    lift.value = glow ? withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true) : withTiming(0, { duration: 300 });
  }, [glow, lift]);
  const st = useAnimatedStyle(() => {
    const z = minS > 0 ? scale.value / minS : 1;
    const f = Math.sqrt(Math.max(1, z)) / scale.value; // wächst beim Zoomen gedämpft mit
    return { opacity: op.value, transform: [{ scale: f * (1 + lift.value * 0.06) }, { translateX: -w / 2 }, { translateY: -h * 0.92 }] };
  });
  return (
    <Animated.View style={[styles.abs, { left: ax, top: ay, width: w, height: h, transformOrigin: "left top", pointerEvents: "none" }, st]}>
      <Pressable onPress={onPress} disabled={!shown} testID={`place-art-${place.id}`} accessibilityElementsHidden importantForAccessibility="no" style={{ flex: 1 }}>
        <Image source={art.src} style={{ width: w, height: h, opacity: dim ? 0.82 : 1 }} resizeMode="contain" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ abs: { position: "absolute" } });
