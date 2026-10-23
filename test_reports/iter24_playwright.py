"""Iteration 24 - Prayer Book (Gebetsheft) feature testing"""
import asyncio
from playwright.async_api import async_playwright

URL = "https://gottes-wort-app.preview.emergentagent.com"

async def skip_intro(page):
    """Dismiss logo overlay by clicking 'Überspringen' if present, else wait."""
    try:
        btn = page.get_by_text("Überspringen", exact=False)
        await btn.first.click(timeout=4000, force=True)
    except Exception:
        await page.wait_for_timeout(6500)

async def set_intro_done_and_goto(page, path="/"):
    await page.goto(URL + path, wait_until="domcontentloaded")
    try:
        await page.evaluate("localStorage.setItem('biblia.introJourney.done','1')")
    except Exception:
        pass
    await page.wait_for_timeout(500)
    await skip_intro(page)
    await page.wait_for_timeout(1200)

async def run():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        page.on("pageerror", lambda e: print(f"PAGEERROR: {e}"))
        page.on("console", lambda m: m.type == "error" and print(f"CONSOLE ERR: {m.text[:200]}"))

        results = {}

        # ========== 1. Bible reader - verse prayer flow ==========
        try:
            await set_intro_done_and_goto(page, "/")
            # pre-set intro done, then navigate to bible
            await page.goto(URL + "/bible?b=Ps&ch=23", wait_until="domcontentloaded")
            await page.evaluate("localStorage.setItem('biblia.introJourney.done','1')")
            await page.wait_for_timeout(500)
            await skip_intro(page)
            await page.wait_for_selector('[data-testid="bible-screen"]', timeout=15000)
            print("STEP1: bible screen loaded")

            # Tap verse 4
            await page.wait_for_selector('[data-testid="verse-23-4"]', timeout=10000)
            await page.click('[data-testid="verse-23-4"]', force=True)
            await page.wait_for_selector('[data-testid="verse-sheet"]', timeout=5000)
            print("STEP1: verse sheet open")

            # Tap 'Ins Gebetsheft'
            await page.wait_for_selector('[data-testid="verse-prayer-button"]', timeout=5000)
            await page.click('[data-testid="verse-prayer-button"]', force=True)
            await page.wait_for_selector('[data-testid="prayer-add-picker"]', timeout=5000)
            print("STEP1: prayer picker shown")

            # Check all 6 chips exist
            for cat in ["dank","orientierung","angst","hoffnung","klage","vergebung"]:
                vis = await page.is_visible(f'[data-testid="prayer-add-{cat}"]')
                print(f"  chip prayer-add-{cat}: {vis}")

            # Click 'angst'
            await page.click('[data-testid="prayer-add-angst"]', force=True)
            await page.wait_for_timeout(1200)

            # Reopen - should show checkmark
            # Close sheet first? The picker remains in sheet; onDone closes picker. Re-open
            try:
                await page.click('[data-testid="verse-prayer-button"]', force=True)
                await page.wait_for_timeout(400)
            except Exception:
                pass
            label_text = await page.inner_text('[data-testid="prayer-add-angst"]')
            print(f"STEP1: angst chip label after save: '{label_text}'")
            results["verse_save_angst"] = "✓" in label_text
            # close sheet
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)

            # Range: tap verse 1, range-plus, then save as dank
            await page.click('[data-testid="verse-23-1"]', force=True)
            await page.wait_for_selector('[data-testid="verse-sheet"]', timeout=5000)
            await page.click('[data-testid="range-plus"]', force=True)
            await page.wait_for_timeout(300)
            await page.click('[data-testid="range-plus"]', force=True)
            await page.wait_for_timeout(300)
            range_to = await page.inner_text('[data-testid="range-to"]')
            print(f"STEP1 range: V.1 bis {range_to}")
            await page.click('[data-testid="verse-prayer-button"]', force=True)
            await page.wait_for_selector('[data-testid="prayer-add-picker"]', timeout=5000)
            await page.click('[data-testid="prayer-add-dank"]', force=True)
            await page.wait_for_timeout(800)
            results["verse_range_save"] = True
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)
        except Exception as e:
            print(f"STEP1 ERROR: {e}")
            results["step1_error"] = str(e)

        # ========== 2. Library - prayer shelf ==========
        try:
            await page.goto(URL + "/library", wait_until="domcontentloaded")
            await page.wait_for_timeout(400)
            await skip_intro(page)
            await page.wait_for_selector('[data-testid="library-screen"]', timeout=10000)
            await page.wait_for_selector('[data-testid="shelf-prayer"]', timeout=8000)
            print("STEP2: shelf-prayer visible")
            # library-tab-prayer should exist
            exists = await page.is_visible('[data-testid="library-tab-prayer"]')
            print(f"STEP2: library-tab-prayer visible={exists}")
            exists_terms = await page.is_visible('[data-testid="library-tab-terms"]')
            print(f"STEP2: library-tab-terms visible={exists_terms}")
            await page.screenshot(path="/app/test_reports/screenshots/iter24_shelf_390.png", quality=40, full_page=False)

            # Open prayer book
            await page.click('[data-testid="library-tab-prayer"]', force=True)
            await page.wait_for_selector('[data-testid="library-section-prayer"]', timeout=5000)
            await page.wait_for_selector('[data-testid="prayer-book"]', timeout=5000)
            print("STEP2: prayer book open")

            # Check sections visible for the 2 cats we added
            for cat in ["angst", "dank"]:
                vis = await page.is_visible(f'[data-testid="prayer-section-{cat}"]')
                print(f"STEP2: prayer-section-{cat}={vis}")

            # Filter chips
            for cat in ["all","dank","orientierung","angst","hoffnung","klage","vergebung"]:
                v = await page.is_visible(f'[data-testid="prayer-filter-{cat}"]')
                print(f"STEP2: prayer-filter-{cat}={v}")

            # Click filter dank -> only dank section
            await page.click('[data-testid="prayer-filter-dank"]', force=True)
            await page.wait_for_timeout(500)
            angst_hidden = not await page.is_visible('[data-testid="prayer-section-angst"]')
            print(f"STEP2: filter dank hides angst section: {angst_hidden}")
            await page.click('[data-testid="prayer-filter-all"]', force=True)
            await page.wait_for_timeout(400)

            # Find a prayer entry and get its id
            entries = await page.query_selector_all('[data-testid^="prayer-entry-"]')
            print(f"STEP2: found {len(entries)} prayer entries")
            entry_ids = []
            for e in entries:
                tid = await e.get_attribute("data-testid")
                entry_ids.append(tid.replace("prayer-entry-",""))
            print(f"STEP2: entry ids: {entry_ids[:5]}")

            if entry_ids:
                eid = entry_ids[0]
                # Fill note
                note_sel = f'[data-testid="prayer-note-{eid}"]'
                await page.click(note_sel, force=True)
                await page.fill(note_sel, "Mein Testgebet")
                # trigger blur
                await page.evaluate(f"document.querySelector('{note_sel}').blur()")
                await page.wait_for_timeout(1000)
                print("STEP2: note saved")

                # Search
                await page.fill('[data-testid="library-search-input"]', "Testgebet")
                await page.wait_for_timeout(600)
                still = await page.is_visible(note_sel)
                print(f"STEP2: entry visible after search match: {still}")
                await page.fill('[data-testid="library-search-input"]', "zzzznope")
                await page.wait_for_timeout(500)
                none_visible = not await page.is_visible(note_sel)
                print(f"STEP2: entry hidden by nonsense search: {none_visible}")
                await page.fill('[data-testid="library-search-input"]', "")
                await page.wait_for_timeout(400)

                # Reload page - verify persistence
                await page.reload()
                await page.wait_for_timeout(400)
                await skip_intro(page)
                await page.wait_for_selector('[data-testid="library-screen"]', timeout=10000)
                await page.click('[data-testid="library-tab-prayer"]', force=True)
                await page.wait_for_selector('[data-testid="prayer-book"]', timeout=5000)
                await page.wait_for_timeout(500)
                note_val = await page.input_value(f'[data-testid="prayer-note-{eid}"]')
                print(f"STEP2: note value after reload: '{note_val}'")
                results["persist_note"] = note_val == "Mein Testgebet"

                # Delete entry
                await page.click(f'[data-testid="prayer-delete-{eid}"]', force=True)
                await page.wait_for_timeout(400)
                # The confirm button has id prayer-delete-confirm-{id}
                await page.click(f'[data-testid="prayer-delete-confirm-{eid}"]', force=True)
                await page.wait_for_timeout(600)
                gone = not await page.is_visible(f'[data-testid="prayer-entry-{eid}"]')
                print(f"STEP2: entry deleted: {gone}")
                results["delete_entry"] = gone
        except Exception as e:
            print(f"STEP2 ERROR: {e}")
            results["step2_error"] = str(e)

        # ========== 3. Station ps1-10 prayer suggestions ==========
        try:
            # Set phase to 5 directly in state
            await page.evaluate("""
                const raw = localStorage.getItem('biblia_state');
                if (raw) {
                  const s = JSON.parse(raw);
                  s.phase = s.phase || {};
                  s.phase['ps1-10'] = 5;
                  localStorage.setItem('biblia_state', JSON.stringify(s));
                }
            """)
            await page.goto(URL + "/station/ps1-10", wait_until="domcontentloaded")
            await page.wait_for_timeout(400)
            await skip_intro(page)
            await page.wait_for_timeout(1500)
            # Check phase-reflection
            on_refl = await page.is_visible('[data-testid="phase-reflection"]')
            print(f"STEP3: phase-reflection visible={on_refl}")
            if on_refl:
                sugg = await page.is_visible('[data-testid="prayer-suggestions"]')
                print(f"STEP3: prayer-suggestions visible={sugg}")
                btn_sel = '[data-testid="prayer-suggest-Ps:103:2-dank"]'
                exists = await page.is_visible(btn_sel)
                print(f"STEP3: prayer-suggest-Ps:103:2-dank visible={exists}")
                if exists:
                    await page.click(btn_sel, force=True)
                    await page.wait_for_timeout(800)
                    # click again - should NOT create duplicate
                    await page.click(btn_sel, force=True)
                    await page.wait_for_timeout(400)
                    count = await page.evaluate("""
                        () => {
                            const raw = localStorage.getItem('biblia_state');
                            const s = JSON.parse(raw);
                            return (s.prayers||[]).filter(p => p.ref==='Ps:103:2' && p.cat==='dank').length;
                        }
                    """)
                    print(f"STEP3: duplicate count for Ps:103:2 dank = {count}")
                    results["no_duplicate"] = count == 1
                results["phase_reflection"] = True
            else:
                results["phase_reflection"] = False
        except Exception as e:
            print(f"STEP3 ERROR: {e}")
            results["step3_error"] = str(e)

        # ========== 4. Smaller viewport 360x780 ==========
        try:
            await page.set_viewport_size({"width": 360, "height": 780})
            await page.goto(URL + "/library", wait_until="domcontentloaded")
            await page.wait_for_timeout(400)
            await skip_intro(page)
            await page.wait_for_selector('[data-testid="shelf-prayer"]', timeout=8000)
            await page.screenshot(path="/app/test_reports/screenshots/iter24_shelf_360.png", quality=40, full_page=False)
            print("STEP4: 360x780 shelf screenshot captured")
            # verify prayer book + terms both exist on shelf-prayer
            a = await page.is_visible('[data-testid="library-tab-prayer"]')
            b = await page.is_visible('[data-testid="library-tab-terms"]')
            print(f"STEP4: tab-prayer={a}, tab-terms={b}")
        except Exception as e:
            print(f"STEP4 ERROR: {e}")
            results["step4_error"] = str(e)

        print("\n=== RESULTS ===")
        for k,v in results.items():
            print(f"  {k}: {v}")

        await browser.close()

asyncio.run(run())
