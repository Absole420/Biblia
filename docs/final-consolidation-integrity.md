
# Final Consolidation & Integrity – proposed changes

Base: emergent-nov-20 at 4e07ac45d45d8bc5f10bafbc385ffe4217920cf5. Original main at 07569a3bf703fcf761e6faa3fae24a0467805e35. Keep both refs until verification. This PR is **not** a release, merge, or APK.

## Implemented here
- Restore the entire original history campaign (16 stations, original station/task IDs, four Kings and four Chronicles stations, original regression tests). Register alongside the existing Josua/Richter and tribes courses. The first overview lessons deliberately overlap rather than deleting distinct original teaching. Correct the structured Esra alias to Esr. No existing courses removed.
- Put additional Academy/extra stations ahead of explicit final exams, avoid prerequisite cycles, carry original IDs/XP and add one review question per moved lesson. Existing completed exams remain recorded.
- Rank normalized exact Bible phrases before separate-word and substring matches, including results beyond the early canonical limit.
- Permit lower zoom bound for overview while keeping maximum detail zoom. Device-level fit and touch interactions still require testing.
- Ensure matching answer order is not the original order; preserve grading indices and existing tasks.
- Validate top-level AppState settings on migration and backup import, as well as own-property checks on additional backup keys. Does not change backup format.
- Reading plans are already offline (study.ts, plans.tsx, plan/[id].tsx, store.tsx); no duplicate feature.

## Status nach Integration in Emergent (umgesetzt)
- Lockfile: `frontend/yarn.lock` ist im Git-Index; `yarn install --frozen-lockfile` in sauberer Kopie erfolgreich.
- Vollsicherung: gestufte Prüfung, Zwischenordner, Rücknahme bei Fehler, Medien bis 60 MB enthalten (siehe CONSOLIDATION.md). Nativer Rundlauf auf Gerät steht aus.
- Lizenzen: Streitenberger `rights.edit=false`; Calvin 2.967 = Bündel.
- Tests: 54/54 Node, 129/129 Backend, tsc und ESLint fehlerfrei.

## Remaining release gates (ursprünglicher PR-Text)
1. **Lockfile:** frontend/yarn.lock still absent in the actual exported Git tree despite Release Lock documentation. Generate using Yarn 1.22.22 in the Emergent workspace, remove any inadvertent ignore rule, use git add -f if needed, verify that the committed blob exists, and run yarn install --frozen-lockfile in a fresh checkout. Do not synthesize a lockfile.
2. **Full backup:** current fullBackup.ts deliberately excludes MP3/MP4, writes photos and restores Way data before replaceState is committed. Add staged validation, explicit confirmation, rollback on failure, verify disk space/output and preserve previous media. Prefer optional separate large-media export/import or include all media safely, clearly document coverage. Never claim arbitrary-media protection before successful native roundtrip. Validate nested diary and photo payloads, base64 sizes, and failure handling. Existing backup files must remain readable.
3. **Licenses:** verify actual redistributable German edition and rights for Calvin; Streitenberger terms are non-sale/unaltered and rights.edit metadata should reflect limitations. Do not add unlicensed texts. Reconcile documented Calvin count with source metadata.
4. Run all 45 frontend and 129 backend baseline tests, restored history tests and new regression tests, tsc, ESLint, new clean production build. Confirm no lost station content, progress and local plans. The original server remains optional. Real Android acceptance (airplane mode from initial launch, storage/restore, maps, camera, audio/video) required. No dependency on servers at runtime.
5. Emergent does not pull/merge mid-project automatically. Integrate the changes into the exact workspace used for Publish, save again, confirm latest GitHub commit, merge main preserving history only after review, tag and archive old branches only after content verification. No force-push or blind merges.

The connector can inspect and write files but cannot install dependencies, execute Expo/Node tests or produce a signed APK. No execution results are claimed.
