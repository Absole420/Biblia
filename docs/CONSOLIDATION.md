# Konsolidierung v0.9.0-beta – Status und manuelle Schritte

Basis: aktueller Emergent-Stand (vollständig). Backup vor der Konsolidierung: `backup-pre-consolidation-20261120.bundle` (git bundle, alle Refs; wiederherstellbar mit `git clone <bundle>`).

## Pull Requests
| PR | Inhalt | Status in der App | Empfohlene Aktion auf GitHub |
|---|---|---|---|
| #1 | Label-Kollision Karten | integriert (+ tests/map-layout.test.mjs) | schließen: „integriert in v0.9.0-beta“ |
| #2 | Geschichtsbücher | bereits gemergt | – |
| #3 | Kartenlesbarkeit/Scroll | ersetzt durch Living-Atlas-Redesign (MapNode/CampaignMap neu) | schließen: „durch Living Atlas ersetzt“ |
| #4 | Cinematic Intro + Tagesvers | integriert (aktuelles Intro behalten, nur Versauswahl) | schließen: integriert |
| #5 | Themenkarten v1 | ersetzt durch #6 | schließen: „durch #6 ersetzt“ |
| #6 | Studienreise 2.0 | integriert | schließen: integriert |
| #7 | 38 Lernstationen | 32 integriert; prophets-more (6) und synoptic-method als Duplikate (kp-1…7, syn-1) bewusst nicht | schließen mit Hinweis auf Duplikate |
| #8 | Lexikon/Zeitstrahl | integriert, stationIds auf vorhandene Stationen umgemappt | schließen: integriert |
| #9 | Offline Engine | integriert ohne doppelte 12-MB-Daten (vorhandene Offline-Struktur) | schließen: integriert |
| #10 | Data Guardian | integriert + Nachbesserungen (Legacy-Warnung, Hinweise schließbar, Sperre, Erinnerung) | schließen: integriert |
| #11 | Living Scripture & Regal | integriert (ein Jesus-Buch, Stammbäume → Lexikon) | schließen: integriert |
| #12 | Scripture Academy | integriert (Debora/Gideon in gb1-8/9, PR-#7-Daten nicht doppelt) | schließen: integriert |
| – | Commentary Collection | integriert (5 deutsche Quellen, 12.070 Abschnitte) | in main enthalten |

## Entfernt
- Ungenutzte Abhängigkeiten: date-fns, dayjs, expo-blur, expo-haptics, expo-symbols, react-native-dotenv, react-native-webview.
- Calvin-Daten waren zwischenzeitlich deaktiviert und sind jetzt mit dokumentierter Lizenz wieder aktiv; MHCC (englisch) nicht mehr gebündelt.

## Manuelle Schritte (keine GitHub-Schreibrechte in Emergent)
1. In Emergent „Save to GitHub“ → Branch `main` des Repos Absole420/Biblia (normaler Push, kein Force-Push).
2. Tag setzen: `git tag -a v0.9.0-beta -m "BIBLIA 0.9 Beta" && git push origin v0.9.0-beta`.
3. PRs #1, #3–#12 mit den Texten aus der Tabelle schließen.
4. Danach Feature-Branches löschen (alle Inhalte sind in main): `feature/*`, `codex/*`.
5. APK bauen: siehe `docs/BUILD.md` oder Emergent „Publish“.
