# Daily Scripture – integration handoff (PR #4)

Integrate the daily-verse feature into the intro currently used by Emergent. Preserve the active intro's illustration, sequence, animation, sound (if any), timing, skip behavior and optional Jesus journey. Do not replace the active intro merely because the branch contains the original cinematic proposal.

- Pool: frontend/src/data/daily-scripture-elb1905.json (365 unique references, exact text from repository ELB 1905 corpus, selected from AT and NT; public domain).
- Pure logic: frontend/src/lib/dailyScriptureLogic.ts.
- Storage service: frontend/src/lib/dailyScripture.ts. Call loadDailyScripture() once before mounting the active intro; render verse.text and verse.ref (label ELB 1905).
- Local date, random without replacement, same day same verse on cold restarts, no server/network dependency. On storage failure use date-based fallback; non-repetition across failures is not guaranteed.
- Keep personal prayer-book VerseOfDay separate. Do not alter user prayer data.
- No new dependencies. Preserve existing timing (in this PR: 6s first, 1.05s repeat, 650ms for reduced motion). The short intro may be too brief for full reading; do not extend automatically without user approval.
- The branch changes only the intro text slots and startup data wiring relative to the previous cinematic PR; the artwork is unchanged. When incorporating newer app code, port the daily service/pool into the existing component rather than overwriting newer design.
- Run node --experimental-strip-types --test tests/daily-scripture.test.mjs (Node 22+), TypeScript check in frontend, and test Android/iOS/web including offline startup, repeated launches, midnight, long verses, small screens, larger text sizes, reduced-motion and skipping. Editorial review of verse selection/context remains necessary.
