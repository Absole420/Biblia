# iter51: Playwright snippet - opens restored history stations, answers tasks (incl. matching shuffle check), completes station
import json
ANS = json.load(open("/tmp/answers.json"))
BASE = "https://gottes-wort-app.preview.emergentagent.com"

async def skip_intro(page):
    for _ in range(3):
        s = page.locator('[data-testid="intro-skip-button"]')
        if await s.count():
            await s.first.click(force=True); await page.wait_for_timeout(1200)

async def answer(page, P, ph):
    lines = await page.evaluate("""(ph) => document.querySelector('[data-testid=phase-'+ph+']').innerText.split('\\n').map(s=>s.trim()).filter(Boolean)""", ph)
    key = next((l for l in lines if l in ANS), None)
    t = lambda s: page.locator(f'[data-testid="{P}-{s}"]')
    info = ""
    if await t("tf-true").count():
        await t("tf-true" if (ANS[key][1] if key else True) else "tf-false").click()
    elif await t("free-input").count():
        await t("free-input").fill("TEST_ Antwort"); await t("show-model").click(); await page.wait_for_timeout(300)
        await t("self-Getroffen").click()
    elif await t("left-0").count():
        order = await page.evaluate("""(P) => [...document.querySelectorAll('[data-testid^="'+P+'-right-"]')].map(e=>+e.dataset.testid.split('-').pop())""", P)
        info = f" rightOrder={order} shuffled={order != sorted(order)}"
        for i in range(len(order)):
            await t(f"left-{i}").click(); await t(f"right-{i}").click()
        await t("check").click()
    elif await t("option-0").count():
        await t(f"option-{ANS[key][1] if key else 0}").click(); await t("check").click()
    await page.wait_for_timeout(400)
    fb = t("feedback")
    if not await fb.count(): return "free/selfrated" + info
    txt = await fb.inner_text()
    return ("OK" if "Richtig!" in txt else "WRONG:" + txt[:60]) + info

async def run_station(page, sid):
    await page.goto(f"{BASE}/station/{sid}")
    await page.wait_for_timeout(2500); await skip_intro(page)
    await page.wait_for_selector('[data-testid="station-screen"]', timeout=20000)
    nxt = page.locator('[data-testid="station-next-button"]')
    res = []
    for _ in range(40):
        if await page.locator('[data-testid="phase-complete"]').count(): break
        ph = "tasks" if await page.locator('[data-testid="phase-tasks"]').count() else ("exam" if await page.locator('[data-testid="phase-exam"]').count() else None)
        if ph:
            res.append(await answer(page, "task" if ph == "tasks" else "exam", ph))
        if await nxt.count() and await nxt.is_enabled():
            await nxt.click(force=True); await page.wait_for_timeout(900)
        else:
            break
    done = await page.locator('[data-testid="phase-complete"]').count() > 0
    score = await page.locator('[data-testid="complete-score"]').inner_text() if done else None
    return res, done, score
