# Studienreise – Ergänzung fehlender Lerninhalte

Geprüfte Ausgangsbasis: main 07569a3bf703fcf761e6faa3fae24a0467805e35 (4. November 2026). Neuere, nicht synchronisierte Emergent-Inhalte konnten nicht geprüft werden.

## Daten übernehmen, nicht neu generieren
Sieben neue Kampagnendateien in frontend/src/data/campaigns:
- revelation.json: 13 Stationen, alle 22 Kapitel, sieben Gemeinden.
- prophets-more.json: 6 (Klagelieder, Amos, Obadja, Nahum, Habakuk, Zefanja); Jona ist bereits x-jona.
- psalms-5.json: 4 (Prediger).
- psalms-6.json: 2 (Hoheslied).
- letters-more.json: 7 (2 Thess, 2 Tim, Titus, Philemon, 2 Petr, 2 Joh, 3 Joh).
- history-tribes.json: 3 (Jakobs Familie, Landverteilung, Teilung und Hoffnung).
- synoptic.json: 3 (Einführung, Taufe/Versuchung/Lehre, Passion/Auferstehung).

38 neue Stationen, 132 strukturierte Leseabschnitte, 114 Lernaufgaben, 76 Prüfungsfragen. Die Leseabschnitte wurden gegen den ELB-1905-Bibelbestand auf Buch, Kapitel und Versgrenzen geprüft. Keine erneute KI-Generierung der Texte nötig. Historische/theologische Aussagen und Textverweise in Freitexten benötigen fachliche Redaktion; einzelne ausgewählte Abschnitte sind keine vollständige Vers-für-Vers-Auslegung.

## Integration
- In john.ts und worlds.ts sind die neuen Kampagnen registriert. Übernimm nur additive Änderungen in den aktuellen Emergent-Code. Alle bestehenden Kampagnen, IDs, Fortschritte und Funktionen erhalten. Wenn neuere Stationen dieselben Themen bereits enthalten, vor Import inhaltlich vergleichen und ohne Duplikate integrieren.
- In letters.json ausschließlich die Station letters-14 (Judas) bezüglich kapitel-/verskorrekter Verweise korrigieren; nicht die gesamte neuere Datei überschreiben.
- Vorhandene Karte der sieben Gemeinden verwenden. Die neue Offenbarung ist playable. Keine neuen Karten oder Illustrationen wurden erstellt.
- Die übrigen Lernwelten behalten ihre bestehenden Karten. Neue Stationsillustrationen optional separat erstellen; keine automatischen teuren Bildgenerierungsaufträge.
- Synoptische Einheit enthält Vergleichstexte; ein eigener Paralleltext-Reader ist nicht implementiert.
- Tests: node --experimental-strip-types --test tests/study-journey-expansion.test.mjs (Node 22+). TypeScript und UI auf Android/iOS/Web prüfen. Testdatei hinzugefügt, keine Geräte-/Buildtests durchgeführt.
- Bestehende Inhalte sind nicht versweise vollständig; zusätzliche Vertiefungen (etwa weitere Gleichnisse, mehr Kapitel der Evangelien und Tora, Königsregister) sind ausdrücklich nicht Bestandteil dieses Datenpakets.
