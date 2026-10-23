// Inhaltsplan des Lexikons, gegliedert nach Bibelbüchern. Format je Eintrag: "id|Titel|Typ".
// Verfügbar ist ein Artikel nur, wenn er in articles.ts tatsächlich ausgearbeitet ist.
import { ArticleKind } from "./articleTypes";

const RAW: Record<string, string[]> = {
  "1Mo": ["schoepfung|Schöpfung|story", "adam-eva|Adam und Eva|person", "garten-eden|Garten Eden|place", "kain-abel|Kain und Abel|story", "noah|Noah|person", "sintflut|Die Sintflut|story", "turmbau-babel|Turmbau zu Babel|story", "abraham|Abraham|person", "sara|Sara|person", "lot|Lot|person", "sodom|Sodom und Gomorra|place", "isaak|Isaak|person", "jakob|Jakob (Israel)|person", "esau-edom|Esau und Edom|empire", "zwoelf-staemme|Die zwölf Stämme|empire", "josef|Josef (Sohn Jakobs)|person", "ur|Ur in Chaldäa|place", "haran|Haran|place", "hebron|Hebron und Mamre|place", "beerscheba|Beerscheba|place"],
  "2Mo": ["mose|Mose|person", "aaron|Aaron|person", "mirjam|Mirjam|person", "aegypten|Ägypten (Neues Reich)|empire", "plagen|Die zehn Plagen|story", "passa|Passa|term", "auszug|Der Auszug aus Ägypten|event", "schilfmeer|Durchzug durchs Schilfmeer|event", "sinai|Berg Sinai / Horeb|place", "zehn-gebote|Die Zehn Gebote|term", "stiftshuette|Stiftshütte|building", "bundeslade|Bundeslade|term", "goldenes-kalb|Das goldene Kalb|story"],
  "3Mo": ["opfer|Opfer im Alten Testament|term", "versoehnungstag|Großer Versöhnungstag|term", "rein-unrein|Rein und unrein|term", "sabbat|Sabbat|term"],
  "4Mo": ["wuestenwanderung|Wüstenwanderung|event", "kadesch|Kadesch-Barnea|place", "bileam|Bileam|person", "eherne-schlange|Die eherne Schlange|story"],
  "5Mo": ["schma|Höre Israel (Schma)|term", "nebo|Berg Nebo|place", "moab|Moab|empire"],
  "Jos": ["josua|Josua|person", "jericho|Jericho|place", "jordan|Jordan|water", "landnahme|Landnahme|event", "rahab|Rahab|person"],
  "Ri": ["richter|Die Richter|term", "debora|Debora|person", "gideon|Gideon|person", "simson|Simson|person", "philister|Philister|empire"],
  "Rut": ["rut|Rut|person", "boas|Boas|person", "bethlehem|Bethlehem|place"],
  "1Sam": ["samuel|Samuel|person", "saul|Saul|person", "david-goliath|David und Goliat|story", "silo|Silo|place"],
  "2Sam": ["david|David|person", "jerusalem|Jerusalem|place", "davidsbund|Der Davidsbund|term"],
  "1Kö": ["salomo|Salomo|person", "tempel-salomo|Der Tempel Salomos|building", "reichsteilung|Reichsteilung|event", "elia|Elia|person", "karmel|Elia auf dem Karmel|story", "samaria|Samaria|place", "phoenizien|Phönizien (Tyrus, Sidon)|empire"],
  "2Kö": ["elisa|Elisa|person", "assyrien|Assyrien (Neuassyrisches Reich)|empire", "fall-samarias|Fall Samarias (722 v. Chr.)|event", "hiskia|Hiskia|person", "josia|Josia|person", "exil|Das Babylonische Exil|event", "babylon|Babylon|place"],
  "Esr": ["persien|Perserreich|empire", "kyros|Kyros II.|person", "zweiter-tempel|Der zweite Tempel|building", "esra|Esra|person"],
  "Neh": ["nehemia|Nehemia|person", "stadtmauer-jerusalem|Die Mauer Jerusalems|building"],
  "Est": ["ester|Ester|person", "purim|Purim|term", "susa|Susa|place"],
  "Hi": ["hiob|Hiob|person", "buch-hiob|Das Buch Hiob|term"],
  "Spr": ["sprueche|Das Buch der Sprüche|term", "gottesfurcht|Gottesfurcht|term"],
  "Ps": ["psalmen|Die Psalmen als Gebetbuch|term", "herz|Das Herz in der Bibel|term", "zion|Zion|place", "hermon|Hermon|water"],
  "Jes": ["jesaja|Jesaja|person", "gottesknecht|Der Gottesknecht|term"],
  "Jer": ["jeremia|Jeremia|person", "babylonien|Neubabylonisches Reich|empire"],
  "Hes": ["ezechiel|Ezechiel (Hesekiel)|person", "kebar|Fluss Kebar|water"],
  "Dan": ["daniel|Daniel|person", "loewengrube|Daniel in der Löwengrube|story"],
  "Jona": ["jona|Jona|person", "ninive|Ninive|place"],
  "Mt": ["jesus|Jesus von Nazareth|person", "bergpredigt|Die Bergpredigt|story", "petrus|Simon Petrus|person", "herodes-grosse|Herodes der Große|person", "pharisaeer|Pharisäer|empire", "rom|Römisches Reich|empire"],
  "Mk": ["see-genezareth|See Genezareth|water", "kapernaum|Kapernaum|place", "sturmstillung|Die Sturmstillung|story", "johannes-markus|Johannes Markus|person"],
  "Lk": ["maria|Maria, Mutter Jesu|person", "geburt-jesu|Die Geburt Jesu|story", "barmherziger-samariter|Der barmherzige Samariter|story", "verlorener-sohn|Der verlorene Sohn|story", "nazareth|Nazareth|place"],
  "Joh": ["johannes-taeufer|Johannes der Täufer|person", "johannes-apostel|Johannes, Sohn des Zebedäus|person", "hochzeit-kana|Die Hochzeit zu Kana|story", "nikodemus|Nikodemus|person", "lazarus|Lazarus von Betanien|person", "kreuzigung|Kreuzigung Jesu|event", "auferstehung|Auferstehung Jesu|event", "tempel-herodes|Der herodianische Tempel|building"],
  "Apg": ["pfingsten|Pfingsten|event", "paulus|Paulus (Saulus) von Tarsus|person", "missionsreisen|Die Missionsreisen des Paulus|event", "antiochia|Antiochia am Orontes|place", "barnabas|Barnabas|person"],
  "Röm": ["roemergemeinde|Die Gemeinde in Rom|place"],
  "1Kor": ["korinth|Korinth|place", "abendmahl|Abendmahl|term"],
  "Offb": ["patmos|Patmos|place", "sieben-gemeinden|Die sieben Gemeinden|place", "neues-jerusalem|Das neue Jerusalem|term"],
};

export type PlanEntry = { id: string; title: string; kind: ArticleKind };
export const LEXICON_PLAN: { book: string; entries: PlanEntry[] }[] = Object.entries(RAW).map(([book, list]) => ({
  book,
  entries: list.map((s) => { const [id, title, kind] = s.split("|"); return { id, title, kind: kind as ArticleKind }; }),
}));
export const PLAN_COUNT = new Set(LEXICON_PLAN.flatMap((b) => b.entries.map((e) => e.id))).size;
