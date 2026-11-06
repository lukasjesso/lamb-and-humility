const test = require('node:test');
const assert = require('node:assert');
const { coverTransform, dawnCurve } = require('../js/scene-kit.js');
const N = { w: 2952, h: 1750 };
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} != ${b}`);

test('coverTransform: full crop, same aspect box', () => {
  const B = { w: 1476, h: 875 };
  const t = coverTransform({ x: 0, y: 0, w: 100, h: 100 }, N, B);
  near(t.scale, B.w / N.w); near(t.x, 0); near(t.y, 0);
});
test('coverTransform: centered 50% crop doubles scale and centers', () => {
  const B = { w: 1476, h: 875 };
  const full = coverTransform({ x: 0, y: 0, w: 100, h: 100 }, N, B);
  const t = coverTransform({ x: 25, y: 25, w: 50, h: 50 }, N, B);
  near(t.scale, full.scale * 2);
  near(N.w * 0.5 * t.scale + t.x, B.w / 2); near(N.h * 0.5 * t.scale + t.y, B.h / 2);
});
test('coverTransform: corner crop clamps', () => {
  const B = { w: 800, h: 600 };
  for (const c of [{ x: 0, y: 0, w: 10, h: 10 }, { x: 90, y: 90, w: 10, h: 10 }, { x: 90, y: 0, w: 10, h: 10 }]) {
    const t = coverTransform(c, N, B);
    assert.ok(t.x <= 0 && t.y <= 0);
    assert.ok(t.x >= B.w - N.w * t.scale - 1e-6 && t.y >= B.h - N.h * t.scale - 1e-6);
  }
});
test('coverTransform: tall box with wide crop still covers', () => {
  const B = { w: 400, h: 900 };
  const c = { x: 10, y: 40, w: 80, h: 10 };
  const t = coverTransform(c, N, B);
  assert.ok(c.w / 100 * N.w * t.scale >= B.w - 1e-6);
  assert.ok(c.h / 100 * N.h * t.scale >= B.h - 1e-6);
});
test('dawnCurve: endpoints, monotonic, glow point, clamping', () => {
  assert.strictEqual(dawnCurve(0, 0.7, 0.06), 0);
  assert.strictEqual(dawnCurve(1, 0.7, 0.06), 1);
  let prev = -1;
  for (let i = 0; i <= 200; i++) { const v = dawnCurve(i / 200, 0.7, 0.06); assert.ok(v >= prev); prev = v; }
  near(dawnCurve(0.7, 0.7, 0.06), 0.06);
  assert.strictEqual(dawnCurve(-3, 0.7, 0.06), 0);
  assert.strictEqual(dawnCurve(4, 0.7, 0.06), 1);
});
