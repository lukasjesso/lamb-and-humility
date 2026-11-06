const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SITE = path.resolve(__dirname, '..');
const win = {};
const ctx = vm.createContext({ window: win, console });
for (const f of ['lamb', 'icon', 'connections', 'credits']) {
  vm.runInContext(fs.readFileSync(path.join(SITE, 'content', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
}
const C = win.CONTENT || {};

const str = (v) => typeof v === 'string' && v.trim().length > 0;
const num = (v) => typeof v === 'number' && Number.isFinite(v);
function checkCrop(c, where) {
  assert.ok(c && ['x', 'y', 'w', 'h'].every((k) => num(c[k])), `${where}: crop needs numeric x,y,w,h`);
  assert.ok(c.x >= 0 && c.y >= 0 && c.w > 0 && c.h > 0, `${where}: x,y >= 0 and w,h > 0`);
  assert.ok(c.x + c.w <= 100.001 && c.y + c.h <= 100.001, `${where}: crop exceeds the image`);
}
function checkIntro(name) {
  const d = C[name];
  assert.ok(d, `${name} missing`);
  assert.ok(str(d.heading), `${name}.heading`);
  assert.ok(Array.isArray(d.facts) && d.facts.length >= 3, `${name}.facts needs >= 3`);
  d.facts.forEach((f, i) => assert.ok(str(f.label) && str(f.value), `${name}.facts[${i}] {label,value}`));
  assert.ok(Array.isArray(d.history) && d.history.length >= 3, `${name}.history needs >= 3`);
  d.history.forEach((h, i) => {
    assert.ok(str(h.line), `${name}.history[${i}].line`);
    if (h.img) assert.ok(str(h.img.src) && str(h.img.alt) && str(h.img.credit), `${name}.history[${i}].img {src,alt,credit}`);
  });
  assert.ok(Array.isArray(d.details), `${name}.details`);
  d.details.forEach((x, i) => { checkCrop(x.crop, `${name}.details[${i}]`); assert.ok(str(x.caption), `${name}.details[${i}].caption`); });
  (d.callouts || []).forEach((x, i) => { checkCrop(x.crop, `${name}.callouts[${i}]`); assert.ok(str(x.greek) && str(x.meaning) && str(x.ref), `${name}.callouts[${i}] {greek,meaning,ref}`); });
  if (d.names) for (const s of ['left', 'right']) assert.ok(str(d.names[s]?.title) && Array.isArray(d.names[s].lines) && d.names[s].lines.length, `${name}.names.${s}`);
  if (d.hymn) assert.ok(Array.isArray(d.hymn.lines) && d.hymn.lines.length && str(d.hymn.cite), `${name}.hymn {lines,cite}`);
}

test('lamb content', () => checkIntro('lamb'));
test('icon content', () => checkIntro('icon'));

const STYLES = ['rise', 'quote-first', 'portrait', 'timeline', 'banner', 'pull-back', 'dawn', 'crossing']; // scenes/30-connection.js STYLES
test('connections content', () => {
  const cs = C.connections;
  assert.ok(Array.isArray(cs) && cs.length === 8, `expected exactly 8 connections, got ${cs && cs.length}`);
  assert.strictEqual(new Set(cs.map((c) => c.id)).size, 8, 'ids must be unique');
  cs.forEach((c, i) => {
    const w = `connections[${i}]`;
    assert.ok(str(c.id) && str(c.numeral) && str(c.title) && str(c.blurb), `${w}: id, numeral, title, blurb`);
    assert.ok(['lamb', 'icon'].includes(c.first), `${w}.first`);
    assert.ok(['lamb', 'icon'].includes(c.zone), `${w}.zone`);
    for (const side of ['lamb', 'icon']) {
      const s = c[side];
      assert.ok(s, `${w}.${side}`);
      checkCrop(s.crop, `${w}.${side}.crop`); checkCrop(s.zoomTo, `${w}.${side}.zoomTo`);
      assert.ok(Array.isArray(s.lines) && s.lines.length >= 1 && s.lines.length <= 6 && s.lines.every(str), `${w}.${side}.lines: 1-6 non-empty strings`);
      if (s.quote) assert.ok(str(s.quote.text) && str(s.quote.cite), `${w}.${side}.quote needs text and cite`);
    }
    assert.ok(c.takeaway && str(c.takeaway.text) && str(c.takeaway.cite), `${w}.takeaway needs text and cite`);
    assert.ok(STYLES.includes(c.style), `${w}.style must be one of ${STYLES.join(', ')}`);
    assert.strictEqual(c.style === 'dawn', c.dawn === true, `${w}: style "dawn" exactly on the dawn: true connection`);
    assert.ok(!('mode' in c), `${w}: "mode" was renamed "style"`);
  });
  assert.strictEqual(new Set(cs.map((c) => c.style)).size, 8, 'each connection has its own style');
  assert.strictEqual(cs.filter((c) => c.dawn === true).length, 1, 'exactly one dawn:true');
  assert.strictEqual(cs[6].dawn, true, 'the 7th connection has dawn:true');
  assert.strictEqual(cs[7].day, true, 'the 8th connection has day:true');
});

test('credits content', () => {
  const d = C.credits;
  assert.ok(d, 'credits missing');
  assert.ok(str(d.thanks) && str(d.builtWith), 'thanks, builtWith');
  assert.ok(Array.isArray(d.sources) && d.sources.length >= 5, 'sources >= 5');
  d.sources.forEach((s, i) => { assert.ok(str(s.label), `sources[${i}].label`); if (s.url) assert.ok(/^https:\/\//.test(s.url), `sources[${i}].url must start with https://`); });
  for (const k of ['images', 'audio']) {
    assert.ok(Array.isArray(d[k]), `${k} array`);
    d[k].forEach((x, i) => assert.ok(str(x.file) && str(x.title) && str(x.source) && str(x.license), `${k}[${i}] {file,title,source,license}`));
  }
  assert.ok(d.barber && str(d.barber.url), 'barber.url');
});

function walk(v, fn, key = '', where = '$') {
  if (typeof v === 'string') fn(v, key, where);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, fn, key, `${where}[${i}]`));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, fn, k, `${where}.${k}`));
}

test('every quote has a cite', () => {
  (function q(v, where) {
    if (Array.isArray(v)) v.forEach((x, i) => q(x, `${where}[${i}]`));
    else if (v && typeof v === 'object') {
      if ('quote' in v && v.quote) assert.ok(str(v.quote.cite), `${where}.quote.cite empty`);
      if ('text' in v && 'cite' in v) assert.ok(str(v.cite), `${where}.cite empty`);
      Object.entries(v).forEach(([k, x]) => q(x, `${where}.${k}`));
    }
  })(C, '$');
});

test('spelling: Surrendering and Zurbarán', () => {
  walk(C, (s, key, where) => {
    if (['file', 'src', 'url'].includes(key)) return;
    assert.ok(!/Surrending/.test(s), `${where}: "Surrending"`);
    assert.ok(!/Zurbaran/.test(s), `${where}: "Zurbaran" without the accent`);
  });
});

test('line lengths (fail > 320, warn > 220)', () => {
  const long = [];
  const check = (s, where) => { if (s.length > 320) long.push(`${where} (${s.length})`); else if (s.length > 220) console.warn(`[warn] ${where} is ${s.length} chars`); };
  for (const n of ['lamb', 'icon']) (C[n]?.history || []).forEach((h, i) => check(h.line || '', `${n}.history[${i}].line`));
  (C.connections || []).forEach((c, i) => ['lamb', 'icon'].forEach((s) => (c[s]?.lines || []).forEach((l, j) => check(l, `connections[${i}].${s}.lines[${j}]`))));
  assert.deepStrictEqual(long, [], 'lines over 320 chars');
});

test('assets exist', () => {
  const files = [];
  for (const n of ['lamb', 'icon']) (C[n]?.history || []).forEach((h) => h.img && files.push(h.img.src));
  for (const k of ['images', 'audio']) (C.credits?.[k] || []).forEach((x) => files.push(x.file));
  const gone = files.filter((f) => !fs.existsSync(path.join(SITE, f)));
  assert.deepStrictEqual(gone, [], 'missing files under site/');
});
