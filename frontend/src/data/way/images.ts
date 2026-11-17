import { ImageSourcePropType } from "react-native";

// KI-gemalte Themenbilder (Gemini, backend/scripts/gen_way.py) – künstlerische Darstellung, offline gebündelt.
const R = 1000 / 747;
export const WAY_IMAGES: Record<string, { src: ImageSourcePropType; ratio: number }> = {
  "neid-vergleich": { src: require("../../../assets/images/way/neid-vergleich.jpg"), ratio: R },
  "entscheidungen": { src: require("../../../assets/images/way/entscheidungen.jpg"), ratio: R },
  "arbeit-sinn": { src: require("../../../assets/images/way/arbeit-sinn.jpg"), ratio: R },
  "geld-sorge": { src: require("../../../assets/images/way/geld-sorge.jpg"), ratio: R },
  "liebe-partnerschaft": { src: require("../../../assets/images/way/liebe-partnerschaft.jpg"), ratio: R },
  "familie": { src: require("../../../assets/images/way/familie.jpg"), ratio: R },
  "aelterwerden": { src: require("../../../assets/images/way/aelterwerden.jpg"), ratio: R },
  "sterben-tod": { src: require("../../../assets/images/way/sterben-tod.jpg"), ratio: R },
  "frieden-stille": { src: require("../../../assets/images/way/frieden-stille.jpg"), ratio: R },
  "mut-neuanfang": { src: require("../../../assets/images/way/mut-neuanfang.jpg"), ratio: R },
  "ungerechtigkeit": { src: require("../../../assets/images/way/ungerechtigkeit.jpg"), ratio: R },
  "gebet-schwer": { src: require("../../../assets/images/way/gebet-schwer.jpg"), ratio: R },
};
