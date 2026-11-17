import { ImageSourcePropType } from "react-native";

import { PlaceKind, PlaceTier } from "./placeKinds";

// Living Atlas – lokale Bildebenen. Reliefs: echte Höhendaten (AWS Terrain Tiles / Mapzen, SRTM u. a.),
// künstlerisch eingefärbt (backend/scripts/gen_relief.py). Ortsillustrationen: KI-gemalte künstlerische
// Rekonstruktionen (Gemini, backend/scripts/gen_places.py), freigestellt als PNG.

export const RELIEF: Record<string, ImageSourcePropType> = {
  overview: require("../../assets/images/relief/overview.jpg"),
  tora: require("../../assets/images/relief/tora.jpg"),
  history: require("../../assets/images/relief/history.jpg"),
  psalms: require("../../assets/images/relief/psalms.jpg"),
  prophets: require("../../assets/images/relief/prophets.jpg"),
  gospels: require("../../assets/images/relief/gospels.jpg"),
  parables: require("../../assets/images/relief/parables.jpg"),
  acts: require("../../assets/images/relief/acts.jpg"),
  letters: require("../../assets/images/relief/letters.jpg"),
  revelation: require("../../assets/images/relief/revelation.jpg"),
};

/** Bildmaße (Breite/Höhe) für unverzerrte Darstellung. */
type Art = { src: ImageSourcePropType; ratio: number };
const a = (src: ImageSourcePropType, w: number, h: number): Art => ({ src, ratio: w / h });

export const PLACE_ART: Record<string, Art> = {
  jerusalem: a(require("../../assets/images/places/jerusalem.png"), 320, 161),
  bethlehem: a(require("../../assets/images/places/bethlehem.png"), 320, 213),
  nazareth: a(require("../../assets/images/places/nazareth.png"), 320, 151),
  capernaum: a(require("../../assets/images/places/capernaum.png"), 320, 139),
  jericho: a(require("../../assets/images/places/jericho.png"), 320, 161),
  joppa: a(require("../../assets/images/places/joppa.png"), 320, 154),
  caesarea: a(require("../../assets/images/places/caesarea.png"), 320, 145),
  hebron: a(require("../../assets/images/places/hebron.png"), 320, 154),
  engedi: a(require("../../assets/images/places/engedi.png"), 320, 171),
  beersheba: a(require("../../assets/images/places/beersheba.png"), 320, 151),
  sinai: a(require("../../assets/images/places/sinai.png"), 320, 149),
  babylon: a(require("../../assets/images/places/babylon.png"), 320, 153),
  nineveh: a(require("../../assets/images/places/nineveh.png"), 320, 142),
  rome: a(require("../../assets/images/places/rome.png"), 320, 165),
};

export const GENERIC_ART: Record<PlaceKind | "village", Art> = {
  city: a(require("../../assets/images/places/town.png"), 320, 155),
  village: a(require("../../assets/images/places/village.png"), 320, 197),
  water: a(require("../../assets/images/places/harbor.png"), 320, 174),
  sacred: a(require("../../assets/images/places/sacred.png"), 320, 209),
  mount: a(require("../../assets/images/places/mountain.png"), 320, 153),
  desert: a(require("../../assets/images/places/camp.png"), 320, 202),
};

export const SPRITES = {
  ship: a(require("../../assets/images/places/ship.png"), 320, 287),
  olives: a(require("../../assets/images/places/olives.png"), 320, 188),
  palms: a(require("../../assets/images/places/palms.png"), 320, 261),
};

export function placeArt(id: string, kind: PlaceKind, tier: PlaceTier): Art {
  return PLACE_ART[id] ?? (kind === "city" && tier === 3 ? GENERIC_ART.village : GENERIC_ART[kind]);
}
