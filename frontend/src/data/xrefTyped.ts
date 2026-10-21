// Kuratierte, nach Art klassifizierte Querverweise (beidseitig). Ergänzt die
// unklassifizierten OpenBible-Verweise. Schlüssel: "Code:Kap:Vers".
export type XKind = "quote" | "parallel" | "allusion" | "theme" | "tradition";
export const XKIND_META: Record<XKind, { label: string; desc: string }> = {
  quote: { label: "Direktes Zitat", desc: "wörtlich oder nahezu wörtlich angeführt" },
  parallel: { label: "Parallelbericht", desc: "dasselbe Ereignis in einem anderen Buch" },
  allusion: { label: "Erkennbare Anspielung", desc: "Wörter oder Bilder deutlich aufgegriffen" },
  theme: { label: "Thematische Verbindung", desc: "ähnliches Thema, keine direkte Abhängigkeit" },
  tradition: { label: "Auslegungstradition", desc: "Verbindung durch spätere (v. a. christliche) Deutung" },
};
type X = { a: string; b: string; to?: number; kind: XKind; note: string; debate?: string };
const LIST: X[] = [
  { a: "Jes:7:14", b: "Mt:1:23", kind: "quote", note: "Matthäus zitiert Jesaja (nach der griechischen Septuaginta: „Jungfrau“).", debate: "Das hebräische ʿalmah bedeutet „junge Frau“; jüdische Auslegung bezieht die Stelle auf ein Kind zur Zeit des Ahas." },
  { a: "Mi:5:1", b: "Mt:2:6", kind: "quote", note: "Bethlehem als Herkunftsort des Herrschers; Matthäus zitiert frei." },
  { a: "Hos:11:1", b: "Mt:2:15", kind: "quote", note: "Bei Hosea Rückblick auf Israels Auszug; Matthäus liest ihn typologisch auf Jesus.", debate: "Kein Vorhersagetext im ursprünglichen Zusammenhang." },
  { a: "Jes:40:3", b: "Mk:1:3", kind: "quote", note: "Die Stimme in der Wüste wird auf Johannes den Täufer bezogen." },
  { a: "Ps:22:2", b: "Mk:15:34", kind: "quote", note: "Jesus betet am Kreuz den Anfang von Psalm 22 (aramäisch)." },
  { a: "Ps:110:1", b: "Mt:22:44", kind: "quote", note: "Meistzitierter Psalmvers im NT; Jesus fragt nach dem Sohn Davids." },
  { a: "Hab:2:4", b: "Röm:1:17", kind: "quote", note: "„Der Gerechte wird aus Glauben leben“ – Grundtext für Paulus." },
  { a: "1Mo:15:6", b: "Röm:4:3", kind: "quote", note: "Abrahams Glaube wird ihm zur Gerechtigkeit gerechnet." },
  { a: "Jer:31:31", b: "Hebr:8:8", to: 12, kind: "quote", note: "Längstes AT-Zitat im NT: der neue Bund." },
  { a: "Jes:53:7", b: "Apg:8:32", to: 33, kind: "quote", note: "Der Kämmerer liest Jesaja 53; Philippus deutet es auf Jesus.", debate: "Jüdische Auslegung bezieht den Gottesknecht meist auf Israel." },
  { a: "4Mo:21:9", b: "Joh:3:14", kind: "allusion", note: "Die erhöhte Schlange als Bild für die Erhöhung des Menschensohnes." },
  { a: "1Mo:1:1", b: "Joh:1:1", kind: "allusion", note: "„Im Anfang“ – Johannes beginnt bewusst wie die Schöpfungsgeschichte." },
  { a: "1Mo:28:12", b: "Joh:1:51", kind: "allusion", note: "Engel steigen auf und nieder – nun auf den Menschensohn." },
  { a: "Mt:14:13", b: "Mk:6:32", kind: "parallel", note: "Speisung der Fünftausend (auch Lk 9,10–17; Joh 6,1–15)." },
  { a: "Mt:5:3", b: "Lk:6:20", kind: "parallel", note: "Seligpreisungen in der Bergpredigt bzw. Feldrede." },
  { a: "Joh:3:16", b: "1Joh:4:9", kind: "theme", note: "Gottes Liebe zeigt sich in der Sendung des Sohnes." },
  { a: "Ps:23:1", b: "Joh:10:11", kind: "theme", note: "Gott als Hirte – Jesus als der gute Hirte (vgl. Hes 34)." },
  { a: "1Mo:22:2", b: "Röm:8:32", kind: "tradition", note: "Die Bindung Isaaks wird christlich auf die Hingabe des Sohnes gedeutet.", debate: "In jüdischer Tradition (Akeda) steht Abrahams Gehorsam und Gottes Bewahrung im Vordergrund." },
];
export function typedXrefs(book: string, ch: number, v: number) {
  const k = `${book}:${ch}:${v}`;
  return LIST.flatMap((x) => (x.a === k ? [{ ...x, target: x.b, to: x.to }] : x.b === k ? [{ ...x, target: x.a, to: undefined }] : []));
}
