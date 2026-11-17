# iter30: verifies mc/multi options are rendered shuffled (DOM order != original index order) and evaluated by original index
import json
ANS = json.load(open("/tmp/answers.json"))
BASE = "https://gottes-wort-app.preview.emergentagent.com"

async def check_station(page, sid, wrong=False):
    await page.goto(f"{BASE}/station/{sid}")
    await page.wait_for_selector('[data-testid="station-screen"]', timeout=20000)
    await page.wait_for_timeout(1200)
    nxt = page.locator('[data-testid="station-next-button"]')
    for _ in range(3):
        await nxt.click(); await page.wait_for_timeout(1500)
    out = []
    for _ in range(40):
        ph = "tasks" if await page.locator('[data-testid="phase-tasks"]').count() else ("exam" if await page.locator('[data-testid="phase-exam"]').count() else None)
        if not ph: break
        P = "task" if ph == "tasks" else "exam"
        lines = await page.evaluate("""(ph) => document.querySelector('[data-testid=phase-'+ph+']').innerText.split('\\n').map(s=>s.trim()).filter(Boolean)""", ph)
        key = next((l for l in lines if l in ANS), None)
        order = await page.evaluate("""(ph) => [...document.querySelectorAll('[data-testid=phase-'+ph+'] [data-testid^="'+(ph=='tasks'?'task':'exam')+'-option-"]')].map(e=>+e.dataset.testid.split('-').pop())""", ph)
        kind = lines[0] if lines else "?"
        if order and key and ANS[key][0] in ("mc", "multi"):
            typ, ans = ANS[key]
            if typ == "multi":
                picks = ans if not wrong else [i for i in order if i not in ans][:1]
            else:
                picks = [ans] if not wrong else [next(i for i in order if i != ans)]
            for i in picks:
                await page.click(f'[data-testid="{P}-option-{i}"]')
            await page.click(f'[data-testid="{P}-check"]'); await page.wait_for_timeout(400)
            fb = await page.locator(f'[data-testid="{P}-feedback"]').inner_text()
            ans_pos = [order.index(a) for a in (ans if isinstance(ans, list) else [ans])]
            out.append({"ph": P, "type": typ, "dom_order": order, "answer": ans, "answer_dom_pos": ans_pos, "picked": picks, "result": "OK" if "Richtig!" in fb else "WRONG"})
        else:
            out.append({"kind": kind[:20], "skipped": True})
            # answer generically so we can move on
            t = lambda s: page.locator(f'[data-testid="{P}-{s}"]')
            if await t("tf-true").count(): await t("tf-true").click()
            elif await t("free-input").count():
                await t("free-input").fill("TEST_ Antwort"); await t("show-model").click(); await page.wait_for_timeout(300); await t("self-Getroffen").click()
            elif await t("left-0").count():
                n = await page.locator(f'[data-testid^="{P}-left-"]').count()
                for i in range(n): await t(f"left-{i}").click(); await t(f"right-{i}").click()
                await t("check").click()
            elif await t("order-0").count():
                n = await page.locator(f'[data-testid^="{P}-order-"]').count()
                for i in range(n): await t(f"order-{i}").click()
                await t("check").click()
            elif await t("option-0").count():
                await t("option-0").click(); await t("check").click()
            await page.wait_for_timeout(400)
        lbl = await nxt.inner_text()
        await nxt.click(); await page.wait_for_timeout(600)
        if "abschließen" in lbl: break
    return out
