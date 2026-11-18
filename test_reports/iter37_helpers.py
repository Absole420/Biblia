# Helper snippet (copy into browser_automation scripts): dismiss intro
async def dismiss_intro(page, base):
    await page.goto(base, wait_until="domcontentloaded")
    await page.wait_for_timeout(2500)
    for txt in ["Überspringen", "Bibel entdecken"]:
        try:
            await page.get_by_text(txt, exact=True).first.click(force=True, timeout=6000)
            await page.wait_for_timeout(1200)
        except Exception as e:
            print("intro step", txt, "not found")
