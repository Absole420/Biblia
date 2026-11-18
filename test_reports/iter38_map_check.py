# Iteration 38: map layout check for new campaigns (paste body into browser_automation)
import json
CAMPS = [("revelation", "revelation"), ("psalms", "psalms-5"), ("psalms", "psalms-6"), ("letters", "letters-more"), ("history", "history-tribes"), ("gospels", "synoptic"), ("psalms", "psalms-4"), ("gospels", "synoptics")]
JS = """(cid) => {
  const r = (el) => { const b = el.getBoundingClientRect(); return {x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height)}; };
  const area = document.querySelector('[data-testid="map-area"]');
  const A = area ? r(area) : null;
  const ctrls = ['map-zoom-in','map-zoom-out','map-current-station','map-fit-all','map-reset-view','map-fullscreen'].map(id => document.querySelector(`[data-testid="${id}"]`)).filter(Boolean).filter(e=>e.offsetParent!==null).map(r);
  const nodes = Array.from(document.querySelectorAll('[data-testid^="station-node-"]')).map(e => ({id: e.dataset.testid.replace('station-node-',''), ...r(e)}));
  const ov = (a,b) => a.x < b.x+b.w && b.x < a.x+a.w && a.y < b.y+b.h && b.y < a.y+a.h;
  const res = nodes.map(n => {
    const visV = A && n.y + n.h > A.y && n.y < A.y + A.h;
    const fullyV = A && n.y >= A.y && n.y + n.h <= A.y + A.h;
    const cutH = A && (n.x < A.x - 1 || n.x + n.w > A.x + A.w + 1);
    const underCtrl = ctrls.some(c => ov(n, c));
    return {id: n.id, box: [n.x,n.y,n.w,n.h], visV, fullyV, cutH, underCtrl};
  });
  const paths = document.querySelectorAll('[data-testid="campaign-map"] svg path[stroke-dasharray="4 18"], [data-testid="campaign-map"] svg path[stroke-dasharray="4,18"]').length;
  return {area: A, ctrls, res, dashed: paths};
}"""
