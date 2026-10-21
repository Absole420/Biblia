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

## Backlog
- P0: Übernahme der HTML-Vorlagen des Users (sobald hochgeladen)
- P1: Builder-Modus (Karteneditor), weitere Lernwelten (Tora, Propheten, Evangelien, Apg, Briefe, Gleichnisse), weitere Aufgabentypen (Orte auf Karte zuordnen, Bilder zuordnen, Rätsel), Studienpläne
- P2: Lizenz NeÜ, handgemalte Illustrationen, Tablet-Layouts, synoptischer Vergleich
