import { test } from "node:test";
import assert from "node:assert/strict";
import { solveLabels } from "../frontend/src/lib/mapLayout.ts";

const view = { x: 0, y: 0, w: 1000, h: 800 };
const item = (overrides = {}) => ({
  id: "jerusalem",
  x: 500,
  y: 400,
  r: 16,
  w: 120,
  h: 30,
  priority: 10,
  ...overrides,
});
const solve = (items, obstacles = []) =>
  solveLabels(items, {
    view,
    reserved: [],
    obstacles,
    gap: 8,
    clusterGap: 4,
  });

test("places a place label in a clear slot when its preferred slot is obstructed", () => {
  const label = solve([item()], [{ x: 524, y: 385, w: 150, h: 60 }]).jerusalem.label;
  assert.ok(label, "label should remain visible");
  assert.notEqual(label.slot, 0, "label should avoid the obstructed right slot");
});

test("hides an unpinned place label when every slot is blocked", () => {
  const base = item();
  const obstacles = Array.from({ length: 16 }, (_, slot) => {
    const [dx, dy] = [
      [24, -15], [-144, -15], [-60, -48], [-60, 24],
      [17, -33], [17, 17], [-137, -33], [-137, 17],
      [24, -60], [-144, -60], [-60, -93], [-60, 69],
      [17, -78], [17, 32], [-137, -78], [-137, 32],
    ][slot];
    return { x: base.x + dx, y: base.y + dy, w: 120, h: 30 };
  });
  assert.equal(solve([base], obstacles).jerusalem.label, null);
});

test("keeps a pinned place label visible as a fallback when every slot is blocked", () => {
  const base = item({ pinned: true });
  const obstacles = Array.from({ length: 16 }, (_, slot) => {
    const [dx, dy] = [
      [24, -15], [-144, -15], [-60, -48], [-60, 24],
      [17, -33], [17, 17], [-137, -33], [-137, 17],
      [24, -60], [-144, -60], [-60, -93], [-60, 69],
      [17, -78], [17, 32], [-137, -78], [-137, 32],
    ][slot];
    return { x: base.x + dx, y: base.y + dy, w: 120, h: 30 };
  });
  assert.ok(solve([base], obstacles).jerusalem.label);
});
