#!/usr/bin/env node
// Live-site check over raw CDP. Zero dependencies, own temp profile.
// Usage: node tests/live-check.mjs [url]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_ = process.argv[2] || 'https://lukasjesso.github.io/lamb-and-humility/';
const outDir = path.join(SITE, 'tests/shots/live');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'live-check-'));
  let chrome, cdp;
  const errors = [], failedRequests = [], steps = [];
  const summary = { url: URL_, ready: false, errors, failedRequests, steps, audioReady: false, lightAtEnd: 0 };
  let zoneLog = [];
  try {
    chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check',
      '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
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
    cdp.on((m, p) => {
      if (m === 'Runtime.exceptionThrown') errors.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
      else if (m === 'Runtime.consoleAPICalled' && p.type === 'error') errors.push('console.error: ' + p.args.map((a) => a.value ?? a.description ?? '').join(' '));
      else if (m === 'Log.entryAdded' && p.entry.level === 'error' && !/Failed to load resource/.test(p.entry.text)) errors.push('log.error: ' + p.entry.text + (p.entry.url ? ' ' + p.entry.url : ''));
      else if (m === 'Network.responseReceived' && p.response.status >= 400) failedRequests.push(`HTTP ${p.response.status} ${p.response.url}`);
    });
    for (const d of ['Page', 'Runtime', 'Log', 'Network']) await cdp.send(d + '.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    const ev = async (expr) => {
      const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('evaluate: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    };

    await cdp.send('Page.navigate', { url: URL_ });
    for (let i = 0; i < 150 && !summary.ready; i++) { await sleep(200); try { summary.ready = (await ev('window.__ready === true')) === true; } catch {} }
    if (summary.ready) {
      await ev(`(() => { const b = document.querySelector('[data-begin]'); if (b) b.click(); })()`);
      await sleep(500);
      let n = 0;
      for (const pct of [0, 25, 50, 75, 100]) {
        await ev(`window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * ${pct / 100}))`);
        await sleep(1200);
        const s = await ev(`({ scrollY: Math.round(scrollY), light: window.__light, zone: window.__audioZone, log: window.__audioZoneLog || [] })`);
        zoneLog = s.log;
        steps.push({ pct, scrollY: s.scrollY, light: s.light, zone: s.zone });
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(outDir, String(n++).padStart(2, '0') + '.png'), Buffer.from(data, 'base64'));
      }
      summary.audioReady = await ev(`(() => { const a = [...document.querySelectorAll('audio')]; return a.length >= 2 && a.every((x) => x.readyState >= 2 && !!x.currentSrc); })()`);
      summary.lightAtEnd = steps[steps.length - 1].light;
    }
  } catch (e) {
    errors.push('fatal: ' + (e.stack || e));
  } finally {
    try { cdp && (await Promise.race([cdp.send('Browser.close'), sleep(1500)])); } catch {}
    try { cdp && cdp.ws.close(); } catch {}
    if (chrome) {
      try { chrome.kill(); } catch {}
      if (process.platform === 'win32' && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
      await sleep(500);
    }
    try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch {}
  }
  const zonesOk = zoneLog.includes('lamb') && zoneLog.includes('icon');
  summary.zoneLog = zoneLog;
  console.log(JSON.stringify(summary, null, 2));
  process.exit(!summary.ready || errors.length || failedRequests.length || !(summary.lightAtEnd >= 0.99) || !zonesOk ? 1 : 0);
}

main();
