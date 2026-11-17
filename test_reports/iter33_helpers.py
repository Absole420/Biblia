# Iteration 33 Playwright helper (reference copy of browser_automation script logic)
# Visible place-node tap check: tap the dot centre with mouse.click, verify place-sheet title == place name.
JS_NODES = """() => Array.from(document.querySelectorAll('[data-testid^="place-node-"]')).map(el => {
  let op=1, n=el; while(n){ op*=parseFloat(getComputedStyle(n).opacity); n=n.parentElement;}
  const r=el.getBoundingClientRect(); const cx=r.x+r.width/2, cy=r.y+r.height/2;
  const top=document.elementFromPoint(cx,cy); let tid=null, t=top; while(t && !tid){ tid=t.getAttribute&&t.getAttribute('data-testid'); t=t.parentElement;}
  return {id:el.dataset.testid.replace('place-node-',''), label:el.getAttribute('aria-label'), op, cx, cy, top:tid};
}).filter(x=>x.op>0.5 && x.cx>0 && x.cx<innerWidth && x.cy>0 && x.cy<innerHeight)"""
