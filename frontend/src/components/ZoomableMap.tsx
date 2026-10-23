/* eslint-disable react-hooks/immutability -- Reanimated-Shared-Values sind absichtlich veränderlich */
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDecay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { radius, spacing, useTheme } from "@/src/theme";

import { MapRect, MapZoomContext } from "./AnchoredMarker";
import { Icon } from "./Icon";

// Neuberechnung der Kollisionslage in Zoomstufen von je 25 %.
const ZOOM_STEP = 1.25;
const BTN = 44;
const BTN_GAP = 8;
const CTRL_W = BTN + spacing.md * 2;

export type MapHandle = { fitBox: (b: MapRect) => void; reset: () => void };

type Props = {
  width: number;
  height: number;
  children: React.ReactNode;
  /** Startausschnitt (Kartenpixel), z. B. die Orte der aktuellen Lektion */
  initial?: MapRect;
  /** „Alle relevanten Orte anzeigen“ */
  allBox?: MapRect;
  focus?: { x: number; y: number };
  maxZoom?: number;
  fit?: "cover" | "contain";
  controlsTop?: number;
  controlsBottom?: number;
  /** Fläche, die von eingeblendeten Panels belegt ist (Bildschirmpixel) */
  padBottom?: number;
  padRight?: number;
  /** Höhe der Bedienelemente am oberen Kartenrand (für Ausschnittsberechnung) */
  padTop?: number;
  /** Weitere fest eingeblendete Elemente (Bildschirmpixel), in denen keine Beschriftung liegen darf */
  reserved?: MapRect[];
  /** Dieser Kartenpunkt soll sichtbar bleiben (z. B. ausgewählter Ort bei geöffneter Infotafel) */
  keepVisible?: { x: number; y: number } | null;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  testID?: string;
  /** Ausschnitt und Zoom bleiben unter diesem Schlüssel erhalten (z. B. beim Zurückkehren von einer Station) */
  persistKey?: string;
  ref?: React.Ref<MapHandle>;
};

type Saved = { cx: number; cy: number; rel: number };
// Zuletzt genutzter Kartenausschnitt je Karte (bleibt während der App-Sitzung erhalten)
const VIEWS = new Map<string, Saved>();

/** Zoom- und verschiebbare Kartenfläche: Pinch-to-Zoom, Wischen mit Schwung, Doppeltipp, Bedienknöpfe. */
export function ZoomableMap(props: Props) {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  // Position und Zoom bleiben bei Größenänderung (Drehen, Vollbild) erhalten.
  const saved = useRef<Saved | null>(props.persistKey ? VIEWS.get(props.persistKey) ?? null : null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!vp || Math.abs(vp.w - width) > 1 || Math.abs(vp.h - height) > 1) setVp({ w: width, h: height });
  };
  return (
    <View style={styles.root} onLayout={onLayout} testID={props.testID}>
      {vp && vp.w > 0 && vp.h > 0 ? <Inner key={`${Math.round(vp.w)}x${Math.round(vp.h)}`} {...props} vw={vp.w} vh={vp.h} saved={saved} /> : null}
    </View>
  );
}

function Inner({
  width, height, focus, children, vw, vh, saved, initial, allBox, controlsTop, controlsBottom = 16, maxZoom = 4, fit = "cover",
  padBottom = 0, padRight = 0, padTop = 8, reserved, keepVisible, fullscreen, onToggleFullscreen, persistKey, ref,
}: Props & { vw: number; vh: number; saved: React.RefObject<Saved | null> }) {
  const { colors } = useTheme();
  // „cover“: Karte füllt die gesamte verfügbare Fläche, ohne Leerraum.
  const minS = fit === "contain" ? Math.min(vw / width, vh / height) : Math.max(vw / width, vh / height);
  const maxS = minS * maxZoom;
  const pB = useSharedValue(padBottom);
  const pR = useSharedValue(padRight);
  const clampX = (x: number, s: number) => {
    "worklet";
    const cw = width * s;
    if (cw <= vw) return (vw - cw) / 2;
    return Math.min(0, Math.max(vw - cw - pR.value, x));
  };
  const clampY = (y: number, s: number) => {
    "worklet";
    const ch = height * s;
    if (ch <= vh) return (vh - ch) / 2;
    return Math.min(0, Math.max(vh - ch - pB.value, y));
  };
  const clampS = (s: number) => Math.min(maxS, Math.max(minS, s));

  /** Ausschnitt so wählen, dass b in die freie Fläche (ohne Bedienelemente/Panels) passt. */
  const fitT = (b: MapRect) => {
    const left = spacing.sm;
    const fw = Math.max(80, vw - left - CTRL_W - pR.value);
    const fh = Math.max(80, vh - padTop - pB.value - spacing.sm);
    const s = clampS(Math.min(fw / Math.max(1, b.w), fh / Math.max(1, b.h)));
    return { s, x: clampX(left + fw / 2 - (b.x + b.w / 2) * s, s), y: clampY(padTop + fh / 2 - (b.y + b.h / 2) * s, s) };
  };
  const homeT = () => {
    if (initial) return fitT(initial);
    const fx = focus?.x ?? width / 2;
    const fy = focus?.y ?? height / 2;
    return { s: minS, x: clampX(vw / 2 - fx * minS, minS), y: clampY(vh / 2 - fy * minS, minS) };
  };
  const [init] = useState(() => {
    const sv = saved.current;
    if (sv) {
      const s = clampS(sv.rel * minS);
      return { s, x: clampX(vw / 2 - sv.cx * s, s), y: clampY(vh / 2 - sv.cy * s, s) };
    }
    return homeT();
  });

  const scale = useSharedValue(init.s);
  const tx = useSharedValue(init.x);
  const ty = useSharedValue(init.y);
  const start = useSharedValue({ s: init.s, x: 0, y: 0, fx: 0, fy: 0 });
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState({ tx: init.x, ty: init.y, s: init.s });

  const commit = (x: number, y: number, s: number) => {
    setSnap((p) => (Math.abs(p.tx - x) < 0.5 && Math.abs(p.ty - y) < 0.5 && Math.abs(p.s - s) < 1e-4 ? p : { tx: x, ty: y, s }));
    saved.current = { cx: (vw / 2 - x) / s, cy: (vh / 2 - y) / s, rel: s / minS };
    if (persistKey) VIEWS.set(persistKey, saved.current);
  };
  useEffect(() => {
    saved.current = { cx: (vw / 2 - init.x) / init.s, cy: (vh / 2 - init.y) / init.s, rel: init.s / minS };
  }, [saved, init, vw, vh, minS]);

  useAnimatedReaction(
    () => Math.floor(Math.log(scale.value / minS) / Math.log(ZOOM_STEP) + 1e-3),
    (b, prev) => {
      if (b !== prev) scheduleOnRN(setZoom, Math.pow(ZOOM_STEP, Math.max(0, b)));
    },
  );

  const animateTo = (t: { s: number; x: number; y: number }) => {
    scale.value = withTiming(t.s, { duration: 380 });
    tx.value = withTiming(t.x, { duration: 380 });
    ty.value = withTiming(t.y, { duration: 380 }, (fin) => {
      if (fin) scheduleOnRN(commit, t.x, t.y, t.s);
    });
  };

  useImperativeHandle(ref, () => ({ fitBox: (b) => animateTo(fitT(b)), reset: () => animateTo(homeT()) }));

  // Ausgewählten Ort bei geöffneter Infotafel sichtbar halten – Zoomstufe bleibt erhalten.
  const kvX = keepVisible?.x;
  const kvY = keepVisible?.y;
  useEffect(() => {
    pB.value = padBottom;
    pR.value = padRight;
    if (kvX == null || kvY == null) return;
    const s = scale.value;
    const sx = kvX * s + tx.value;
    const sy = kvY * s + ty.value;
    const m = 48;
    const right = vw - padRight - CTRL_W;
    const bottom = vh - padBottom;
    if (sx > m && sx < right - m && sy > padTop + m && sy < bottom - m) return;
    animateTo({ s, x: clampX(right / 2 - kvX * s, s), y: clampY(padTop + (bottom - padTop) / 2 - kvY * s, s) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kvX, kvY, padBottom, padRight]);

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
    })
    .onEnd(() => {
      scheduleOnRN(commit, tx.value, ty.value, scale.value);
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
      const done = (fin?: boolean) => {
        "worklet";
        if (fin) scheduleOnRN(commit, tx.value, ty.value, scale.value);
      };
      tx.value = withDecay({ velocity: e.velocityX, clamp: [cx, Math.max(cx, clampX(1e9, s))] }, done);
      ty.value = withDecay({ velocity: e.velocityY, clamp: [cy, Math.max(cy, clampY(1e9, s))] }, done);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const s0 = scale.value;
      const s = s0 * 1.8 > maxS ? minS : s0 * 1.8;
      const k = s / s0;
      const x = clampX(e.x - (e.x - tx.value) * k, s);
      const y = clampY(e.y - (e.y - ty.value) * k, s);
      scale.value = withTiming(s);
      tx.value = withTiming(x);
      ty.value = withTiming(y, undefined, (fin) => {
        if (fin) scheduleOnRN(commit, x, y, s);
      });
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const zoomBy = (factor: number) => {
    const s0 = scale.value;
    const s = clampS(s0 * factor);
    const k = s / s0;
    const cx = (vw - pR.value) / 2;
    const cy = (vh - pB.value) / 2;
    animateTo({ s, x: clampX(cx - (cx - tx.value) * k, s), y: clampY(cy - (cy - ty.value) * k, s) });
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const buttons = [
    { icon: "plus", id: "map-zoom-in", label: "Hineinzoomen", on: () => zoomBy(1.5) },
    { icon: "minus", id: "map-zoom-out", label: "Herauszoomen", on: () => zoomBy(1 / 1.5) },
    ...(focus ? [{ icon: "crosshair", id: "map-current-station", label: "Zur aktuellen Lernstation", on: () => {
      const s = clampS(minS * 2.2);
      animateTo({ s, x: clampX(vw / 2 - focus.x * s, s), y: clampY((vh - pB.value) / 2 - focus.y * s, s) });
    } }] : []),
    ...(allBox ? [{ icon: "map", id: "map-fit-all", label: "Alle relevanten Orte anzeigen", on: () => animateTo(fitT(allBox)) }] : []),
    { icon: "rotate-ccw", id: "map-reset-view", label: "Ansicht zurücksetzen", on: () => animateTo(homeT()) },
    ...(onToggleFullscreen ? [{ icon: fullscreen ? "minimize-2" : "maximize-2", id: "map-fullscreen", label: fullscreen ? "Vollbild verlassen" : "Karte im Vollbild", on: onToggleFullscreen }] : []),
  ];
  // Sehr flache Ansichten (Querformat): Bedienknöpfe in mehrere Spalten umbrechen
  const fitRows = Math.max(1, Math.floor((vh - (controlsTop ?? spacing.sm) - spacing.sm + BTN_GAP) / (BTN + BTN_GAP)));
  const cols = Math.ceil(buttons.length / fitRows);
  const rows = Math.ceil(buttons.length / cols);
  const ctrlH = rows * (BTN + BTN_GAP);
  const ctrlW = cols * BTN + (cols - 1) * BTN_GAP;
  const ctrlY = controlsTop ?? vh - controlsBottom - ctrlH;
  const ctx = useMemo(() => {
    const r: MapRect[] = [{ x: vw - CTRL_W - ctrlW + BTN, y: ctrlY - 4, w: CTRL_W + ctrlW - BTN, h: ctrlH + 8 }, ...(reserved ?? [])];
    if (padBottom) r.push({ x: 0, y: vh - padBottom, w: vw, h: padBottom });
    if (padRight) r.push({ x: vw - padRight, y: 0, w: padRight, h: vh });
    return { scale, minS, zoom, snap, vw, vh, reserved: r };
  }, [scale, minS, zoom, snap, vw, vh, ctrlY, ctrlH, ctrlW, reserved, padBottom, padRight]);

  return (
    <>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Animated.View style={[{ width, height, transformOrigin: "left top" }, style]}>
            <MapZoomContext.Provider value={ctx}>{children}</MapZoomContext.Provider>
          </Animated.View>
        </View>
      </GestureDetector>
      <View style={[styles.controls, { top: ctrlY, right: padRight + spacing.md, width: ctrlW, flexDirection: cols > 1 ? "row" : "column", flexWrap: "wrap" }]}>
        {buttons.map((b) => (
          <Pressable
            key={b.id}
            testID={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.label}
            onPress={b.on}
            hitSlop={2}
            style={({ pressed }) => [styles.btn, { backgroundColor: colors.glass, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name={b.icon} size={19} color={colors.onSurface} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  controls: { position: "absolute", gap: BTN_GAP, pointerEvents: "box-none" },
  btn: { width: BTN, height: BTN, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
