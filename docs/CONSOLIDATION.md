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
| – | Commentary Collection | integriert (5 deutsche Quellen, 12.089 Abschnitte) | in main enthalten |

## Entfernt
- Ungenutzte Abhängigkeiten: date-fns, dayjs, expo-blur, expo-haptics, expo-symbols, react-native-dotenv, react-native-webview.
- Calvin-Daten waren zwischenzeitlich deaktiviert und sind jetzt mit dokumentierter Lizenz wieder aktiv; MHCC (englisch) nicht mehr gebündelt.

## Manuelle Schritte (keine GitHub-Schreibrechte in Emergent)
1. In Emergent „Save to GitHub“ → Branch `main` des Repos Absole420/Biblia (normaler Push, kein Force-Push).
2. Tag setzen: `git tag -a v0.9.0-beta -m "BIBLIA 0.9 Beta" && git push origin v0.9.0-beta`.
3. PRs #1, #3–#12 mit den Texten aus der Tabelle schließen.
4. Danach Feature-Branches löschen (alle Inhalte sind in main): `feature/*`, `codex/*`.
5. APK bauen: siehe `docs/BUILD.md` oder Emergent „Publish“.

## Final Cleanup (Entwicklungsstopp)
- Kroeker-OCR bereinigt (Silbentrennungen, Fußnoten-/Fehlzeichen, Verweise wie „1, iff.“ → „1, 1ff.“, eindeutig zusammengeklebte oder gesperrte Wörter), Wortlaut und Bedeutung unverändert.
- Kroeker – bewusst **unverändert** gelassen, weil ohne Originalvorlage nicht sicher lesbar:
  - `kroeker-19-88-1` … `kroeker-19-93-1`: „(Ps. go, i£.)“ (vermutlich Ps 90,1f., nicht geändert)
  - `kroeker-26-6-1`, `kroeker-26-7-1`: „139. Psalm (V. g£.)“ (vermutlich V. 9f.)
  - `kroeker-20-23-29`: „Richt. 13, A£f.“ (Versangabe unleserlich)
  - `kroeker-4-22-30` … `kroeker-4-25-1`: einzelnes „$“ vor „Die Überlieferung“ (Fußnotenzeichen?)
  - ca. 35 zusammengeschriebene Eigennamen/Komposita ohne Bindestrich (z. B. „SinaiOffenbarung“, „AbedNego“, „ZionJerusalem“, „HalleluJah“) – Bindestrich/Schreibweise nicht eindeutig
  - `kroeker-19-1-1` (Ps 1): Anfang fehlt bereits im SWORD-Quellmodul, Überschrift doppelt
- Rieger: Zeichenkodierung beim Import korrigiert (0 defekte Umlaute/ß, vorher 2.213 Ersatzzeichen).
- Ansorg: alle 9 kapitelübergreifenden Predigten auf jedes behandelte Kapitel verteilt (Einträge 705 → 724); geprüft: 0 Abweichungen zwischen „Stelle:“-Angabe und Verszuordnung, 0 doppelte IDs.
- Kommentar-Filter: Chips mit 44 px Tippfläche; eigener Hinweis, wenn alle Autoren ausgeblendet sind. Reiter „Studienkommentare“ passt auf 360 px.
- ESLint: 15 Hinweise in `app/way/*` und `app/living/[id].tsx` ohne Verhaltensänderung behoben.
- Kommentarvergleich: gestapelt unter 600 px Breite, nebeneinander auf Tablets; Filter einklappbar („Filter · x von y Autoren“).
- Laden: Kommentare je Buch einmal nach Kapitel indexiert.
- Sicherheit: Fotodateinamen beim Wiederherstellen einer Vollsicherung auf einfache Namen beschränkt (Audit SEC-002).
- Sicherheitsaudit (Final Cleanup) behoben: ungenutzter offener Schreibzugang `/api/status` entfernt; CORS ohne Credentials; Bibelsuche mit Obergrenzen (`q` ≤ 200 Zeichen, `limit` ≤ 200).
- Weiterhin offen (nur Hinweise): `EMERGENT_LLM_KEY` in `backend/.env` nur für Bauskripte – `.env` ist gitignored, vor dem Push nochmals prüfen; Wiederherstellung übernimmt beliebige Speicherschlüssel aus einer selbst gewählten Sicherungsdatei (geringes Risiko, nur lokal).
