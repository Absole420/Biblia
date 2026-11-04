import { test } from "node:test";
import assert from "node:assert/strict";
import { solveLabels } from "../frontend/src/lib/mapLayout.ts";

const base = {
  id: "jerusalem",
  x: 150,
  y: 100,
  r: 10,
  w: 50,
  h: 16,
  priority: 1,
};

const options = {
  view: { x: 0, y: 0, w: 300, h: 200 },
  reserved: [],
  obstacles: [],
  gap: 3,
  clusterGap: 4,
};

function labelRect(item, label) {
  return { x: item.x + label.dx, y: item.y + label.dy, w: item.w, h: item.h };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

test("place labels avoid fixed region and sea labels", () => {
  const firstSlot = { x: 150 + 10 + 3, y: 100 - 8, w: 50, h: 16 };
  const result = solveLabels([base], { ...options, obstacles: [firstSlot] });
  const label = result[base.id].label;

  assert.ok(label, "the place should keep a visible label when another slot is free");
  assert.equal(overlaps(labelRect(base, label), firstSlot), false);
  assert.notEqual(label.slot, 0);
});

test("hide non-pinned labels when every slot is blocked", () => {
  const result = solveLabels([base], {
    ...options,
    reserved: [{ x: -500, y: -500, w: 1000, h: 1000 }],
  });

  assert.equal(result[base.id].label, null);
});

test("keep the selected place label visible when every slot is blocked", () => {
  const selected = { ...base, pinned: true, priority: 1000 };
  const result = solveLabels([selected], {
    ...options,
    reserved: [{ x: -500, y: -500, w: 1000, h: 1000 }],
  });

  assert.ok(result[selected.id].label);
});
