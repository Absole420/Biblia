import React from "react";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

import { Avatar } from "@/src/lib/avatar";

const INK = "#3A2A1C"; // Konturfarbe der Illustration (in beiden Modi gleich)
const SHIRT: Record<Avatar["gender"], string> = { female: "#C0573E", male: "#3F7FA7", diverse: "#7E5B82" };

// Haarbedeckende Kopfbedeckungen: vorderes Deckhaar wird darunter nur als Pony gezeigt.
const COVERS_TOP = ["cap", "beanie", "straw", "headscarf", "turban"];

const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, "0")}`;
};

/**
 * 2D-Avatar aus abgestimmten Vektorebenen (Koordinatensystem 200 × 220):
 * Rückhaar → Körper → Ohren → Kopf → Gesicht → Deckhaar → Brille → Kopfbedeckung.
 * mode "head" zeigt einen runden Kopf-Ausschnitt für Marker und kleine Anzeigen.
 */
export function AvatarView({ a, size = 160, mode = "full" }: { a: Avatar; size?: number; mode?: "full" | "head" }) {
  const child = a.age === "child";
  const senior = a.age === "senior";
  const hc = a.hairColor;
  const top = COVERS_TOP.includes(a.hat);
  const longBack = ["long", "braids", "bob", "curly"].includes(a.hair) && a.hat !== "headscarf";
  const eyeR = child ? 7.5 : 6.5;
  const shoulders = a.gender === "male" ? 78 : a.gender === "female" ? 64 : 70;
  const vb = mode === "head" ? "30 22 140 140" : "0 0 200 220";
  const fr = [0, 6, 12, 20][a.freckles];
  const freckles = Array.from({ length: fr }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const k = Math.floor(i / 2);
    return [100 + side * (18 + ((k * 7) % 16)), 112 + ((k * 5) % 12) - 4];
  });
  return (
    <Svg width={size} height={mode === "head" ? size : size * 1.1} viewBox={vb}>
      <G>
        {/* Rückhaar */}
        {longBack && a.hair === "long" ? <Path d="M52 92 Q48 175 70 190 L130 190 Q152 175 148 92 Z" fill={hc} /> : null}
        {longBack && a.hair === "bob" ? <Path d="M50 90 Q48 140 62 150 L138 150 Q152 140 150 90 Z" fill={hc} /> : null}
        {longBack && a.hair === "curly" ? <G fill={hc}>{[[56, 110], [62, 135], [144, 110], [138, 135], [70, 150], [130, 150]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={16} />)}</G> : null}
        {longBack && a.hair === "braids" ? <G fill={hc}>{[0, 1, 2, 3].map((i) => <G key={i}><Ellipse cx={58} cy={118 + i * 18} rx={9} ry={10} /><Ellipse cx={142} cy={118 + i * 18} rx={9} ry={10} /></G>)}</G> : null}
        {a.hair === "bun" && !top ? <Circle cx={100} cy={34} r={18} fill={hc} stroke={INK} strokeWidth={1.5} /> : null}
        {a.hat === "headscarf" ? <Path d="M44 96 Q40 40 100 32 Q160 40 156 96 Q160 165 128 182 L72 182 Q40 165 44 96 Z" fill={a.hatColor} stroke={INK} strokeWidth={2} /> : null}
        {/* Körper */}
        <Path d={`M${100 - shoulders} 220 Q${100 - shoulders} 172 100 166 Q${100 + shoulders} 172 ${100 + shoulders} 220 Z`} fill={SHIRT[a.gender]} stroke={INK} strokeWidth={2} />
        <Path d="M86 152 L86 170 Q100 180 114 170 L114 152 Z" fill={shade(a.skin, 0.9)} />
        {/* Ohren */}
        {a.hat !== "headscarf" ? <><Ellipse cx={55} cy={102} rx={8} ry={11} fill={a.skin} stroke={INK} strokeWidth={1.5} /><Ellipse cx={145} cy={102} rx={8} ry={11} fill={a.skin} stroke={INK} strokeWidth={1.5} /></> : null}
        {/* Kopf */}
        <Ellipse cx={100} cy={child ? 100 : 98} rx={child ? 46 : 44} ry={child ? 50 : 54} fill={a.skin} stroke={INK} strokeWidth={2} />
        {child ? <><Circle cx={74} cy={120} r={8} fill="#F08A8A" opacity={0.35} /><Circle cx={126} cy={120} r={8} fill="#F08A8A" opacity={0.35} /></> : null}
        {/* Altersmerkmale */}
        {senior ? (
          <G stroke={shade(a.skin, 0.7)} strokeWidth={1.4} fill="none" strokeLinecap="round">
            <Path d="M80 66 Q100 61 120 66" /><Path d="M84 72 Q100 68 116 72" />
            <Path d="M66 96 l-5 -3 M66 100 l-6 0 M134 96 l5 -3 M134 100 l6 0" />
            <Path d="M74 106 Q80 109 86 106 M114 106 Q120 109 126 106" />
            <Path d="M84 124 Q82 134 88 140 M116 124 Q118 134 112 140" />
          </G>
        ) : a.age === "adult" ? <Path d="M86 126 Q84 133 89 138 M114 126 Q116 133 111 138" stroke={shade(a.skin, 0.8)} strokeWidth={1.1} fill="none" /> : null}
        {/* Sommersprossen */}
        {freckles.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={1.6} fill={shade(a.skin, 0.62)} />)}
        {/* Augen + Brauen */}
        {[80, 120].map((x) => (
          <G key={x}>
            <Ellipse cx={x} cy={98} rx={eyeR + 3} ry={eyeR} fill="#FFFFFF" stroke={INK} strokeWidth={1.2} />
            <Circle cx={x} cy={98} r={eyeR * 0.68} fill={a.eyes} />
            <Circle cx={x} cy={98} r={eyeR * 0.32} fill="#111111" />
            <Circle cx={x + 1.8} cy={96} r={1.4} fill="#FFFFFF" />
            <Path d={`M${x - 9} ${86 - (child ? 0 : 1)} Q${x} ${80} ${x + 9} ${86}`} stroke={a.hair === "none" || a.hairColor === "#F2F2F2" ? shade(a.skin, 0.55) : hc} strokeWidth={3} fill="none" strokeLinecap="round" />
            {a.gender === "female" ? <Path d={`M${x + (x < 100 ? -9 : 9)} 96 l${x < 100 ? -3 : 3} -3`} stroke={INK} strokeWidth={1.4} /> : null}
          </G>
        ))}
        {/* Nase */}
        {{
          small: <Path d="M98 108 Q96 116 100 117 Q104 116 102 114" stroke={shade(a.skin, 0.6)} strokeWidth={2} fill="none" strokeLinecap="round" />,
          round: <Ellipse cx={100} cy={115} rx={6} ry={5} fill={shade(a.skin, 0.88)} stroke={shade(a.skin, 0.6)} strokeWidth={1.5} />,
          straight: <Path d="M100 100 L97 116 Q100 119 104 116" stroke={shade(a.skin, 0.6)} strokeWidth={2} fill="none" strokeLinecap="round" />,
          wide: <Path d="M94 114 Q92 119 97 119 Q100 121 103 119 Q108 119 106 114" stroke={shade(a.skin, 0.6)} strokeWidth={2} fill="none" strokeLinecap="round" />,
        }[a.nose]}
        {/* Lippen */}
        {{
          thin: <Path d="M89 131 Q100 135 111 131" stroke={a.lipColor} strokeWidth={3} fill="none" strokeLinecap="round" />,
          full: <Path d="M88 130 Q94 126 100 129 Q106 126 112 130 Q106 139 100 139 Q94 139 88 130 Z" fill={a.lipColor} stroke={shade(a.lipColor, 0.75)} strokeWidth={1} />,
          smile: <Path d="M87 128 Q100 142 113 128 Q100 134 87 128 Z" fill={a.lipColor} stroke={shade(a.lipColor, 0.75)} strokeWidth={1} />,
          heart: <Path d="M90 130 Q95 125 100 129 Q105 125 110 130 Q104 137 100 138 Q96 137 90 130 Z" fill={a.lipColor} stroke={shade(a.lipColor, 0.75)} strokeWidth={1} />,
        }[a.lips]}
        {/* Deckhaar */}
        {a.hair !== "none" ? (top ? (
          ["buzz", "none"].includes(a.hair) ? null : <Path d="M64 74 Q80 66 100 70 Q120 66 136 74 L136 80 Q100 74 64 80 Z" fill={hc} />
        ) : {
          buzz: <Path d="M58 84 Q58 46 100 44 Q142 46 142 84 Q120 66 100 68 Q80 66 58 84 Z" fill={hc} opacity={0.85} />,
          short: <Path d="M55 92 Q50 40 100 38 Q150 40 145 92 Q140 70 124 66 Q100 76 72 66 Q60 72 55 92 Z" fill={hc} stroke={INK} strokeWidth={1.5} />,
          side: <Path d="M55 96 Q48 38 104 38 Q152 42 145 92 Q138 72 120 70 Q96 70 80 60 Q66 76 55 96 Z" fill={hc} stroke={INK} strokeWidth={1.5} />,
          curly: <G fill={hc} stroke={INK} strokeWidth={1}>{[[60, 80], [70, 58], [88, 46], [108, 44], [128, 52], [140, 72], [78, 70], [120, 68], [100, 60]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={14} />)}</G>,
          long: <Path d="M52 110 Q46 38 100 38 Q154 38 148 110 Q140 74 118 66 Q100 78 82 66 Q60 74 52 110 Z" fill={hc} stroke={INK} strokeWidth={1.5} />,
          bob: <Path d="M50 120 Q44 40 100 38 Q156 40 150 120 Q146 82 132 72 Q100 82 68 72 Q54 82 50 120 Z" fill={hc} stroke={INK} strokeWidth={1.5} />,
          bun: <Path d="M56 90 Q52 46 100 44 Q148 46 144 90 Q132 64 100 62 Q68 64 56 90 Z" fill={hc} stroke={INK} strokeWidth={1.5} />,
          braids: <Path d="M54 98 Q48 40 100 40 Q152 40 146 98 Q138 70 100 68 Q62 70 54 98 Z" fill={hc} stroke={INK} strokeWidth={1.5} />,
        }[a.hair]) : null}
        {/* Brille */}
        {a.glasses !== "none" ? (
          <G stroke={a.glassesColor} strokeWidth={3} fill="#FFFFFF" fillOpacity={0.12}>
            {[80, 120].map((x) => ({
              round: <Circle key={x} cx={x} cy={98} r={13} />,
              square: <Rect key={x} x={x - 14} y={87} width={28} height={22} rx={4} />,
              cat: <Path key={x} d={x < 100 ? `M${x - 15} 90 L${x + 13} 92 Q${x + 12} 110 ${x} 110 Q${x - 13} 109 ${x - 15} 90 Z` : `M${x + 15} 90 L${x - 13} 92 Q${x - 12} 110 ${x} 110 Q${x + 13} 109 ${x + 15} 90 Z`} />,
              aviator: <Path key={x} d={`M${x - 14} 90 L${x + 14} 90 Q${x + 14} 112 ${x} 112 Q${x - 14} 112 ${x - 14} 90 Z`} />,
            }[a.glasses as "round" | "square" | "cat" | "aviator"]))}
            <Path d="M93 96 Q100 92 107 96" fill="none" />
            <Path d="M66 95 L56 98 M134 95 L144 98" fill="none" />
          </G>
        ) : null}
        {/* Kopfbedeckung */}
        {{
          none: null,
          kippa: <Path d="M80 52 Q100 38 120 52 Q100 48 80 52 Z" fill={a.hatColor} stroke={INK} strokeWidth={1.5} />,
          cap: <G><Path d="M54 80 Q54 34 100 34 Q146 34 146 80 Z" fill={a.hatColor} stroke={INK} strokeWidth={2} /><Path d="M54 80 Q100 70 150 80 Q178 84 176 92 Q140 84 54 86 Z" fill={shade(a.hatColor, 0.8)} stroke={INK} strokeWidth={2} /><Circle cx={100} cy={36} r={4} fill={shade(a.hatColor, 0.7)} /></G>,
          beanie: <G><Path d="M54 82 Q52 30 100 30 Q148 30 146 82 Z" fill={a.hatColor} stroke={INK} strokeWidth={2} /><Rect x={50} y={72} width={100} height={16} rx={8} fill={shade(a.hatColor, 0.8)} stroke={INK} strokeWidth={2} /><Circle cx={100} cy={28} r={9} fill={shade(a.hatColor, 1.15)} stroke={INK} strokeWidth={1.5} /></G>,
          straw: <G><Ellipse cx={100} cy={78} rx={78} ry={14} fill="#E3C07A" stroke={INK} strokeWidth={2} /><Path d="M64 78 Q64 36 100 36 Q136 36 136 78 Z" fill="#E8C984" stroke={INK} strokeWidth={2} /><Rect x={64} y={64} width={72} height={10} fill={a.hatColor} /></G>,
          headscarf: <Path d="M52 92 Q50 46 100 42 Q150 46 148 92 Q130 66 100 64 Q70 66 52 92 Z" fill={shade(a.hatColor, 0.9)} stroke={INK} strokeWidth={1.5} />,
          turban: <G><Path d="M52 84 Q48 30 100 28 Q152 30 148 84 Q100 70 52 84 Z" fill={a.hatColor} stroke={INK} strokeWidth={2} /><Path d="M58 70 Q100 40 142 70 M60 56 Q100 36 136 52" stroke={shade(a.hatColor, 0.75)} strokeWidth={3} fill="none" /></G>,
        }[a.hat]}
      </G>
    </Svg>
  );
}
