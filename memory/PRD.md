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
