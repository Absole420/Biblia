import { Article } from "./articleTypes";
import { SRC_BIBLE } from "./articleSources";

// Lexikon-Etappe Weisheit: Bücher und Grundbegriffe der Lernwelt „Psalmen & Weisheit“.
const PS3 = Array.from({ length: 10 }, (_, i) => `ps3-${i + 1}`);
const PS4 = Array.from({ length: 10 }, (_, i) => `ps4-${i + 1}`);

export const ARTICLES_WISDOM: Article[] = [
  {
    id: "sprueche", kind: "term", title: "Das Buch der Sprüche", aliases: ["Sprichwörter", "Proverbia", "Mischle"], category: "Weisheitsbuch",
    summary: "Eine Sammlung von Lebensweisheit Israels: kurze Merksätze, Lehrreden und Gedichte über ein gelingendes Leben vor Gott. Leitsatz: „Die Furcht Jehovas ist der Erkenntnis Anfang“ (Spr 1,7).",
    overview: [
      { h: "Aufbau", layer: "bible", body: "Kap. 1–9: Lehrreden eines Vaters bzw. der Weisheit selbst (8,1–36). Kap. 10–22,16: „Sprüche Salomos“ – meist zweizeilige Merksätze. 22,17–24,34: „Worte der Weisen“. Kap. 25–29: von den Männern Hiskias gesammelt (25,1). Kap. 30–31: Worte Agurs und König Lemuels, abgeschlossen mit dem Gedicht von der tüchtigen Frau (31,10–31)." },
      { h: "Themen", layer: "bible", body: "Gottesfurcht, das Herz als Quelle des Lebens (4,23), Worte (15,1; 18,21), Ehrlichkeit im Handel (11,1), Arbeit und Planung (6,6; 21,5), Freundschaft (17,17; 27,17), Selbstbeherrschung (16,32) und Barmherzigkeit mit den Armen (14,31; 19,17)." },
      { h: "Richtig lesen", layer: "reflection", body: "Sprüche verdichten typische Erfahrungen. Sie sind keine Garantien im Einzelfall – Spr 26,4–5 stellt zwei gegensätzliche Ratschläge bewusst nebeneinander. Hiob und Ps 73 zeigen die Ausnahmen." },
    ],
    deep: [
      { h: "Verfasser und Entstehung", layer: "hypothesis", body: "Die Überschrift nennt Salomo (1,1; vgl. 1Kö 5,12), doch das Buch nennt selbst weitere Sammler und Verfasser (22,17; 25,1; 30,1; 31,1). Viele nehmen an, dass es über Jahrhunderte gewachsen und nach dem Exil abgeschlossen wurde." },
      { h: "Weisheit im Alten Orient", layer: "history", body: "Spruchsammlungen gab es auch in Ägypten; die „Lehre des Amenemope“ hat auffällige Ähnlichkeiten mit Spr 22,17–24,22. Israel stellt diese Lebenskunst unter die Furcht Jehovas." },
      { h: "Auslegung", layer: "tradition", body: "Jüdische Tradition liest Spr 31 am Sabbatabend als Lob der Frau des Hauses und der Tora. Christliche Auslegung verbindet die personifizierte Weisheit (Spr 8) mit Christus (vgl. 1Kor 1,24; Kol 2,3) – als spätere Deutung." },
    ],
    refs: ["Spr 1,1–7", "Spr 4,20–27", "Spr 8,22–31", "Spr 15,1", "Spr 26,4–5", "Spr 31,10–31"],
    timeframe: "Sammlungen aus der Königszeit bis in die Zeit nach dem Exil",
    epoch: "koenigszeit", region: "judaea", books: ["Spr"],
    relations: [
      { type: "related", target: "salomo", label: "Salomo als genannter Verfasser" },
      { type: "related", target: "gottesfurcht", label: "Leitsatz des Buches" },
      { type: "related", target: "herz", label: "Das Herz als Quelle (Spr 4,23)" },
      { type: "related", target: "buch-hiob", label: "Weisheit und Leid" },
    ],
    stationIds: PS3,
    sources: [SRC_BIBLE],
  },
  {
    id: "buch-hiob", kind: "term", title: "Das Buch Hiob", aliases: ["Ijob", "Hiobbuch"], category: "Weisheitsbuch",
    summary: "Ein Weisheitsbuch über das Leid eines Gerechten: Rahmenerzählung und große Dichtung fragen, ob man Gott „umsonst“ fürchtet und warum Gerechte leiden – ohne eine einfache Antwort zu geben.",
    overview: [
      { h: "Aufbau", layer: "bible", body: "Prosa-Rahmen: Prüfung und Verlust (Kap. 1–2), Wiederherstellung (42,7–17). Poetischer Hauptteil: Hiobs Klage (Kap. 3), drei Redegänge mit Elifas, Bildad und Zofar (4–27), das Lied von der Weisheit (28), Hiobs Schlussrede (29–31), Elihu (32–37), Gottes Reden aus dem Sturm (38–41) und Hiobs Antwort (42,1–6)." },
      { h: "Die großen Fragen", layer: "bible", body: "„Ist es umsonst, daß Hiob Gott fürchtet?“ (1,9). Ist Leid immer Strafe? Die Freunde sagen ja (4,7–8; 8,4) – Gott weist ihre Deutung zurück (42,7). Hiob klagt, hofft auf einen lebenden Erlöser (19,25) und begegnet Gott neu (42,5)." },
      { h: "Was das Buch lehrt", layer: "reflection", body: "Leid nicht vorschnell erklären, Leidenden beistehen (2,13), Klage zulassen und Gottesfurcht auch angesichts offener Fragen bewahren (28,28)." },
    ],
    deep: [
      { h: "Gattung und Datierung", layer: "hypothesis", body: "Das Buch gehört zur Weisheitsliteratur. Ort (Uz) und Zeit der Erzählung bleiben offen; die Abfassung wird häufig in die persische Zeit gelegt, andere halten ein höheres Alter für möglich. Der Text legt sich selbst nicht fest." },
      { h: "Text und Übersetzung", layer: "history", body: "Die Dichtung enthält viele seltene Wörter; Stellen wie 19,25–27 und 42,6 sind schwer zu übersetzen. Gute Übersetzungen kennzeichnen solche Unsicherheiten." },
      { h: "Auslegung", layer: "tradition", body: "Jak 5,11 nennt Hiobs Ausharren ein Vorbild. Christliche Tradition liest 19,25 auf Christus hin (Vorausdeutung); jüdische Tradition diskutiert, ob Hiob eine historische Person oder ein Gleichnis ist (Talmud, Baba Batra 15a)." },
    ],
    refs: ["Hi 1,1–12", "Hi 2,11–13", "Hi 19,25–27", "Hi 28,28", "Hi 38,1–7", "Hi 42,1–10", "Jak 5,11"],
    timeframe: "Erzählzeit unbestimmt; Abfassung meist persische Zeit angenommen",
    epoch: "nachexil", region: "kanaan", books: ["Hi", "Jak"],
    relations: [
      { type: "related", target: "hiob", label: "Die Hauptperson" },
      { type: "related", target: "sprueche", label: "Weisheit: Regel und Ausnahme" },
      { type: "related", target: "gottesfurcht", label: "Hi 1,1; 28,28" },
      { type: "related", target: "psalmen", label: "Klage in den Psalmen" },
    ],
    stationIds: PS4,
    sources: [SRC_BIBLE],
  },
  {
    id: "gottesfurcht", kind: "term", title: "Gottesfurcht", aliases: ["Furcht Jehovas", "Furcht des Herrn", "Ehrfurcht vor Gott"], category: "Grundbegriff",
    summary: "Ehrfürchtige Anerkennung Gottes, die Vertrauen und Ernsthaftigkeit gegenüber seinem Willen verbindet. In den Weisheitsbüchern der „Anfang der Weisheit“ (Spr 1,7; 9,10; Hi 28,28; Ps 111,10).",
    overview: [
      { h: "Mehr als Angst", layer: "bible", body: "Gottesfurcht ist „ein Born des Lebens“ und schenkt „starkes Vertrauen“ (Spr 14,26–27). Sie zeigt sich darin, das Böse zu meiden (Hi 1,1; 28,28; Spr 3,7) und Gottes Weisung ernst zu nehmen." },
      { h: "Vergebung und Furcht", layer: "bible", body: "„Bei dir ist Vergebung, damit du gefürchtet werdest“ (Ps 130,4): Gottes Gnade führt nicht zu Gleichgültigkeit, sondern zu ehrfürchtiger Hinwendung." },
      { h: "Im Alltag", layer: "reflection", body: "Lernbereitschaft, Demut und Verantwortung sind ihre Kennzeichen; Selbstüberschätzung und Verachtung von Korrektur ihr Gegenteil (Spr 1,5–7)." },
    ],
    deep: [
      { h: "Sprachliches", layer: "history", body: "Hebräisch jir’at JHWH. Das Wortfeld „fürchten“ reicht von Erschrecken bis zu Ehrfurcht und Verehrung; in der Weisheit überwiegt die Bedeutung „Gott ernst nehmen“." },
      { h: "Neues Testament", layer: "tradition", body: "Die Urgemeinde „wandelte in der Furcht des Herrn“ (Apg 9,31); „Gottesfürchtige“ heißen auch Nichtjuden, die sich zum Gott Israels halten (Apg 10,2). 1Joh 4,18 betont: Die Liebe treibt die (angstvolle) Furcht aus." },
    ],
    refs: ["Spr 1,7", "Spr 9,10", "Spr 14,26–27", "Hi 1,1", "Hi 28,28", "Ps 111,10", "Ps 130,4", "Apg 9,31"],
    timeframe: "Grundbegriff durch die ganze Bibel",
    epoch: "koenigszeit", region: "judaea", books: ["Spr", "Hi", "Ps", "Pred", "Apg"],
    relations: [
      { type: "related", target: "sprueche", label: "Leitsatz der Sprüche" },
      { type: "related", target: "buch-hiob", label: "Hiob – gottesfürchtig (Hi 1,1)" },
      { type: "related", target: "herz", label: "Ein ungeteiltes Herz (Ps 86,11)" },
    ],
    stationIds: ["ps3-1", "ps3-10", "ps4-1", "ps4-7", "ps1-2", "ps2-7"],
    sources: [SRC_BIBLE],
  },
  {
    id: "herz", kind: "term", title: "Das Herz in der Bibel", aliases: ["Herz", "lev", "Inneres"], category: "Grundbegriff",
    summary: "Das Herz ist in der Bibel das innere Zentrum des Menschen: Sitz von Denken, Wollen, Planen und Fühlen. „Behüte dein Herz mehr als alles … denn von ihm aus sind die Ausgänge des Lebens“ (Spr 4,23).",
    overview: [
      { h: "Denken und Wollen", layer: "bible", body: "Im Herzen werden Pläne gemacht (Spr 16,9), Gottes Wort bewahrt (Spr 4,21; Ps 119,11) und Entscheidungen getroffen. Anders als heute steht das Herz nicht vor allem für Gefühle." },
      { h: "Ein neues Herz", layer: "bible", body: "„Schaffe mir, Gott, ein reines Herz“ (Ps 51,10). Die Propheten verheißen ein neues Herz und einen neuen Geist (Hes 36,26). Gott sieht das Herz an (1Sam 16,7)." },
      { h: "Jesus über das Herz", layer: "bible", body: "Aus dem Herzen kommen böse Gedanken, Habsucht und Neid (Mk 7,21–23) – und das Gute, das ein guter Mensch hervorbringt (Lk 6,45)." },
    ],
    deep: [
      { h: "Sprachliches", layer: "history", body: "Hebräisch lev/levav, griechisch kardia. Für Gefühle und Mitleid nennt das Hebräische oft auch die „Eingeweide“ oder „Nieren“ (vgl. Ps 139,13)." },
      { h: "Herz bewahren", layer: "reflection", body: "Das Herz zu bewahren heißt, Motive und Einflüsse zu prüfen und gute Ausrichtungen zu pflegen (Spr 4,23–27) – weder Gefühle zu unterdrücken noch allen Menschen zu misstrauen." },
    ],
    refs: ["Spr 4,23", "Spr 4,21", "Ps 51,10", "Ps 139,23", "Hes 36,26", "1Sam 16,7", "Mk 7,21–23"],
    timeframe: "Grundbegriff durch die ganze Bibel",
    epoch: "koenigszeit", region: "judaea", books: ["Spr", "Ps", "Hes", "1Sam", "Mk"],
    relations: [
      { type: "related", target: "sprueche", label: "Spr 4,23" },
      { type: "related", target: "gottesfurcht", label: "Ein ungeteiltes Herz" },
      { type: "related", target: "david", label: "Ps 51 – ein reines Herz" },
    ],
    stationIds: ["ps3-3", "ps3-4", "ps1-7", "ps2-4", "ps2-8"],
    sources: [SRC_BIBLE],
  },
];
