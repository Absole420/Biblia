# BIBLIA – Data Guardian Engine (schlanke Version)

- Vorhandenen Stand zuerst abgleichen; nur die fehlenden Teile dieses PR übernehmen.
- Native: zwei rotierende, SHA-256-geprüfte Lernstandsdateien im App-Dokumentordner, zwei wöchentliche Kopien und ein Vor-Import/Reset/Restore-Stand. Web: entsprechender lokaler AsyncStorage. Alte biblia_state-Daten bleiben unverändert als Migrationsreserve. Keine Cloud, keine neuen Pakete, kein Background-Service.
- Automatisch alle sieben Tage, bei Start/Änderung/Rückkehr in die App. Bei geschlossener App findet keine Sicherung statt; beim nächsten Start wird sie nachgeholt.
- JSON-Export und Import bleiben kompatibel; aktuelle unvollständige Sicherungen werden abgelehnt. Vor-Änderungsstand wird gesichert, Aktionen melden erst nach verifiziertem Schreiben Erfolg.
- Fehler beim Laden dürfen nie einen leeren Lernstand schreiben. Ist kein lesbarer Stand vorhanden, wird der Nutzer gewarnt; derzeit kein automatisches Überschreiben oder Wiederherstellen aus externer Datei in diesem gesperrten Zustand. Support-/manuelle Recovery vor Freigabe besprechen. Bei Fehlermeldung App-Daten nicht löschen.
- Sicherungen enthalten den AppState (Notizen, Fortschritt, Gebete, Einstellungen usw.). Physische Fotodateien, separat gespeicherte Intro-/sonstige Flags und Verschlüsselung sind bewusst nicht Teil dieser kleinen Änderung. JSON-Dateien enthalten persönliche Daten; extern aufbewahren für Geräteverlust. Interne Sicherungen können mit der App gelöscht werden. Kein Schutz bei vollständigem Geräteverlust ohne externe Kopie.
- Bei einem Downgrade würde die alte Version den alten AsyncStorage-Stand lesen. Nicht downgraden; vorher exportieren.
- Nur eine App-Instanz / ein Web-Tab gleichzeitig. Kein Umbau der übrigen Funktionen.

## Tests vor Release
1. Bestehenden Lernstand auf Kopie des echten Geräts migrieren; Notizen, Gebete, Markierungen und Lernreisen vergleichen.
2. Node: `node --experimental-strip-types --test tests/data-guardian.test.mjs`; vorhandene Tests und TypeScript ebenfalls ausführen.
3. Flugmodus: Backup anlegen, Zeit um sieben Tage vorstellen / Uhr im Test injizieren, App erneut starten, letzte Sicherung prüfen; zwei Wochenstände behalten.
4. Simulierte Schreib-/Lesefehler, voller Speicher, Abbruch zwischen Schreibvorgängen und korruptes JSON; kein leerer Stand und keine falsche Erfolgsanzeige. Falls alle Kopien defekt: keine Datenüberschreibung.
5. Import, Reset, Wiederherstellung und erneuten Start prüfen; bestehenden Foto-/Lernstand und weitere Speicherverbraucher verifizieren. Web und echte eigenständige Android-APK testen.

Status: Code und Tests vorbereitet; Laufzeit, Expo-Kompatibilität, TypeScript und Gerätetests vor Merge ausführen.
