/* scene-kit: the contract scenes build on. window.kit. Pure helpers are exported for node tests. */
(function () {
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smoothstep(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  // crop in PERCENT of natural image; N natural {w,h}; B box {w,h} -> {x,y,scale} (apply with transform-origin 0 0).
  function coverTransform(crop, N, B) {
    var cx = crop.x / 100 * N.w, cy = crop.y / 100 * N.h, cw = crop.w / 100 * N.w, ch = crop.h / 100 * N.h;
    var s = Math.max(B.w / cw, B.h / ch);
    var tx = B.w / 2 - (cx + cw / 2) * s, ty = B.h / 2 - (cy + ch / 2) * s;
    return {
      x: clamp(tx, Math.min(0, B.w - N.w * s), 0),
      y: clamp(ty, Math.min(0, B.h - N.h * s), 0),
      scale: s
    };
  }
  function lerpCrop(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t };
  }
  function dawnCurve(p, glowUntil, glow) {
    if (glowUntil == null) glowUntil = 0.7;
    if (glow == null) glow = 0.06;
    if (!(p > 0)) return 0;
    if (p >= 1) return 1;
    if (p < glowUntil) return glow * (p / glowUntil);
    return glow + (1 - glow) * smoothstep((p - glowUntil) / (1 - glowUntil));
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { coverTransform: coverTransform, dawnCurve: dawnCurve, lerpCrop: lerpCrop };
  if (typeof window === 'undefined') return;

  var root = document.documentElement;
  // The pinned layouts need at least 1024x640. Lite is the exact complement, so a fractional width (zoom) can never fall between the two.
  var Q_FULL = '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';
  var Q_LITE = 'not all and ' + Q_FULL;
  var forced = /[?&]lite=1/.test(location.search);
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  function isLite() { return !hasGsap || forced || !matchMedia(Q_FULL).matches; }
  function syncClass() { root.classList.toggle('is-lite', isLite()); if (window.sky && sky.refresh) sky.refresh(); }
  syncClass();
  matchMedia(Q_LITE).addEventListener('change', syncClass);

  function natural(img) { return { w: img.naturalWidth || +img.getAttribute('width') || 1, h: img.naturalHeight || +img.getAttribute('height') || 1 }; }
  function put(el, v) {
    if (window.gsap) gsap.set(el, v);
    else { el.style.transformOrigin = '0 0'; el.style.width = v.width + 'px'; el.style.height = v.height + 'px'; el.style.transform = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + v.scale + ')'; }
  }
  function warnEnd(name, at, dur) { if (at + dur > 1 + 1e-6) console.warn('[kit] ' + name + ' ends after 1 (at+dur=' + (at + dur).toFixed(3) + ')'); }

  var kit = {};
  var dawnST = null;
  Object.defineProperty(kit, 'lite', { get: isLite, enumerable: true });
  kit.coverTransform = coverTransform; kit.dawnCurve = dawnCurve; kit.lerpCrop = lerpCrop;

  kit.frame = function (img, crop) {
    img._crop = crop;
    var f = img.parentElement;
    if (!img._box) img._box = { w: f.clientWidth, h: f.clientHeight };
    if (!img._box.w || !img._box.h) return;
    var N = natural(img), t = coverTransform(crop, N, img._box);
    put(img, { x: t.x, y: t.y, scale: t.scale, transformOrigin: '0 0', width: N.w, height: N.h });
  };

  kit.media = function (el, o) {
    if (!hasGsap) { if (o.lite) o.lite(); return null; }
    var mm = gsap.matchMedia();
    mm.add({ full: Q_FULL, lite: Q_LITE }, function (ctx) {
      if (forced || ctx.conditions.lite || !ctx.conditions.full) { if (o.lite) o.lite(); return; }
      var before = dawnST;
      root.classList.add('is-pinned'); // only now may .abut pull sections together (base.css)
      if (o.full) o.full();
      var own = dawnST !== before ? dawnST : null;
      // On revert (resize to lite / reduced motion) the dawn trigger dies: forget it and put the page back to night.
      return function () { root.classList.remove('is-pinned'); if (own && dawnST === own) { dawnST = null; if (window.sky) sky.setLight(0); } };
    });
    return mm;
  };

  if (!hasGsap) { // degraded kit: scenes only ever reach lite()
    ['pin', 'zoom', 'frameTween', 'grow', 'reveal', 'fade', 'fadeIn', 'swap', 'dawn', 'onRefresh'].forEach(function (k) { kit[k] = function () { return null; }; });
    window.kit = kit;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  kit.pin = function (el, o) {
    o = o || {};
    var screens = o.screens == null ? 3 : o.screens;
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: el, start: 'top top', end: function () { return '+=' + Math.round(innerHeight * screens); },
        pin: true, pinSpacing: o.pinSpacing !== false, scrub: o.scrub == null ? 0.6 : o.scrub,
        anticipatePin: 1, invalidateOnRefresh: true
      }
    });
    tl.to({}, { duration: 0 }, 1);
    return tl;
  };

  kit.zoom = function (tl, img, a, b, o) {
    o = o || {};
    var at = o.at || 0, dur = o.dur == null ? 1 : o.dur, proxy = { t: 0 };
    warnEnd('zoom', at, dur);
    kit.frame(img, a);
    tl.to(proxy, { t: 1, duration: dur, ease: o.ease || 'none', onUpdate: function () { kit.frame(img, lerpCrop(a, b, proxy.t)); } }, at);
    return tl;
  };
  kit.frameTween = kit.zoom;

  kit.grow = function (tl, frameEl, o) {
    o = o || {};
    var at = o.at || 0, dur = o.dur == null ? 1 : o.dur;
    warnEnd('grow', at, dur);
    tl.fromTo(frameEl, { scale: o.from == null ? 0.86 : o.from }, { scale: o.to == null ? 1 : o.to, duration: dur, ease: o.ease || 'none' }, at);
    return tl;
  };

  kit.reveal = function (tl, container, o) {
    o = o || {};
    var at = o.at || 0, dur = o.dur == null ? 1 : o.dur, y = o.y == null ? 24 : o.y;
    var kids = container.querySelectorAll(o.selector || '.reveal'), n = kids.length;
    if (!n) return tl;
    warnEnd('reveal', at, dur);
    var slot = dur / n;
    kids.forEach(function (c, i) {
      tl.fromTo(c, { autoAlpha: 0, y: y }, { autoAlpha: 1, y: 0, duration: 0.8 * slot }, at + i * slot);
      if (typeof o.dim === 'number' && i > 0) tl.to(kids[i - 1], { opacity: o.dim, duration: 0.2 * slot }, at + (i + 0.6) * slot);
    });
    return tl;
  };

  kit.fade = function (tl, els, o) {
    o = o || {};
    var at = o.at || 0, dur = o.dur == null ? 0.1 : o.dur;
    warnEnd('fade', at, dur);
    tl.to(els, { autoAlpha: o.to == null ? 0 : o.to, duration: dur }, at);
    return tl;
  };
  kit.fadeIn = function (tl, els, o) {
    o = o || {};
    var at = o.at || 0, dur = o.dur == null ? 0.1 : o.dur;
    warnEnd('fadeIn', at, dur);
    tl.fromTo(els, { autoAlpha: 0, y: o.y == null ? 16 : o.y }, { autoAlpha: 1, y: 0, duration: dur }, at);
    return tl;
  };

  kit.swap = function (tl, A, B, o) {
    o = o || {};
    var at = o.at || 0, dur = o.dur == null ? 0.2 : o.dur, d = o.distance == null ? 90 : o.distance;
    var sign = o.fromSide === 'left' ? -1 : 1;
    warnEnd('swap', at, dur);
    gsap.set(A, { autoAlpha: 1 });
    gsap.set(B, { autoAlpha: 0 });
    tl.to(A, { autoAlpha: 0, x: -sign * d * 0.35, duration: 0.45 * dur }, at);
    tl.fromTo(B, { autoAlpha: 0, x: sign * d }, { autoAlpha: 1, x: 0, duration: 0.45 * dur }, at + 0.55 * dur);
    return tl;
  };

  kit.dawn = function (tl, o) {
    o = o || {};
    var gu = o.glowUntil == null ? 0.7 : o.glowUntil, g = o.glow == null ? 0.06 : o.glow, to = o.end == null ? 1 : o.end;
    if (dawnST) { console.warn('[kit] dawn() called twice; replacing the first'); dawnST.kill(); }
    var apply = function (s) { sky.setLight(dawnCurve(s.progress, gu, g)); };
    dawnST = ScrollTrigger.create({
      start: function () { return tl.scrollTrigger.start; },
      end: function () { var st = tl.scrollTrigger; return st.start + (st.end - st.start) * to; }, // full light at `end` of the pin, held after
      refreshPriority: -10, onUpdate: apply, onRefresh: apply
    });
    sky.setLight(dawnCurve(dawnST.progress, gu, g));
    return dawnST;
  };
  Object.defineProperty(kit, 'dawnTrigger', { get: function () { return dawnST; } });

  kit.onRefresh = function (fn) { ScrollTrigger.addEventListener('refresh', fn); };

  function allImgs() { return document.querySelectorAll('.frame > img.art'); }
  ScrollTrigger.addEventListener('refreshInit', function () { allImgs().forEach(function (i) { i._box = null; }); });
  ScrollTrigger.addEventListener('refresh', function () { allImgs().forEach(function (i) { if (i._crop) kit.frame(i, i._crop); }); });
  addEventListener('resize', function () { allImgs().forEach(function (i) { i._box = null; }); });

  window.kit = kit;
})();
