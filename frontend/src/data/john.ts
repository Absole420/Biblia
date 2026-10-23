import type { Campaign, Station } from "./types";
import { EXTRA_LESSONS } from "./lessonsExtra";
import { findInfoIds, INFO_BY_ID } from "./lexicon";
import C_tora_1 from "./campaigns/tora-1.json";
import C_tora_2 from "./campaigns/tora-2.json";
import C_tora_3 from "./campaigns/tora-3.json";
import C_tora_4 from "./campaigns/tora-4.json";
import C_tora_5 from "./campaigns/tora-5.json";
import C_matthew from "./campaigns/matthew.json";
import C_mark from "./campaigns/mark.json";
import C_luke from "./campaigns/luke.json";
import C_parables from "./campaigns/parables.json";
import C_prophets from "./campaigns/prophets.json";
import C_acts from "./campaigns/acts.json";
import C_letters from "./campaigns/letters.json";
import { PSALMS_1 } from "./psalms1";
import { PSALMS_2 } from "./psalms2";
import { PSALMS_3 } from "./psalms3";
import { PSALMS_4 } from "./psalms4";

// Lernkampagne: Das Evangelium nach Johannes (vollständig spielbar).
// Bibeltexte werden NICHT hier gespeichert, sondern über die austauschbare
// Datenquelle (src/data/bible.ts, Elberfelder 1905) geladen.
// Fachliche Aussagen sind nach Art gekennzeichnet (text/history/hypothesis/jewish/christian).

export const JOHN: Campaign = {
  id: "john",
  worldId: "gospels",
  title: "Das Johannesevangelium",
  book: "Joh",
  mapW: 1000,
  mapH: 1800,
  intro:
    "Eine Reise vom „Anfang“ bis zum leeren Grab: Folge dem Weg durch Zeichen, Gespräche und Ich-bin-Worte. Johannes nennt sein Ziel selbst: „auf daß ihr glaubet“ (Joh 20,31).",
  stations: [
    {
      id: "john-1",
      title: "Das Wort im Anfang",
      subtitle: "Der Prolog · Joh 1,1–18",
      type: "study",
      icon: "book-open",
      x: 500, y: 1650,
      requires: [],
      xp: 50,
      placeIds: [],
      discover:
        "Das Johannesevangelium beginnt nicht mit einer Geburtsgeschichte, sondern mit einem Hymnus über das „Wort“. Die ersten Worte klingen bewusst wie der Anfang der Bibel: „Im Anfang …“.",
      readings: [{ book: "Joh", ch: 1, from: 1, to: 18 }],
      terms: [
        { term: "Logos", explanation: "Griechisch für „Wort“, „Rede“, „Vernunft“. Bei Johannes Bezeichnung für den, der bei Gott war und Fleisch wurde.", ref: "Joh 1,1.14" },
        { term: "Fleisch werden", explanation: "Bild für das volle Menschsein. Christliche Theologie spricht von der Inkarnation (Menschwerdung).", ref: "Joh 1,14" },
        { term: "„wohnte“ (griech. eskēnōsen)", explanation: "Wörtlich „zeltete“. Erinnert an das Zelt der Begegnung (Stiftshütte), in dem Gottes Herrlichkeit wohnte.", ref: "Joh 1,14; 2Mo 40,34" },
      ],
      background: [
        { kind: "text", title: "Was der Text sagt", text: "Das Wort war im Anfang, war bei Gott und war Gott (1,1). Durch es ist alles geworden (1,3). Johannes der Täufer war nicht das Licht, sondern Zeuge des Lichts (1,6–8). Das Wort wurde Fleisch (1,14).", refs: ["Joh 1,1–14"] },
        { kind: "jewish", title: "Jüdischer Hintergrund", text: "Die hebräische Bibel kennt Gottes schöpferisches Wort (1Mo 1; Ps 33,6) und die personifizierte Weisheit, die vor der Schöpfung bei Gott war (Spr 8,22–31).", refs: ["1Mo 1,1", "Ps 33,6", "Spr 8,22–31"] },
        { kind: "hypothesis", title: "Forschungsdiskussion", text: "Ob Johannes eher an die jüdische Weisheitstradition, an das aramäische „Memra“ der Targume oder an den griechisch-philosophischen Logos-Begriff (z. B. Philo von Alexandria) anknüpft, ist in der Forschung umstritten. Viele sehen eine Verbindung mehrerer Hintergründe." },
        { kind: "christian", title: "Christliche Auslegung", text: "Die Kirche las den Prolog als Zeugnis für die Präexistenz und Gottheit Christi; er wurde zentral für die Christologie der Konzilien von Nicäa (325) und Chalcedon (451)." },
      ],
      tasks: [
        { id: "j1-t1", type: "mc", question: "An welchen Bibeltext erinnern die ersten Worte des Johannesevangeliums?", options: ["1. Mose 1,1", "Psalm 23,1", "Jesaja 53,1", "Matthäus 1,1"], answer: 0, explain: "„Im Anfang“ greift den ersten Vers der Bibel auf (1Mo 1,1) und stellt den Logos in den Zusammenhang der Schöpfung.", ref: "Joh 1,1; 1Mo 1,1" },
        { id: "j1-t2", type: "verse", question: "Vervollständige den Vers (Elberfelder 1905):", verse: { ch: 1, v: 1 }, blank: "Anfang", options: ["Anfang", "Himmel", "Licht", "Geist"], explain: "Joh 1,1 beginnt mit „Im Anfang war das Wort“.", ref: "Joh 1,1" },
        { id: "j1-t3", type: "tf", statement: "Johannes der Täufer wird im Prolog als das wahre Licht bezeichnet.", answer: false, explain: "Joh 1,8 sagt ausdrücklich: Er war nicht das Licht, sondern sollte zeugen von dem Licht.", ref: "Joh 1,8" },
        { id: "j1-t4", type: "match", question: "Ordne die Begriffe ihrer Bedeutung zu:", pairs: [["Logos", "Wort"], ["Fleisch werden", "Menschwerdung"], ["zelten / wohnen", "Stiftshütte"], ["Zeuge", "Johannes der Täufer"]], explain: "Vgl. Joh 1,1.6–8.14.", ref: "Joh 1,1–14" },
        { id: "j1-t5", type: "free", question: "Warum könnte Johannes sein Evangelium mit der Schöpfung statt mit der Geburt Jesu beginnen?", model: "Er will zeigen, dass Jesus nicht erst mit seiner Geburt beginnt, sondern als das Wort von Anfang an bei Gott war. Der Prolog stellt die ganze folgende Geschichte in den Horizont von Schöpfung und Neuschöpfung.", ref: "Joh 1,1–3.14" },
      ],
      exam: [
        { id: "j1-e1", type: "mc", question: "Was geschah laut Joh 1,14 mit dem Wort?", options: ["Es wurde Fleisch", "Es wurde aufgeschrieben", "Es kehrte in den Himmel zurück", "Es wurde vergessen"], answer: 0, explain: "„Und das Wort ward Fleisch“ (Joh 1,14).", ref: "Joh 1,14" },
        { id: "j1-e2", type: "error", question: "Finde das falsche Wort in der Aussage:", words: ["Durch", "das", "Wort", "ist", "nur", "Israel", "geworden."], wrongIndex: 5, correction: "alles", explain: "Joh 1,3: Alles wurde durch dasselbe.", ref: "Joh 1,3" },
      ],
      reflection: ["Was bedeutet es für dich, dass Gott sich in einem Menschen zeigt?", "Welcher Vers des Prologs spricht dich am meisten an – und warum?"],
    },
    {
      id: "john-2",
      title: "Zeugen am Jordan",
      subtitle: "Der Täufer & die ersten Jünger · Joh 1,19–51",
      type: "narrative",
      icon: "users",
      x: 290, y: 1470,
      requires: ["john-1"],
      xp: 50,
      placeIds: ["bethany-jordan", "bethsaida", "nazareth"],
      discover:
        "Am Jordan zeigt Johannes der Täufer auf Jesus. Zwei seiner Jünger folgen Jesus – und aus einer Begegnung wird eine Kette: Einer bringt den nächsten.",
      readings: [{ book: "Joh", ch: 1, from: 19, to: 51 }],
      terms: [
        { term: "Lamm Gottes", explanation: "Titel, mit dem der Täufer auf Jesus hinweist. Erinnert an das Passahlamm und an Opfertiere.", ref: "Joh 1,29.36" },
        { term: "Kephas", explanation: "Aramäisch „Fels“; griechisch Petros. Neuer Name für Simon.", ref: "Joh 1,42" },
        { term: "Rabbi", explanation: "Ehrenvolle Anrede für einen Lehrer; Johannes übersetzt: „Lehrer“.", ref: "Joh 1,38" },
      ],
      background: [
        { kind: "history", title: "Historisch belegt", text: "Johannes der Täufer ist auch außerhalb des Neuen Testaments bezeugt: Der jüdische Historiker Flavius Josephus berichtet über ihn und seine Taufe (Jüdische Altertümer 18,116–119)." },
        { kind: "hypothesis", title: "Umstrittener Ort", text: "„Bethanien jenseits des Jordan“ (Joh 1,28) ist nicht sicher lokalisiert. Häufig wird es mit Al-Maghtas östlich des Jordan in Verbindung gebracht; andere Vorschläge existieren." },
        { kind: "jewish", title: "Jüdischer Kontext", text: "Die Fragen der Gesandten (Elia? der Prophet?) spiegeln Erwartungen aus Mal 3,23 und 5Mo 18,15. Der Täufer antwortet mit Jes 40,3.", refs: ["Mal 3,23", "5Mo 18,15", "Jes 40,3"] },
        { kind: "christian", title: "Christliche Auslegung", text: "„Lamm Gottes“ wird christlich auf den Opfertod Jesu bezogen und häufig mit dem Passahlamm (2Mo 12) und Jes 53,7 verbunden. Diese Verbindung ist eine christliche Deutung." },
      ],
      tasks: [
        { id: "j2-t1", type: "order", question: "Bringe die Ereignisse in die richtige Reihenfolge:", items: ["Der Täufer nennt Jesus „Lamm Gottes“", "Zwei Jünger folgen Jesus", "Andreas bringt Simon zu Jesus", "Jesus beruft Philippus", "Philippus findet Nathanael"], explain: "Reihenfolge in Joh 1,29–51.", ref: "Joh 1,29–51" },
        { id: "j2-t2", type: "error", question: "Finde den Fehler:", words: ["Andreas", "führte", "seinen", "Bruder", "Philippus", "zu", "Jesus."], wrongIndex: 4, correction: "Simon", explain: "Andreas findet seinen Bruder Simon (Joh 1,41–42).", ref: "Joh 1,41" },
        { id: "j2-t3", type: "mc", question: "Mit welchem Prophetenwort beschreibt sich der Täufer?", options: ["Jesaja 40,3", "Jeremia 31,31", "Daniel 7,13", "Micha 5,1"], answer: 0, explain: "„Ich bin die Stimme eines Rufenden in der Wüste“ – nach Jes 40,3.", ref: "Joh 1,23" },
        { id: "j2-t4", type: "tf", statement: "Nathanael fragt: „Kann aus Nazareth etwas Gutes kommen?“", answer: true, explain: "So reagiert Nathanael auf Philippus (Joh 1,46).", ref: "Joh 1,46" },
      ],
      exam: [
        { id: "j2-e1", type: "mc", question: "Welchen Namen gibt Jesus dem Simon?", options: ["Kephas", "Boanerges", "Didymus", "Barnabas"], answer: 0, explain: "„Du wirst Kephas heißen“ (Joh 1,42).", ref: "Joh 1,42" },
        { id: "j2-e2", type: "multi", question: "Welche Personen werden in Joh 1,35–51 genannt? (mehrere)", options: ["Andreas", "Philippus", "Nathanael", "Thomas", "Nikodemus"], answers: [0, 1, 2], explain: "Thomas und Nikodemus treten erst später auf.", ref: "Joh 1,35–51" },
      ],
      reflection: ["Wer hat dich zu Jesus oder zur Bibel „geführt“?", "„Komm und sieh!“ (1,46) – wo möchtest du genauer hinschauen?"],
    },
    {
      id: "john-3",
      title: "Die Hochzeit zu Kana",
      subtitle: "Das erste Zeichen · Joh 2,1–12",
      type: "event",
      icon: "droplet",
      x: 640, y: 1330,
      requires: ["john-2"],
      xp: 50,
      placeIds: ["cana"],
      discover:
        "Ein Fest droht zu kippen: Der Wein geht aus. Sechs steinerne Wasserkrüge stehen bereit – und Johannes erzählt vom „Anfang der Zeichen“.",
      readings: [{ book: "Joh", ch: 2, from: 1, to: 12 }],
      terms: [
        { term: "Zeichen (griech. sēmeion)", explanation: "Johannes nennt Jesu Wunder „Zeichen“: Sie verweisen über sich hinaus auf seine Herrlichkeit.", ref: "Joh 2,11" },
        { term: "Steinkrüge", explanation: "Nach Joh 2,6 standen sie „nach der Reinigungssitte der Juden“ dort.", ref: "Joh 2,6" },
        { term: "Speisemeister", explanation: "Verantwortlicher für den Ablauf des Festmahls.", ref: "Joh 2,8–9" },
      ],
      background: [
        { kind: "history", title: "Archäologie", text: "Gefäße aus Stein wurden im Judentum des 1. Jh. n. Chr. vielfach verwendet und sind archäologisch u. a. in Galiläa und Jerusalem gut belegt. Stein galt als nicht verunreinigungsfähig." },
        { kind: "hypothesis", title: "Umstrittener Ort", text: "Kana ist nicht sicher lokalisiert. Diskutiert werden vor allem Khirbet Qana (nördlich von Sepphoris) und Kafr Kanna (bei Nazareth)." },
        { kind: "jewish", title: "Jüdischer Kontext", text: "Hochzeiten wurden oft über mehrere Tage gefeiert. Wein ist in der hebräischen Bibel Zeichen von Freude und Segen; die Heilszeit wird mit Überfluss an Wein beschrieben (Am 9,13).", refs: ["Am 9,13"] },
        { kind: "christian", title: "Christliche Auslegung", text: "Viele Ausleger sehen in der Verwandlung ein Bild für die neue Freude, die mit Jesus beginnt. Die Deutung im Detail (z. B. auf das Abendmahl) ist unterschiedlich." },
      ],
      tasks: [
        { id: "j3-t1", type: "multi", question: "Wer kommt in der Erzählung vor? (mehrere)", options: ["Die Mutter Jesu", "Die Diener", "Der Speisemeister", "Pilatus", "Lazarus"], answers: [0, 1, 2], explain: "Vgl. Joh 2,1–10.", ref: "Joh 2,1–10" },
        { id: "j3-t2", type: "gap", question: "Ergänze die Lücken:", parts: ["Es standen dort ", " steinerne Wasserkrüge; Jesus sagte: Füllet die Wasserkrüge mit ", "."], blanks: ["sechs", "Wasser"], distractors: ["zwölf", "Wein", "drei"], explain: "Joh 2,6–7.", ref: "Joh 2,6–7" },
        { id: "j3-t3", type: "tf", statement: "Kana ist ein archäologisch eindeutig identifizierter Ort.", answer: false, explain: "Die Lokalisierung ist umstritten (Khirbet Qana oder Kafr Kanna).", ref: "Joh 2,1" },
      ],
      exam: [
        { id: "j3-e1", type: "mc", question: "Wie bezeichnet Johannes dieses Wunder?", options: ["Als Anfang der Zeichen", "Als letztes Wunder", "Als Gleichnis", "Als Vision"], answer: 0, explain: "Joh 2,11: „Diesen Anfang der Zeichen machte Jesus zu Kana“.", ref: "Joh 2,11" },
        { id: "j3-e2", type: "mc", question: "Welche Folge nennt Joh 2,11?", options: ["Seine Jünger glaubten an ihn", "Die Pharisäer klagten ihn an", "Die Menge wollte ihn zum König machen", "Er wurde verhaftet"], answer: 0, explain: "Er offenbarte seine Herrlichkeit, und seine Jünger glaubten an ihn.", ref: "Joh 2,11" },
      ],
      reflection: ["Wo erlebst du Mangel – und wo Fülle?", "Maria sagt: „Was irgend er euch sagen mag, tut.“ Was heißt das für dich?"],
    },
    {
      id: "john-4",
      title: "Nikodemus in der Nacht",
      subtitle: "Von neuem geboren · Joh 3,1–21",
      type: "study",
      icon: "moon",
      x: 320, y: 1160,
      requires: ["john-3"],
      xp: 60,
      placeIds: ["jerusalem"],
      discover:
        "Ein angesehener Lehrer kommt bei Nacht. Das Gespräch kreist um ein Wort mit doppelter Bedeutung – und mündet in einen der bekanntesten Verse der Bibel.",
      readings: [{ book: "Joh", ch: 3, from: 1, to: 21 }],
      terms: [
        { term: "„von neuem“ (griech. anōthen)", explanation: "Kann „von neuem“ und „von oben“ bedeuten. Nikodemus versteht es wörtlich-zeitlich.", ref: "Joh 3,3–4" },
        { term: "Pharisäer", explanation: "Jüdische Bewegung mit großem Gewicht auf Tora-Auslegung und Alltagsheiligung.", ref: "Joh 3,1" },
        { term: "Erhöhung", explanation: "Johannes nutzt „erhöhen“ doppeldeutig: Kreuz und Verherrlichung.", ref: "Joh 3,14; 12,32–33" },
      ],
      background: [
        { kind: "text", title: "Was der Text sagt", text: "Nikodemus ist Pharisäer und „Oberster der Juden“ (3,1). Er erscheint später erneut: Er verteidigt Jesus (7,50–51) und hilft bei der Grablegung (19,39).", refs: ["Joh 3,1", "Joh 7,50", "Joh 19,39"] },
        { kind: "jewish", title: "Tora-Bezug", text: "Joh 3,14 bezieht sich auf 4. Mose 21,8–9: Mose richtete in der Wüste eine Schlange auf, und wer sie ansah, blieb am Leben.", refs: ["4Mo 21,8–9"] },
        { kind: "hypothesis", title: "Wer spricht ab 3,16?", text: "Ob 3,16–21 noch Rede Jesu oder bereits Kommentar des Evangelisten ist, lässt der griechische Text offen; Übersetzungen setzen die Anführungszeichen unterschiedlich." },
        { kind: "christian", title: "Christliche Auslegung", text: "Die „Geburt aus Wasser und Geist“ (3,5) wurde in vielen Traditionen auf die Taufe bezogen; andere betonen die geistliche Erneuerung allgemein." },
      ],
      tasks: [
        { id: "j4-t1", type: "verse", question: "Vervollständige Joh 3,16:", verse: { ch: 3, v: 16 }, blank: "geliebt", options: ["geliebt", "gerichtet", "erschaffen", "gesegnet"], explain: "„Denn also hat Gott die Welt geliebt …“", ref: "Joh 3,16" },
        { id: "j4-t2", type: "match", question: "Altes und Neues Testament: Ordne zu.", pairs: [["Joh 3,14 erhöhte Schlange", "4Mo 21,8–9"], ["Joh 1,14 „zeltete“", "2Mo 40,34"], ["Joh 6,31 Brot vom Himmel", "2Mo 16"], ["Joh 1,23 Stimme in der Wüste", "Jes 40,3"]], explain: "Johannes greift bewusst Motive der Tora und der Propheten auf.", ref: "Joh 3,14" },
        { id: "j4-t3", type: "tf", statement: "Nikodemus begegnet im Evangelium nur ein einziges Mal.", answer: false, explain: "Er erscheint auch in Joh 7,50 und 19,39.", ref: "Joh 7,50; 19,39" },
        { id: "j4-t4", type: "free", question: "Was könnte die Doppelbedeutung „von neuem / von oben“ für das Verständnis des Gesprächs bedeuten?", model: "Jesus spricht von einer Geburt, die von Gott her („von oben“) kommt; Nikodemus denkt an eine zweite natürliche Geburt („von neuem“). Das Missverständnis führt zur Vertiefung.", ref: "Joh 3,3–8" },
      ],
      exam: [
        { id: "j4-e1", type: "mc", question: "Zu welcher Tageszeit kommt Nikodemus?", options: ["Bei Nacht", "Am Mittag", "Am Sabbatmorgen", "Bei Sonnenaufgang"], answer: 0, explain: "„Dieser kam zu ihm bei der Nacht“ (Joh 3,2).", ref: "Joh 3,2" },
        { id: "j4-e2", type: "mc", question: "Auf welche Begebenheit verweist Joh 3,14?", options: ["Die erhöhte Schlange", "Den brennenden Dornbusch", "Die Arche Noah", "Den Turmbau zu Babel"], answer: 0, explain: "4Mo 21,8–9.", ref: "Joh 3,14" },
      ],
      reflection: ["Welche Fragen würdest du Jesus „bei Nacht“ stellen?", "Was bedeutet „Leben von oben“ für deinen Alltag?"],
    },
    {
      id: "john-5",
      title: "Am Jakobsbrunnen",
      subtitle: "Lebendiges Wasser · Joh 4,1–42",
      type: "narrative",
      icon: "sun",
      x: 760, y: 1080,
      requires: ["john-3"],
      xp: 60,
      placeIds: ["sychar"],
      discover:
        "Mittagshitze in Samarien. Ein Jude bittet eine samaritanische Frau um Wasser – eine Begegnung über Grenzen hinweg, die ein ganzes Dorf verändert.",
      readings: [{ book: "Joh", ch: 4, from: 1, to: 42 }],
      terms: [
        { term: "Samaritaner", explanation: "Bevölkerung Samariens mit eigener Tora-Tradition und eigenem Heiligtum auf dem Berg Garizim.", ref: "Joh 4,9.20" },
        { term: "Lebendiges Wasser", explanation: "Wörtlich fließendes Quellwasser; bei Jesus Bild für die Gabe Gottes.", ref: "Joh 4,10–14" },
        { term: "Sechste Stunde", explanation: "Nach jüdischer Zählung etwa die Mittagszeit.", ref: "Joh 4,6" },
      ],
      background: [
        { kind: "history", title: "Historischer Hintergrund", text: "Das samaritanische Heiligtum auf dem Garizim wurde im 2. Jh. v. Chr. unter dem Hasmonäer Johannes Hyrkanos zerstört. Spannungen zwischen Juden und Samaritanern sind gut bezeugt (vgl. Joh 4,9)." },
        { kind: "jewish", title: "Patriarchen-Tradition", text: "Der Text verbindet den Ort mit Jakob, der seinem Sohn Josef ein Feld gab (Joh 4,5; vgl. 1Mo 33,19; 48,22; Jos 24,32).", refs: ["1Mo 33,19", "Jos 24,32"] },
        { kind: "hypothesis", title: "Lokalisierung", text: "Sychar wird traditionell mit dem Dorf Askar bei Nablus verbunden; der heute gezeigte Jakobsbrunnen gilt als alte, aber nicht beweisbare Tradition." },
        { kind: "christian", title: "Christliche Auslegung", text: "Die Erzählung wird oft als Beispiel für Jesu Zuwendung über ethnische, religiöse und soziale Grenzen hinweg gelesen; die Samaritaner nennen ihn „Heiland der Welt“ (4,42)." },
      ],
      tasks: [
        { id: "j5-t1", type: "mc", question: "Über welchen Berg spricht die Frau in Joh 4,20?", options: ["Den Garizim („diesen Berg“)", "Den Sinai", "Den Karmel", "Den Ölberg"], answer: 0, explain: "Sie meint den Berg Garizim, das samaritanische Heiligtum; der Name selbst steht nicht im Text.", ref: "Joh 4,20" },
        { id: "j5-t2", type: "order", question: "Ordne den Ablauf:", items: ["Jesus bittet um Wasser", "Gespräch über lebendiges Wasser", "Frage nach dem rechten Ort der Anbetung", "Die Frau geht in die Stadt", "Viele Samaritaner glauben"], explain: "Joh 4,7–42.", ref: "Joh 4,7–42" },
        { id: "j5-t3", type: "tf", statement: "Laut Joh 4,9 verkehrten Juden und Samaritaner normalerweise nicht miteinander.", answer: true, explain: "Johannes erklärt dies ausdrücklich in 4,9.", ref: "Joh 4,9" },
      ],
      exam: [
        { id: "j5-e1", type: "mc", question: "Wie nennen die Samaritaner Jesus am Ende?", options: ["Heiland der Welt", "Sohn Davids", "Prophet aus Galiläa", "Rabbi von Nazareth"], answer: 0, explain: "Joh 4,42.", ref: "Joh 4,42" },
        { id: "j5-e2", type: "error", question: "Finde den Fehler:", words: ["Jesus", "traf", "die", "Frau", "am", "Abend", "am", "Brunnen."], wrongIndex: 5, correction: "Mittag (sechste Stunde)", explain: "Es war um die sechste Stunde (Joh 4,6).", ref: "Joh 4,6" },
      ],
      reflection: ["Welche Grenzen fällt es dir schwer zu überwinden?", "Wonach „dürstet“ dein Leben gerade?"],
    },
    {
      id: "john-6",
      title: "Brot des Lebens",
      subtitle: "Speisung & Rede · Joh 6",
      type: "practice",
      icon: "package",
      x: 520, y: 900,
      requires: ["john-4", "john-5"],
      xp: 70,
      placeIds: ["tiberias", "capernaum"],
      discover:
        "Am See von Galiläa: Fünf Gerstenbrote und zwei Fische reichen für eine riesige Menge. Am nächsten Tag deutet Jesus das Zeichen in der Synagoge von Kapernaum.",
      readings: [{ book: "Joh", ch: 6, from: 1, to: 15 }, { book: "Joh", ch: 6, from: 32, to: 35 }, { book: "Joh", ch: 6, from: 66, to: 69 }],
      terms: [
        { term: "Ich-bin-Worte", explanation: "Sieben bildhafte Selbstaussagen Jesu im Johannesevangelium („Ich bin das Brot des Lebens“ u. a.).", ref: "Joh 6,35" },
        { term: "Manna", explanation: "Das Brot, das Israel in der Wüste erhielt (2Mo 16).", ref: "Joh 6,31" },
        { term: "See von Tiberias", explanation: "Johannes nennt den See Genezareth auch nach der Stadt Tiberias.", ref: "Joh 6,1" },
      ],
      background: [
        { kind: "text", title: "Was der Text sagt", text: "Das Passah war nahe (6,4). Ein Knabe hat fünf Gerstenbrote und zwei Fische (6,9). Zwölf Körbe bleiben übrig (6,13). Die Menge will Jesus zum König machen; er zieht sich zurück (6,15).", refs: ["Joh 6,4–15"] },
        { kind: "history", title: "Historisch gesichert", text: "Tiberias wurde um 20 n. Chr. von Herodes Antipas gegründet und nach Kaiser Tiberius benannt. In Kapernaum sind Reste einer Synagoge (spätantik) über älteren Fundamenten ausgegraben." },
        { kind: "jewish", title: "Jüdischer Kontext", text: "Das Manna in der Wüste (2Mo 16; Ps 78,24) war zentrale Erinnerung an Gottes Fürsorge. Die Erwartung, dass sich in der Heilszeit das Manna-Wunder wiederholt, ist in jüdischen Schriften bezeugt (z. B. 2. Baruch 29,8).", refs: ["2Mo 16", "Ps 78,24"] },
        { kind: "christian", title: "Christliche Auslegung", text: "Joh 6,51–58 wird in vielen Kirchen auf das Abendmahl bezogen; andere Ausleger betonen in erster Linie den Glauben als „Essen“ des Lebensbrotes." },
      ],
      tasks: [
        { id: "j6-t1", type: "gap", question: "Ergänze die Lücken:", parts: ["Ein Knabe hatte fünf ", " und zwei ", ". Es blieben ", " Handkörbe übrig."], blanks: ["Gerstenbrote", "Fische", "zwölf"], distractors: ["Weizenbrote", "sieben", "Krüge"], explain: "Joh 6,9.13.", ref: "Joh 6,9.13" },
        { id: "j6-t2", type: "multi", question: "Welche sind Ich-bin-Worte im Johannesevangelium? (mehrere)", options: ["Ich bin das Brot des Lebens", "Ich bin das Licht der Welt", "Ich bin der gute Hirte", "Ich bin der Fels Israels", "Ich bin das Salz der Erde"], answers: [0, 1, 2], explain: "Joh 6,35; 8,12; 10,11. „Ihr seid das Salz der Erde“ sagt Jesus in Mt 5,13 über die Jünger.", ref: "Joh 6,35; 8,12; 10,11" },
        { id: "j6-t3", type: "verse", question: "Vervollständige Joh 6,35:", verse: { ch: 6, v: 35 }, blank: "Brot", options: ["Brot", "Wasser", "Licht", "Weg"], explain: "„Ich bin das Brot des Lebens“.", ref: "Joh 6,35" },
        { id: "j6-t4", type: "match", question: "Ordne die Ich-bin-Worte ihren Stellen zu:", pairs: [["Brot des Lebens", "Joh 6,35"], ["Licht der Welt", "Joh 8,12"], ["Auferstehung und Leben", "Joh 11,25"], ["Wahrer Weinstock", "Joh 15,1"]], explain: "Die Ich-bin-Worte ziehen sich durch das ganze Evangelium.", ref: "Joh 6,35" },
      ],
      exam: [
        { id: "j6-e1", type: "mc", question: "Welches Fest war laut Joh 6,4 nahe?", options: ["Passah", "Laubhüttenfest", "Tempelweihe", "Pfingsten"], answer: 0, explain: "Joh 6,4.", ref: "Joh 6,4" },
        { id: "j6-e2", type: "mc", question: "Wer antwortet: „Herr, zu wem sollen wir gehen?“", options: ["Simon Petrus", "Judas", "Thomas", "Philippus"], answer: 0, explain: "Joh 6,68.", ref: "Joh 6,68" },
      ],
      reflection: ["Was „nährt“ dich innerlich?", "Wann hast du erlebt, dass Weniges genug wurde?"],
    },
    {
      id: "john-7",
      title: "Licht für den Blinden",
      subtitle: "Herausforderung · Joh 9",
      type: "challenge",
      icon: "sun",
      x: 250, y: 740,
      requires: ["john-6"],
      xp: 80,
      placeIds: ["jerusalem"],
      discover:
        "Ein Mann, blind von Geburt, wäscht sich im Teich Siloah – und sieht. Doch dann beginnt ein Verhör. Wer ist hier eigentlich blind?",
      readings: [{ book: "Joh", ch: 9, from: 1, to: 41 }],
      terms: [
        { term: "Siloah", explanation: "Teich in Jerusalem; Johannes übersetzt den Namen mit „Gesandt“.", ref: "Joh 9,7" },
        { term: "Sabbat", explanation: "Siebter Tag, Ruhetag nach der Tora. Die Heilung geschieht am Sabbat.", ref: "Joh 9,14" },
        { term: "Aus der Synagoge ausgeschlossen", explanation: "Die Eltern fürchten diesen Ausschluss.", ref: "Joh 9,22" },
      ],
      background: [
        { kind: "history", title: "Archäologie", text: "2004 wurden in Jerusalem Treppen eines großen Teiches aus der Zeit des Zweiten Tempels freigelegt, der weithin mit dem Teich Siloah identifiziert wird." },
        { kind: "hypothesis", title: "Forschungshypothese", text: "Einige Forscher (z. B. J. L. Martyn) vermuten, dass Joh 9,22 auch Erfahrungen der johanneischen Gemeinde gegen Ende des 1. Jh. widerspiegelt. Diese These ist einflussreich, aber umstritten." },
        { kind: "jewish", title: "Jüdischer Kontext", text: "Die Frage der Jünger (9,2) spiegelt eine verbreitete Frage nach dem Zusammenhang von Leid und Schuld, die auch in der hebräischen Bibel kritisch diskutiert wird (z. B. im Buch Hiob)." },
        { kind: "christian", title: "Christliche Auslegung", text: "Die Erzählung wird als Weg vom äußeren zum inneren Sehen gelesen: Der Geheilte bekennt schrittweise mehr (Mensch – Prophet – Herr)." },
      ],
      tasks: [
        { id: "j7-t1", type: "order", question: "Wie bezeichnet der Geheilte Jesus im Lauf der Erzählung? Ordne:", items: ["„Ein Mensch, genannt Jesus“", "„Er ist ein Prophet“", "„Ich glaube, Herr“"], explain: "Joh 9,11.17.38 – eine wachsende Erkenntnis.", ref: "Joh 9,11.17.38" },
        { id: "j7-t2", type: "tf", statement: "Jesus antwortet, dass der Mann wegen seiner Sünde blind geboren wurde.", answer: false, explain: "Joh 9,3: Weder dieser hat gesündigt noch seine Eltern.", ref: "Joh 9,3" },
        { id: "j7-t3", type: "mc", question: "Was bedeutet „Siloah“ laut Johannes?", options: ["Gesandt", "Quelle", "Frieden", "Licht"], answer: 0, explain: "Joh 9,7.", ref: "Joh 9,7" },
        { id: "j7-t4", type: "error", question: "Finde den Fehler:", words: ["Die", "Heilung", "geschah", "an", "einem", "Festtag", "der", "Tempelweihe."], wrongIndex: 5, correction: "Sabbat", explain: "„Es war aber Sabbat“ (Joh 9,14). Das Tempelweihfest folgt erst in 10,22.", ref: "Joh 9,14" },
        { id: "j7-t5", type: "free", question: "Wer ist in Joh 9 am Ende „blind“ – und wer „sehend“?", model: "Der Blindgeborene wird körperlich und im Glauben sehend; die Kritiker, die meinen zu sehen, bleiben in ihrer Ablehnung „blind“ (9,39–41).", ref: "Joh 9,39–41" },
      ],
      exam: [
        { id: "j7-e1", type: "verse", question: "Vervollständige Joh 9,5:", verse: { ch: 9, v: 5 }, blank: "Licht", options: ["Licht", "Brot", "Hirte", "König"], explain: "„… bin ich das Licht der Welt.“", ref: "Joh 9,5" },
        { id: "j7-e2", type: "mc", question: "Warum antworten die Eltern ausweichend?", options: ["Aus Furcht vor dem Ausschluss aus der Synagoge", "Weil sie Jesus nicht kannten", "Weil sie nicht in Jerusalem waren", "Weil ihr Sohn noch blind war"], answer: 0, explain: "Joh 9,22.", ref: "Joh 9,22" },
      ],
      reflection: ["Wo hast du „sehen“ gelernt?", "Was bedeutet es, mutig zu bezeugen, was man erlebt hat?"],
    },
    {
      id: "john-8",
      title: "Lazarus, komm heraus!",
      subtitle: "Auferstehung und Leben · Joh 11",
      type: "event",
      icon: "sunrise",
      x: 660, y: 600,
      requires: ["john-7"],
      xp: 70,
      placeIds: ["bethany", "ephraim"],
      discover:
        "In Bethanien trauern Martha und Maria um ihren Bruder. Jesus kommt zu spät – scheinbar. Vier Tage liegt Lazarus schon im Grab.",
      readings: [{ book: "Joh", ch: 11, from: 17, to: 44 }],
      terms: [
        { term: "Bethanien", explanation: "Dorf bei Jerusalem, etwa fünfzehn Stadien entfernt (ca. 3 km).", ref: "Joh 11,18" },
        { term: "Hoher Rat (Synedrium)", explanation: "Jüdisches Gremium unter Vorsitz des Hohenpriesters.", ref: "Joh 11,47" },
        { term: "Kaiphas", explanation: "Hoherpriester (amtierend ca. 18–36 n. Chr.).", ref: "Joh 11,49" },
      ],
      background: [
        { kind: "jewish", title: "Jüdische Auferstehungshoffnung", text: "Martha bekennt die Auferstehung „am letzten Tage“ (11,24) – eine Hoffnung, die u. a. in Dan 12,2 wurzelt und von den Pharisäern vertreten wurde.", refs: ["Dan 12,2", "Joh 11,24"] },
        { kind: "history", title: "Historisch gesichert", text: "Kaiphas ist als Hoherpriester auch bei Josephus bezeugt. Ein 1990 in Jerusalem gefundenes Ossuar mit der Aufschrift „Joseph, Sohn des Kaiphas“ wird häufig mit ihm in Verbindung gebracht (Zuordnung diskutiert)." },
        { kind: "text", title: "Was der Text sagt", text: "Jesus sagt: „Ich bin die Auferstehung und das Leben“ (11,25). Er weint (11,35). Nach dem Zeichen beschließt der Rat seinen Tod (11,53).", refs: ["Joh 11,25.35.53"] },
        { kind: "christian", title: "Christliche Auslegung", text: "Die Auferweckung des Lazarus gilt als Vorausdeutung auf Jesu eigene Auferstehung – im Unterschied dazu stirbt Lazarus später wieder." },
      ],
      tasks: [
        { id: "j8-t1", type: "order", question: "Bringe die Ereignisse in Reihenfolge:", items: ["Nachricht von der Krankheit", "Jesus bleibt noch zwei Tage", "Martha geht Jesus entgegen", "Jesus weint", "Der Stein wird weggenommen", "Lazarus kommt heraus"], explain: "Joh 11,3–44.", ref: "Joh 11,3–44" },
        { id: "j8-t2", type: "verse", question: "Vervollständige Joh 11,25:", verse: { ch: 11, v: 25 }, blank: "Auferstehung", options: ["Auferstehung", "Wahrheit", "Tür", "Weinstock"], explain: "„Ich bin die Auferstehung und das Leben“.", ref: "Joh 11,25" },
        { id: "j8-t3", type: "tf", statement: "Lazarus lag bereits vier Tage im Grab.", answer: true, explain: "Joh 11,17.39.", ref: "Joh 11,17" },
      ],
      exam: [
        { id: "j8-e1", type: "mc", question: "Welche Reaktion folgt im Hohen Rat?", options: ["Man beschließt Jesu Tod", "Man erkennt Jesus als Messias an", "Man lädt Jesus zum Fest ein", "Man verbannt Lazarus"], answer: 0, explain: "Joh 11,53.", ref: "Joh 11,53" },
        { id: "j8-e2", type: "multi", question: "Welche Geschwister kommen in Joh 11 vor? (mehrere)", options: ["Martha", "Maria", "Lazarus", "Salome"], answers: [0, 1, 2], explain: "Joh 11,1–2.", ref: "Joh 11,1" },
      ],
      reflection: ["Wie gehst du mit Trauer um – und was gibt dir Hoffnung?", "„Jesus weinte.“ Was sagt dir dieser kurze Vers?"],
    },
    {
      id: "john-9",
      title: "Im Obergemach",
      subtitle: "Fußwaschung & Abschiedsreden · Joh 13–17",
      type: "study",
      icon: "heart",
      x: 360, y: 420,
      requires: ["john-8"],
      xp: 70,
      placeIds: ["jerusalem"],
      discover:
        "Vor dem Passahfest wäscht Jesus seinen Jüngern die Füße. Danach spricht er lange zu ihnen: vom Weg, vom Beistand, vom Weinstock – und betet für sie.",
      readings: [{ book: "Joh", ch: 13, from: 1, to: 15 }, { book: "Joh", ch: 13, from: 34, to: 35 }, { book: "Joh", ch: 14, from: 1, to: 6 }, { book: "Joh", ch: 15, from: 1, to: 5 }],
      terms: [
        { term: "Paraklet", explanation: "Griech. paraklētos: Beistand, Fürsprecher, Tröster. Bezeichnung für den Heiligen Geist.", ref: "Joh 14,16.26" },
        { term: "Neues Gebot", explanation: "„Daß ihr einander liebet“ – nach dem Maß der Liebe Jesu.", ref: "Joh 13,34" },
        { term: "Weinstock", explanation: "Bild der Verbundenheit; in der hebräischen Bibel auch Bild für Israel (Ps 80,9; Jes 5).", ref: "Joh 15,1" },
      ],
      background: [
        { kind: "history", title: "Historischer Kontext", text: "Fußwaschung war im Alltag der Antike üblich, wurde aber in der Regel von Dienern oder Untergeordneten vollzogen. Dass der Lehrer sie übernimmt, ist eine bewusste Umkehrung." },
        { kind: "jewish", title: "Bezug zur hebräischen Bibel", text: "Das Bild vom Weinberg/Weinstock für Gottes Volk ist alt (Ps 80,9–16; Jes 5,1–7).", refs: ["Ps 80,9", "Jes 5,1–7"] },
        { kind: "hypothesis", title: "Literarische Entstehung", text: "Joh 14,31 („Stehet auf, laßt uns von hinnen gehen“) und die Fortsetzung in Kap. 15–17 führen viele Forscher zu der Vermutung, dass die Abschiedsreden in mehreren Stufen gewachsen sind." },
        { kind: "christian", title: "Christliche Auslegung", text: "Joh 17 wird oft „Hohepriesterliches Gebet“ genannt (Bezeichnung seit der Reformationszeit). Die Bitte um Einheit (17,21) ist zentral für die Ökumene." },
      ],
      tasks: [
        { id: "j9-t1", type: "verse", question: "Vervollständige Joh 14,6:", verse: { ch: 14, v: 6 }, blank: "Weg", options: ["Weg", "Hirte", "König", "Tempel"], explain: "„Ich bin der Weg und die Wahrheit und das Leben“.", ref: "Joh 14,6" },
        { id: "j9-t2", type: "mc", question: "Woran soll man laut Joh 13,35 die Jünger erkennen?", options: ["An ihrer Liebe untereinander", "An ihrer Kleidung", "An ihren Wundern", "An ihrem Wissen"], answer: 0, explain: "Joh 13,35.", ref: "Joh 13,35" },
        { id: "j9-t3", type: "match", question: "Ordne Bild und Bedeutung zu:", pairs: [["Fußwaschung", "Dienst aneinander"], ["Weinstock und Reben", "Verbundenheit"], ["Paraklet", "Beistand"], ["Wohnungen im Haus des Vaters", "Verheißung"]], explain: "Joh 13–15.", ref: "Joh 13,14; 14,2.16; 15,5" },
        { id: "j9-t4", type: "free", question: "Wie könnte „einander die Füße waschen“ heute praktisch aussehen?", model: "Unscheinbare, demütige Dienste füreinander übernehmen; Menschen Würde geben, ohne nach Status zu fragen; Versöhnung suchen.", ref: "Joh 13,14–15" },
      ],
      exam: [
        { id: "j9-e1", type: "tf", statement: "Petrus wollte sich zunächst nicht die Füße waschen lassen.", answer: true, explain: "Joh 13,8.", ref: "Joh 13,8" },
        { id: "j9-e2", type: "mc", question: "Wer ist laut Joh 15,1 der Weingärtner?", options: ["Der Vater", "Petrus", "Johannes der Täufer", "Mose"], answer: 0, explain: "„Mein Vater ist der Weingärtner.“", ref: "Joh 15,1" },
      ],
      reflection: ["Wem könntest du diese Woche „die Füße waschen“?", "Was bedeutet „bleiben“ (Joh 15,4) für dich?"],
    },
    {
      id: "john-10",
      title: "Vollbracht & auferstanden",
      subtitle: "Abschlussprüfung · Joh 18–20",
      type: "exam",
      icon: "award",
      x: 560, y: 210,
      requires: ["john-9"],
      xp: 120,
      placeIds: ["jerusalem"],
      discover:
        "Vom Garten jenseits des Kidron über den Palast des Pilatus nach Golgatha – und am ersten Tag der Woche zu einem leeren Grab. Die große Prüfung deiner Reise.",
      readings: [{ book: "Joh", ch: 19, from: 16, to: 30 }, { book: "Joh", ch: 20, from: 11, to: 18 }, { book: "Joh", ch: 20, from: 24, to: 31 }],
      terms: [
        { term: "Pontius Pilatus", explanation: "Römischer Präfekt von Judäa (ca. 26–36 n. Chr.).", ref: "Joh 18,29" },
        { term: "Golgatha", explanation: "„Schädelstätte“, Ort der Kreuzigung.", ref: "Joh 19,17" },
        { term: "Rüsttag", explanation: "Vorbereitungstag vor dem Sabbat bzw. Fest.", ref: "Joh 19,14.31" },
      ],
      background: [
        { kind: "history", title: "Historisch gesichert", text: "Pontius Pilatus ist durch Josephus, Philo, Tacitus (Annalen 15,44) und eine 1961 in Caesarea gefundene Inschrift belegt. Die Kreuzigung Jesu unter Pilatus gilt in der Geschichtswissenschaft als gesichert." },
        { kind: "hypothesis", title: "Chronologie", text: "Johannes datiert die Kreuzigung auf den Rüsttag des Passah (19,14), die ersten drei Evangelien schildern das letzte Mahl als Passahmahl. Wie sich das verhält, wird unterschiedlich erklärt." },
        { kind: "hypothesis", title: "Lage von Golgatha", text: "Die Grabeskirche beruht auf einer bis ins 4. Jh. zurückreichenden Tradition und gilt vielen Forschern als wahrscheinlichster Ort; das „Gartengrab“ ist eine Lokalisierung des 19. Jh." },
        { kind: "christian", title: "Christliche Auslegung", text: "„Es ist vollbracht“ (19,30) wird als Vollendung des Werkes Jesu verstanden. Thomas’ Bekenntnis „Mein Herr und mein Gott!“ (20,28) bildet einen Höhepunkt der Christologie des Evangeliums." },
      ],
      tasks: [
        { id: "j10-t1", type: "order", question: "Ordne die Ereignisse:", items: ["Verhaftung im Garten", "Verhör vor Pilatus", "Kreuzigung", "Grablegung durch Josef und Nikodemus", "Maria Magdalena am Grab", "Thomas bekennt"], explain: "Joh 18–20.", ref: "Joh 18–20" },
        { id: "j10-t2", type: "multi", question: "In welchen Sprachen war die Kreuzesinschrift verfasst? (mehrere)", options: ["Hebräisch", "Lateinisch", "Griechisch", "Aramäisch-syrisch", "Koptisch"], answers: [0, 1, 2], explain: "Joh 19,20 nennt Hebräisch, Griechisch und Lateinisch.", ref: "Joh 19,20" },
        { id: "j10-t3", type: "mc", question: "Wer sieht den Auferstandenen laut Joh 20 zuerst?", options: ["Maria Magdalena", "Petrus", "Thomas", "Nikodemus"], answer: 0, explain: "Joh 20,14–18.", ref: "Joh 20,14" },
      ],
      exam: [
        { id: "j10-e1", type: "mc", question: "Was fragt Pilatus Jesus in Joh 18,38?", options: ["„Was ist Wahrheit?“", "„Wer bist du?“", "„Bist du Elia?“", "„Wo ist dein Vater?“"], answer: 0, explain: "Joh 18,38.", ref: "Joh 18,38" },
        { id: "j10-e2", type: "tf", statement: "Nikodemus brachte Myrrhe und Aloe zur Grablegung.", answer: true, explain: "Joh 19,39.", ref: "Joh 19,39" },
        { id: "j10-e3", type: "verse", question: "Vervollständige Joh 20,31:", verse: { ch: 20, v: 31 }, blank: "glaubet", options: ["glaubet", "wisset", "gehorchet", "betet"], explain: "Johannes nennt den Zweck seines Buches.", ref: "Joh 20,31" },
        { id: "j10-e4", type: "error", question: "Finde den Fehler:", words: ["Thomas", "sagte:", "Mein", "Herr", "und", "mein", "König!"], wrongIndex: 6, correction: "Gott", explain: "„Mein Herr und mein Gott!“ (Joh 20,28).", ref: "Joh 20,28" },
      ],
      reflection: ["Was nimmst du von der ganzen Reise durch Johannes mit?", "Wo stehst du selbst zwischen Thomas’ Zweifel und seinem Bekenntnis?"],
    },
  ],
};

// Aus den HTML-Lernreisen importierte Kampagnen (Generator: /app/imports/convert.ts)
const IMPORTED = [C_tora_1, C_tora_2, C_tora_3, C_tora_4, C_tora_5, C_matthew, C_mark, C_luke, C_parables, C_prophets, C_acts, C_letters] as unknown as Campaign[];

export const CAMPAIGNS: Record<string, Campaign> = enrich({ john: JOHN, ...Object.fromEntries(IMPORTED.map((c) => [c.id, c])), "psalms-1": PSALMS_1, "psalms-2": PSALMS_2, "psalms-3": PSALMS_3, "psalms-4": PSALMS_4 });
export const ALL_STATIONS = Object.values(CAMPAIGNS).flatMap((c) => c.stations);

/** Anteil abgeschlossener Stationen über alle Kampagnen einer Lernwelt. */
export function worldProgress(campaignIds: string[] | undefined, done: Record<string, unknown>) {
  const st = (campaignIds ?? []).flatMap((id) => CAMPAIGNS[id]?.stations ?? []);
  return st.length ? st.filter((s) => done[s.id]).length / st.length : 0;
}

export function findStation(id: string) {
  for (const c of Object.values(CAMPAIGNS)) {
    const s = c.stations.find((x) => x.id === id);
    if (s) return { campaign: c, station: s };
  }
  return null;
}

/**
 * Ergänzt Kampagnen um die Zusatzlektionen (am Ende des Weges) und verknüpft
 * jede Station automatisch mit passenden Infotafeln. Stationen mit mindestens
 * drei Infotafeln erhalten eine zusätzliche Zuordnungsaufgabe aus dem Lexikon.
 */
function enrich(all: Record<string, Campaign>): Record<string, Campaign> {
  const out: Record<string, Campaign> = {};
  for (const [id, c0] of Object.entries(all)) {
    const extras = EXTRA_LESSONS.filter((e) => e.campaign === id);
    const shift = extras.length * 230;
    let stations: Station[] = c0.stations.map((s) => ({ ...s, y: s.y + shift }));
    extras.forEach((e, i) => {
      const prev = stations[stations.length - 1];
      const { campaign: _c, ...rest } = e;
      stations.push({ ...rest, x: 500 + Math.sin((stations.length + i) * 1.15) * 300, y: prev.y - 230, requires: [prev.id], xp: 60 });
    });
    stations = stations.map((s) => {
      const text = [s.title, s.discover, ...s.background.map((b) => b.text), ...s.terms.map((t) => t.term)].join(" ");
      const info = Array.from(new Set([...(s.info ?? []), ...findInfoIds(text)])).filter((x) => INFO_BY_ID[x]).slice(0, 8);
      const tasks = [...s.tasks];
      if (info.length >= 3 && !tasks.some((t) => t.id === `${s.id}-lex`)) {
        tasks.push({
          id: `${s.id}-lex`, type: "match", question: "Infotafeln: Ordne jeder Person, jedem Ort oder Begriff die passende Beschreibung zu.",
          pairs: info.slice(0, 4).map((x) => [INFO_BY_ID[x].name, INFO_BY_ID[x].summary.split(/[;.]/)[0]] as [string, string]),
          explain: "Die Beschreibungen stammen aus den verknüpften Infotafeln.", ref: INFO_BY_ID[info[0]].refs.split("; ")[0],
        });
      }
      return { ...s, info, tasks };
    });
    out[id] = { ...c0, mapH: c0.mapH + shift, stations };
  }
  return out;
}
