# BIBLIA – Die Reise durch Gottes Wort (PRD)

## Original Problem Statement
Master-Prompt: interaktive Android-Bibelstudiums-App mit zoombarer Abenteuer-Weltkarte, historischen Karten (gesichert/umstritten), Lernwelten (Tora, Propheten, Evangelien, Apostelgeschichte, Briefe, Gleichnisse …), 7-Phasen-Lernstationen, 15 Aufgabentypen, XP/Stufen/Abzeichen, Studienbibliothek, Builder-Modus, Offline, JSON Export/Import, Hell/Dunkel, Barrierearmut, fachlich gekennzeichnete Aussagen.

## User Choices
- Expo/React Native statt Kotlin (APK/AAB über Publish)
- Übersetzung: Elberfelder 1905 (gemeinfrei) + NeÜ bibel.heute (Platzhalter bis Lizenz geklärt)
- v1: Johannes vollständig spielbar + Weltkarte mit Vorschau aller Lernwelten + XP + Notizen
- Speicherung lokal (Default), HTML-Vorlagen will der User noch hochladen

## Architektur
- Nur Frontend (Expo Router), lokale Speicherung über `src/utils/storage`, kein Backend genutzt
- Kartenengine: `ZoomableMap` (Pinch, Pan mit Schwung, Doppeltipp, Zoomknöpfe) + SVG-Karten (Welt, Kampagne, Historisch) + Animationen (Wolken, Wasser, Feuer, Licht)
- Daten: `src/data/*` (Typen, Welten, Johannes-Kampagne, historische Karte, Bibelquelle), Logik: `src/lib/progress-logic.ts`, Store: `src/lib/store.tsx`
- Docs: `/app/docs/DATENMODELL.md`, `NEUE_BUECHER.md`, `INSTALLATION.md`; Tests: `node --test /app/tests/progress.test.mjs`

## Implementiert (2026-06)
- Weltkarte mit 9 Lernwelten in eigenen Farbwelten, HUD (Stufe/EP)
- Johannes-Kampagne: 10 Stationen mit Verzweigung, Freischaltung, Fortschrittswegen; historische Karte mit 11 Orten (gesichert/Tradition/umstritten, Koordinaten, Quellen)
- 7-Phasen-Station inkl. Begriffskarten, gekennzeichneten Aussagen, 9 Aufgabentypen (MC, Mehrfach, R/F, Lückentext, Vers vervollständigen, Zuordnung, Sortieren, Fehler finden, Freitext mit Musterantwort + Selbstbewertung), Prüfung (Bestehensgrenze), Reflexion, Abschluss mit EP; Autosave der Phase
- Bibelleser Johannes 1–21 (ELB 1905), Lesezeichen, frei konfigurierbare Farbmarkierungen, Versnotizen
- Bibliothek: Notizen, Lesezeichen, Markierungen (thematisch), Lernjournal, persönliches Lexikon, Suche
- Profil: Stufen, Statistik, Wochenziel, Abzeichen, Buchfortschritt, Wiederholung falscher Fragen
- Einstellungen: Hell/Dunkel/System, Schriftgröße, Übersetzung, Kategorien, JSON Export/Import mit Validierung, Reset
- Automatisierte Logiktests (7 bestanden), Frontend-Testlauf bestanden

## Iteration 2 (2026-06)
- Hauptkarte: echte Landesform Israels (Natural Earth, gemeinfrei) mit Städten, Ereignissen, Personen
- Themen-Chips passen die Karte an: Tora (Ur–Haran–Kanaan–Ägypten, Exodus als Hypothese), Geschichte (Stämme/Königreiche), Psalmen, Propheten (bis Babylon/Susa, Deportation/Rückkehr), Evangelien, Gleichnisse, Apg (Paulusreisen), Briefe, Offenbarung (7 Gemeinden)
- Vollbild: Edge-to-Edge, Android-Navigationsleiste ausgeblendet
- Ganze Bibel (ELB 1905) über /api/bible + Kapitel-Cache offline, Buchauswahl, Volltextsuche
- In der Bibel: Markierungen, Kommentare, Querverweis-Verknüpfungen, eigene Lerneinheiten (/unit/[id] mit Lernkarten)
- Bibelstellen in Lerneinheiten/Erklärungen/Orten sind antippbare Links in den Bibelleser
- Schema v3 (links, units) mit Migration

## Iteration 3 (2026-06)
- Karten-Modi: „Übersicht“ (Orte, Personen, Ereignisse je Thema) und „Studienreise“ (farbige Themenfelder → Lektionen)
- Illustrative Kartendetails: Berge, Wüsten, Gärten/fruchtbares Land, Palmen, Ölbäume, Hirte mit Schafen, Kamele, Boote, Häuser, antike Fernstraßen (Via Maris, Königsweg, Bergland – schematisch)

## Iteration 4 (2026-06)
- Zoomabhängige Kollisionserkennung (`src/lib/mapLayout.ts`): Marker, Beschriftungen und Kartenfiguren weichen sich aus (Mindestabstände inkl. Tippbereich), Neuberechnung je 25 % Zoomstufe
- `AnchoredMarker`: konstante Bildschirmgröße, sanft animiertes Gleiten, Ankerpunkt + dezente Verbindungslinie bei Verschiebung; geografische Anker unverändert
- Gilt für Übersicht (Orte + Figuren) und Studienreise (Themenfeld-Medaillons); Regionsnamen werden von Beschriftungen gemieden
- Veraltete `pointerEvents`-Props auf `style.pointerEvents` umgestellt

## Iteration 5 (2026-06)
- 5 HTML-Lernreisen des Users übernommen (Generator `/app/imports/convert.ts` → `src/data/campaigns/*.json`): Tora (5 Kampagnen = 5 Bücher Mose), Matthäus/Markus/Lukas (Welt „Evangelien“ neben Johannes, Kampagnen-Chips), Gleichnisse, Propheten, Apostelgeschichte, NT-Briefe
- Welten tora, prophets, parables, acts, letters, gospels spielbar (`World.campaignIds`); generische Abenteuerkarte in Weltfarben; historische Karte je Lernwelt
- Bibeltexte in Stationen werden bei Bedarf geladen (`ReadingVerses`)
- Intro-Animation beim Start (`IntroAnimation`): Weg Ägypten → Sinai → Jordan → Nazareth → Galiläa → Golgatha, Kreuz, Blick zum Himmel, Schriftrolle „BIBLIA“; überspringbar

## Iteration 6 (2026-06)
- Übersetzungsverwaltung: ELB 2006 als lizenzpflichtig vorbereitet (backend/data/elb2006.json → automatisch verfügbar, /api/bible/translations, ?t=), Anzeige immer „Angezeigt: …“; Fallback ELB 1905 klar gekennzeichnet
- Lexikon (src/data/lexicon.ts, 30 Infotafeln) mit Karte (Sprung via /?theme&place), Zeitstrahl (/timeline), Bibelstellen, Unsicherheiten; globale InfoSheet; auto-Verknüpfung aller Stationen + Zusatz-Zuordnungsaufgabe
- 6 neue Lektionen (Jakob, Elia, Jona, Bartimäus, Emmaus, Athen) mit Lernziel, Bezügen AT/NT (Zitat/Anspielung/Parallele/Auslegung), jüdischer Perspektive, Zusammenfassung
- Avatar (Schema v4): Editor /avatar, Anzeige in Profil, HUD, Abenteuerkarte, historische Karte („Du“, Kollisionslayout), Stationsstart/-abschluss; Export/Import mit Validierung
- Intro: „by Absole“

## Iteration 7 (2026-06)
- Persönlicher Studienbereich (/study): Weiterlesen, Heute lesen, Lesepläne (Vorlagen + Editor + Vorschau + Umplanen), Lesefortschritt je Buch (eindeutige Verse), Suche & Sammlung mit Tags/Filtern, Merkliste (1/3/7/14/30 Tage), Studienjournal, Quellenübersicht
- Bibel: Leseposition wird gespeichert/wiederhergestellt; Querverweis-Sprung mit Rückkehr (überschreibt Position nicht); Versmenü-Reiter Persönlich/Studienkommentare/Querverweise; Versbereiche; als gelesen markieren; Fokusmodus; Zeilenabstand
- Inhalte getrennt im Backend: /api/study/sources, /api/study/commentary, /api/study/xref (OpenBible CC BY, ≥8 Stimmen; KJV-Verszählung markiert), Matthew Henry Concise (gemeinfrei, englisch) Beispielbestand Joh 3
- Schema v5 (study)
- Offen: Erinnerungen (Benachrichtigungen), Tablet-Split-View, deutschsprachiger gemeinfreier Kommentar (Bengel/Werner) – Textquelle fehlt

## Backlog
- P1: Lernwelten Geschichtsbücher, Psalmen, Offenbarung mit Inhalten füllen
- P1: Builder-Modus (Karteneditor), weitere Lernwelten (Tora, Propheten, Evangelien, Apg, Briefe, Gleichnisse), weitere Aufgabentypen (Orte auf Karte zuordnen, Bilder zuordnen, Rätsel), Studienpläne
- P2: Lizenz NeÜ, handgemalte Illustrationen, Tablet-Layouts, synoptischer Vergleich

## Iteration 9 – Karten-Layout in allen Lernwelten (agent-tested, iteration_9.json)
- ZoomableMap: cover-fit (kein Leerraum), Startausschnitt aus lektionsrelevanten Orten, Buttons Zoom/Alle relevanten Orte/Ansicht zurücksetzen/Vollbild, Position bleibt bei Größenwechsel, keepVisible bei offener Infotafel
- GeoMap: Marker fix an Koordinaten, solveLabels (16 Slots, Leader-Linien, Hysterese, Gruppen +n, Ausblenden nachrangiger Labels, reservierte Bedienflächen)
- MapPanel (nicht-modal, unten/seitlich ab 720px), MapLegend (Legende, Linienarten, Quellen, Ortsliste)
- Lint/Typecheck projektweit sauber
## Offen
- Leseplan-Details (Ruhe-/Puffertage, verpasste Tage, Themenpläne) prüfen/ergänzen
- Deutsche gemeinfreie Kommentarquelle; Elberfelder 2006 nur mit Lizenz

## Iteration 10 – Deutscher Kommentar (agent-tested, iteration_10.json)
- Calvin Kommentare (deutsch, gemeinfrei laut GermanSwordModules/Lesekammer) als Quelle `calvin-de`: 2.972 Abschnitte zu Jos, Joh, Apg, Röm, Gal, Eph, Phil, Tit, Phlm, Hebr, Jak, 1/2Petr, 1Joh, Jud
- Versstudium: deutsche Auslegungen zuerst, lange Texte einklappbar, Sprache „Deutsch“
- Offen: Übersetzer/Jahr der deutschen Fassung nicht belegt → vor kommerziellem Release prüfen; weitere Bücher (AT, Evangelien außer Joh) ohne deutschen Kommentar

## Iteration 11 – Bibel-Kopfbereich (agent-tested, iteration_11.json)
- Zwei Buttons: Bibelbuch auswählen + Optionen ausklappen (Studium, Suche, Lesemodus, Zeilenabstand, Übersetzung)

## Iteration 12 – Bibliothek (agent-tested, iteration_12.json)
- Meine Einträge: Bibel (Buch→Kapitel→Vers, farbig nach Markierung/Typ) und Studienreise (Lernwelt→Lektion); freie Notizen
- Favoriten Bibel (Buch/Kapitel über Herz im Kopf, Vers im Vers-Menü), Favoriten Studienreise (Herz in Lektion + Karten-Panel)
- Lektionsnotizen; Bilder per Kamera/Galerie, nur lokal (expo-file-system), Titel+Notiz, Zuordnung Bibelstelle/Lektion
- Schema v6 (favorites, photos)

## Iteration 13 – Lexikon Etappe 1
- Artikelmodell (articleTypes.ts), 8 Musterartikel, Inhaltsplan nach Büchern, /lexicon (Suche inkl. Alias, Filter Typ/Epoche/Region/Buch, Favoriten, Zuletzt), /lexicon/[id] (Überblick/Vertiefung, Ebenen-Kennzeichnung, Bibelvorschau ELB1905 + Rücksprung, Karte mit Zeitständen/Vollbild/Ortsliste, Verbindungen, Aus deinen Lernreisen, Notiz, Quellen); Versmenü „Im Lexikon“; state.lexicon
- Übersicht: docs/LEXIKON_STAND.md

## Lexikon Etappe 2 – Tora (Juni 2026)
- 41 neue Artikel zu 1.–5. Mose (src/data/articlesTora1.ts, articlesTora2.ts); Tora-Inhaltsplan vollständig ausgearbeitet (49/135 gesamt).
- 12 KI-Personenillustrationen (OpenAI GPT Image 1 via Emergent LLM Key), einmalig erzeugt mit backend/scripts/gen_illustrations.py, als JPEG gebündelt (assets/images/lexicon) → offline. Gekennzeichnet „Künstlerische Rekonstruktion – Aussehen nicht überliefert“.
- Article.placeId verknüpft Kartenorte mit Artikeln. Testagent Iteration 15: alles grün.
- Nächste Etappen: Josua–Könige, Propheten/Exil, Evangelien, Apg/Briefe; weitere Illustrationen.

## Lexikon Etappe 3 – Josua bis 2. Könige + Bibliothek als Bücherregal (Juni 2026)
- 31 neue Artikel (src/data/articlesKings1.ts, articlesKings2.ts); 80/135 gesamt. 15 weitere KI-Illustrationen (gesamt 27).
- Bibliothek-Tab: Bücherregal (src/components/Bookshelf.tsx) – große Bücher Lexikon & Zeitstrahl, kleine Bücher Meine Einträge, Favoriten Bibel, Favoriten Studienreise, Bilder, Lerneinheiten, Begriffe & Infotafeln; Abschnitte mit farbigem Kopf und Zurück zum Regal.
- Testagent Iteration 16: alles grün.
- Offen: Etappen Esra–Propheten, Evangelien, Apg/Briefe/Offb.

## Lexikon Etappe 4 – Esra bis Propheten + Regal-Animation (Juni 2026)
- 23 neue Artikel (src/data/articlesProphets.ts); 103/135 gesamt. 10 weitere KI-Illustrationen (gesamt 37). Hiob-Prompt wurde vom Sicherheitsfilter abgelehnt und entschärft neu erzeugt.
- Bookshelf: Buch kippt beim Antippen aus dem Regal (~260ms, RN Animated, respektiert „Bewegung reduzieren“), danach Navigation; Doppeltipp-Schutz.
- Testagent Iteration 17: alles grün. Offen: Evangelien, Apg, Briefe, Offb (32 Artikel).

## Lexikon Etappe 5 – Evangelien + Zeitstrahl neu (Juni 2026)
- 21 neue Artikel (src/data/articlesGospels.ts); 124/135 gesamt. 9 weitere KI-Illustrationen (gesamt 46).
- Zeitstrahl neu (app/timeline.tsx, src/data/timelineData.ts): 8 Epochen als farbige Kapitelbänder mit Sprungchips, Filter (Personen/Ereignisse/Reiche & Begriffe), Bilder, 101 Einträge; Tippen öffnet Lexikonartikel (ältere Infotafeln → InfoSheet).
- Artikel: Button „Im Zeitstrahl zeigen“ → /timeline?focus=id (hervorgehoben, eingescrollt).
- Testagent Iteration 18: alles grün. Offen: Apg, Briefe, Offb (11 Artikel); Intro-Overlay erscheint mehrfach pro Sitzung (prüfen).

## Lexikon Etappe 6 – Urkirche + Sortierung/Filter-Sheet (Juni 2026)
- 11 neue Artikel (src/data/articlesChurch.ts) → Inhaltsplan 135/135 vollständig ausgearbeitet. 2 weitere KI-Bilder (gesamt 48).
- Lexikon-Index: ein „Filter“-Button öffnet Sheet (Art, Epoche, Region, Bibelbuch, kombinierbar, Zurücksetzen, „N Treffer anzeigen“); aktive Filter als entfernbare Chips; Sortierung A–Z / Zeitlich (TIMELINE_YEAR, sonst EPOCH_FALLBACK) für alle Listen.
- Relationen geprüft: keine ungültigen Ziele mehr (cana→nazareth, capernaum→kapernaum).
- Testagent Iteration 19: 21/23 grün; die 2 Datenfehler waren bereits behoben (Bundle-Cache), per Screenshot verifiziert.
- Hinweis: Intro-Overlay erscheint mehrfach pro Sitzung (offen).

## Intro „Reise bis zum Kreuz“ + Karten-Feinschliff (Juni 2026)
- IntroJourney (src/components/IntroJourney.tsx, Daten src/data/introScenes.ts): Titelkarte + 15 Szenen (Geburt → Auferstehung) mit KI-Bildern (assets/images/intro, gen_intro.py), Nacherzählung ohne Zitate, Bibelstellen, Hinweise zu abweichender Reihenfolge der Evangelien. Steuerung: zurück/pausieren/weiter/überspringen, Auto-Weiter 11 s, Ken-Burns-Kamerafahrt (aus bei reduzierter Bewegung/alten Android-Geräten), Farbstimmung je Szene, Vorladen ±1 Szene, Fortsetzen nach Unterbrechung (AsyncStorage), Pause bei App im Hintergrund.
- Erststart: nach Logo-Animation automatisch; danach nur noch über Einstellungen → „Intro erneut ansehen“ (/intro).
- Karte: neue Palette (Türkis-Meer, Sand, Olive, warmer Stein) in theme.ts; neuer Button „Zur aktuellen Lernstation“ in ZoomableMap.
- Testagent Iteration 20/21: grün nach Fixes (Resume, testID).
- Nicht umgesetzt (offen): zoomabhängige zusätzliche Landschafts-Illustrationen (Städte, Pflanzen, Bauwerke), Marker-Clustering-Überarbeitung, kompakte Stationsvorschau mit einklappbarem Detailbereich und alternative Stationsliste – bestehende Kartenlösung (Iteration 9) bleibt aktiv.

## Iteration 22 – Karten-Überarbeitung (agent-tested, nicht nutzerbestätigt)
- Abenteuerkarte: Stationsliste (Status, „Aktuell“), Legende mit Stationszuständen, ländliche Details (Dörfer, Weinberge, Felder, Herden, Palmen, Zelte, Zypressen) weichen Stationen/Wegen aus
- Historische Karte: reich illustrierte Deko mit Detailstufen je Zoom (Gebirgszüge, Dörfer, Weinberge, Kornfelder, Zedern, Papyrus, Brunnen, Zelte, ummauerte Städte, Fische, Wellen); Symbole wachsen beim Zoomen gedämpft
- Button „Aktuelle Station“ in beiden Kartenarten; Zoom/Ausschnitt sowie Kartenart/Kampagne bleiben beim Zurückkehren erhalten (Sitzung)
- Kartenanimationen respektieren „Bewegung reduzieren“; Bedienknöpfe brechen im Querformat in zwei Spalten um
- Fallback-Seite für unbekannte Lernwelt

## Iteration 23 – Lernwelt „Psalmen & Weisheit“ (Station 1+2)
- Welt `psalms` jetzt spielbar mit Kampagnen `psalms-1` (Die Psalmen als Gebetbuch) und `psalms-2` (Klage und Vertrauen): je 10 Einheiten (Stationen ps1-1…ps1-10, ps2-1…ps2-10) + Prüfung (`psalms-1-exam`, `psalms-2-exam`, 12 Fragen, schaltet nach allen 10 Einheiten frei)
- Jede Einheit: Lernziel, KI-Bild (assets/images/psalms, gen_psalms.py), Einführung, Bibeltexte (Elb 1905, Zählung der App-Daten – Überschrift in V. 1), Begriffskarten, Lehrtext (3–4 Abschnitte), Infotafel(n), 4–5 Aufgaben mit Begründung + Stelle, Freitext mit Musterantwort/Selbsteinschätzung, Reflexion (unbewertet), Wiederholungsfrage, Zusammenfassung, Lexikon-Links, Bibelleser-Link (Notizen/Markierungen)
- Messianische Kennzeichnung: „Im NT auf Jesus bezogen“ / „Christliche Vorausdeutung“ / „Thematische Verbindung“; Sammlung „Jesus in den Psalmen“ (/psalms-jesus; Ps 2, 8, 16, 22, 23, 69, 110, 118), Einträge nach Abschluss der Einheit freigeschaltet
- Iteration 25: Station 3 „Weisheit der Sprüche“ (psalms-3, ps3-1…ps3-10, Lebenskompass-Projekt in 3.10) und Station 4 „Hiob und das Leid“ (psalms-4, ps4-1…ps4-10, Leitfaden in 4.10) umgesetzt, inkl. Bilder und Prüfungen (je 12 Aufgaben). Alle 40 Einheiten vorhanden.

## Iteration 24 – Mein Gebetsheft
- Lokales Gebetsheft (state.prayers, Schema v7, migriert verlustfrei): Rubriken Dank, Orientierung, Angst, Hoffnung, Klage, Vergebung
- Hinzufügen: Bibelleser → Vers antippen → „Ins Gebetsheft“ → Rubrik (auch Versbereiche); Psalm-Einheit 1.10 → Schritt Reflexion → Vorschläge übernehmen
- Bibliothek: neues Buch „Gebetsheft“ (Regal 4) mit Filter, Suche, Verstext, Gebetsnotiz, Umsortieren innerhalb der Rubrik, Löschen mit Bestätigung, Sprung in den Bibelleser

## Iteration 26 – Lexikon Weisheit + Vers des Tages
- Neue Lexikonartikel: sprueche, buch-hiob, gottesfurcht, herz (articlesWisdom.ts, 139 Artikel gesamt); verknüpft mit allen ps3-*/ps4-* sowie ps1-2, ps1-7, ps2-4, ps2-7, ps2-8
- Startseite: „Vers des Tages“ aus dem Gebetsheft, täglich wechselnd, Rubrik wählbar (settings.votdCat), Sprung in Bibelleser/Gebetsheft

## Mein geistlicher Weg (Iteration 27, agent-tested, nicht nutzerbestätigt)
- Bibliothek → Buch „Mein geistlicher Weg“ (/way) mit zwei klar getrennten Bereichen.
- Allgemeines Register: 12 ausführliche Themen (src/data/way/topics1.ts, topics2.ts), Bibelstellen gegen ELB 1905 (KJV-Verszählung der Datendatei!) geprüft; 12 weitere Themen als „offen“ markiert.
- Persönliches Register: Check-in + Erkenntnis/Frage/Gebet/Schritt, Weg-Ansicht, neutraler Rückblick (7/30 Tage/frei), Export (JSON + Text), Wiederherstellen, vollständiges Löschen. Speicher: AsyncStorage `biblia_way_v1`, AES-256-GCM via expo-crypto, Schlüssel `biblia_way_key` im SecureStore; nicht im Lernstand-Export enthalten.
- Keine App-Sperre (Nutzerwahl), Krisennummern nur Deutschland, keine Push-Nachrichten, keine Sync.
