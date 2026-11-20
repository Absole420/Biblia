# Iteration 41: multi-screen colour/contrast audit (body of a browser_automation script; SCHEME set by caller)
AUDIT = open("/app/test_reports/iter41_contrast_audit.js").read().split("\n", 1)[1]
BASE = "https://gottes-wort-app.preview.emergentagent.com"
errs = []
page.on("pageerror", lambda e: errs.append(str(e)))

async def dismiss():
    for _ in range(14):
        sk = page.get_by_text("Überspringen", exact=True)
        if await sk.count() > 0 and await sk.first.is_visible():
            await sk.first.click(force=True); await page.wait_for_timeout(800); break
        if await page.locator('[data-testid="tab-map"]').count() > 0 and _ > 6: break
        await page.wait_for_timeout(500)
    for _ in range(6):
        b = page.get_by_text("Bibel entdecken", exact=True)
        if await b.count() > 0 and await b.first.is_visible():
            await b.first.click(force=True); await page.wait_for_timeout(800); break
        await page.wait_for_timeout(400)

async def audit(name, shot=True):
    r = await page.evaluate(AUDIT)
    print(f"== {name}: checked={r['checked']} fails={len(r['fails'])}")
    for f in r['fails'][:12]: print("   ", f)
    if shot: await page.screenshot(path=f".screenshots/{SCHEME}_{name.replace(' ', '_')}.jpg", quality=40, full_page=False)

STYLE = """(sel)=>[...document.querySelectorAll(sel)].slice(0,6).map(e=>{const s=getComputedStyle(e); const t=[...e.querySelectorAll('*')].find(x=>[...x.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())); return e.dataset.testid+' bg='+s.backgroundColor+' bd='+s.borderTopColor+' txt='+(t?getComputedStyle(t).color:'-')+' sel='+(e.getAttribute('aria-selected')||e.getAttribute('aria-checked')||'')})"""

async def go(path):
    await page.goto(BASE + path, wait_until="networkidle"); await dismiss(); await page.wait_for_timeout(1500)

try:
    await page.set_viewport_size({"width": 390, "height": 844})
    await page.emulate_media(color_scheme=SCHEME)
    await go("/")
    await page.click('[data-testid="tab-library"]', force=True); await page.wait_for_timeout(2000)
    await audit("library")
    await page.click('[data-testid="tab-profile"]', force=True); await page.wait_for_timeout(2000)
    await audit("profile")
    await go("/lexicon")
    await audit("lexicon list")
    print("\n".join(await page.evaluate(STYLE, '[data-testid^="lexicon-sort-"]')))
    print("\n".join(await page.evaluate(STYLE, '[data-testid="lexicon-search"]')))
    art = await page.query_selector('[data-testid^="lex-article-"]')
    if art:
        await art.click(force=True); await page.wait_for_timeout(2000); await audit("lexicon article")
    await go("/way")
    await audit("way", shot=False)
    print("\n".join(await page.evaluate(STYLE, '[data-testid^="way-cat-"]')))
    cats = await page.query_selector_all('[data-testid^="way-cat-"]')
    if len(cats) > 1:
        await cats[1].click(force=True); await page.wait_for_timeout(800)
        print("after select:"); print("\n".join(await page.evaluate(STYLE, '[data-testid^="way-cat-"]')))
    await page.screenshot(path=f".screenshots/{SCHEME}_way.jpg", quality=40, full_page=False)
    await go("/settings")
    await audit("settings")
    print("\n".join(await page.evaluate(STYLE, '[data-testid^="theme-"], [data-testid^="font-"], [data-testid^="map-motion-"]')))
    print("\n".join(await page.evaluate(STYLE, '[data-testid="export-button"], [data-testid="reset-button"], [data-testid="full-backup-button"]')))
except Exception as e:
    print("ERR", e)
print("pageerrors", errs[:5])
