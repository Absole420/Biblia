# iter45: Scripture Academy station runner (separate task/exam answer keys, gap support). Generate keys first: node --import ./tests/ts-loader.mjs --experimental-strip-types tests/academy_answers_gen.mjs
# Playwright snippet (pasted into browser_automation): runs a BIBLIA station end-to-end using answer keys from /tmp/answers.json
import json
ANS = json.load(open("/tmp/answers.json"))
BASE = "https://gottes-wort-app.preview.emergentagent.com"

async def answer_current(page, prefix):
    box = page.locator(f'[data-testid="phase-{"tasks" if prefix == "task" else "exam"}"]')
    q = await page.evaluate("""(sel) => { const r = document.querySelector(sel); const t = r ? r.innerText.split('\\n').map(s=>s.trim()).filter(Boolean) : []; return t; }""", f'[data-testid="phase-{"tasks" if prefix == "task" else "exam"}"]')
    lines = q
    key = next((l for l in lines if l in ANS), None)
    t = lambda s: page.locator(f'[data-testid="{prefix}-{s}"]')
    if await t("tf-true").count():
        val = ANS[key][1] if key else True
        await t("tf-true" if val else "tf-false").click()
    elif await t("free-input").count():
        await t("free-input").fill("TEST_ Antwort")
        await t("show-model").click(); await page.wait_for_timeout(300)
        await t("self-Getroffen").click()
    elif await t("left-0").count():
        n = await page.locator(f'[data-testid^="{prefix}-left-"]').count()
        for i in range(n):
            await t(f"left-{i}").click(); await t(f"right-{i}").click()
        await t("check").click()
    elif await t("order-0").count():
        n = await page.locator(f'[data-testid^="{prefix}-order-"]').count()
        for i in range(n): await t(f"order-{i}").click()
        await t("check").click()
    elif await t("option-0").count():
        if key and ANS[key][0] == "multi":
            for i in ANS[key][1]: await t(f"option-{i}").click()
        else:
            await t(f"option-{ANS[key][1] if key else 0}").click()
        await t("check").click()
    await page.wait_for_timeout(400)
    fb = t("feedback")
    kind = lines[1] if len(lines) > 1 else "?"
    if not await fb.count():
        return f"{kind[:14]}:free/selfrated"
    txt = await fb.inner_text()
    return f"{kind[:14]}:{'OK' if 'Richtig!' in txt else 'WRONG'}"

async def run_station(page, sid):
    out = {"id": sid}
    await page.goto(f"{BASE}/station/{sid}")
    await page.wait_for_selector('[data-testid="station-screen"]', timeout=20000)
    await page.wait_for_timeout(1200)
    nxt = page.locator('[data-testid="station-next-button"]')
    out["title"] = (await page.locator('[data-testid="station-screen"]').inner_text()).split("\n")[0:2]
    out["img"] = await page.evaluate("() => Array.from(document.querySelectorAll('[data-testid=\"station-illustration\"] img')).map(i=>i.currentSrc||i.src).join(',')")
    await nxt.click(); await page.wait_for_timeout(2500)
    study = await page.locator('[data-testid="phase-study"]').inner_text()
    out["study_len"] = len(study); out["study_loading"] = "konnte nicht" in study
    out["study_snip"] = study[:300].replace("\n", " | ")
    await nxt.click(); await page.wait_for_timeout(800)
    out["bg_len"] = len(await page.locator('[data-testid="phase-background"]').inner_text())
    await nxt.click(); await page.wait_for_timeout(800)
    res = []
    for _ in range(20):
        res.append(await answer_current(page, "task"))
        lbl = await nxt.inner_text()
        await nxt.click(); await page.wait_for_timeout(600)
        if "Prüfung" in lbl: break
    out["tasks"] = res
    ex = []
    for _ in range(20):
        if not await page.locator('[data-testid="phase-exam"]').count(): break
        ex.append(await answer_current(page, "exam"))
        lbl = await nxt.inner_text()
        await nxt.click(); await page.wait_for_timeout(600)
        if "abschließen" in lbl: break
    out["review"] = ex
    if await page.locator('[data-testid="phase-reflection"]').count():
        await nxt.click(); await page.wait_for_timeout(1500)
    if await page.locator('[data-testid="phase-complete"]').count():
        out["complete"] = (await page.locator('[data-testid="complete-title"]').inner_text(), await page.locator('[data-testid="complete-score"]').inner_text())
        u = page.locator('[data-testid="complete-unlocked"]')
        out["unlocked"] = await u.inner_text() if await u.count() else None
    else:
        out["complete"] = "NOT REACHED: " + (await page.locator('[data-testid="station-phase-label"]').inner_text())
    return out

ANS_T = json.load(open("/tmp/answers_t.json")); ANS_E = json.load(open("/tmp/answers_e.json"))
_orig_ac = answer_current
async def answer_current(page, prefix):
    global ANS
    ANS = ANS_T if prefix == "task" else ANS_E
    return await _orig_ac(page, prefix)

async def dismiss(page):
    for sel in ['[data-testid="intro-skip-button"]', '[data-testid="welcome-start"]']:
        try:
            await page.wait_for_selector(sel, timeout=14000); await page.click(sel, force=True); await page.wait_for_timeout(800)
        except Exception:
            pass

_orig_ac2 = answer_current
async def answer_current(page, prefix):
    global ANS
    ANS = ANS_T if prefix == "task" else ANS_E
    if await page.locator(f'[data-testid="{prefix}-word-0"]').count() and not await page.locator(f'[data-testid="{prefix}-option-0"]').count():
        lines = await page.evaluate("""(sel) => { const r = document.querySelector(sel); return r ? r.innerText.split('\\n').map(s=>s.trim()).filter(Boolean) : []; }""", f'[data-testid="phase-{"tasks" if prefix == "task" else "exam"}"]')
        for w in GAP_BLANKS:
            await page.locator(f'[data-testid^="{prefix}-word-"]', has_text=w).first.click()
        await page.locator(f'[data-testid="{prefix}-check"]').click(); await page.wait_for_timeout(400)
        txt = await page.locator(f'[data-testid="{prefix}-feedback"]').inner_text() if await page.locator(f'[data-testid="{prefix}-feedback"]').count() else ""
        return "GAP:" + ("OK" if "Richtig!" in txt else "WRONG")
    return await _orig_ac2(page, prefix)

GAP_BLANKS = ["sechs", "Wasser"]
