// Verknüpftes Lexikon (Infotafeln) zu Personen, Orten, Begriffen und Ereignissen.
// Jahreszahlen sind Näherungen; Unsicherheiten werden im Feld "uncertain" benannt.
// placeId verweist auf Orte der thematischen Karten (src/data/themeMaps.ts).
import { THEME_MAPS } from "./themeMaps";

export type InfoKind = "person" | "place" | "term" | "event";
export type InfoEntry = {
  id: string;
  kind: InfoKind;
  name: string;
  aliases?: string[]; // weitere Schreibweisen für die automatische Verknüpfung
  summary: string;
  details: string;
  refs: string; // Bibelstellen, mit "; " getrennt
  placeId?: string;
  year?: number; // negative Werte = v. Chr.
  yearLabel?: string;
  uncertain?: string;
  related?: string[];
};

export const KIND_META: Record<InfoKind, { label: string; icon: string }> = {
  person: { label: "Person", icon: "user" },
  place: { label: "Ort", icon: "map-pin" },
  term: { label: "Begriff", icon: "bookmark" },
  event: { label: "Ereignis", icon: "calendar" },
};

export const LEXICON: InfoEntry[] = [
  // ---- Personen
  { id: "abraham", kind: "person", name: "Abraham", aliases: ["Abram"], summary: "Stammvater Israels; Gott beruft ihn aus Haran und verheißt ihm Land, Nachkommen und Segen für alle Völker.", details: "Abraham gilt in Judentum, Christentum und Islam als Vorbild des Glaubens. Paulus greift 1. Mose 15,6 auf, um zu zeigen, dass Gott Glauben als Gerechtigkeit anrechnet.", refs: "1Mo 12,1–3; 1Mo 15,6; Röm 4,1–3; Hebr 11,8–10", placeId: "hebron", year: -1850, yearLabel: "ca. 2000–1700 v. Chr. (traditionell)", uncertain: "Die Erzvätergeschichten lassen sich nicht genau datieren; die Angaben sind Schätzungen.", related: ["jakob", "bund"] },
  { id: "jakob", kind: "person", name: "Jakob", summary: "Sohn Isaaks, Enkel Abrahams; erhält nach dem Ringen am Jabbok den Namen Israel.", details: "Jakobs Geschichte ist voller Brüche: Betrug an Esau, Flucht, Traum in Bethel, Jahre bei Laban, Versöhnung. Seine zwölf Söhne gelten als Ahnherren der zwölf Stämme.", refs: "1Mo 28,10–22; 1Mo 32,23–33; 1Mo 35,9–12; Hos 12,4–5", placeId: "bethel", year: -1750, yearLabel: "Zeit der Erzväter (nicht genau datierbar)", uncertain: "Datierung unsicher wie bei allen Erzvätern.", related: ["abraham", "bethel"] },
  { id: "mose", kind: "person", name: "Mose", summary: "Führt Israel aus Ägypten; am Sinai empfängt er die Weisungen des Bundes.", details: "In jüdischer Tradition gilt Mose als größter Prophet (5Mo 34,10) und als Lehrer der Tora („Mosche Rabbenu“). Das Neue Testament stellt Jesus mehrfach in Beziehung zu Mose (z. B. Joh 1,17; Hebr 3,1–6).", refs: "2Mo 3,1–15; 2Mo 19–20; 5Mo 34,10; Joh 1,17; Hebr 3,1–6", placeId: "sinai", year: -1250, yearLabel: "13. Jh. v. Chr. (oder 15. Jh.)", uncertain: "Die Datierung des Exodus ist umstritten (früh: ca. 1446 v. Chr. nach 1Kö 6,1; spät: ca. 1250 v. Chr.). Außerbiblische Belege für Mose fehlen.", related: ["exodus", "passa", "bund"] },
  { id: "david", kind: "person", name: "David", summary: "Hirte aus Bethlehem, König über Juda und Israel; Jerusalem wird seine Hauptstadt.", details: "Gott verheißt David ein bleibendes Königtum (2Sam 7). Daran knüpft die Erwartung eines „Sohnes Davids“ an, die das Neue Testament auf Jesus bezieht (Mt 1,1; Röm 1,3). Die Tel-Dan-Inschrift (9. Jh. v. Chr.) erwähnt das „Haus Davids“.", refs: "1Sam 16,1–13; 2Sam 5,1–10; 2Sam 7,12–16; Mt 1,1; Röm 1,3", placeId: "bethlehem", year: -1000, yearLabel: "ca. 1010–970 v. Chr.", related: ["jerusalem", "messias"] },
  { id: "elia", kind: "person", name: "Elia", summary: "Prophet im Nordreich zur Zeit König Ahabs; tritt gegen den Baalskult auf.", details: "Nach Mal 3,23 wird Elia vor dem „Tag des Herrn“ erwartet. Im Neuen Testament wird Johannes der Täufer mit dieser Erwartung verbunden (Mt 11,14; Lk 1,17). Im jüdischen Sederabend steht bis heute ein Becher für Elia bereit.", refs: "1Kö 17–19; 1Kö 18,20–40; Mal 3,23–24; Mt 11,14; Mt 17,1–4", placeId: "carmel", year: -865, yearLabel: "9. Jh. v. Chr. (Ahab ca. 871–852)", related: ["karmel", "johannes-taeufer", "prophet"] },
  { id: "jona", kind: "person", name: "Jona", summary: "Prophet aus Gat-Hefer; flieht vor Gottes Auftrag und predigt schließlich in Ninive.", details: "2Kö 14,25 nennt Jona zur Zeit Jerobeams II. Das Buch selbst ist wahrscheinlich später entstanden. Jesus nennt das „Zeichen des Jona“ (Mt 12,39–41). Im Judentum wird das Buch Jona am Versöhnungstag (Jom Kippur) gelesen.", refs: "Jona 1–4; 2Kö 14,25; Mt 12,39–41; Lk 11,29–32", placeId: "nineveh", year: -780, yearLabel: "8. Jh. v. Chr. (Jerobeam II.)", uncertain: "Entstehungszeit und literarische Gattung des Buches werden unterschiedlich beurteilt (Geschichtsbericht oder lehrhafte Erzählung).", related: ["ninive", "prophet"] },
  { id: "jesaja", kind: "person", name: "Jesaja", summary: "Prophet in Jerusalem im 8. Jh. v. Chr.; Botschaft von Gottes Heiligkeit, Gericht und Trost.", details: "Das Neue Testament zitiert Jesaja häufiger als fast jedes andere Prophetenbuch. Viele Forscher sehen in Jes 40–66 spätere Teile aus der Exils- und Nachexilszeit; traditionell wird das ganze Buch Jesaja zugeschrieben.", refs: "Jes 6,1–8; Jes 7,14; Jes 53; Lk 4,16–21", placeId: "jerusalem", year: -740, yearLabel: "ca. 740–700 v. Chr.", uncertain: "Verfasserschaft von Jes 40–66 umstritten.", related: ["prophet", "messias"] },
  { id: "maria", kind: "person", name: "Maria", summary: "Mutter Jesu aus Nazareth.", details: "Lukas erzählt von der Ankündigung der Geburt (Lk 1,26–38) und Marias Lobgesang (Lk 1,46–55), der Motive aus dem Gebet Hannas (1Sam 2,1–10) aufnimmt. Johannes nennt sie bei der Hochzeit zu Kana und unter dem Kreuz.", refs: "Lk 1,26–56; Joh 2,1–5; Joh 19,25–27; Apg 1,14", placeId: "nazareth", year: -5, yearLabel: "um die Zeitenwende", related: ["jesus", "nazareth"] },
  { id: "johannes-taeufer", kind: "person", name: "Johannes der Täufer", aliases: ["Johannes den Täufer", "Täufer"], summary: "Bußprediger am Jordan; tauft Jesus und weist auf ihn hin.", details: "Auch Flavius Josephus berichtet über Johannes und seine Hinrichtung durch Herodes Antipas (Jüdische Altertümer 18,116–119). Die Evangelien verbinden ihn mit Jes 40,3.", refs: "Mk 1,2–11; Lk 3,1–20; Joh 1,19–34; Jes 40,3", year: 28, yearLabel: "ca. 28 n. Chr.", related: ["elia", "jesus"] },
  { id: "jesus", kind: "person", name: "Jesus von Nazareth", aliases: ["Jesus"], summary: "Jüdischer Lehrer und Wundertäter aus Galiläa; nach christlichem Glauben der Messias und Sohn Gottes.", details: "Seine Kreuzigung unter Pontius Pilatus ist auch außerbiblisch bezeugt (Tacitus, Annalen 15,44; Josephus). Seine Auferstehung bezeugen die Evangelien und Paulus (1Kor 15,3–8) als Glaubensbekenntnis.", refs: "Mk 1,14–15; Lk 4,16–21; 1Kor 15,3–8", placeId: "jerusalem", year: 30, yearLabel: "ca. 6/4 v. Chr. – 30/33 n. Chr.", related: ["messias", "kreuzigung", "maria", "petrus"] },
  { id: "petrus", kind: "person", name: "Petrus", aliases: ["Simon Petrus", "Kephas"], summary: "Fischer aus Galiläa, Sprecher der Zwölf; predigt an Pfingsten in Jerusalem.", details: "Sein Name bedeutet „Fels“ (aramäisch Kephas). Nach alter Überlieferung starb er in Rom als Märtyrer (um 64 n. Chr.); die Apostelgeschichte berichtet darüber nicht.", refs: "Mt 16,13–19; Lk 5,1–11; Apg 2,14–41; 1Kor 15,5", placeId: "capernaum", year: 31, yearLabel: "1. Jh. n. Chr.", uncertain: "Ort und Zeit seines Todes sind Tradition.", related: ["jesus", "pfingsten"] },
  { id: "paulus", kind: "person", name: "Paulus", aliases: ["Saulus"], summary: "Pharisäer aus Tarsus; nach seiner Begegnung mit dem Auferstandenen Apostel der Völker.", details: "Er gründet Gemeinden in Kleinasien und Griechenland. Seine Briefe sind die ältesten Schriften des Neuen Testaments (ab ca. 50 n. Chr.). Er versteht sich weiterhin als Israelit (Röm 11,1).", refs: "Apg 9,1–19; Apg 17,16–34; Gal 1,13–17; Phil 3,4–6; Röm 11,1", placeId: "tarsus", year: 50, yearLabel: "ca. 5–64 n. Chr.", related: ["areopag", "athen", "damaskus"] },
  { id: "bartimaeus", kind: "person", name: "Bartimäus", summary: "Blinder Bettler bei Jericho, der Jesus als „Sohn Davids“ anruft und geheilt wird.", details: "Der Name bedeutet „Sohn des Timäus“. Markus nennt ihn als einzige geheilte Person mit Namen auf dem Weg nach Jerusalem; er folgt Jesus „auf dem Weg“ nach.", refs: "Mk 10,46–52; Mt 20,29–34; Lk 18,35–43", placeId: "jericho", year: 30, yearLabel: "ca. 30 n. Chr.", related: ["jericho", "messias"] },
  { id: "kleopas", kind: "person", name: "Kleopas", summary: "Einer der beiden Jünger auf dem Weg nach Emmaus.", details: "Nur Lukas nennt seinen Namen. Ob er mit dem in Joh 19,25 genannten Klopas identisch ist, ist unsicher.", refs: "Lk 24,13–35", placeId: "emmaus", year: 30, yearLabel: "ca. 30 n. Chr.", uncertain: "Identifikation mit Klopas (Joh 19,25) unsicher.", related: ["emmaus"] },
  // ---- Orte
  { id: "jerusalem", kind: "place", name: "Jerusalem", summary: "Stadt Davids und des Tempels; Ort von Kreuzigung, Auferstehung und Pfingsten.", details: "Seit David politisches und kultisches Zentrum. 586 v. Chr. von Babylon, 70 n. Chr. von Rom zerstört.", refs: "2Sam 5,6–9; 1Kö 6,1; Ps 122; Lk 24,47; Apg 2,1–5", placeId: "jerusalem", related: ["david", "kreuzigung", "pfingsten"] },
  { id: "bethel", kind: "place", name: "Bethel", summary: "„Haus Gottes“ – Ort von Jakobs Traum; später Heiligtum des Nordreichs.", details: "Meist mit dem heutigen Beitin nördlich von Jerusalem gleichgesetzt. Propheten wie Amos kritisieren den Kult in Bethel (Am 7,10–13).", refs: "1Mo 28,19; 1Kö 12,28–29; Am 7,10–13", placeId: "bethel", uncertain: "Identifikation mit Beitin ist verbreitet, aber nicht unumstritten.", related: ["jakob"] },
  { id: "karmel", kind: "place", name: "Karmel", aliases: ["Berg Karmel"], summary: "Gebirgszug an der Mittelmeerküste; Ort des Gottesurteils zwischen Elia und den Baalspropheten.", details: "Der Name bedeutet etwa „Fruchtgarten“. Der genaue Ort des Opfers in 1Kö 18 ist Tradition (el-Muhraqa).", refs: "1Kö 18,19–40; Jes 35,2", placeId: "carmel", related: ["elia"] },
  { id: "ninive", kind: "place", name: "Ninive", summary: "Hauptstadt des Assyrerreichs am Tigris (bei Mossul, Irak).", details: "Assyrien eroberte 722 v. Chr. das Nordreich Israel. Ninive fiel 612 v. Chr. an Babylonier und Meder (vgl. Nahum).", refs: "Jona 1,2; Jona 3,3–10; Nah 1,1; 2Kö 19,36", placeId: "nineveh", related: ["jona"] },
  { id: "jericho", kind: "place", name: "Jericho", summary: "Oasenstadt im Jordantal, eine der ältesten Städte der Welt.", details: "In neutestamentlicher Zeit lag das herodianische Jericho südlich des alten Tells. Hier begegnet Jesus Zachäus und Bartimäus.", refs: "Jos 6; Lk 19,1–10; Mk 10,46", placeId: "jericho", uncertain: "Die Datierung der Zerstörung in Jos 6 ist archäologisch umstritten.", related: ["bartimaeus"] },
  { id: "nazareth", kind: "place", name: "Nazareth", summary: "Dorf in Galiläa, Heimatort Jesu.", details: "Im Alten Testament nicht erwähnt; archäologisch als kleines Dorf belegt.", refs: "Lk 1,26; Lk 4,16–30; Joh 1,46", placeId: "nazareth", related: ["maria", "jesus"] },
  { id: "emmaus", kind: "place", name: "Emmaus", summary: "Dorf „sechzig Stadien“ (ca. 11 km) von Jerusalem; Ziel der beiden Jünger in Lk 24.", details: "Mehrere Orte werden vorgeschlagen, u. a. Emmaus-Nikopolis (Amwas), el-Qubeibeh und Motza.", refs: "Lk 24,13–35", placeId: "emmaus", uncertain: "Die Lage ist umstritten; einige Handschriften nennen 160 Stadien.", related: ["kleopas"] },
  { id: "athen", kind: "place", name: "Athen", summary: "Kulturzentrum Griechenlands mit Philosophenschulen; Paulus spricht dort auf dem Areopag.", details: "Zur Zeit des Paulus Teil der römischen Provinz Achaja, aber weiterhin Ort der Bildung (Stoiker, Epikureer).", refs: "Apg 17,15–34; 1Thess 3,1", placeId: "athens", related: ["areopag", "paulus"] },
  { id: "damaskus", kind: "place", name: "Damaskus", summary: "Hauptstadt Arams; vor ihren Toren begegnet Saulus dem Auferstandenen.", details: "Eine der ältesten durchgehend bewohnten Städte der Welt.", refs: "2Kö 5; Apg 9,1–19; Gal 1,17", placeId: "damascus", related: ["paulus"] },
  // ---- Begriffe
  { id: "bund", kind: "term", name: "Bund", summary: "Verbindliche Beziehung, die Gott mit Menschen eingeht (hebr. berit).", details: "Wichtige Bundesschlüsse: mit Noah, Abraham, Israel am Sinai, David. Jer 31,31–34 verheißt einen neuen Bund; Jesus bezieht diesen beim letzten Mahl auf sich (Lk 22,20).", refs: "1Mo 9,8–17; 1Mo 15; 2Mo 24,3–8; Jer 31,31–34; Lk 22,20", related: ["abraham", "mose"] },
  { id: "passa", kind: "term", name: "Passa", aliases: ["Pessach", "Passah"], summary: "Fest der Erinnerung an die Befreiung aus Ägypten.", details: "Bis heute feiern Juden Pessach mit dem Sederabend und der Haggada. Die Evangelien verbinden Jesu Tod mit dem Passafest; Paulus nennt Christus „unser Passalamm“ (1Kor 5,7) – eine christliche Deutung.", refs: "2Mo 12,1–28; 5Mo 16,1–8; Lk 22,7–20; 1Kor 5,7", related: ["exodus", "mose"] },
  { id: "messias", kind: "term", name: "Messias", aliases: ["Christus", "Sohn Davids"], summary: "„Gesalbter“ (hebr. maschiach, griech. christos); erwarteter König aus Davids Linie.", details: "Die jüdischen Erwartungen zur Zeit Jesu waren vielfältig (königlich, priesterlich, prophetisch). Das Neue Testament bekennt Jesus als Messias; das Judentum teilt diese Deutung nicht.", refs: "2Sam 7,12–16; Ps 2; Jes 11,1–10; Mk 8,29; Joh 20,31", related: ["david", "jesus"] },
  { id: "prophet", kind: "term", name: "Prophet", summary: "Sprecher Gottes, der zur Umkehr ruft, Unrecht aufdeckt und Hoffnung verkündet.", details: "Prophetie ist nicht in erster Linie Zukunftsvorhersage, sondern Deutung der Gegenwart im Licht Gottes. Kriterien in 5Mo 18,15–22.", refs: "5Mo 18,15–22; Am 3,7–8; Jer 1,4–10", related: ["elia", "jesaja", "jona"] },
  { id: "areopag", kind: "term", name: "Areopag", summary: "„Areshügel“ in Athen und zugleich Name des dort tagenden Rates.", details: "Ob Paulus auf dem Hügel oder vor dem Rat sprach, ist nicht eindeutig zu entscheiden.", refs: "Apg 17,19–34", placeId: "athens", uncertain: "Ort bzw. Gremium unsicher.", related: ["paulus", "athen"] },
  // ---- Ereignisse
  { id: "exodus", kind: "event", name: "Auszug aus Ägypten", aliases: ["Exodus", "Auszug"], summary: "Gott befreit Israel aus der Sklaverei in Ägypten.", details: "Das Grundereignis des Glaubens Israels (2Mo 20,2). Route und Datierung sind historisch umstritten.", refs: "2Mo 12–15; 2Mo 20,2; Ps 136,10–15", placeId: "sinai", year: -1250, yearLabel: "13. oder 15. Jh. v. Chr.", uncertain: "Datierung und Route umstritten; keine direkten außerbiblischen Belege.", related: ["mose", "passa"] },
  { id: "exil", kind: "event", name: "Babylonisches Exil", aliases: ["Exil"], summary: "Zerstörung Jerusalems 586 v. Chr. und Verschleppung nach Babylon.", details: "Historisch gut belegt (u. a. babylonische Chroniken). Ab 538 v. Chr. erlaubt der Perserkönig Kyrus die Rückkehr.", refs: "2Kö 25,1–21; Ps 137; Jer 29,4–14; Esr 1,1–4", placeId: "babylon", year: -586, yearLabel: "586–538 v. Chr.", related: ["jerusalem"] },
  { id: "kreuzigung", kind: "event", name: "Kreuzigung Jesu", aliases: ["Kreuz"], summary: "Hinrichtung Jesu unter Pontius Pilatus in Jerusalem.", details: "Historisch gesichert (Tacitus, Josephus). Die genaue Datierung (30 oder 33 n. Chr.) wird diskutiert.", refs: "Mk 15,20–41; Joh 19,16–30; 1Kor 15,3", placeId: "jerusalem", year: 30, yearLabel: "30 oder 33 n. Chr.", related: ["jesus", "jerusalem"] },
  { id: "pfingsten", kind: "event", name: "Pfingsten", aliases: ["Schawuot"], summary: "Am jüdischen Wochenfest (Schawuot) empfangen die Jünger den Heiligen Geist.", details: "Schawuot erinnert im Judentum an die Ernte und später an die Gabe der Tora am Sinai. Lukas deutet das Ereignis mit Joel 3,1–5.", refs: "3Mo 23,15–21; Joel 3,1–5; Apg 2,1–41", placeId: "jerusalem", year: 30, yearLabel: "ca. 30/33 n. Chr.", related: ["petrus", "jerusalem"] },
];

export const INFO_BY_ID: Record<string, InfoEntry> = Object.fromEntries(LEXICON.map((e) => [e.id, e]));

/** Karte, auf der der Ort zu finden ist (bevorzugt Übersicht). */
export function mapForPlace(placeId: string): string | null {
  const order = ["overview", ...Object.keys(THEME_MAPS).filter((k) => k !== "overview" && k !== "journey")];
  return order.find((k) => THEME_MAPS[k]?.places.some((p) => p.id === placeId)) ?? null;
}

/** Infotafeln, deren Name/Alias im Text vorkommt (ganze Wörter). */
export function findInfoIds(text: string): string[] {
  const out: string[] = [];
  for (const e of LEXICON) {
    const names = [e.name, ...(e.aliases ?? [])];
    if (names.some((n) => new RegExp(`(^|[^A-Za-zÄÖÜäöüß])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-zÄÖÜäöüß]|$)`).test(text))) out.push(e.id);
  }
  return out;
}
