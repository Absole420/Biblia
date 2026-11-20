# BIBLIA – The Living Scripture / Bibliothek-Einstellungen

Sieben Bücher (223 eigene Einträge, 106 hebräische/griechische/aramäische Wortstudien, 514 passende Stellenverweise). Alle Daten lokal als JSON, keine Abhängigkeiten oder Online-Abfragen. Bilder aus vorhandenen Intro-/Lexikonillustrationen (thematische, künstlerische Rekonstruktionen), keine zusätzlichen Bilddateien. Suchfeld je Band, Kategorien, Einzelseite, anklickbare Bibelstellen, Vor/Zurück. Stammbäume als kompakte lesbare Linien/Schaubilder, keine frei zoombare genealogische Grafik. Sammlung „Auf den Spuren Jesu“ enthält 30 Texte und verbindet vorhandene Gleichnis-Studienreise und Jesus-in-den-Psalmen.

Bearbeitungsmodus im Bücherregal: jedes Buch mit Größe (klein/mittel/groß), Regalfach, Position über Pfeile, Einbandfarbe (Palette oder Hex) und Symbol. Vorschau, Speichern/Abbrechen, Wiederherstellen des Standardregals. Responsive Regalreihen statt freier Pixelpositionierung; kein Drag-and-drop. Einstellungen in AppState.settings.libraryLayout (optionales Feld), dadurch bestehender JSON-Export/Import und Data Guardian können sie mitsichern. Fehlende/ungültige Einträge werden normalisiert; neue Standardbücher ergänzt. Keine anderen App-Daten verändern.

## Emergent-Integration
GitHub-main ist älter als der in Emergent beschriebene Stand. Dateiunterschiede zuerst prüfen. Die vorhandene Bibliothek **nicht** überschreiben. Vorhandene Bücher und IDs (auch neuere als GitHub) in Registry + Defaults aufnehmen, existierendes „Auf den Spuren Jesu“ um die Sammlung ergänzen statt zweites Buch, vorhandene Stammbäume verknüpfen/erweitern statt duplizieren. Layout-Anpassung auf alle aktuellen Bücher anwenden. Bewahre PR #9/#10, Vollsicherung mit Fotos/Tagebuch, Farben, Animationen und lokale Daten. Die alte GitHub-Bibliothek enthält noch ein externes Cover; dieser PR ändert das nicht, da Emergent den Offline-Ersatz bereits gemeldet hat. Stelle sicher, dass das aktuelle lokale Cover erhalten bleibt.

## QA
- Node: node --experimental-strip-types --test tests/living-scripture.test.mjs (Node mit TypeScript-Stripping); TypeScript, Lint und vorhandene Tests.
- Alle Bände, Suchbegriffe (Schrift, Umschrift, Deutsch), Filter, Bibelstellen und Vor/Zurück prüfen; RTL-Schrift und Font-Fallback auf Android und Web.
- Jedes bestehende/neue Buch bearbeiten, Reihenfolge/Fach/Größe/Farbe/Symbol ändern, speichern, erneut öffnen, Backup-Roundtrip, Abbrechen, Standard zurücksetzen; keine Inhalte verschwinden.
- Flugmodus und echtes Android-Gerät testen. Redaktionelle Kontrolle nach docs/living-scripture-content.md.
