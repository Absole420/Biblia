import { ImageSourcePropType } from "react-native";

/** Farbstimmung je Szene: warm (Wirken), gedämpft (Passion), Morgenlicht (Auferstehung). */
export type SceneMood = "warm" | "passion" | "dawn";
export type IntroScene = { id: string; title: string; text: string; refs: string[]; mood: SceneMood; image: ImageSourcePropType; note?: string };

// Zusammenfassende Darstellung nach den Evangelien. Texte sind Nacherzählungen, keine Zitate;
// Bilder: KI-generiert (OpenAI GPT Image 1), künstlerische Rekonstruktion.
export const INTRO_SCENES: IntroScene[] = [
  { id: "geburt", mood: "warm", image: require("../../assets/images/intro/geburt.jpg"), title: "Geburt in Bethlehem",
    text: "Maria bringt ihren Sohn in Bethlehem zur Welt und legt ihn in eine Krippe. Hirten hören als Erste die Botschaft; Weise aus dem Osten folgen einem Stern.",
    refs: ["Lk 2,1–20", "Mt 2,1–12"], note: "Hirten erzählt nur Lukas, die Weisen nur Matthäus." },
  { id: "kindheit", mood: "warm", image: require("../../assets/images/intro/kindheit.jpg"), title: "Kindheit in Nazareth",
    text: "Jesus wächst in dem kleinen Dorf Nazareth in Galiläa auf. Mit zwölf Jahren bleibt er beim Passafest im Tempel und spricht mit den Lehrern.",
    refs: ["Lk 2,39–52", "Mt 2,19–23"] },
  { id: "taufe", mood: "warm", image: require("../../assets/images/intro/taufe.jpg"), title: "Taufe im Jordan",
    text: "Johannes der Täufer ruft am Jordan zur Umkehr. Jesus lässt sich von ihm taufen; der Geist kommt wie eine Taube auf ihn, und eine Stimme aus dem Himmel nennt ihn den geliebten Sohn.",
    refs: ["Mk 1,9–11", "Mt 3,13–17", "Joh 1,29–34"] },
  { id: "wueste", mood: "warm", image: require("../../assets/images/intro/wueste.jpg"), title: "Versuchung in der Wüste",
    text: "Vierzig Tage ist Jesus in der Wüste und fastet. Dreimal wird er versucht – und antwortet jedes Mal mit Worten aus der Schrift.",
    refs: ["Mt 4,1–11", "Lk 4,1–13", "Mk 1,12–13"], note: "Matthäus und Lukas ordnen die drei Versuchungen unterschiedlich." },
  { id: "berufung", mood: "warm", image: require("../../assets/images/intro/berufung.jpg"), title: "Berufung der Jünger",
    text: "Am See Genezareth ruft Jesus die Fischer Simon, Andreas, Jakobus und Johannes. Sie lassen ihre Netze zurück und folgen ihm.",
    refs: ["Mk 1,16–20", "Lk 5,1–11", "Joh 1,35–51"], note: "Johannes erzählt die ersten Begegnungen am Jordan." },
  { id: "verkuendigung", mood: "warm", image: require("../../assets/images/intro/verkuendigung.jpg"), title: "Verkündigung und Gleichnisse",
    text: "Jesus verkündet, dass das Reich Gottes nahe ist. Auf einem Berg lehrt er die Seligpreisungen; in Gleichnissen erzählt er von Saat, verlorenen Schafen und einem wartenden Vater.",
    refs: ["Mk 1,14–15", "Mt 5,1–12", "Mk 4,1–9", "Lk 15,11–32"] },
  { id: "begegnungen", mood: "warm", image: require("../../assets/images/intro/begegnungen.jpg"), title: "Begegnungen",
    text: "Jesus spricht mit Menschen, die andere meiden: mit einer Frau aus Samarien am Brunnen, mit dem Zöllner Zachäus in Jericho, bei dem er zu Gast ist.",
    refs: ["Joh 4,1–42", "Lk 19,1–10"] },
  { id: "wunder", mood: "warm", image: require("../../assets/images/intro/wunder.jpg"), title: "Heilungen und Wunder",
    text: "Kranke werden gesund, der blinde Bartimäus sieht wieder, Tausende werden satt, und auf dem See legt sich der Sturm.",
    refs: ["Mk 10,46–52", "Mk 6,30–44", "Mk 4,35–41"] },
  { id: "bekenntnis", mood: "warm", image: require("../../assets/images/intro/bekenntnis.jpg"), title: "Bekenntnis des Petrus",
    text: "Bei Caesarea Philippi fragt Jesus, für wen die Jünger ihn halten. Petrus bekennt ihn als den Christus. Danach kündigt Jesus an, dass er leiden, getötet werden und auferstehen wird.",
    refs: ["Mk 8,27–33", "Mt 16,13–23", "Mk 9,30–32", "Mk 10,32–34"] },
  { id: "einzug", mood: "warm", image: require("../../assets/images/intro/einzug.jpg"), title: "Einzug in Jerusalem",
    text: "Vor dem Passafest reitet Jesus auf einem jungen Esel in Jerusalem ein. Menschen breiten Kleider und Zweige aus und rufen „Hosanna“.",
    refs: ["Mk 11,1–11", "Joh 12,12–16"], note: "Die Tempelreinigung erzählen die ersten drei Evangelien nach dem Einzug, Johannes schon zu Beginn (Joh 2)." },
  { id: "abendmahl", mood: "passion", image: require("../../assets/images/intro/abendmahl.jpg"), title: "Das letzte Abendmahl",
    text: "Am Abend isst Jesus mit den Zwölf. Er nimmt Brot und Kelch und deutet sie auf seinen Leib und sein Blut. Nach Johannes wäscht er seinen Jüngern die Füße.",
    refs: ["Mk 14,12–25", "Lk 22,14–20", "Joh 13,1–15", "1Kor 11,23–26"], note: "Die ersten drei Evangelien schildern ein Passamahl, Johannes datiert es auf den Tag davor." },
  { id: "gethsemane", mood: "passion", image: require("../../assets/images/intro/gethsemane.jpg"), title: "Gebet in Gethsemane",
    text: "In einem Garten am Ölberg betet Jesus in großer Angst, dass der Kelch an ihm vorübergehe – und doch, dass Gottes Wille geschehe. Die Jünger schlafen ein.",
    refs: ["Mk 14,32–42", "Lk 22,39–46"] },
  { id: "verhaftung", mood: "passion", image: require("../../assets/images/intro/verhaftung.jpg"), title: "Verhaftung, Verleugnung, Urteil",
    text: "Judas führt die Wache zu Jesus; er wird verhaftet. Im Hof verleugnet Petrus ihn dreimal, dann kräht der Hahn. Der Hohe Rat verhört Jesus, Pontius Pilatus verurteilt ihn zum Tod.",
    refs: ["Mk 14,43–72", "Mk 15,1–15", "Joh 18,1–19,16"] },
  { id: "kreuz", mood: "passion", image: require("../../assets/images/intro/kreuz.jpg"), title: "Kreuzigung und Grablegung",
    text: "Auf Golgota wird Jesus gekreuzigt. Frauen sehen von ferne zu. Gegen Abend legt Josef von Arimathäa ihn in ein Felsengrab und rollt einen Stein davor.",
    refs: ["Mk 15,20–47", "Lk 23,26–56", "Joh 19,16–42"] },
  { id: "auferstehung", mood: "dawn", image: require("../../assets/images/intro/auferstehung.jpg"), title: "Auferstehung",
    text: "Am ersten Tag der Woche, früh am Morgen, kommen Frauen zum Grab. Der Stein ist weggewälzt, das Grab ist leer. Der Auferstandene begegnet Maria Magdalena und den Jüngern.",
    refs: ["Mk 16,1–8", "Lk 24,1–35", "Joh 20,1–18", "1Kor 15,3–8"] },
];

export const MOOD_STYLE: Record<SceneMood, { veil: string; accent: string }> = {
  warm: { veil: "rgba(120,72,20,0.10)", accent: "#E8B86A" },
  passion: { veil: "rgba(30,36,52,0.32)", accent: "#B9B2A6" },
  dawn: { veil: "rgba(255,244,220,0.12)", accent: "#F6E3B0" },
};
