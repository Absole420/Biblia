"""Iteration 25 - Psalms-3 (Weisheit der Sprüche) and Psalms-4 (Hiob) testing"""
import asyncio
from playwright.async_api import async_playwright

URL = "https://gottes-wort-app.preview.emergentagent.com"

async def skip_intro(page):
    for _ in range(2):
        try:
            btn = page.get_by_text("Überspringen", exact=False).first
            await btn.click(timeout=3000, force=True)
            await page.wait_for_timeout(600)
        except Exception:
            break
    await page.wait_for_timeout(400)

async def goto_safe(page, path):
    await page.goto(URL + path, wait_until="domcontentloaded")
    try:
        await page.evaluate("localStorage.setItem('biblia.introJourney.done','1')")
    except Exception:
        pass
    await page.wait_for_timeout(500)
    await skip_intro(page)
    await page.wait_for_timeout(800)

async def run():
    results = {}
    console_errors = []
    page_errors = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        page.on("pageerror", lambda e: page_errors.append(str(e)[:300]))
        page.on("console", lambda m: m.type == "error" and console_errors.append(m.text[:300]))

        # ===== STEP A: /world/psalms chip + nodes =====
        try:
            await goto_safe(page, "/world/psalms")
            await page.wait_for_selector('[data-testid="world-screen"], [data-testid="map-canvas"], text=/Psalmen/', timeout=12000)
            # Verify all 4 campaign chips + jesus chip
            for cid in ["psalms-1","psalms-2","psalms-3","psalms-4"]:
                v = await page.is_visible(f'[data-testid="campaign-chip-{cid}"]')
                print(f"A: campaign-chip-{cid}: {v}")
                results[f"chip_{cid}"] = v
            vj = await page.is_visible('[data-testid="jesus-psalms-chip"]')
            print(f"A: jesus-psalms-chip: {vj}")
            results["jesus_chip"] = vj

            # Select psalms-3
            await page.click('[data-testid="campaign-chip-psalms-3"]', force=True)
            await page.wait_for_timeout(900)
            ps3_nodes = []
            for i in range(1, 11):
                v = await page.is_visible(f'[data-testid="station-node-ps3-{i}"]')
                ps3_nodes.append(v)
            exam3 = await page.is_visible('[data-testid="station-node-psalms-3-exam"]')
            print(f"A: ps3 nodes 1..10 visible: {ps3_nodes}, exam: {exam3}")
            results["ps3_nodes_count"] = sum(ps3_nodes) + (1 if exam3 else 0)

            # Toggle map-places
            try:
                await page.click('[data-testid="map-places-toggle"]', force=True)
                await page.wait_for_timeout(500)
                items = await page.query_selector_all('[data-testid^="map-place-"]')
                print(f"A: map-places entries for ps3: {len(items)}")
                results["ps3_places"] = len(items)
                await page.click('[data-testid="map-places-toggle"]', force=True)
                await page.wait_for_timeout(300)
            except Exception as e:
                print(f"A: map-places-toggle error: {e}")

            # psalms-4
            await page.click('[data-testid="campaign-chip-psalms-4"]', force=True)
            await page.wait_for_timeout(900)
            ps4_nodes = []
            for i in range(1, 11):
                v = await page.is_visible(f'[data-testid="station-node-ps4-{i}"]')
                ps4_nodes.append(v)
            exam4 = await page.is_visible('[data-testid="station-node-psalms-4-exam"]')
            print(f"A: ps4 nodes 1..10 visible: {ps4_nodes}, exam: {exam4}")
            results["ps4_nodes_count"] = sum(ps4_nodes) + (1 if exam4 else 0)

            try:
                await page.click('[data-testid="map-places-toggle"]', force=True)
                await page.wait_for_timeout(500)
                items = await page.query_selector_all('[data-testid^="map-place-"]')
                print(f"A: map-places entries for ps4: {len(items)}")
                results["ps4_places"] = len(items)
            except Exception as e:
                print(f"A: ps4 map-places error: {e}")

        except Exception as e:
            print(f"STEP A ERROR: {e}")
            results["stepA_error"] = str(e)

        # ===== STEP B: Open individual stations =====
        station_ids = ["ps3-1","ps3-4","ps3-10","ps4-1","ps4-6","ps4-8","ps4-10","psalms-3-exam","psalms-4-exam"]
        station_results = {}
        for sid in station_ids:
            try:
                await goto_safe(page, f"/station/{sid}")
                await page.wait_for_selector('[data-testid="station-screen"], [data-testid="phase-content"], text=/Phase|Station/', timeout=12000)
                await page.wait_for_timeout(600)

                info = {"loaded": True}

                # Illustration (phase 0 for units; exam may differ)
                if "exam" not in sid:
                    illus = await page.query_selector('[data-testid="station-illustration"]')
                    if illus:
                        src = await illus.get_attribute("src")
                        info["illustration"] = bool(src and ("http" in (src or "")))
                    else:
                        info["illustration"] = False
                    goal = await page.is_visible('[data-testid="station-goal"]')
                    info["goal"] = goal
                    lex = await page.query_selector('[data-testid="station-lexicon-links"]')
                    info["lexicon_links"] = bool(lex)

                # Exam: check 12 exam questions
                if "exam" in sid:
                    # Count exam task cards
                    qs = await page.query_selector_all('[data-testid^="exam-q-"]')
                    if not qs:
                        qs = await page.query_selector_all('[data-testid^="task-"]')
                    info["exam_questions"] = len(qs)

                # Check for connections on ps3-4/ps3-10/ps4-10/ps4-8
                if sid in ["ps3-4","ps3-10","ps4-10","ps4-8"]:
                    # Navigate to teach phase if needed - we can simply scan whole doc text
                    body = await page.evaluate("() => document.body.innerText")
                    if sid == "ps4-8":
                        info["has_conn"] = "Christliche Vorausdeutung" in body or "Vorausdeutung" in body
                    else:
                        info["has_conn"] = "Thematische Verbindung" in body
                    # also check for station-connections testid
                    sc = await page.query_selector('[data-testid="station-connections"]')
                    info["station_connections_testid"] = bool(sc)

                # Check for red screen error
                err = await page.query_selector('[data-testid="error-screen"]')
                if err:
                    info["red_screen"] = True

                station_results[sid] = info
                print(f"B: {sid}: {info}")
            except Exception as e:
                print(f"B: {sid} ERROR: {e}")
                station_results[sid] = {"error": str(e)[:200]}

        results["stations"] = station_results

        # ===== STEP C: Regression - ps1-1 + gospels =====
        try:
            await goto_safe(page, "/station/ps1-1")
            await page.wait_for_timeout(1500)
            ok = await page.is_visible('[data-testid="station-illustration"]') or await page.is_visible('[data-testid="station-goal"]')
            print(f"C: ps1-1 renders: {ok}")
            results["regr_ps1_1"] = ok

            await goto_safe(page, "/world/gospels")
            await page.wait_for_timeout(1200)
            gok = await page.is_visible('[data-testid="world-screen"]') or await page.is_visible('text=/Evangel/')
            # fallback
            if not gok:
                gok = (await page.title()) is not None
            body = await page.evaluate("() => document.body.innerText")
            print(f"C: gospels world loaded, has text len={len(body)}")
            results["regr_gospels"] = len(body) > 100
        except Exception as e:
            print(f"C ERROR: {e}")
            results["stepC_error"] = str(e)

        print("\n=== CONSOLE ERRORS ===")
        for e in console_errors[:10]:
            print(f"  {e}")
        print(f"Total console errors: {len(console_errors)}")
        print(f"Total page errors: {len(page_errors)}")
        for pe in page_errors[:5]:
            print(f"  PAGEERR: {pe}")

        results["console_errors"] = len(console_errors)
        results["page_errors"] = len(page_errors)

        print("\n=== RESULTS SUMMARY ===")
        for k, v in results.items():
            if k != "stations":
                print(f"  {k}: {v}")

        await browser.close()
    return results

asyncio.run(run())
