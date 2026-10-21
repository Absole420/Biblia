# BIBLIA – Datenmodell

Alle Typen: `frontend/src/data/types.ts`. Fortschritt: `frontend/src/lib/progress-logic.ts`.

## Inhalte (statisch, offline im App-Bundle)
| Typ | Zweck |
|---|---|
| `World` | Lernwelt auf der Weltkarte (Farbwelt, Position, Status `playable`/`preview`, geplante Stationen) |
| `Campaign` | Lernkampagne eines Buches mit Kartengröße (`mapW`,`mapH`) und Stationen |
| `Station` | Lernstation: Typ (event/narrative/study/practice/exam/challenge), Position, `requires` (Freischaltbedingung), XP, 7 Phasen-Inhalte |
| `Task` | 9 Aufgabentypen: `mc`, `multi`, `tf`, `gap`, `verse`, `match`, `order`, `error`, `free` – jeweils mit Erklärung + Bibelstelle |
| `Claim` | Gekennzeichnete Aussage: `text` / `history` / `hypothesis` / `jewish` / `christian` / `reflection` |
| `HistoricalMap` / `Place` | Historische Karte mit Grenzen (lat/lon), Orten (WGS84), Sicherheitsgrad `secure`/`traditional`/`disputed`, Quellen |
| `Translation` | Austauschbare Bibel-Datenquelle (`src/data/bible.ts`) |

## Lernstand (`AppState`, lokal gespeichert, Schema v2)
`xp`, `stations` (Abschluss, Prüfungsergebnis, Bestwert), `phase` (Autosave je Station), `wrong` (Wiederholungsfragen),
`reflections`, `notes`, `bookmarks`, `highlights` (Vers → Kategorie), `categories` (frei konfigurierbare Farben),
`settings` (Theme, Schriftgröße, Übersetzung), `goal`, `activity`, `answered`.

- Speicherung: automatisch nach jeder Änderung (`src/lib/store.tsx`).
- Migration: `migrate()` hebt ältere Schemata verlustfrei an (v1 `completed[]` → v2 `stations{}`).
- Export/Import: JSON `{ app: "BIBLIA", exportedAt, state }`, Validierung in `parseImport()`.
