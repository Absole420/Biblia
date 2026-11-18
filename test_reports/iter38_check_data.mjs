// Iteration 38: verify layout/requires/icon/goal/image fixes of new campaign JSONs
import fs from "node:fs";
const dir = "/app/frontend/src/data/campaigns/";
const ids = ["revelation", "psalms-5", "psalms-6", "letters-more", "history-tribes", "synoptic"];
let fail = 0;
const bad = (m) => { fail++; console.log("FAIL", m); };
for (const id of ids) {
  const raw = JSON.parse(fs.readFileSync(dir + id + ".json", "utf8"));
  const camps = Array.isArray(raw) ? raw : raw.campaigns ?? [raw];
  for (const c of camps) {
    const st = c.stations;
    const n = st.length;
    const expH = (n + 1) * 240 + 320;
    console.log(`${c.id}: n=${n} mapW=${c.mapW} mapH=${c.mapH} (exp ${expH})`);
    if (c.mapH !== expH) bad(`${c.id} mapH ${c.mapH} != ${expH}`);
    st.forEach((s, i) => {
      const ex = Math.round(500 + Math.sin(i * 1.15) * 290);
      if (Math.abs(s.x - ex) > 2) bad(`${s.id} x=${s.x} exp ${ex}`);
      if (i > 0 && Math.abs((st[i - 1].y - s.y) - 240) > 2) bad(`${s.id} y spacing ${st[i - 1].y - s.y}`);
      if (s.y < 150 || s.y > c.mapH - 100) bad(`${s.id} y=${s.y} out of map`);
      const req = s.requires ?? [];
      if (i === 0 && req.length) bad(`${s.id} first requires ${req}`);
      if (i > 0 && (req.length !== 1 || req[0] !== st[i - 1].id)) bad(`${s.id} requires ${JSON.stringify(req)} exp ${st[i - 1].id}`);
      if (s.icon === "lock") bad(`${s.id} icon lock`);
      if (c.id === "revelation" || id === "revelation") {
        const goal = JSON.stringify(s.goal ?? s.goals ?? s.learningGoal ?? "");
        if (!goal.includes("Du kannst das Thema „")) bad(`${s.id} goal: ${goal.slice(0, 120)}`);
      }
    });
    console.log("  xs:", st.map((s) => s.x).join(","), " ys:", st.map((s) => s.y).join(","));
    const seals = st.find((s) => s.id === "rev-seals");
    if (seals) console.log("  rev-seals icon:", seals.icon);
    for (const s of st) if (s.id.startsWith("psalms-6")) console.log("  ", s.id, "image:", s.image ?? s.illustration ?? null);
  }
}
console.log(fail ? `${fail} failures` : "ALL OK");
