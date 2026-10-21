# Installation & Build

- **Vorschau:** QR-Code im Emergent-Panel mit der App „Expo Go“ (Android/iOS) scannen.
- **APK / App Bundle (AAB):** In Emergent oben rechts auf **Publish** klicken, danach einen Android-Build erzeugen.
  Die APK kann direkt installiert werden, das AAB ist für den Google Play Store.
- Keine Registrierung, alle Daten bleiben lokal. Lernstand über *Einstellungen → Als JSON exportieren* sichern.

## Projektstruktur
- `frontend/app/` – Bildschirme (expo-router): Weltkarte, Bibel, Bibliothek, Profil, Lernwelt, Station, Wiederholung, Einstellungen
- `frontend/src/components/` – Kartenengine (`ZoomableMap`, `WorldMap`, `CampaignMap`, `HistoricalMap`), Aufgaben (`TaskView`)
- `frontend/src/data/` – Inhalte, Bibeltext, Karten
- `frontend/src/lib/` – Fortschrittslogik, Speicher, Export/Import

## Platzhalter (ausdrücklich gekennzeichnet)
- NeÜ bibel.heute: urheberrechtlich geschützt – erst nach Nutzungsrecht einbindbar.
- Illustrationen: Vektor-Platzhalter, lizenzierte handgemalte Illustrationen folgen.
- Lernwelten außer Johannes: Vorschau-Module.
