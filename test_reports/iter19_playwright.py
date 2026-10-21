"""Iteration 19 testing for BIBLIA Lexikon:
- Filter sheet, Sort (A-Z / Zeitlich), Active chips, Progress 135/135
- Neue Artikel (Urkirche-Etappe) öffnen
- Relationen antippbar
- Timeline-Verknüpfung paulus → /lexicon/paulus
- Keine Konsolenfehler
"""
import asyncio

BASE = "https://gottes-wort-app.preview.emergentagent.com"

async def run(page):
    errors = []
    nans = []
    page.on("console", lambda m: (errors.append(m.text) if m.type == "error" else None) or (nans.append(m.text) if ("NaN" in m.text or "Infinity" in m.text) else None))
    page.on("pageerror", lambda e: errors.append(f"PAGEERROR {e}"))

    await page.set_viewport_size({"width": 390, "height": 844})

    async def dismiss_intro():
        try:
            btn = await page.query_selector('text=Überspringen')
            if btn and await btn.is_visible():
                await btn.click(force=True)
                await page.wait_for_timeout(300)
        except Exception:
            pass

    # ---------- 1) Open /lexicon ----------
    print("\n=== 1) /lexicon progress ===")
    await page.goto(f"{BASE}/lexicon", wait_until="domcontentloaded")
    await page.wait_for_selector('[data-testid="lexicon-screen"]', timeout=15000)
    await dismiss_intro()
    await page.wait_for_timeout(500)
    prog = await page.inner_text('[data-testid="lexicon-progress"]')
    print(f"progress: {prog}")
    assert "135" in prog and "von 135" in prog, f"progress wrong: {prog}"

    # ---------- 2) Filter sheet ----------
    print("\n=== 2) lexicon-filter-open ===")
    # Ensure no overlay
    await dismiss_intro()
    # Chip rows should not exist anymore (only filter button + sort)
    toolbar_filter_btn = await page.query_selector('[data-testid="lexicon-filter-open"]')
    assert toolbar_filter_btn, "lexicon-filter-open missing"
    print("filter button visible OK")

    await page.click('[data-testid="lexicon-filter-open"]', force=True)
    await page.wait_for_selector('[data-testid="lexicon-filter-sheet"]', timeout=5000)
    print("filter sheet opened")

    # Check sections present
    for sel in ['[data-testid="lex-kind-person"]', '[data-testid="lex-epoch-urkirche"]',
                '[data-testid="lex-region-kleinasien"]', '[data-testid="lex-book-Apg"]']:
        el = await page.query_selector(sel)
        print(f"  {sel}: {'OK' if el else 'MISSING'}")
        assert el, f"{sel} missing"

    # Multi-filter: urkirche epoch + person kind
    await page.click('[data-testid="lex-epoch-urkirche"]', force=True)
    await page.wait_for_timeout(200)
    await page.click('[data-testid="lex-kind-person"]', force=True)
    await page.wait_for_timeout(300)
    apply_text = await page.inner_text('[data-testid="lexicon-filter-apply"]')
    print(f"apply btn text: {apply_text}")
    assert "Treffer anzeigen" in apply_text, apply_text

    await page.click('[data-testid="lexicon-filter-apply"]', force=True)
    await page.wait_for_timeout(400)
    # Sheet should close
    sheet_visible = await page.is_visible('[data-testid="lexicon-filter-sheet"]')
    print(f"sheet after apply visible={sheet_visible}")
    assert not sheet_visible, "sheet should close after apply"

    # Button shows "Filter · 2"
    btn_text = await page.inner_text('[data-testid="lexicon-filter-open"]')
    print(f"filter button after apply: '{btn_text}'")
    assert "2" in btn_text, btn_text

    # Active chips present
    for sel in ['[data-testid="lex-active-kind"]', '[data-testid="lex-active-epoch"]']:
        v = await page.is_visible(sel)
        print(f"  active chip {sel}: {v}")
        assert v, sel

    # Click to remove kind chip
    await page.click('[data-testid="lex-active-kind"]', force=True)
    await page.wait_for_timeout(300)
    btn_text2 = await page.inner_text('[data-testid="lexicon-filter-open"]')
    print(f"after remove kind: '{btn_text2}'")
    assert "1" in btn_text2 and "2" not in btn_text2, btn_text2

    # Reset
    await page.click('[data-testid="lexicon-filter-open"]', force=True)
    await page.wait_for_selector('[data-testid="lexicon-filter-sheet"]')
    await page.click('[data-testid="lexicon-filter-reset"]', force=True)
    await page.wait_for_timeout(300)
    reset_apply = await page.inner_text('[data-testid="lexicon-filter-apply"]')
    print(f"after reset apply: {reset_apply}")
    # Close sheet via close
    await page.click('[data-testid="lexicon-filter-sheet-close"]', force=True)
    await page.wait_for_timeout(400)
    btn_text3 = await page.inner_text('[data-testid="lexicon-filter-open"]')
    print(f"filter btn after reset: '{btn_text3}'")
    assert "·" not in btn_text3, btn_text3

    # ---------- 3) Sort A-Z + Zeitlich ----------
    print("\n=== 3) Sort A-Z / Zeitlich ===")
    note = await page.inner_text('[data-testid="lexicon-sort-note"]')
    print(f"sort note alpha: {note}")
    assert "lphabet" in note, note

    # Alpha: Aaron before Abraham
    titles_alpha = await page.evaluate("""() => {
      const rows = Array.from(document.querySelectorAll('[data-testid^="lex-article-"]'));
      return rows.slice(0, 15).map(r => r.innerText.split('\\n')[0]);
    }""")
    print(f"alpha first 15: {titles_alpha}")

    await page.click('[data-testid="lexicon-sort-time"]', force=True)
    await page.wait_for_timeout(400)
    note2 = await page.inner_text('[data-testid="lexicon-sort-note"]')
    print(f"sort note time: {note2}")
    assert "eitlich" in note2, note2
    titles_time = await page.evaluate("""() => {
      const rows = Array.from(document.querySelectorAll('[data-testid^="lex-article-"]'));
      return rows.slice(0, 8).map(r => r.innerText.split('\\n')[0]);
    }""")
    print(f"time first 8: {titles_time}")

    # Verify a known early entry (e.g. "Die Schöpfung") and known late entry (neues-jerusalem)
    all_time = await page.evaluate("""() => {
      const rows = Array.from(document.querySelectorAll('[data-testid^="lex-article-"]'));
      return rows.map(r => r.getAttribute('data-testid'));
    }""")
    print(f"total articles rendered: {len(all_time)}")
    # Index of schoepfung should be low, neues-jerusalem should be last-ish
    idx_schoep = next((i for i, t in enumerate(all_time) if "schoepfung" in t.lower()), -1)
    idx_njer = next((i for i, t in enumerate(all_time) if "neues-jerusalem" in t.lower()), -1)
    print(f"idx schoepfung={idx_schoep}, neues-jerusalem={idx_njer}, total={len(all_time)}")
    assert idx_schoep != -1 and idx_njer != -1 and idx_schoep < idx_njer, "time sort order wrong"

    # Sort back to alpha
    await page.click('[data-testid="lexicon-sort-alpha"]', force=True)
    await page.wait_for_timeout(300)

    # Verify alpha: 'Aaron' before 'Abraham'
    idx_aaron = next((i for i, t in enumerate(titles_alpha) if "Aaron" in t), -1)
    idx_abr = next((i for i, t in enumerate(titles_alpha) if "Abraham" in t), -1)
    print(f"alpha Aaron idx={idx_aaron}, Abraham idx={idx_abr}")
    if idx_aaron != -1 and idx_abr != -1:
        assert idx_aaron < idx_abr, "Aaron should come before Abraham"

    # ---------- 4) Sort applies to filtered results ----------
    print("\n=== 4) Sort on filtered results ===")
    await page.fill('[data-testid="lexicon-search"]', "paul")
    await page.wait_for_timeout(400)
    results_root = await page.query_selector('[data-testid="lexicon-results"]')
    print(f"lexicon-results visible: {bool(results_root)}")
    assert results_root

    # ---------- 5) Open new articles ----------
    print("\n=== 5) Open new articles ===")
    await page.fill('[data-testid="lexicon-search"]', "")
    await page.wait_for_timeout(300)

    new_ids = ["pfingsten", "paulus", "missionsreisen", "antiochia", "barnabas",
               "roemergemeinde", "korinth", "abendmahl", "patmos", "sieben-gemeinden",
               "neues-jerusalem"]
    for aid in new_ids:
        await page.goto(f"{BASE}/lexicon/{aid}", wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        await dismiss_intro()
        try:
            await page.wait_for_selector('[data-testid="article-title"]', timeout=6000)
            title = await page.locator('[data-testid="article-title"]').last.inner_text()
            print(f"  {aid}: '{title}' OK")
        except Exception as e:
            print(f"  {aid}: FAIL — {e}")
            errors.append(f"article {aid} not open: {e}")

    # Check paulus has illustration
    await page.goto(f"{BASE}/lexicon/paulus", wait_until="domcontentloaded")
    await page.wait_for_timeout(500)
    await dismiss_intro()
    illu_p = await page.query_selector('[data-testid="article-illustration"]')
    print(f"paulus illustration: {bool(illu_p)}")

    # Check barnabas illustration
    await page.goto(f"{BASE}/lexicon/barnabas", wait_until="domcontentloaded")
    await page.wait_for_timeout(500)
    await dismiss_intro()
    illu_b = await page.query_selector('[data-testid="article-illustration"]')
    print(f"barnabas illustration: {bool(illu_b)}")

    # missionsreisen map
    await page.goto(f"{BASE}/lexicon/missionsreisen", wait_until="domcontentloaded")
    await page.wait_for_timeout(600)
    await dismiss_intro()
    body = await page.content()
    has_map = ('article-map' in body) or ('data-testid="article-map"' in body)
    print(f"missionsreisen article-map: {has_map}")

    # sieben-gemeinden map
    await page.goto(f"{BASE}/lexicon/sieben-gemeinden", wait_until="domcontentloaded")
    await page.wait_for_timeout(600)
    await dismiss_intro()
    body = await page.content()
    has_map2 = ('article-map' in body)
    print(f"sieben-gemeinden article-map: {has_map2}")

    # ---------- 6) Relations ----------
    print("\n=== 6) Relations ===")
    for src, rel_target in [("hochzeit-kana", "nazareth"), ("see-genezareth", "kapernaum"), ("jeremia", "abendmahl")]:
        await page.goto(f"{BASE}/lexicon/{src}", wait_until="domcontentloaded")
        await page.wait_for_timeout(600)
        await dismiss_intro()
        sel = f'[data-testid="rel-{rel_target}"]'
        rel = await page.query_selector(sel)
        print(f"  {src} -> rel-{rel_target}: present={bool(rel)}")
        if rel:
            # check not disabled
            disabled = await rel.get_attribute('aria-disabled')
            opacity = await rel.evaluate("el => getComputedStyle(el).opacity")
            print(f"    disabled={disabled}, opacity={opacity}")
            await rel.click(force=True)
            await page.wait_for_timeout(900)
            cur_url = page.url
            print(f"    after click URL: {cur_url}")
            # Should navigate to /lexicon/<target>
            assert rel_target in cur_url, f"nav fail for {src}->{rel_target}, url={cur_url}"

    # ---------- 7) Timeline paulus ----------
    print("\n=== 7) Timeline ===")
    await page.goto(f"{BASE}/timeline", wait_until="domcontentloaded")
    await page.wait_for_timeout(1200)
    await dismiss_intro()
    tl_p = await page.query_selector('[data-testid="timeline-item-paulus"]')
    print(f"timeline-item-paulus present: {bool(tl_p)}")
    if tl_p:
        await tl_p.scroll_into_view_if_needed()
        await page.wait_for_timeout(300)
        await tl_p.click(force=True)
        await page.wait_for_timeout(1200)
        url = page.url
        print(f"after paulus click URL: {url}")
        assert "/lexicon/paulus" in url, f"paulus should open article, got {url}"

    tl_pf = await page.query_selector('[data-testid="timeline-item-pfingsten"]')
    print(f"timeline-item-pfingsten present: {bool(tl_pf)}")
    if tl_pf:
        # Verify its parent epoch is urkirche
        in_urk = await page.evaluate("""() => {
          const el = document.querySelector('[data-testid="timeline-item-pfingsten"]');
          if (!el) return false;
          let n = el;
          while (n) {
            const id = n.getAttribute && n.getAttribute('data-testid');
            if (id === 'timeline-epoch-urkirche') return true;
            n = n.parentElement;
          }
          return false;
        }""")
        print(f"pfingsten in urkirche epoch: {in_urk}")

    # ---------- 8) in Arbeit / plan toggle ----------
    print("\n=== 8) Plan toggle 'in Arbeit' count ===")
    await page.goto(f"{BASE}/lexicon", wait_until="domcontentloaded")
    await page.wait_for_timeout(800)
    await dismiss_intro()
    # Scroll down to the plan
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(400)
    # Toggle to show all planned
    toggle_text = await page.inner_text('[data-testid="lexicon-plan-toggle"]')
    print(f"plan toggle initial text: '{toggle_text}'")
    if "Alle" in toggle_text:
        await page.click('[data-testid="lexicon-plan-toggle"]', force=True)
        await page.wait_for_timeout(500)
    inarbeit_count = await page.evaluate("""() => {
      const nodes = document.querySelectorAll('[data-testid^="plan-"]');
      let cnt = 0;
      nodes.forEach(n => { if ((n.innerText||'').includes('in Arbeit')) cnt++; });
      return cnt;
    }""")
    print(f"'in Arbeit' count after toggle to 'Alle geplanten': {inarbeit_count}")

    # ---------- Summary ----------
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
