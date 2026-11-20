// Iteration 41: in-page WCAG contrast audit for every visible text node (used via page.evaluate)
() => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  const out = []; const seen = new Set(); let checked = 0;
  const nodes = Array.from(document.querySelectorAll("div[dir], span, div")).filter((el) => {
    const t = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
    return t.length > 0;
  });
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") continue;
    let fg = parse(cs.color); if (!fg) continue;
    let op = 1; let layers = []; let img = false; let e = el;
    while (e && e !== document.documentElement) {
      const s = getComputedStyle(e);
      op *= parseFloat(s.opacity);
      if (s.backgroundImage && s.backgroundImage !== "none") img = true;
      if (e.querySelector && Array.from(e.children).some((ch) => ch.tagName === "IMG" || ch.querySelector?.(":scope > img"))) img = img || false;
      const bg = parse(s.backgroundColor);
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 0.99) break; }
      e = e.parentElement;
    }
    if (op < 0.05) continue;
    let bgc = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) bgc = blend(layers[i], bgc);
    fg = blend({ ...fg, a: fg.a * op }, bgc);
    const l1 = L(fg), l2 = L(bgc); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const fs = parseFloat(cs.fontSize); const fw = parseInt(cs.fontWeight) || 400;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const need = large ? 3 : 4.5;
    checked++;
    const txt = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("").slice(0, 40);
    const key = txt + hex(fg) + hex(bgc);
    if (ratio < need && !seen.has(key)) { seen.add(key); out.push(`${ratio.toFixed(2)} fg=${hex(fg)} bg=${hex(bgc)} fs=${fs} op=${op.toFixed(2)}${img ? " [over-gradient/img]" : ""} tid=${el.closest("[data-testid]")?.getAttribute("data-testid") || "-"} "${txt}"`); }
  }
  return { checked, fails: out };
}
