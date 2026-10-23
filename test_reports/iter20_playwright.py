"""Iteration 20 testing for BIBLIA Intro Journey (15 scenes) + Map regression.
Flows:
  1. First start: logo animation -> IntroJourney auto appears with title card.
  2. Click "Weiter" scrolls through 15 scenes with testID intro-scene-<id>.
  3. Pause/play behavior; last scene "Abschließen" closes; reload => no journey.
  4. Skip (intro-journey-skip) also closes & marks seen.
  5. Resume: open to scene 5 (berufung), reload while not done -> starts at berufung.
  6. Settings: settings-replay-intro opens /intro with title card.
  7. Map regression: /world/gospel + /world/tora zoom in/out/reset + current-station.
  8. Multiple viewports: 360x780, 390x844, 412x915, 820x1180, 844x390.
"""

BASE = "https://gottes-wort-app.preview.emergentagent.com"
EXPECTED_IDS = [
    "geburt", "kindheit", "taufe", "wueste", "berufung", "verkuendigung",
    "begegnungen", "wunder", "bekenntnis", "einzug", "abendmahl",
    "gethsemane", "verhaftung", "kreuz", "auferstehung",
]

async def run(page):
    errors = []
    nans = []
    page.on("console", lambda m: (errors.append(m.text) if m.type == "error" else None) or (nans.append(m.text) if ("NaN" in m.text or "Infinity" in m.text) else None))
    page.on("pageerror", lambda e: errors.append(f"PAGEERROR {e}"))

    async def clear_intro_storage():
        try:
            await page.evaluate("""() => {
              try { localStorage.removeItem('biblia.introJourney.done'); } catch(e){}
              try { localStorage.removeItem('biblia.introJourney.pos'); } catch(e){}
            }""")
        except Exception:
            pass

    async def wait_for_journey(timeout=15000):
        # Logo-Animation: ca. 2-3s; danach erscheint intro-journey.
        try:
            await page.wait_for_selector('[data-testid="intro-journey"]', timeout=timeout)
            return True
        except Exception:
            return False

    async def current_scene_id():
        return await page.evaluate("""() => {
          const nodes = Array.from(document.querySelectorAll('[data-testid^="intro-scene-"]'));
          if (!nodes.length) return null;
          // Beim Übergang existieren kurz zwei -> letztes (sichtbares)
          const last = nodes[nodes.length - 1];
          return last.getAttribute('data-testid');
        }""")

    async def title_card_visible():
        try:
            el = await page.query_selector('[data-testid="intro-title-card"]')
            return bool(el) and await el.is_visible()
        except Exception:
            return False

    # ========== 1) First start: logo -> journey -> title card ==========
    print("\n=== 1) First-start flow ===")
    await page.set_viewport_size({"width": 390, "height": 844})
    await page.goto(f"{BASE}/", wait_until="domcontentloaded")
    await page.wait_for_timeout(600)
    await clear_intro_storage()
    await page.goto(f"{BASE}/", wait_until="domcontentloaded")

    # Wait up to 15s for logo animation to finish and journey to appear
    ok = await wait_for_journey(timeout=18000)
    print(f"intro-journey appeared: {ok}")
    assert ok, "intro-journey did not appear on first start"

    await page.wait_for_timeout(400)
    tc = await title_card_visible()
    print(f"title card visible: {tc}")
    assert tc, "title card not visible"

    # Hint text: 'Zusammenfassende Darstellung nach den vier Evangelien'
    body = await page.inner_text('[data-testid="intro-title-card"]')
    print(f"title card body contains hint: {'Evangelien' in body}")
    assert "vier Evangelien" in body, body[:200]

    # Progress dots exist
    prog = await page.query_selector('[data-testid="intro-progress"]')
    print(f"intro-progress exists: {bool(prog)}")
    assert prog

    # ========== 2) Click Weiter through 15 scenes ==========
    print("\n=== 2) 15 scenes forward ===")
    # First "Weiter" from title card
    await page.click('[data-testid="intro-next"]', force=True)
    await page.wait_for_timeout(900)
    seen_ids = []
    for step in range(15):
        await page.wait_for_timeout(500)
        sid = await current_scene_id()
        if sid:
            seen_ids.append(sid.replace("intro-scene-", ""))
            print(f"  step {step+1}: {sid}")
        # On last scene, intro-next shows "Abschließen" (check icon)
        if step < 14:
            try:
                await page.click('[data-testid="intro-next"]', force=True)
            except Exception as e:
                print(f"  next click failed on step {step}: {e}")
    print(f"seen ids: {seen_ids}")
    missing = [s for s in EXPECTED_IDS if s not in seen_ids]
    print(f"missing scenes: {missing}")

    # ========== 3) Last scene Abschließen closes ==========
    print("\n=== 3) Finish on last scene ===")
    # We should be on 'auferstehung' now; click Weiter (Abschließen)
    last_sid = await current_scene_id()
    print(f"last scene id: {last_sid}")
    await page.click('[data-testid="intro-next"]', force=True)
    await page.wait_for_timeout(1500)
    journey_gone = not await page.is_visible('[data-testid="intro-journey"]')
    print(f"journey closed after Abschließen: {journey_gone}")
    assert journey_gone, "journey should close"

    # Reload - journey must not reappear
    await page.reload()
    await page.wait_for_timeout(5000)
    reappeared = await page.is_visible('[data-testid="intro-journey"]')
    print(f"journey reappeared after reload (should be False): {reappeared}")
    assert not reappeared, "journey should NOT reappear after finish"

    # Verify localStorage state
    done = await page.evaluate("() => localStorage.getItem('biblia.introJourney.done')")
    pos = await page.evaluate("() => localStorage.getItem('biblia.introJourney.pos')")
    print(f"storage done={done}, pos={pos}")
    assert done == "1", f"done flag wrong: {done}"

    # ========== 4) Skip test ==========
    print("\n=== 4) Skip flow ===")
    await clear_intro_storage()
    await page.goto(f"{BASE}/", wait_until="domcontentloaded")
    ok = await wait_for_journey(timeout=18000)
    assert ok
    await page.wait_for_timeout(600)
    # Click skip from title card
    await page.click('[data-testid="intro-journey-skip"]', force=True)
    await page.wait_for_timeout(1500)
    journey_gone = not await page.is_visible('[data-testid="intro-journey"]')
    print(f"journey closed after skip: {journey_gone}")
    assert journey_gone

    done = await page.evaluate("() => localStorage.getItem('biblia.introJourney.done')")
    print(f"storage done after skip: {done}")
    assert done == "1"

    # ========== 5) Resume at scene 5 (berufung) ==========
    print("\n=== 5) Resume flow ===")
    await clear_intro_storage()
    await page.goto(f"{BASE}/", wait_until="domcontentloaded")
    ok = await wait_for_journey(timeout=18000)
    assert ok
    await page.wait_for_timeout(600)
    # Click Weiter from title card -> geburt (scene 1)
    for _ in range(5):
        try:
            await page.click('[data-testid="intro-next"]', force=True)
        except Exception as e:
            print(f"next click err: {e}")
        await page.wait_for_timeout(800)
    sid = await current_scene_id()
    print(f"scene after 5 clicks: {sid}")

    # Pause so no auto-advance
    try:
        await page.click('[data-testid="intro-play"]', force=True)
        await page.wait_for_timeout(300)
    except Exception as e:
        print(f"pause err: {e}")

    # Reload while not done
    await page.reload()
    await page.wait_for_timeout(5000)
    reappeared = await page.is_visible('[data-testid="intro-journey"]')
    print(f"journey reappeared (should be True): {reappeared}")
    assert reappeared, "journey should reappear if not finished"
    await page.wait_for_timeout(1500)
    sid2 = await current_scene_id()
    print(f"resume scene id: {sid2}")
    # Expectation: starts at scene 5 (berufung, 0-indexed=4)
    if sid2 and "berufung" in sid2:
        print("  resume at berufung: OK")
    else:
        print(f"  WARN resume scene is {sid2}, expected intro-scene-berufung")

    # ========== 6) Pause/Play behavior ==========
    print("\n=== 6) Pause behavior ===")
    sid_before = await current_scene_id()
    print(f"before pause test: {sid_before}")
    # Ensure paused (we paused above); wait 13s and check scene unchanged
    await page.wait_for_timeout(13000)
    sid_after = await current_scene_id()
    print(f"after 13s pause: {sid_after}")
    paused_ok = sid_before == sid_after
    print(f"paused (no auto-advance): {paused_ok}")

    # Press play
    try:
        await page.click('[data-testid="intro-play"]', force=True)
    except Exception:
        pass
    await page.wait_for_timeout(12500)
    sid_play = await current_scene_id()
    print(f"after 12.5s playing: {sid_play}")
    advanced = sid_after != sid_play
    print(f"advanced after play: {advanced}")

    # Prev button
    try:
        await page.click('[data-testid="intro-prev"]', force=True)
        await page.wait_for_timeout(1200)
        sid_prev = await current_scene_id()
        print(f"after prev: {sid_prev}")
    except Exception as e:
        print(f"prev err: {e}")

    # Skip from scene
    await page.click('[data-testid="intro-journey-skip"]', force=True)
    await page.wait_for_timeout(1500)

    # ========== 7) Settings replay ==========
    print("\n=== 7) Settings replay-intro ===")
    await page.goto(f"{BASE}/settings", wait_until="domcontentloaded")
    await page.wait_for_timeout(2500)
    btn = await page.query_selector('[data-testid="settings-replay-intro"]')
    print(f"settings-replay-intro present: {bool(btn)}")
    assert btn
    await btn.scroll_into_view_if_needed()
    await page.wait_for_timeout(300)
    await btn.click(force=True)
    await page.wait_for_timeout(2500)
    tc = await title_card_visible()
    url = page.url
    print(f"url after replay: {url}, title card visible: {tc}")
    assert "/intro" in url, url

    # ========== 8) Panel visible on various viewports ==========
    print("\n=== 8) Panel visibility across viewports ===")
    viewports = [(360, 780), (390, 844), (412, 915), (820, 1180), (844, 390)]
    for w, h in viewports:
        await page.set_viewport_size({"width": w, "height": h})
        await page.wait_for_timeout(500)
        # Panel + controls present
        has_journey = await page.is_visible('[data-testid="intro-journey"]')
        has_next = await page.is_visible('[data-testid="intro-next"]')
        has_skip = await page.is_visible('[data-testid="intro-journey-skip"]')
        print(f"  {w}x{h}: journey={has_journey}, next={has_next}, skip={has_skip}")
        # Check overlap: controls y > panel bottom? We rely on visibility.
        try:
            next_box = await page.locator('[data-testid="intro-next"]').bounding_box()
            print(f"    next btn box: {next_box}")
        except Exception:
            pass

    await page.set_viewport_size({"width": 390, "height": 844})

    # ========== 9) Map regression /world/gospel ==========
    print("\n=== 9) Map /world/gospel ===")
    # Finish/skip intro to be safe
    try:
        skip = await page.query_selector('[data-testid="intro-journey-skip"]')
        if skip:
            await skip.click(force=True)
            await page.wait_for_timeout(1500)
    except Exception:
        pass

    await page.goto(f"{BASE}/world/gospel", wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)
    try:
        skip = await page.query_selector('[data-testid="intro-journey-skip"]')
        if skip:
            await skip.click(force=True)
            await page.wait_for_timeout(1500)
    except Exception:
        pass

    for tid in ["map-zoom-in", "map-zoom-out", "map-reset-view"]:
        el = await page.query_selector(f'[data-testid="{tid}"]')
        print(f"  {tid} present: {bool(el)}")
        if el:
            await el.click(force=True)
            await page.wait_for_timeout(700)

    cur = await page.query_selector('[data-testid="map-current-station"]')
    print(f"  map-current-station present: {bool(cur)}")
    if cur:
        await cur.click(force=True)
        await page.wait_for_timeout(1200)

    # ========== 10) Map /world/tora ==========
    print("\n=== 10) Map /world/tora ===")
    await page.goto(f"{BASE}/world/tora", wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)
    try:
        skip = await page.query_selector('[data-testid="intro-journey-skip"]')
        if skip:
            await skip.click(force=True)
            await page.wait_for_timeout(1500)
    except Exception:
        pass
    for tid in ["map-zoom-in", "map-zoom-out", "map-reset-view"]:
        el = await page.query_selector(f'[data-testid="{tid}"]')
        print(f"  {tid} present: {bool(el)}")

    # ========== Summary ==========
    print("\n=== CONSOLE ERRORS ===")
    print(f"errors: {len(errors)}")
    for e in errors[:20]:
        print(f"  - {e[:200]}")
    print(f"NaN/Infinity: {len(nans)}")
    for n in nans[:5]:
        print(f"  - {n[:200]}")

try:
    await run(page)
except Exception as e:
    print(f"\n!!! EXCEPTION: {e}")
    import traceback; traceback.print_exc()
