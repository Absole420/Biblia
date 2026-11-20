# BIBLIA – Build-Anleitung (v0.9.0-beta, unabhängig von Emergent)

Die App ist eine Expo/React-Native-App (Expo SDK siehe `frontend/package.json`). Alle Inhalte (Bibel ELB 1905, Kommentare, Querverweise, Lexikon, Karten, Bilder, Schriften) liegen in `frontend/` – zur Laufzeit wird **kein Server** benötigt.

## Voraussetzungen
- Node.js ≥ 20 (getestet mit 24), Yarn 1.22 (`packageManager` in `frontend/package.json`)
- Android: JDK 17, Android SDK (Platform 35, Build-Tools), `ANDROID_HOME` gesetzt
- Optional: Expo-Konto nur für EAS-Cloud-Builds (nicht nötig für lokalen Build)

## Installation
```bash
cd frontend
yarn install --frozen-lockfile     # yarn.lock ist die verbindliche Lockdatei
```

## Entwicklung
```bash
npx expo start          # Web/Expo Go zum Ausprobieren
```

## Eigenständige Android-APK (lokal, ohne Expo Go, ohne Dev-Server)
```bash
cd frontend
npx expo prebuild --platform android --clean
cd android
# Eigenen Release-Keystore erzeugen (einmalig, sicher aufbewahren!)
keytool -genkeypair -v -keystore biblia-release.keystore -alias biblia -keyalg RSA -keysize 2048 -validity 10000
# android/gradle.properties: BIBLIA_STORE_FILE, BIBLIA_STORE_PASSWORD, BIBLIA_KEY_ALIAS, BIBLIA_KEY_PASSWORD
# und in android/app/build.gradle unter signingConfigs.release eintragen
./gradlew assembleRelease
# Ergebnis: android/app/build/outputs/apk/release/app-release.apk
```
Alternative mit EAS: `npx eas build -p android --profile offline-release` (Profil in `frontend/eas.json`, erzeugt APK, `developmentClient: false`).

OTA-Updates sind deaktiviert (`app.json → updates.enabled=false, checkAutomatically=NEVER, useEmbeddedUpdate=true`). Die App fragt nie nach Updates.

## Tests
```bash
node --import ./tests/ts-loader.mjs --experimental-strip-types --test tests/*.test.mjs   # aus /app (Repo-Wurzel)
cd frontend && npx tsc --noEmit -p .
```

## Kommentare neu importieren (nur Bauzeit)
`backend/scripts/import_sword_commentaries.py` liest SWORD-RawCom-Module (CrossWire / GermanSwordModules) und schreibt `backend/data/commentaries/*.json`. Danach `backend/scripts/clean_commentaries.py` (OCR-Bereinigung Kroeker, Ansorg-Kapitelzuordnung – nur einmal ausführen) und Bündelung nach `frontend/src/data/offline/commentary/` (nur Quellen mit `status=integrated` und allen Rechten in `sources.json`). Benötigt `pysword` nur zur Bauzeit.

## Backend (optional)
`backend/server.py` (FastAPI) ist ein Altbestand aus der Entwicklung und wird von der App nicht mehr aufgerufen.

## Prüfstand v0.9.0 (Release Lock)
- Version `0.9.0` (`app.json` und `package.json`), Android `versionCode` 900.
- `frontend/yarn.lock` (Yarn 1.22.22) liegt im Repo; reproduzierbare Installation: `cd frontend && yarn install --frozen-lockfile` (in sauberer Kopie geprüft, ohne Änderungen am Lockfile).
- Frontend: 54/54 Node-Tests (seit PR #13) (inkl. `tests/backup-keys.test.mjs`), `tsc --noEmit` und `npx eslint app src` fehlerfrei.
- Backend: `cd backend && EXPO_PUBLIC_BACKEND_URL=<Preview-URL> python -m pytest tests -q` → 129/129.
- 42/42 Node-Tests, `tsc --noEmit` fehlerfrei, `npx eslint app src` ohne Fehler und Warnungen (Final Cleanup).
- Kommentardaten: `python3 tests/kroeker_ocr_scan.py` und `python3 tests/commentary_data_check.py` (12.089 Abschnitte, keine doppelten IDs, keine ungültigen Verszuordnungen, Rieger ohne defekte Umlaute).
