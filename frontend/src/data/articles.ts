import { Article } from "./articleTypes";
import { SRC_BIBLE, SRC_GEO } from "./articleSources";
import { ARTICLES_GEN } from "./articlesTora1";
import { ARTICLES_EXO } from "./articlesTora2";
import { ARTICLES_JOS } from "./articlesKings1";
import { ARTICLES_KINGS } from "./articlesKings2";
import { ARTICLES_PROPHETS } from "./articlesProphets";
import { ARTICLES_GOSPELS } from "./articlesGospels";
import { ARTICLES_CHURCH } from "./articlesChurch";
import { ARTICLES_WISDOM } from "./articlesWisdom";

/** Etappe 1: je Artikeltyp ein Musterartikel. */
const STAGE1: Article[] = [
  {
    id: "abraham", kind: "person", title: "Abraham", aliases: ["Abram", "Ibrahim"], category: "Erzvater",
    summary: "Stammvater Israels. Nach 1. Mose verlässt er auf Gottes Ruf Haran und zieht als Fremder durch Kanaan – mit der Verheißung von Land, Nachkommen und Segen für alle Völker.",
    disambiguation: "Nicht zu verwechseln mit Abraham als Bild im Gleichnis vom reichen Mann und armen Lazarus (Lk 16,22–31), wo er als Gestalt der jenseitigen Welt erscheint.",
    overview: [
      { h: "Lebensstationen", layer: "bible", body: "Ur in Chaldäa → Haran (Aufbruch mit Terach) → Sichem und Bethel → Ägypten (Hungersnot) → Mamre bei Hebron → Gerar und Beerscheba. Begraben wird er in der Höhle Machpela bei Hebron (1Mo 25,9–10)." },
      { h: "Die Verheißung", layer: "bible", body: "Gott verspricht ihm Land, viele Nachkommen und dass in ihm „alle Geschlechter der Erde“ gesegnet werden (1Mo 12,1–3). Der Bund wird in 1Mo 15 und 17 bekräftigt; Abram erhält den Namen Abraham." },
      { h: "Familie", layer: "bible", body: "Ehefrau Sara (Sarai); Söhne Ismael (von Hagar) und Isaak (von Sara); Neffe Lot. Isaak wird Vater von Jakob und Esau." },
    ],
    deep: [
      { h: "Die Bindung Isaaks", layer: "bible", body: "1Mo 22 erzählt, wie Abraham bereit ist, Isaak auf einem Berg im Land Morija zu opfern, und Gott ihn davon abhält. Die jüdische Tradition nennt die Erzählung „Akeda“ (Bindung); 2Chr 3,1 verbindet Morija mit dem späteren Tempelberg." },
      { h: "Historische Einordnung", layer: "history", body: "Außerbiblische Zeugnisse, die Abraham als Person nennen, sind nicht bekannt. Namen, Wanderbewegungen und Bräuche der Erzählungen lassen sich mit dem 2. Jahrtausend v. Chr. vergleichen; manche Details (z. B. Kamele, „Ur der Chaldäer“) spiegeln eher spätere Zeiten." },
      { h: "Entstehung der Texte", layer: "hypothesis", body: "Viele Forschende gehen davon aus, dass die Abrahamserzählungen über längere Zeit überliefert und erst im 1. Jahrtausend v. Chr. schriftlich zusammengefügt wurden. Über Umfang und Datierung der Überlieferungsschichten gibt es unterschiedliche Modelle." },
      { h: "Auslegung", layer: "tradition", body: "Im Judentum ist Abraham „Avraham Avinu“, unser Vater, und Vorbild der Gastfreundschaft (1Mo 18). Christliche Ausleger betonen mit Paulus seinen Glauben (Röm 4; Gal 3) und Jakobus dessen Bewährung im Handeln (Jak 2,21–23). Christen lesen die Segensverheißung auf Jesus Christus hin (Gal 3,16)." },
      { h: "Zum Nachdenken", layer: "reflection", body: "Abraham bricht auf, ohne das Ziel zu kennen (Hebr 11,8). Wo erfordert Vertrauen bei dir einen Schritt ins Unbekannte?" },
    ],
    refs: ["1Mo 11,27–32", "1Mo 12,1–9", "1Mo 15,1–6", "1Mo 17,1–8", "1Mo 22,1–19", "1Mo 25,7–10", "Röm 4,1–3", "Hebr 11,8–12"],
    timeframe: "Erzväterzeit; nach üblicher Einordnung 1. Hälfte bis Mitte des 2. Jahrtausends v. Chr. (unsicher, keine gesicherten Jahreszahlen)",
    epoch: "erzvaeter", region: "kanaan", books: ["1Mo", "Jes", "Mt", "Lk", "Röm", "Gal", "Hebr", "Jak"],
    relations: [
      { type: "lived", target: "ur", label: "Ur in Chaldäa", uncertain: true },
      { type: "lived", target: "haran", label: "Haran" },
      { type: "lived", target: "hebron", label: "Hebron / Mamre" },
      { type: "family", target: "sara", label: "Ehemann Saras" },
      { type: "family", target: "isaak", label: "Vater Isaaks" },
      { type: "family", target: "lot", label: "Onkel Lots" },
      { type: "family", target: "jakob", label: "Großvater Jakobs" },
      { type: "related", target: "sodom", label: "Fürbitte für Sodom" },
      { type: "mentioned", target: "jerusalem", label: "Morija (nach 2Chr 3,1 Tempelberg)", uncertain: true },
    ],
    map: { mapId: "tora", placeIds: ["ur", "haran", "shechem", "bethel", "hebron", "beersheba"], routeIds: ["abraham"], note: "Route nach den Ortsangaben in 1. Mose; die Lage von Ur ist traditionell (Tell el-Muqayyar), Alternativen werden diskutiert. Wegverlauf vermutet." },
    sources: [SRC_BIBLE, SRC_GEO, "Zur Lage von Ur: Ausgrabungen von C. L. Woolley (1922–1934) in Tell el-Muqayyar; Identifikation mit dem biblischen „Ur der Chaldäer“ ist traditionell, nicht gesichert."],
  },
  {
    id: "hochzeit-kana", kind: "story", title: "Die Hochzeit zu Kana", aliases: ["Weinwunder", "Kana"], category: "Erzählung im Johannesevangelium",
    summary: "Bei einer Hochzeit in Kana geht der Wein aus. Jesus lässt sechs steinerne Wasserkrüge füllen – das Wasser wird zu Wein. Johannes nennt es das erste seiner Zeichen.",
    overview: [
      { h: "Ausgangssituation", layer: "bible", body: "Am dritten Tag ist eine Hochzeit in Kana in Galiläa. Die Mutter Jesu, Jesus und seine Jünger sind eingeladen. Als der Wein ausgeht, macht Maria Jesus darauf aufmerksam (Joh 2,1–3)." },
      { h: "Verlauf (Nacherzählung)", layer: "bible", body: "Jesus antwortet zunächst zurückhaltend: „Meine Stunde ist noch nicht gekommen.“ Maria sagt den Dienern, sie sollen tun, was er sagt. Sechs Steinkrüge für die Reinigung werden mit Wasser gefüllt; der Speisemeister kostet und lobt den guten Wein, ohne zu wissen, woher er stammt (Joh 2,4–10)." },
      { h: "Beteiligte & Schauplatz", layer: "bible", body: "Jesus, Maria, die Jünger, Diener, Speisemeister, Bräutigam. Ort: Kana in Galiläa – nicht sicher lokalisiert (siehe Ort)." },
    ],
    deep: [
      { h: "Auslegung: „Zeichen“", layer: "tradition", body: "Johannes nennt das Ereignis „Anfang der Zeichen“ (Joh 2,11): Es soll auf Jesu Herrlichkeit hinweisen. Christliche Ausleger verbinden den Überfluss an Wein mit prophetischen Bildern der Heilszeit (Am 9,13; Jes 25,6) und die Hochzeit mit dem Bild Gottes als Bräutigam seines Volkes." },
      { h: "Kultureller Hintergrund", layer: "history", body: "Hochzeiten dauerten oft mehrere Tage; Gastfreundschaft war Ehrensache. Steinerne Gefäße galten im Judentum der Zeit als nicht verunreinigbar – Funde solcher Steingefäße aus dem 1. Jh. sind aus Galiläa und Jerusalem bekannt." },
      { h: "Wo lag Kana?", layer: "hypothesis", body: "Kandidaten sind Chirbet Qana (ca. 14 km nördlich von Nazareth, mit Ausgrabungen einer Siedlung der römischen Zeit) und Kafr Kanna (traditioneller Pilgerort). Die Frage ist umstritten." },
      { h: "Zum Nachdenken", layer: "reflection", body: "Maria bringt eine peinliche Not einfach vor Jesus. Was würdest du ihm heute ebenso schlicht hinlegen?" },
    ],
    refs: ["Joh 2,1–11", "Joh 4,46–54", "Joh 21,2", "Jes 25,6", "Am 9,13"],
    timeframe: "Beginn des öffentlichen Wirkens Jesu, um 28–30 n. Chr. (Näherung)",
    epoch: "jesus", region: "galilaea", books: ["Joh"],
    relations: [
      { type: "participated", target: "jesus", label: "Jesus von Nazareth" },
      { type: "participated", target: "maria", label: "Maria" },
      { type: "tookPlace", target: "nazareth", label: "Kana bei Nazareth", uncertain: true },
      { type: "related", target: "passa", label: "Passa (folgt in Joh 2,13)" },
    ],
    stationIds: ["john-3"],
    map: { mapId: "gospels", placeIds: ["cana", "nazareth", "capernaum"], note: "Kana ist nicht sicher lokalisiert; dargestellt ist die traditionelle bzw. diskutierte Lage." },
    sources: [SRC_BIBLE, SRC_GEO, "Steingefäße: Grabungsberichte zu Werkstätten bei Reina und Kafr Kanna (Galiläa), veröffentlicht durch die Israel Antiquities Authority."],
  },
  {
    id: "exil", kind: "event", title: "Das Babylonische Exil", aliases: ["Babylonische Gefangenschaft", "Exil", "Verbannung"], category: "Ereignis der Geschichte Israels",
    summary: "Nach Eroberungen Jerusalems durch das Neubabylonische Reich (597 und 587/586 v. Chr.) werden Teile der Bevölkerung Judas nach Babylonien verschleppt. Mit dem Edikt des Perserkönigs Kyros (539/538 v. Chr.) beginnt die Rückkehr.",
    overview: [
      { h: "Vorgeschichte", layer: "bible", body: "Juda gerät zwischen Ägypten und Babylon. König Jojakim fällt von Babylon ab; sein Sohn Jojachin wird 597 v. Chr. mit der Oberschicht deportiert (2Kö 24,10–16)." },
      { h: "Ablauf", layer: "bible", body: "Unter Zedekia folgt ein weiterer Aufstand. Nebukadnezar belagert Jerusalem; Stadt und Tempel werden zerstört, weitere Deportationen folgen (2Kö 25,1–21; Jer 52)." },
      { h: "Folgen", layer: "bible", body: "Im Exil wirken Ezechiel (am Fluss Kebar) und – nach verbreiteter Annahme – der Prophet hinter Jes 40–55. Psalm 137 verleiht der Klage Ausdruck. Esra 1 berichtet von der Rückkehr unter Kyros." },
    ],
    deep: [
      { h: "Außerbiblische Belege", layer: "history", body: "Die Babylonische Chronik (Tafel BM 21946) nennt die Einnahme Jerusalems im März 597 v. Chr. Verwaltungstexte aus Babylon erwähnen Rationen für „Jaukinu, König des Landes Jahud“ (Jojachin). Der Kyros-Zylinder beschreibt eine Politik der Rückführung von Kulten und Völkern, nennt Juda aber nicht ausdrücklich." },
      { h: "Datierungsfrage", layer: "hypothesis", body: "Für die Zerstörung Jerusalems werden 587 oder 586 v. Chr. vertreten, je nach Berechnung der Regierungsjahre. Wie groß der deportierte Anteil der Bevölkerung war, ist umstritten." },
      { h: "Bedeutung", layer: "tradition", body: "In jüdischer Überlieferung prägt das Exil Gebet, Schriftstudium und Identität ohne Tempel; der Fasttag Tischa beAv erinnert an die Zerstörung. Christliche Ausleger lesen die Trostworte von Jes 40 – wie schon die Evangelien (Mk 1,2–3) – auf Johannes den Täufer und Jesus hin." },
      { h: "Zum Nachdenken", layer: "reflection", body: "Jeremia rät den Verbannten, „der Stadt Bestes“ zu suchen (Jer 29,7). Wie lebt man treu an einem Ort, den man sich nicht ausgesucht hat?" },
    ],
    refs: ["2Kö 24,10–17", "2Kö 25,1–21", "Jer 29,1–14", "Ps 137,1–6", "Hes 1,1–3", "Esr 1,1–4"],
    timeframe: "597 v. Chr. (1. Deportation) · 587/586 v. Chr. (Zerstörung Jerusalems) · 539/538 v. Chr. (Edikt des Kyros)",
    epoch: "exil", region: "mesopotamien", books: ["2Kö", "2Chr", "Jer", "Kla", "Hes", "Dan", "Esr", "Ps"],
    relations: [
      { type: "tookPlace", target: "babylon", label: "Babylon" },
      { type: "tookPlace", target: "jerusalem", label: "Jerusalem (Zerstörung)" },
      { type: "participated", target: "jesaja", label: "Prophetenbuch Jesaja (Jes 40–55)", uncertain: true },
      { type: "related", target: "assyrien", label: "Assyrisches Reich (Vorgeschichte)" },
    ],
    map: { mapId: "prophets", placeIds: ["jerusalem", "babylon", "kebar", "carchemish"], routeIds: ["exile", "return"], note: "Deportations- und Rückkehrweg vermutet (übliche Route entlang des Fruchtbaren Halbmonds, nicht durch die Wüste)." },
    sources: [SRC_BIBLE, SRC_GEO, "Babylonische Chronik, British Museum BM 21946.", "Jojachin-Rationstexte (Babylon, Südburg), Vorderasiatisches Museum Berlin.", "Kyros-Zylinder, British Museum BM 90920."],
  },
  {
    id: "jerusalem", kind: "place", title: "Jerusalem", aliases: ["Zion", "Salem", "Stadt Davids", "Jebus", "Aelia Capitolina"], category: "Stadt in Judäa",
    summary: "Stadt im judäischen Bergland, von David zur Hauptstadt gemacht, Ort des Tempels und zentraler Schauplatz von Altem und Neuem Testament.",
    overview: [
      { h: "Lage & Landschaft", layer: "history", body: "Auf rund 750 m Höhe auf Hügeln zwischen Kidrontal (Osten) und Hinnomtal (Süden/Westen). Wichtigste Quelle: Gihon. Östlich liegt der Ölberg, dahinter fällt das Land zur Judäischen Wüste ab." },
      { h: "In der Bibel", layer: "bible", body: "David erobert die Jebusiterstadt (2Sam 5,6–9), Salomo baut den Tempel (1Kö 6). Babylon zerstört Stadt und Tempel (2Kö 25). Nach dem Exil Wiederaufbau (Esr, Neh). Jesus lehrt im Tempel, wird hier gekreuzigt; Pfingsten beginnt die Gemeinde (Apg 2)." },
    ],
    deep: [
      { h: "Epochen im Überblick", layer: "history", body: "Bronzezeit: befestigte Stadt auf dem Südosthügel („Stadt Davids“). Eisenzeit: Ausdehnung nach Norden (Tempelberg) und Westen; Hiskia-Tunnel (Siloah-Inschrift, 8. Jh.). Persische Zeit: kleine Stadt. Herodes der Große (37–4 v. Chr.) erweitert den Tempelbezirk gewaltig. 70 n. Chr. Zerstörung durch Rom; später römische Kolonie Aelia Capitolina." },
      { h: "Archäologie", layer: "history", body: "Gesichert sind u. a. Teile der Stadtmauern verschiedener Epochen, die Siloah-Inschrift, die herodianischen Stützmauern des Tempelplatzes (Westmauer) und der Siloah-Teich der römischen Zeit. Die Deutung einzelner Bauten als „Palast Davids“ ist umstritten." },
      { h: "Auslegung", layer: "tradition", body: "Zion steht in Psalmen und Propheten für Gottes Gegenwart bei seinem Volk (Ps 48; Jes 2,2–4). Das Neue Testament spricht vom „himmlischen Jerusalem“ (Hebr 12,22; Offb 21) – ein christliches Hoffnungsbild." },
    ],
    refs: ["2Sam 5,6–10", "1Kö 8,1–11", "2Kö 25,8–10", "Neh 2,11–18", "Ps 122,1–9", "Lk 19,41–44", "Apg 2,1–13"],
    timeframe: "Besiedelt seit der Bronzezeit; Hauptstadt ab David (10. Jh. v. Chr., genaue Daten unsicher)",
    epoch: "koenigszeit", region: "judaea", books: ["2Sam", "1Kö", "2Kö", "Neh", "Ps", "Jes", "Jer", "Mt", "Lk", "Joh", "Apg", "Offb"],
    relations: [
      { type: "partOf", target: "assyrien", label: "Tributpflichtig gegenüber Assyrien (zeitweise)" },
      { type: "related", target: "exil", label: "Zerstörung 587/586 v. Chr." },
      { type: "related", target: "stiftshuette", label: "Stiftshütte → Tempel" },
      { type: "related", target: "passa", label: "Wallfahrtsfest Passa" },
    ],
    map: { mapId: "overview", placeIds: ["jerusalem", "bethlehem", "jericho", "hebron", "qumran"], note: "Lage Jerusalems im judäischen Bergland (gesicherte Lokalisierung)." },
    sources: [SRC_BIBLE, SRC_GEO, "Siloah-Inschrift: Istanbul, Archäologisches Museum (Inv. 2195)."],
  },
  {
    id: "see-genezareth", kind: "water", title: "See Genezareth", aliases: ["See von Tiberias", "Galiläisches Meer", "Kinneret", "Kinnereth"], category: "See in Galiläa",
    summary: "Süßwassersee in Galiläa, rund 21 km lang und bis 13 km breit, etwa 210 m unter dem Meeresspiegel. Hauptschauplatz des Wirkens Jesu.",
    overview: [
      { h: "Geografie", layer: "history", body: "Der Jordan fließt von Norden in den See und verlässt ihn im Süden. Steile Ufer im Osten (Golan), fruchtbare Ebene Gennesar im Nordwesten. Plötzliche Fallwinde können heftige Stürme auslösen." },
      { h: "In der Bibel", layer: "bible", body: "Im AT als Kinneret Grenzangabe (4Mo 34,11; Jos 13,27). In den Evangelien: Berufung der Fischer (Mk 1,16–20), Sturmstillung (Mk 4,35–41), Gang auf dem Wasser (Mt 14,22–33), Begegnung nach Ostern (Joh 21)." },
    ],
    deep: [
      { h: "Orte am Ufer", layer: "history", body: "Kapernaum (Ausgrabungen mit Synagoge des 4./5. Jh. über älteren Fundamenten), Magdala, Tiberias (von Herodes Antipas um 20 n. Chr. gegründet), Betsaida (Lage umstritten: et-Tell oder el-Araj)." },
      { h: "Das Boot von Ginnosar", layer: "history", body: "1986 wurde bei niedrigem Wasserstand ein Fischerboot aus der römischen Zeit (1. Jh. v./n. Chr.) gefunden, ca. 8 m lang. Es zeigt, wie Boote der Zeit gebaut waren – es ist kein Boot einer bestimmten biblischen Person." },
      { h: "Auslegung", layer: "tradition", body: "Christliche Ausleger lesen die Sturmstillung als Bild für Jesu Vollmacht über das Chaos, das im AT mit dem Meer verbunden ist (Ps 107,23–30)." },
    ],
    refs: ["4Mo 34,11", "Mk 1,16–20", "Mk 4,35–41", "Mt 14,22–33", "Joh 6,1", "Joh 21,1–14"],
    timeframe: "Geologisch alt; im NT 1. Jh. n. Chr.",
    epoch: "jesus", region: "galilaea", books: ["4Mo", "Jos", "Mt", "Mk", "Lk", "Joh"],
    relations: [
      { type: "related", target: "kapernaum", label: "Kapernaum" },
      { type: "related", target: "jesus", label: "Wirkungsgebiet Jesu" },
      { type: "related", target: "hochzeit-kana", label: "Kana (westlich im Bergland)" },
    ],
    map: { mapId: "gospels", placeIds: ["capernaum", "tiberias", "bethsaida", "gerasa", "nazareth"], note: "Die Seefläche stammt aus den Natural-Earth-Geodaten. Betsaida und das Gebiet der Gerasener sind unsicher lokalisiert." },
    sources: [SRC_BIBLE, SRC_GEO, "Boot von Ginnosar: Yigal Allon Museum, Ginosar; Bergung 1986 durch die Israelische Altertümerbehörde."],
  },
  {
    id: "assyrien", kind: "empire", title: "Assyrien (Neuassyrisches Reich)", aliases: ["Assur", "Assyrer", "Assyrisches Reich"], category: "Großreich in Mesopotamien",
    summary: "Großreich am oberen Tigris mit den Hauptstädten Assur, Kalchu (Nimrud), Dur-Scharrukin und Ninive. Zerstört 722/720 v. Chr. Samaria und belagert 701 v. Chr. Juda.",
    overview: [
      { h: "Entstehung", layer: "history", body: "Die Stadt Assur ist seit dem 3. Jahrtausend v. Chr. bewohnt. Ab dem 9. Jh. v. Chr. dehnt sich das Neuassyrische Reich durch Feldzüge nach Westen aus." },
      { h: "Wichtige Herrscher mit Bezug zur Bibel", layer: "history", body: "Salmanassar III. (Schwarzer Obelisk zeigt Jehu von Israel), Tiglat-Pileser III. (in 2Kö 15,19 „Pul“), Salmanassar V. und Sargon II. (Eroberung Samarias), Sanherib (Feldzug gegen Hiskia 701), Asarhaddon und Assurbanipal." },
      { h: "In der Bibel", layer: "bible", body: "2Kö 17 deutet den Untergang des Nordreichs theologisch. 2Kö 18–19 und Jes 36–37 erzählen von der Belagerung Jerusalems unter Sanherib. Jona und Nahum richten sich an Ninive." },
    ],
    deep: [
      { h: "Sanheribs Feldzug 701 v. Chr.", layer: "history", body: "Das Taylor-Prisma berichtet, Sanherib habe Hiskia „wie einen Vogel im Käfig“ in Jerusalem eingeschlossen – eine Einnahme der Stadt nennt es nicht. Die Lachisch-Reliefs aus Ninive zeigen die Eroberung von Lachisch. Die Bibel erzählt von Tribut und der Rettung Jerusalems (2Kö 18,13–19,37)." },
      { h: "Untergang", layer: "history", body: "612 v. Chr. erobern Babylonier und Meder Ninive; nach der Schlacht bei Karkemisch (605 v. Chr.) übernimmt Babylon die Vorherrschaft im Westen." },
      { h: "Ausdehnung zu bestimmten Zeitpunkten", layer: "hypothesis", body: "Die Karte zeigt Zentren und belegte Machtbereiche zu drei Zeitständen. Genaue Grenzen sind für das Altertum nicht gesichert und werden deshalb nicht als Linie gezeichnet." },
    ],
    refs: ["2Kö 15,19–20", "2Kö 17,1–6", "2Kö 18,13–19,37", "Jes 10,5–11", "Jona 3,1–10", "Nah 3,1–7"],
    timeframe: "Neuassyrisches Reich ca. 911–609 v. Chr.",
    epoch: "koenigszeit", region: "mesopotamien", books: ["2Kö", "2Chr", "Jes", "Jona", "Nah", "Hos"],
    relations: [
      { type: "related", target: "jona", label: "Jona predigt in Ninive" },
      { type: "related", target: "jesaja", label: "Jesaja zur Zeit Sanheribs" },
      { type: "related", target: "exil", label: "Nachfolger: Babylon" },
    ],
    stationIds: ["x-jona"],
    map: {
      mapId: "prophets", placeIds: ["assur", "nineveh", "carchemish", "jerusalem", "babylon"], routeIds: ["assyria"],
      note: "Kerngebiet am oberen Tigris gesichert; Machtbereiche je Zeitstand nur über belegte Orte, ohne erfundene Grenzlinien.",
      states: [
        { label: "um 850 v. Chr.", placeIds: ["assur", "nineveh", "carchemish"], note: "Unter Salmanassar III.: Kernland am Tigris, Feldzüge bis zum Euphrat und nach Syrien." },
        { label: "um 720 v. Chr.", placeIds: ["assur", "nineveh", "carchemish", "babylon", "jerusalem"], note: "Nach dem Fall Samarias: Herrschaft bis zur Levante; Juda ist tributpflichtig." },
        { label: "um 670 v. Chr.", placeIds: ["assur", "nineveh", "carchemish", "babylon", "jerusalem", "tahpanhes"], note: "Unter Asarhaddon zeitweise bis nach Ägypten; größte Ausdehnung." },
      ],
    },
    sources: [SRC_BIBLE, SRC_GEO, "Taylor-Prisma Sanheribs, British Museum BM 91032.", "Lachisch-Reliefs, British Museum (aus dem Südwestpalast in Ninive).", "Schwarzer Obelisk Salmanassars III., British Museum BM 118885."],
  },
  {
    id: "stiftshuette", kind: "building", title: "Stiftshütte", aliases: ["Zelt der Begegnung", "Offenbarungszelt", "Mischkan", "Tabernakel"], category: "Heiligtum der Wüstenzeit",
    summary: "Tragbares Zeltheiligtum, das Israel nach 2. Mose am Sinai errichtet und auf der Wüstenwanderung mitführt: Ort der Begegnung zwischen Gott und seinem Volk.",
    overview: [
      { h: "Aufbau nach 2. Mose", layer: "bible", body: "Vorhof mit Brandopferaltar und Waschbecken; Zelt mit zwei Räumen: das Heilige (Leuchter, Schaubrottisch, Räucheraltar) und das Allerheiligste mit der Bundeslade, getrennt durch einen Vorhang (2Mo 25–27; 36–40)." },
      { h: "Funktion", layer: "bible", body: "Gottes Herrlichkeit erfüllt das Zelt (2Mo 40,34–35). Die Leviten tragen es; beim Aufbruch zieht die Wolke voran (4Mo 9,15–23). Später steht es u. a. in Silo (Jos 18,1)." },
    ],
    deep: [
      { h: "Maße und Darstellung", layer: "bible", body: "Die Bibel nennt Maße in Ellen (eine Elle ≈ 45–52 cm). Rekonstruktionen in Büchern und Modellen sind Deutungen dieser Angaben; ein archäologischer Befund der Stiftshütte existiert nicht." },
      { h: "Historische Fragen", layer: "hypothesis", body: "Manche Forschende sehen in der Beschreibung ein Idealbild, das am späteren Tempel orientiert ist; andere verweisen auf ägyptische Zeltheiligtümer und tragbare Kultobjekte der Bronzezeit als Parallelen." },
      { h: "Auslegung", layer: "tradition", body: "Die jüdische Tradition verbindet das Mischkan mit der Schechina, der Gegenwart Gottes. Das Neue Testament greift das Bild auf: „Das Wort … zeltete unter uns“ (Joh 1,14, wörtlich); der Hebräerbrief deutet das Heiligtum auf Christus hin (Hebr 9) – eine christliche Auslegung." },
    ],
    refs: ["2Mo 25,1–9", "2Mo 26,31–35", "2Mo 40,33–38", "4Mo 9,15–23", "Jos 18,1", "Hebr 9,1–12"],
    timeframe: "Nach biblischer Darstellung Wüstenzeit bis frühe Königszeit; historische Datierung offen",
    epoch: "exodus", region: "aegypten", books: ["2Mo", "3Mo", "4Mo", "Jos", "1Sam", "Hebr"],
    relations: [
      { type: "related", target: "mose", label: "Mose errichtet das Heiligtum" },
      { type: "lived", target: "sinai", label: "Errichtet am Sinai", uncertain: true },
      { type: "related", target: "bundeslade", label: "Bundeslade im Allerheiligsten" },
      { type: "related", target: "aaron", label: "Priesterdienst Aarons" },
      { type: "related", target: "jerusalem", label: "Später: Tempel in Jerusalem" },
    ],
    stationIds: ["tora-2-6"],
    map: { mapId: "tora", placeIds: ["sinai", "kadesh", "rameses"], routeIds: ["exodus"], note: "Lage des Sinai und der Wüstenroute umstritten; dargestellt ist eine traditionelle Variante." },
    sources: [SRC_BIBLE, SRC_GEO],
  },
  {
    id: "passa", kind: "term", title: "Passa", aliases: ["Pessach", "Passah", "Pascha", "Fest der ungesäuerten Brote"], category: "Fest & Brauch",
    summary: "Frühlingsfest zur Erinnerung an die Befreiung aus Ägypten, verbunden mit dem Fest der ungesäuerten Brote. Im NT der Zeitrahmen von Jesu letztem Mahl und seinem Tod.",
    overview: [
      { h: "Ursprung nach 2. Mose", layer: "bible", body: "In der Nacht des Auszugs schlachtet jede Familie ein Lamm und streicht das Blut an die Türpfosten; der Verderber „geht vorüber“ (hebr. pasach). Sieben Tage wird ungesäuertes Brot gegessen (2Mo 12)." },
      { h: "Zur Zeit Jesu", layer: "history", body: "Passa war ein Wallfahrtsfest: Lämmer wurden im Tempel geschlachtet und in Jerusalem gegessen. Josephus berichtet von großen Pilgermengen." },
    ],
    deep: [
      { h: "Seder heute", layer: "tradition", body: "Nach der Tempelzerstörung entwickelte sich der Seder im Familienkreis mit Haggada, Mazza, Bitterkräutern und vier Bechern Wein. Die Frage der Kinder „Was unterscheidet diese Nacht?“ steht im Mittelpunkt." },
      { h: "Christliche Deutung", layer: "tradition", body: "Paulus nennt Christus „unser Passah“ (1Kor 5,7). Ob das letzte Mahl Jesu ein Passamahl war, wird diskutiert: Die ersten drei Evangelien legen es nahe, Johannes datiert den Tod Jesu auf den Rüsttag des Passa (Joh 19,14)." },
      { h: "Zum Nachdenken", layer: "reflection", body: "Passa ist Erinnerung, die erzählt wird. Welche Erfahrung von Befreiung würdest du weitererzählen?" },
    ],
    refs: ["2Mo 12,1–14", "5Mo 16,1–8", "Jos 5,10–12", "2Kö 23,21–23", "Lk 22,7–20", "Joh 19,14", "1Kor 5,7–8"],
    timeframe: "14./15. Nisan (März/April); seit biblischer Zeit bis heute",
    epoch: "exodus", region: "aegypten", books: ["2Mo", "4Mo", "5Mo", "Jos", "2Kö", "Esr", "Mt", "Mk", "Lk", "Joh", "1Kor"],
    relations: [
      { type: "related", target: "mose", label: "Auszug unter Mose" },
      { type: "tookPlace", target: "jerusalem", label: "Wallfahrt nach Jerusalem" },
      { type: "related", target: "hochzeit-kana", label: "Joh 2,13 folgt auf Kana" },
    ],
    sources: [SRC_BIBLE, "Flavius Josephus, Jüdischer Krieg 6,423–427 (Pilgerzahlen; Angaben gelten als übertrieben)."],
  },
];

/** Vollständig ausgearbeitete Artikel (Etappe 1, 2: Tora, 3: Josua–Könige, 4: Esra–Propheten). */
export const ARTICLES: Article[] = [...STAGE1, ...ARTICLES_GEN, ...ARTICLES_EXO, ...ARTICLES_JOS, ...ARTICLES_KINGS, ...ARTICLES_PROPHETS, ...ARTICLES_GOSPELS, ...ARTICLES_CHURCH, ...ARTICLES_WISDOM];

export const ARTICLE_BY_ID: Record<string, Article> = Object.fromEntries(ARTICLES.map((a) => [a.id, a]));
