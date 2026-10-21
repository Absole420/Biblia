import { ImageSourcePropType } from "react-native";

// KI-generierte Personenillustrationen (OpenAI GPT Image 1), in die App gebündelt → offline verfügbar.
// Erzeugt mit backend/scripts/gen_illustrations.py. Künstlerische Rekonstruktion, kein historisches Bild.
export const ILLUSTRATIONS: Record<string, ImageSourcePropType> = {
  "adam-eva": require("../../assets/images/lexicon/adam-eva.jpg"),
  noah: require("../../assets/images/lexicon/noah.jpg"),
  abraham: require("../../assets/images/lexicon/abraham.jpg"),
  sara: require("../../assets/images/lexicon/sara.jpg"),
  lot: require("../../assets/images/lexicon/lot.jpg"),
  isaak: require("../../assets/images/lexicon/isaak.jpg"),
  jakob: require("../../assets/images/lexicon/jakob.jpg"),
  josef: require("../../assets/images/lexicon/josef.jpg"),
  mose: require("../../assets/images/lexicon/mose.jpg"),
  aaron: require("../../assets/images/lexicon/aaron.jpg"),
  mirjam: require("../../assets/images/lexicon/mirjam.jpg"),
  bileam: require("../../assets/images/lexicon/bileam.jpg"),
};

export const ILLUSTRATION_LABEL = "Künstlerische Rekonstruktion – Aussehen nicht überliefert";
export const ILLUSTRATION_SOURCE = "Illustration: KI-generiert mit OpenAI GPT Image 1 für BIBLIA. Künstlerische Rekonstruktion; Aussehen, Kleidung und Umgebung sind nicht überliefert.";
