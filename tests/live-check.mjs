#!/usr/bin/env node
// Live-site check over raw CDP. Zero dependencies, own temp profile.
// Usage: node tests/live-check.mjs [url] [--audio]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const AUDIO = process.argv.includes('--audio');
const URL_ = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'https://lukasjesso.github.io/lamb-and-humility/';
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

const AUDIO_JS = `({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, light: window.__light, zone: window.__audioZone,
  audio: (window.__testAudios || []).map((el) => ({ src: el.currentSrc.split('/').pop(), readyState: el.readyState, networkState: el.networkState,
    paused: el.paused, volume: +el.volume.toFixed(2), currentTime: +el.currentTime.toFixed(1), error: el.error && el.error.code })) })`;

async function collectAudio(ev) {
  const series = [];
  const { max, vh } = await ev(`({ max: document.documentElement.scrollHeight - innerHeight, vh: innerHeight })`);
  for (let y = 0, i = 0; ; y = Math.min(y + vh / 2, max), i++) {
    await ev(`window.scrollTo(0, ${Math.round(y)})`);
    await sleep(y >= max ? 3600 : 600); // the closing fade takes 2.5 s
    series.push({ i, ...(await ev(AUDIO_JS)) });
    if (y >= max) break;
  }
  return series;
}

function reportAudio(series, summary, errors, failedRequests) {
  if (!series || !series.length) { console.log(JSON.stringify({ ...summary, fatal: 'no series' }, null, 2)); return 1; }
  const at = (s, name) => s.audio.find((a) => a.src === name);
  const playing = (i, name) => { // playing: unpaused, audible, and currentTime advanced since the previous step
    const a = at(series[i], name), b = i > 0 && at(series[i - 1], name);
    return !!a && !a.paused && a.volume > 0.05 && !!b && a.currentTime > b.currentTime;
  };
  const silent = (s, name) => { const a = at(s, name); return !a || a.paused || a.volume < 0.05; };
  const L = 'lamb-chant.mp3', I = 'icon-chant.mp3';
  const a = series.findIndex((_, i) => playing(i, L));
  const b = series.findIndex((s) => s.zone === 'icon');
  const c = b < 0 ? -1 : series.findIndex((s, i) => i >= b && playing(i, I) && silent(s, L));
  const last = series[series.length - 1];
  const d = last.zone === 'none' && silent(last, L) && silent(last, I);
  const e = series.flatMap((s) => s.audio.filter((x) => x.error != null || (x.readyState < 2 && !x.paused)).map((x) => ({ step: s.i, ...x })));
  const show = (i) => (i < 0 ? 'NEVER' : 'step ' + i + ' (y=' + series[i].y + ', light=' + series[i].light + ')');
  console.log('RAW SERIES (step y/max light zone | per audio: src ready/net paused vol t err)');
  for (const s of series) console.log(s.i, s.y + '/' + s.max, s.light, s.zone, '|', s.audio.map((x) => x.src + ' ' + x.readyState + '/' + x.networkState + ' ' + (x.paused ? 'P' : 'play') + ' v' + x.volume + ' t' + x.currentTime + ' e' + x.error).join(' | '));
  console.log('(a) lamb first playing:', show(a));
  console.log('(b) zone first icon:', show(b));
  console.log('(c) icon playing + lamb faded:', show(c));
  console.log('(d) end zone=' + last.zone + ', both silent:', d);
  console.log('(e) errors / not-ready-while-playing:', JSON.stringify(e));
  console.log('page errors:', JSON.stringify(errors), 'failedRequests:', JSON.stringify(failedRequests));
  return a < 0 || c < 0 || !d || e.length ? 1 : 0;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'live-check-'));
  let chrome, cdp;
  const errors = [], failedRequests = [], steps = [];
  const summary = { url: URL_, ready: false, errors, failedRequests, steps, audioReady: false, lightAtEnd: 0 };
  let zoneLog = [], audioSeries = null;
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

    // The site's chants are detached `new Audio()` objects, so record every instance created (audio mode only).
    if (AUDIO) await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const A = window.Audio; window.__testAudios = []; window.Audio = function (...a) { const e = new A(...a); window.__testAudios.push(e); return e; }; window.Audio.prototype = A.prototype; })()` });
    await cdp.send('Page.navigate', { url: URL_ });
    for (let i = 0; i < 150 && !summary.ready; i++) { await sleep(200); try { summary.ready = (await ev('window.__ready === true')) === true; } catch {} }
    if (summary.ready) {
      await ev(`(() => { const b = document.querySelector('[data-begin]'); if (b) b.click(); })()`);
      await sleep(500);
      let n = 0;
      if (AUDIO) audioSeries = await collectAudio(ev);
      for (const pct of AUDIO ? [] : [0, 25, 50, 75, 100]) {
        await ev(`window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * ${pct / 100}))`);
        await sleep(1200);
        const s = await ev(`({ scrollY: Math.round(scrollY), light: window.__light, zone: window.__audioZone, log: window.__audioZoneLog || [] })`);
        zoneLog = s.log;
        steps.push({ pct, scrollY: s.scrollY, light: s.light, zone: s.zone });
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(outDir, String(n++).padStart(2, '0') + '.png'), Buffer.from(data, 'base64'));
      }
      if (!AUDIO) summary.audioReady = await ev(`(() => { const a = (window.__testAudios || []); return a.length >= 2 && a.every((x) => x.readyState >= 2 && !!x.currentSrc); })()`);
      if (!AUDIO) summary.lightAtEnd = steps[steps.length - 1].light;
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
  if (AUDIO) process.exit(reportAudio(audioSeries, summary, errors, failedRequests));
  const zonesOk = zoneLog.includes('lamb') && zoneLog.includes('icon');
  summary.zoneLog = zoneLog;
  console.log(JSON.stringify(summary, null, 2));
  process.exit(!summary.ready || errors.length || failedRequests.length || !(summary.lightAtEnd >= 0.99) || !zonesOk ? 1 : 0);
}

main();
