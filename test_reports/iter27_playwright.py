# iter27: 'Mein geistlicher Weg' (register, diary, safety, review, data, verse sheet)
# Reusable record of the browser_automation script core (run via browser automation tool, viewport 390x844).
# Use normal clicks (force=True did not trigger RN-web Pressable navigation on open-way).
B = "<EXPO_PUBLIC_BACKEND_URL>"

# await page.add_init_script("localStorage.setItem('biblia.introJourney.done','true')")
# Register: /way -> way-area-register -> 12 topic-card-<id>; way-search 'müde' -> erschoepfung, 'Sorge' -> angst-sorge
# Topic: /way/topic/erschoepfung -> topic-passage-0-context -> way-context-sheet -> way-context-open-reader
#        -> /bible?b=Jes&ch=40&v=28&way=erschoepfung -> way-return-button -> topic
# Diary: way-area-diary -> diary-intro-accept -> diary-new-checkin -> feeling-besorgt -> entry-save -> diary-entry-<id>
# Persistence: reload, localStorage['biblia_way_v1'] startswith '"enc1:'
# Safety: entry-mood 'Ich will nicht mehr leben' -> entry-safety / crisis-call-112 ; 'er schlägt mich' -> abuse text
# Review: diary-review -> review-week / review-month / review-custom (review-from/review-to) -> review-summary
# Data: diary-data -> way-export-backup / way-export-text (expect_download) -> way-wipe -> way-wipe-continue -> way-wipe-confirm
#       -> way-restore (expect_file_chooser, set_files backup.json; retry once) -> way-restore-replace
# Verse sheet: /bible?b=Ps&ch=23 -> verse-23-1 -> verse-way-diary / verse-way-erschoepfung
