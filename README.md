# Surrendering to Achieve Victory

Live: https://lukasjesso.github.io/lamb-and-humility/

A scroll-driven comparison of Zurbarán's *Lamb of God* and the icon of *Extreme Humility*, built by Lukas Jesso with Claude Code for THEO 20262 (University of Notre Dame, Fall 2026).

---

# Surrendering to Achieve Victory — site foundation

A scroll-driven, cinematic one-pager: every scene pins to the screen and scroll position scrubs its animation (reversible).
A dark starfield sits behind the page; near the end light enters from the LEFT edge and floods the page to warm daylight.
Two chant recordings crossfade by position. The pinned layout needs a window of at least 1024x640 CSS px; anything narrower or shorter
(phones, tablets, a zoomed or small laptop window), `prefers-reduced-motion`, and `?lite=1` get a static stacked fallback ("lite").
If GSAP or the scene kit fails to load, `app.js` shows the same static stack (`is-lite`; `no-kit` when the kit is missing, and scenes are then not initialised).

Plain HTML/CSS/JS, no build, classic `<script>` tags. Only externals: Google Fonts and GSAP 3.15.1 (cdnjs).

## Run

```
cd site
python -m http.server 8080      # then open http://localhost:8080/   (opening index.html directly also works)
```

URL flags: `?only=landing,lamb` mounts only those scenes (demo scenes are mounted ONLY this way: `?only=demo,demo-dawn` (a scene may declare `with: "<id>"` to be mounted along with another));
`?lite=1` forces the static stacked fallback.

## Tests (run from `site/`)

```
node --test tests/*.test.js           # kit (coverTransform, dawnCurve) + content schema + "assets exist" (Node 24 needs the glob, not a bare tests/)
node tests/cdp-smoke.mjs --only=demo,demo-dawn --sizes=1440x900,390x844 --every=0.5 --pins --reverse --resize --allow-missing=assets/audio/ --out=tests/shots/demo
node tests/cdp-smoke.mjs --sizes=1920x1080,1366x768,1024x640 --every=0.5 --pins --reverse --resize --out=tests/shots/full   # the whole film (~15 min)
node tests/cdp-smoke.mjs --lite --sizes=907x459,1400x600,390x844,1440x900 --every=0.75 --out=tests/shots/full-lite
node tests/cdp-smoke.mjs --only=<your-scene-id> --sizes=1920x1080,1366x768,390x844 --every=0.5 --pins --reverse --out=tests/shots/<name>
```

Smoke flags: `--only --sizes --every=k (steps of k viewport heights) --pins --reverse --resize --lite --out --allow-missing=prefix,prefix`.
It starts its own server (port 0) and its own headless Chrome in a fresh temp profile (safe to run in parallel), exits 1 on any failure,
prints a JSON summary, and writes `<out>/index.html`, a filmstrip contact sheet to LOOK at. Asserts: zero errors / 4xx (except allowed prefixes),
no horizontal overflow (in lite: no element wider than the viewport, pictures inside a `.frame` excepted), pinned element stays at top 0 (+-2px) while pinned,
an active pinned section's laid-out content fits the viewport (its `scrollHeight` with the clip and the inline animation transforms lifted is <= innerHeight + 2), at most one `[data-swap-panel]` visible per `[data-swap-group]`,
no text (`.reveal, p, li, blockquote`) visible while 0.15 < light < 0.9 (unless `[data-flood-ok]`), light 0 before the dawn trigger and 1 after it, zones only none/lamb/icon,
and on the full page the lamb chant before the dawn trigger starts and never after it.

## Files

`index.html`, `css/tokens.css` (the only place colors/fonts live), `css/base.css` (reset + shared components), `js/sky.js`, `js/audio.js`,
`js/scene-kit.js`, `js/app.js` (boot), `content/*.js` (text, `window.CONTENT`), `scenes/NN-name.js|css`.

## Scene contract

```js
window.SCENES = window.SCENES || [];
window.SCENES.push({
  id: 'lamb', order: 10,                       // order sorts DOM order; ids are unique
  html(C) { return `<section class="scene scene-lamb" id="scene-lamb" data-zone="lamb"><div class="stage">...</div></section>`; },
  init(el, { gsap, ScrollTrigger, kit, audio, sky, C }) { /* build timelines inside kit.media full() */ }
});
```
`html()` returns exactly ONE `<section class="scene scene-<id>" id="scene-<id>">` (app.js console.errors otherwise). `C` is `window.CONTENT`.
`init` runs once per scene, in DOM order, after fonts and every `#app` image have loaded/decoded; an exception is logged and the page continues.
Optional scene field `with: "<id>"` mounts the scene whenever that other id is mounted via `?only=` (used by demo scenes).
`class="is-day"` on a section (or any element) makes ALL its text follow the page light: `color` and `--ink`/`--ink-dim` are mixed from night ink (`--light` 0) to dark ink (`--light` 1), so it is light ink while the sky is dark and dark ink once the page is daylight. Put it on the final connection and credits sections, not before. In lite there is no dawn (`--light` stays 0), so it stays light ink on the dark sky. Text with explicit colors is not affected.

### Kit (`window.kit`)

`at` and `dur` are fractions 0..1 of the pin timeline; keep `at + dur <= 1` (helpers `console.warn` otherwise).

| call | meaning |
|---|---|
| `kit.pin(el, {screens=3, scrub=0.6, pinSpacing=true})` | pinned, scrubbed GSAP timeline of duration exactly 1 (`defaults {ease:'none'}`); scroll length = `screens` viewport heights. `tl.scrollTrigger` is the trigger |
| `kit.frame(img, crop)` | cover-fit the crop (`{x,y,w,h}` in PERCENT of the natural image) into the img's parent `.frame`; the img is sized at natural px then scaled. The ONLY owner of an img's transform |
| `kit.zoom(tl, img, cropA, cropB, {at,dur,ease})` (alias `frameTween`) | animate the visible rectangle A to B in a straight line; renders A before its start and B after its end |
| `kit.grow(tl, frameEl, {from=.86,to=1,at,dur,ease})` | scales the `.frame` DIV (never the img): "the picture gets bigger" |
| `kit.reveal(tl, container, {selector='.reveal',at,dur,y=24,dim=null})` | n children appear in order, evenly spread; `dim:0.38` dims earlier ones as the next lands. Any n >= 1 |
| `kit.fade(tl, els, {to=0,at,dur})`, `kit.fadeIn(tl, els, {at,dur,y=16})` | autoAlpha helpers |
| `kit.swap(tl, A, B, {fromSide='right'\|'left',at,dur=0.2,distance=90})` | A fades out (first 45%), B slides in from `fromSide` (last 45%); never both visible. Panels need `data-swap-panel`, their common parent `data-swap-group` |
| `kit.dawn(tl, {glowUntil=.7, glow=.06, end=1})` | ONE global light trigger from `tl`'s start to `end` (fraction of its pin) — light 1 from there on, so a pin can hold in full light after the flood (a second call warns and replaces the first). Light is a pure function of scroll position, so jumps are safe. `glowUntil` is a fraction of that dawn range. `kit.dawnCurve(p, glowUntil, glow)` is the pure curve |
| `kit.dawnTrigger` (getter), `kit.coverTransform(crop, natural, box)`, `kit.lerpCrop(a, b, t)` | the active dawn ScrollTrigger (or null); pure helpers (unit-tested) |
| `kit.media(el, {full, lite})` | `full()` on `(min-width:1024px) and (min-height:640px) and (prefers-reduced-motion:no-preference)`; `lite()` on everything else (the exact complement, so a fractional zoomed width never falls between the two) or `?lite=1`. `html.is-pinned` is set while `full()` is live. GSAP reverts everything created inside on change |
| `kit.lite`, `kit.onRefresh(fn)` | boolean getter; callback on ScrollTrigger `refresh` |

**Abutting pins (`class="abut"`)**: a pinned section with class `abut` starts the moment the previous pin ends (`margin-top:-100vh` only under `html.is-pinned`,
copied by GSAP onto the pin spacer; without live pins the margin would stack every scene on one screen), so no empty screen scrolls by between scenes. Contract: the previous pin ENDS empty (everything faded) and this one
STARTS empty (everything hidden at progress 0). Every scene after the landing abuts: lamb, icon, the connection section and each `.conn` after the first, credits.
The lamb is the one exception to "starts empty": its first frame equals the landing's last, and the landing's own timeline shows it (`autoAlpha`) at progress 1
and hides itself, so the handoff is one atomic, scrub-synced swap.

Swap markup: panels are siblings inside ONE group element:
```html
<div class="stage" data-swap-group><div data-swap-panel>...A...</div><div data-swap-panel>...B...</div></div>
```
Call `kit.frame(img, crop)` inside `full()` / `lite()` (never at module load): the img must already be loaded, which `app.js` guarantees before `init`.
Dawn timing: light follows scroll instantly (no scrub), text tweens are scrubbed with lag, so all text must be gone by about 0.6 of the dawn pin and only return after about 0.95. If the window leaves `full` (resize below 1024x640 or reduced motion) the kit kills the dawn trigger and resets the light to 0 (night); re-entering `full` rebuilds it from the scroll position.

Example (pin + grow + zoom + reveal + swap):

```js
init(el, { kit }) {
  const A = el.querySelector('.panel-a'), B = el.querySelector('.panel-b');
  const img = A.querySelector('img.art'), full = { x:0, y:0, w:100, h:100 };
  kit.media(el, {
    full() {
      const tl = kit.pin(el, { screens: 4 });
      kit.frame(img, full);
      kit.grow(tl, A.querySelector('.frame'), { from: .86, to: 1, at: 0, dur: .3 });
      kit.zoom(tl, img, full, { x:52, y:60, w:30, h:36 }, { at: .3, dur: .3 });
      kit.reveal(tl, A.querySelector('.text'), { at: .05, dur: .55, dim: .38 });
      kit.swap(tl, A, B, { fromSide: 'right', at: .62, dur: .2 });
    },
    lite() { kit.frame(img, { x:52, y:60, w:30, h:36 }); }   // static state only
  });
}
```
See `scenes/90-demo.js` for a working one (including `kit.dawn`).

### Sky, light, audio

- `sky.setLight(t)` (0..1) fades the stars and grows `#dawn` from the left-edge midpoint; sets `--light`, `window.__light`, `html.is-dawned` at t > .999.
  Scenes normally never call it: only `kit.dawn` does. No scene paints its own page background.
- Audio zones come from `data-zone="lamb|icon|none"` on scene sections. `audio.syncFromScroll()` picks the LAST `[data-zone]` whose top is at or above the viewport top
  (pinned pages: measured on the section's pin spacer, whose top reaches 0 exactly at the pin start, never early under anticipatePin) or mid-viewport in lite, so pinned sections stay current and jumps work.
  It runs on a whole-page ScrollTrigger (`start:0, end:'max'`, throttled) and on `scrollEnd`; a scene that changes its own `data-zone` calls it itself (credits). Zones are story-based (lamb chant until the light enters, then icon). `[data-begin]` anywhere starts audio (landing's Begin button).
  Missing mp3s only `console.warn`; the zone stays silent. `#sound` (bottom-right) toggles mute and is shown once armed or scrolled past 40vh.

## Rules for scene authors

1. Own only your two scene files (`scenes/NN-name.js` and `.css`); prefix every CSS selector with `.scene-<id>`. Never edit base/tokens/kit/content. Needs go in your report.
2. No element is shared across scenes.
3. No `transform`, `filter`, `perspective`, `contain`, `will-change` or `overflow:hidden` on a pinned ancestor (`#app`, `main`, `body`, `html`). A pinned `.scene` clips
   itself (`html.is-pinned .scene{overflow:clip}`, base.css), so a scene can never spill into the abutting ones; a section that only holds pins (connection) sets `overflow:visible`.
   Lay out your full scene to fit 1024x640: the smoke test fails a pinned section whose content is taller than the viewport.
4. Build ALL timelines and ScrollTriggers inside `kit.media` `full()`; `lite()` sets static states only (e.g. `kit.frame(img, crop)`). Add your lite layout under `html.is-lite .scene-<id>`.
5. Keep `at + dur <= 1`.
6. Every `<img>` has `width`/`height` attributes and sits inside a `.frame` (`<img class="art">`); the frame's size is yours to set.
7. Text is short lines, not paragraphs. Use the shared components (`.kicker .display .title .lede .quote .caption .greek .facts-strip .rule .reveal`) and colors/fonts only from tokens; do not restyle them globally.
8. Put `data-zone` on your section. Use `[data-flood-ok]` on text that is meant to stay readable while light is rising (rare).
9. No scene paints its own page background (the sky is global). Colors only from `css/tokens.css`.
