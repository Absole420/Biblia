# Weitere Bibelbücher hinzufügen

1. **Bibeltext** (nur gemeinfrei oder lizenziert!): JSON `{ chapters: { "1": ["Vers 1", ...] } }` unter `frontend/src/data/` ablegen
   und in `src/data/bible.ts` in `getChapter` sowie `BOOKS` (Kürzel, Name, Kapitelzahl) registrieren.
   Neue Übersetzungen als weiteren Eintrag in `TRANSLATIONS` anlegen (`available: true` erst mit Nutzungsrecht).
2. **Kampagne** anlegen: Kopie von `src/data/john.ts` als Vorlage, Stationen mit `x/y` (Kartenpixel), `requires`,
   Lerninhalten, Aufgaben und Prüfungsfragen füllen. Fachliche Aussagen immer mit `kind` kennzeichnen.
3. In `CAMPAIGNS` registrieren und in `src/data/worlds.ts` bei der Lernwelt `status: "playable"` + `campaignId` setzen.
4. Optional historische Karte: Orte mit Koordinaten, Sicherheitsgrad und Quelle in einer `HistoricalMap` ergänzen.
5. QA: `unreachableStations(stations)` muss eine leere Liste liefern; Tests ausführen (`node --experimental-strip-types tests/progress.test.ts`).
