import React from "react";
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";

import { Certainty } from "@/src/data/types";
import { PlaceKind, PlaceTier } from "@/src/data/placeKinds";
import { useTheme } from "@/src/theme";

// Illustrierte Atlas-Marker: kleine Bildzeichen auf einer Pergament-Medaille mit weichem Schatten.
// Randart zeigt die Gewissheit (durchgezogen · gepunktet = Tradition · gestrichelt = umstritten).
type Props = { kind: PlaceKind; tier: PlaceTier; certainty: Certainty; events?: boolean; selected?: boolean; size: number };

export function PlaceGlyph({ kind, tier, certainty, events, selected, size }: Props) {
  const { colors } = useTheme();
  const ink = colors.mapInk;
  const gold = colors.brandPrimary;
  const id = `g${kind}${tier}`;
  const dash = certainty === "disputed" ? "3 2.2" : certainty === "traditional" ? "0.6 2.2" : undefined;
  const ring = selected ? colors.stationNarrative : tier === 1 ? gold : ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <RadialGradient id={id} cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor={colors.surface} stopOpacity={1} />
          <Stop offset="1" stopColor={colors.surfaceTertiary} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      {/* weicher Schatten */}
      <Ellipse cx={20} cy={36.2} rx={tier === 1 ? 11 : 9} ry={2.4} fill={ink} fillOpacity={0.22} />
      {tier === 1 ? <Circle cx={20} cy={19} r={18} fill="none" stroke={gold} strokeOpacity={0.55} strokeWidth={1.2} /> : null}
      <Circle cx={20} cy={19} r={tier === 3 ? 13.5 : 15.5} fill={`url(#${id})`} stroke={ring} strokeWidth={tier === 1 ? 2.4 : 1.8} strokeDasharray={dash} strokeLinecap="round" />
      <G transform={tier === 3 ? "translate(20 19) scale(0.8) translate(-20 -19)" : undefined}>{glyph(kind, ink, gold, colors.mapRiver, colors.mapForest)}</G>
      {events && tier < 3 ? (
        <G>
          <Circle cx={32} cy={7.5} r={6} fill={gold} stroke={colors.surface} strokeWidth={1.4} />
          <Path d="M32 3.9l1.05 2.3 2.5.25-1.9 1.65.55 2.45L32 9.3l-2.2 1.25.55-2.45-1.9-1.65 2.5-.25z" fill={colors.surface} />
        </G>
      ) : null}
    </Svg>
  );
}

function glyph(kind: PlaceKind, ink: string, gold: string, water: string, green: string) {
  switch (kind) {
    case "sacred": // Tempel mit Lichtstrahlen
      return (
        <G>
          {[-60, -30, 0, 30, 60].map((a) => (
            <Path key={a} d="M20 7.2v-3" stroke={gold} strokeWidth={1.6} strokeLinecap="round" transform={`rotate(${a} 20 16)`} />
          ))}
          <Path d="M11.5 15.5L20 10.5l8.5 5z" fill={gold} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M13 16.5h14M13.5 25.5h13" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
          {[14.5, 18.2, 21.8, 25.5].map((x) => <Path key={x} d={`M${x} 17.5v7`} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />)}
          <Path d="M12 27.5h16" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      );
    case "mount": // Berg mit Schneekappe
      return (
        <G>
          <Path d="M8.5 27L17 12.5l4.2 6.3 2.6-3.5L31.5 27z" fill={ink} fillOpacity={0.82} strokeLinejoin="round" />
          <Path d="M17 12.5l-2.6 4.4 1.6-.6 1.2 1.3 1.3-1.4 1.3.8z" fill={gold} />
          <Path d="M7 27.5h26" stroke={ink} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      );
    case "desert": // Zelt und Palme an der Oase
      return (
        <G>
          <Path d="M8.5 26.5L15.5 15l7 11.5z" fill={gold} stroke={ink} strokeWidth={1.1} strokeLinejoin="round" />
          <Path d="M15.5 15v11.5M13.6 26.5l1.9-4 1.9 4" stroke={ink} strokeWidth={1} fill="none" />
          <Path d="M26.5 26.5c.3-4 .1-7.5-1-10.5" stroke={ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Path d="M25.5 16c-2.5-1.6-4.6-1.2-5.8.2M25.5 16c1.3-2.6 3.4-3.2 5.2-2.4M25.5 16c2.8-.4 4.6.8 5 2.6M25.5 16c-1.8.6-3 2-3.1 3.6" stroke={green} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <Path d="M20 28c3.5-1.4 8.5-1.4 12 0" stroke={water} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </G>
      );
    case "water": // Segelboot auf Wellen
      return (
        <G>
          <Path d="M20.5 10v13" stroke={ink} strokeWidth={1.2} />
          <Path d="M21.3 11l6.7 10.5h-6.7z" fill={gold} stroke={ink} strokeWidth={0.9} strokeLinejoin="round" />
          <Path d="M19.7 13l-5 8.5h5z" fill={ink} fillOpacity={0.15} stroke={ink} strokeWidth={0.9} strokeLinejoin="round" />
          <Path d="M12 23h17l-2.4 3.2H14.4z" fill={ink} fillOpacity={0.85} strokeLinejoin="round" />
          <Path d="M9 28.5q2.75-2 5.5 0t5.5 0 5.5 0 5.5 0" stroke={water} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      );
    default: // Stadttor mit Türmen und Häusern
      return (
        <G>
          <Path d="M10.5 27V15h1.6v1.4h1.6V15h1.6v1.4h1.6V15H18.5v12zM21.5 27V15h1.6v1.4h1.6V15h1.6v1.4h1.6V15h1.6v12z" fill={ink} fillOpacity={0.82} />
          <Path d="M18.5 18.5h3V27h-3z" fill={ink} fillOpacity={0.55} />
          <Path d="M13 27v-4.2a1.6 1.6 0 013.2 0V27M23.8 27v-4.2a1.6 1.6 0 013.2 0V27" fill={gold} />
          <Path d="M9 27.6h22" stroke={ink} strokeWidth={1.3} strokeLinecap="round" />
        </G>
      );
  }
}
