# Bibliothek – Lexikon und Zeitstrahl

Basis: main 07569a3bf703fcf761e6faa3fae24a0467805e35 (4. November 2026). 139 ausgearbeitete Artikel im ursprünglichen Plan; 49 weitere Artikel in articlesExpansion.json (188 insgesamt). Neu sind u.a. elf bisher nur unzureichend vertretene kleine Propheten außer Jona, Klagelieder, Prediger, Hohelied, ausgewählte Könige und Ereignisse, Glaubensbegriffe, Mitarbeiter der Urkirche und sechs Offenbarungsmotive.

## Emergent-Integration
- Daten direkt übernehmen und nicht erneut generieren. articlesExpansion.json in die bestehende Artikelregistrierung einbinden; IDs vorab mit dem aktuellen App-Stand abgleichen. Keine vorhandenen Daten, Favoriten, Illustrationen oder Funktionen überschreiben.
- lexiconPlan.ts erweitert den bestehenden Plan. Artikel gruppieren sich nach einem Hauptbuch; Filter berücksichtigen alle in den Artikeln genannten Bibelbücher. Bestehende echte Artikel behalten Vorrang bei bereits vorhandenen IDs. Neue Artikel verwenden das bestehende Article-Modell.
- timelineData.ts und app/timeline.tsx: historische Anker, Kontext und literarische Texte kennzeichnen; sechs Offenbarungsvisionen als eigener undatierter Lesebereich. Keine zukünftige Kalenderchronologie. 28 neue datierte Zuordnungen (darunter Patmos als bestehender Artikel); doppelten alten Exodus-Zeitstrahleintrag entfernen, ohne Info-ID zu löschen. Alte Sortierjahre dienen weiterhin nur intern zur Ordnung. Suchfeld und ungecroppte Vorschaubilder.
- app/lexicon/index.tsx: Suche durchsucht auch Zusammenfassungen, Quellenverweise und Artikeltexte; app/lexicon/[id].tsx ermöglicht den Sprung zu Visionen und passt Bilder proportional an. referenceSearch.ts ist offline.
- Zehn zuvor außerhalb des gültigen Versbereichs liegende primäre Artikelverweise korrigiert; zwei kapitelübergreifende Links getrennt. Freitext und andere Module sind nicht vollständig redaktionell geprüft.
- PR #7 ist optional für die zusätzlichen Stationslinks. Die bestehende Artikelseite prüft, ob Stationen vorhanden sind; nach Einbindung von PR #7 werden passende Links sichtbar. Keine neuen Bilder generieren, sofern nicht gewünscht. Keine vollständige Königsreihe oder neue Karten in dieser Erweiterung.
- Prüfe neue/alte IDs und Merge-Konflikte, TypeScript, Offline-Suche, Bibelverweise, Zeitstrahlsprung, hell/dunkel und Android/iOS/Web. Test: node --experimental-strip-types --test tests/library-expansion.test.mjs (Node 22+). Datenprüfung in der Erstellung durchgeführt; Build und Gerätetest ausstehend. Inhaltliche/fachliche Redaktion empfohlen.

## Quellen
Bibelgrundlage: repository backend/data/elb1905.json. Externe historische Anker: Encyclopaedia Iranica (Babylonian Chronicles), University of Oxford / British Museum (Nabonidus Chronicle), Metropolitan Museum of Art (Flavian Dynasty). Die Quellen sind in den entsprechenden Artikeltexten hinterlegt; nicht jede historische Nebenbemerkung wurde unabhängig verifiziert.
