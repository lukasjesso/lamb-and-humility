#!/usr/bin/env node
// Headless-Chrome smoke test over raw CDP. Zero dependencies, own server (port 0), own temp profile.
// Usage: node tests/cdp-smoke.mjs [--only=a,b] [--sizes=WxH,..] [--every=0.75] [--pins] [--reverse] [--resize] [--lite]
//        [--out=tests/shots/<name>] [--allow-missing=prefix,prefix]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return [m[1], m[2] === undefined ? true : m[2]]; }));
const sizes = String(args.sizes || '1440x900').split(',').map((s) => s.split('x').map(Number));
const every = parseFloat(args.every || '0.75');
const allow = String(args['allow-missing'] || '').split(',').filter(Boolean);
const outDir = path.resolve(SITE, args.out || `tests/shots/run-${Date.now()}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', woff2: 'font/woff2' };

const failures = [];
const missing = [];
const fail = (m) => { failures.push(m); };

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = path.resolve(SITE, '.' + (p.endsWith('/') ? p + 'index.html' : p));
      const rel = path.relative(SITE, f);
      if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
      const size = fs.statSync(f).size, h = { 'content-type': MIME[path.extname(f).slice(1).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store', 'accept-ranges': 'bytes' };
      const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (m && (m[1] || m[2])) { // Range support so looping media behaves like GitHub Pages
        let a = m[1] ? +m[1] : Math.max(0, size - +m[2]), b = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
        if (a > b || a >= size) { res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end(); }
        res.writeHead(206, { ...h, 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1 });
        return fs.createReadStream(f, { start: a, end: b }).pipe(res);
      }
      res.writeHead(200, { ...h, 'content-length': size });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0; const pending = new Map(); const handlers = [];
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
      else if (m.method) handlers.forEach((h) => h(m.method, m.params));
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({
      ws,
      send: (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: i, method, params })); }),
      on: (h) => handlers.push(h),
    });
  });
}

const urlPath = (u) => { try { return new URL(u).pathname.replace(/^\//, ''); } catch { return u; } };
const allowed = (u) => allow.some((p) => urlPath(u).startsWith(p));

// Runs in the page: facts for one scroll position.
const COLLECT = `(() => {
  const vis = (el) => { const cs = getComputedStyle(el); return parseFloat(cs.opacity) > 0.05 && cs.visibility === 'visible'; };
  const eff = (el) => { let o = 1; for (let n = el; n && n.id !== 'app'; n = n.parentElement) { const cs = getComputedStyle(n); o *= parseFloat(cs.opacity); if (cs.visibility === 'hidden') return 0; } return o; };
  const light = window.__light || 0;
  const pins = (window.ScrollTrigger ? ScrollTrigger.getAll() : []).filter((s) => s.pin).map((s) => ({
    id: s.pin.id || s.pin.className, active: s.isActive, progress: +s.progress.toFixed(3), top: +s.pin.getBoundingClientRect().top.toFixed(1) }));
  const swap = [...document.querySelectorAll('[data-swap-group]')].map((g) => ({
    n: [...g.querySelectorAll('[data-swap-panel]')].filter(vis).length, total: g.querySelectorAll('[data-swap-panel]').length }));
  let leaks = [];
  if (light > 0.15 && light < 0.9) {
    leaks = [...document.querySelectorAll('#app .reveal, #app p, #app li, #app blockquote')].filter((el) => {
      if (el.closest('[data-flood-ok]')) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
      return eff(el) > 0.1;
    }).map((el) => (el.textContent || '').trim().slice(0, 40));
  }
  let lowContrast = [];
  if (light > 0.95) {
    const lum = (c) => { const n = (c.match(/-?[\d.]+/g) || []).map(Number); const v = c.startsWith('color(') ? n.slice(0, 3).map((x) => x * 255) : n.slice(0, 3); return (0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) / 255; };
    lowContrast = [...document.querySelectorAll('#app .is-day p, #app .is-day li, #app .is-day blockquote, #app .is-day h1, #app .is-day h2, #app .is-day h3, #app .is-day .lede, #app .is-day .title, #app .is-day .caption')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.bottom < 0 || r.top > innerHeight || eff(el) < 0.5 || el.classList.contains('kicker')) return false;
      return lum(getComputedStyle(el).color) > 0.45;
    }).map((el) => (el.textContent || '').trim().slice(0, 30) + ' ' + getComputedStyle(el).color);
  }
  const lite = document.documentElement.classList.contains('is-lite');
  const name = (el) => el.id || (el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/).join('.'));
  // full: an active pinned section's laid-out content must fit the viewport. Measured with its clip lifted and the inline
  // animation transforms removed (entrance offsets like y:30 on a full-screen layer are motion, not size), then both restored.
  const tall = lite ? [] : (window.ScrollTrigger ? ScrollTrigger.getAll() : []).filter((s) => s.pin && s.isActive).map((s) => {
    const el = s.pin, moved = [...el.querySelectorAll('*')].filter((n) => n.style.transform), tf = moved.map((n) => n.style.transform), ov = el.style.overflow;
    moved.forEach((n) => { n.style.transform = 'none'; }); el.style.overflow = 'visible';
    const h = el.scrollHeight;
    moved.forEach((n, i) => { n.style.transform = tf[i]; }); el.style.overflow = ov;
    return { id: name(el), h };
  }).filter((t) => t.h > innerHeight + 2);
  // lite: no element wider than the viewport (pictures inside a .frame are clipped by it, so skip them)
  const wide = !lite ? [] : [...document.querySelectorAll('#app *')].filter((el) => {
    if (el.parentElement && el.parentElement.closest('.frame')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.right > innerWidth + 1 || r.left < -1);
  }).slice(0, 8).map((el) => { const r = el.getBoundingClientRect(); return name(el) + ' ' + Math.round(r.left) + '..' + Math.round(r.right); });
  const d = window.ScrollTrigger && ScrollTrigger.getAll().find((s) => s.vars && s.vars.refreshPriority === -10);
  return { y: Math.round(scrollY), light, zone: window.__audioZone, zoneLog: window.__audioZoneLog,
    lite, tall, wide,
    scrollWidth: document.documentElement.scrollWidth, innerWidth, innerHeight,
    docH: document.documentElement.scrollHeight, pins, swap, leaks, lowContrast,
    dawn: d ? { start: d.start, end: d.end } : null };
})()`;

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const srv = await startServer();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-smoke-'));
  let chrome, cdp;
  const shots = [];
  try {
    chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check',
      '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
    const portFile = path.join(prof, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(150);
    if (!fs.existsSync(portFile)) throw new Error('Chrome did not start');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
      if (!target) await sleep(150);
    }
    cdp = await connect(target.webSocketDebuggerUrl);
    const reqUrls = new Map();
    cdp.on((m, p) => {
      if (m === 'Runtime.exceptionThrown') missing.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
      else if (m === 'Runtime.consoleAPICalled' && p.type === 'error') {
        const t = p.args.map((a) => a.value ?? a.description ?? '').join(' ');
        if (!/Failed to load resource/.test(t)) missing.push('console.error: ' + t);
      } else if (m === 'Log.entryAdded' && p.entry.level === 'error') {
        if (!(p.entry.url && allowed(p.entry.url))) missing.push('log.error: ' + p.entry.text + (p.entry.url ? ' ' + p.entry.url : ''));
      } else if (m === 'Network.requestWillBeSent') reqUrls.set(p.requestId, p.request.url);
      else if (m === 'Network.loadingFailed' && !p.canceled) { const u = reqUrls.get(p.requestId) || p.requestId; if (!allowed(u)) missing.push(`net failure ${p.errorText} ${u}`); }
      else if (m === 'Network.responseReceived' && p.response.status >= 400 && !allowed(p.response.url)) missing.push(`HTTP ${p.response.status} ${p.response.url}`);
    });
    for (const d of ['Page', 'Runtime', 'Log', 'Network']) await cdp.send(d + '.enable');

    const ev = async (expr) => {
      const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('evaluate: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    };
    const setSize = (w, h) => cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 500 });
    const shot = async (dir, name) => {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), Buffer.from(data, 'base64'));
      return path.relative(outDir, path.join(dir, name)).replace(/\\/g, '/');
    };
    let dawnInfo = null;
    const check = (label, f) => {
      if (f.scrollWidth > f.innerWidth) fail(`${label}: horizontal overflow ${f.scrollWidth} > ${f.innerWidth}`);
      f.pins.forEach((p) => { if (p.active && p.progress > 0.02 && p.progress < 0.98 && Math.abs(p.top) > 2) fail(`${label}: pin ${p.id} drifted top=${p.top} at progress ${p.progress}`); });
      f.tall.forEach((t) => fail(`${label}: pinned ${t.id} content is ${t.h}px tall, viewport ${f.innerHeight}`));
      if (f.wide.length) fail(`${label}: wider than the viewport (${f.innerWidth}): ${f.wide.join(' | ')}`);
      if (!f.lite) f.swap.forEach((s) => { if (s.n > 1) fail(`${label}: ${s.n} swap panels visible at once`); });
      if (f.lowContrast.length) fail(`${label}: light text on daylight (light ${f.light.toFixed(2)}): ${f.lowContrast.join(' | ')}`);
      if (f.leaks.length) fail(`${label}: text visible during flood (light ${f.light.toFixed(2)}): ${f.leaks.join(' | ')}`);
      if (f.dawn) {
        dawnInfo = f.dawn;
        if (f.y < f.dawn.start - 2 && f.light > 0.001) fail(`${label}: light ${f.light} before dawn starts (${f.dawn.start})`);
        if (f.y > f.dawn.end + 2 && f.light < 0.999) fail(`${label}: light ${f.light} after dawn ends (${f.dawn.end})`);
        // full page: the chant is the lamb's until the light enters, then the icon's (credits may fade it to none)
        if (!args.only && !f.lite && f.y < f.dawn.start - 2 && f.zone === 'icon') fail(`${label}: icon chant before the dawn (y ${f.y} < ${f.dawn.start})`);
        if (!args.only && !f.lite && f.y > f.dawn.start + 2 && f.zone === 'lamb') fail(`${label}: lamb chant after the dawn started (y ${f.y})`);
      }
      (f.zoneLog || []).forEach((z) => { if (!['none', 'lamb', 'icon'].includes(z)) fail(`${label}: bad zone ${z}`); });
    };
    const step = async (dir, name, y, label) => {
      await ev(`window.scrollTo(0, ${y})`);
      await sleep(400);
      let f = await ev(COLLECT);
      for (let i = 0; i < 20; i++) { // wait until the scrubbed state is idle (two equal reads in a row)
        await sleep(200);
        const g = await ev(COLLECT);
        const same = g.light === f.light && JSON.stringify(g.pins) === JSON.stringify(f.pins) && JSON.stringify(g.swap) === JSON.stringify(f.swap) && g.leaks.join() === f.leaks.join();
        f = g; if (same) break;
      }
      check(label, f);
      const file = await shot(dir, name);
      shots.push({ file, label, ...f, pins: f.pins.filter((p) => p.active), leaks: f.leaks });
      return f;
    };

    for (let si = 0; si < sizes.length; si++) {
      const [w, h] = sizes[si]; const tag = `${w}x${h}`; const dir = path.join(outDir, tag);
      await setSize(w, h);
      const q = [args.only ? 'only=' + args.only : '', args.lite ? 'lite=1' : ''].filter(Boolean).join('&');
      await cdp.send('Page.navigate', { url: 'about:blank' }); // drop the previous page so a stale __ready cannot pass
      await sleep(200);
      await cdp.send('Page.navigate', { url: `${base}/index.html${q ? '?' + q : ''}` });
      let ok = false;
      for (let i = 0; i < 100 && !ok; i++) { await sleep(200); try { ok = (await ev('window.__ready === true')) === true; } catch {} }
      if (!ok) { fail(`${tag}: window.__ready not true within 20 s`); continue; }
      await ev(`(() => { const b = document.querySelector('[data-begin]'); if (b) b.click(); })()`);
      await sleep(300);
      const total = (await ev('document.documentElement.scrollHeight - innerHeight'));
      const ys = []; for (let y = 0; y < total; y += every * h) ys.push(Math.round(y)); ys.push(total);
      let n = 0;
      for (const y of ys) await step(dir, String(n++).padStart(3, '0') + '.png', y, `${tag} y=${y}`);

      if (String(args.only || '').includes('demo-dawn') && !(await ev("document.documentElement.classList.contains('is-lite')"))) { // lite demo page is too short to reach the icon zone
        const log = (await ev('window.__audioZoneLog || []')) || [];
        if (!(log.indexOf('lamb') >= 0 && log.indexOf('icon') > log.indexOf('lamb'))) fail(`${tag}: zone log should contain lamb then icon, got ` + JSON.stringify(log));
      }
      if (args.pins) {
        const trig = await ev(`(window.ScrollTrigger ? ScrollTrigger.getAll() : []).filter(s => s.pin).map(s => [s.start, s.end])`);
        let pi = 0;
        for (const [s, e] of trig) { for (const f of [0, 0.5, 1]) await step(dir, `pin-${pi}-${f * 100}.png`, Math.round(s + (e - s) * f), `${tag} pin${pi}@${f * 100}%`); pi++; }
      }
      if (args.reverse) {
        let r = 0;
        for (const y of ys.slice().reverse()) await step(dir, 'rev-' + String(r++).padStart(3, '0') + '.png', y, `${tag} rev y=${y}`);
      }
      if (args.resize && sizes.length > 1) {
        const [w2, h2] = sizes[(si + 1) % sizes.length];
        await ev(`window.scrollTo(0, ${Math.round(total / 2)})`); await sleep(800);
        await setSize(w2, h2); await sleep(1000);
        const f = await ev(COLLECT); check(`${tag}->${w2}x${h2} resize`, f);
        const file = await shot(dir, `resize-${w2}x${h2}.png`);
        shots.push({ file, label: `resize ${tag} -> ${w2}x${h2}`, ...f, pins: f.pins.filter((p) => p.active) });
      }
    }
    if (missing.length) missing.forEach((m) => fail(m));
    writeSheet(shots);
    const summary = { ok: failures.length === 0, base, shots: shots.length, out: outDir, dawn: dawnInfo, failures: [...new Set(failures)] };
    console.log(JSON.stringify(summary, null, 2));
  } catch (e) {
    fail('fatal: ' + (e.stack || e));
    console.log(JSON.stringify({ ok: false, failures }, null, 2));
  } finally {
    try { cdp && (await Promise.race([cdp.send('Browser.close'), sleep(1500)])); } catch {}
    try { cdp && cdp.ws.close(); } catch {}
    if (chrome) {
      try { chrome.kill(); } catch {}
      if (process.platform === 'win32' && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
      await sleep(500);
    }
    await new Promise((r) => srv.close(r));
    try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch {}
  }
  process.exit(failures.length ? 1 : 0);
}

function writeSheet(shots) {
  const esc = (s) => String(s).replace(/[&<]/g, (c) => ({ '&': '&amp;', '<': '&lt;' }[c]));
  const html = `<!doctype html><meta charset="utf-8"><title>Filmstrip</title><style>body{background:#111;color:#ddd;font:12px monospace;margin:12px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}figure{margin:0;background:#1a1a1a;padding:6px}img{width:100%;display:block}
figcaption{padding-top:4px;white-space:pre-wrap}</style><div class="g">${shots.map((s) => `<figure><img src="${s.file}" loading="lazy"><figcaption>${esc(s.label)}\nlight=${(s.light ?? 0).toFixed(3)} zone=${s.zone} y=${s.y}\npins=${esc(JSON.stringify(s.pins))}\nswap=${esc(JSON.stringify(s.swap))}</figcaption></figure>`).join('')}</div>`;
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

main();
