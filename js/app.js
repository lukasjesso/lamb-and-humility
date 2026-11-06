/* Boot: mount scenes, wait for fonts + images, init scenes in DOM order, wire audio zones. */
(function () {
  var root = document.documentElement;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var C = window.CONTENT || {};
  var q = new URLSearchParams(location.search);

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  } else {
    console.warn('[app] GSAP failed to load; showing the static stack');
    root.classList.add('is-lite');
  }

  var only = (q.get('only') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var scenes = (window.SCENES || []).slice().sort(function (a, b) { return a.order - b.order; });
  scenes = only.length ? scenes.filter(function (s) { return only.indexOf(s.id) >= 0 || (s.with && only.indexOf(s.with) >= 0); }) : scenes.filter(function (s) { return !s.demo; });

  var app = document.getElementById('app');
  app.innerHTML = scenes.map(function (s) { return s.html(C); }).join('');
  scenes.forEach(function (s) {
    var el = document.getElementById('scene-' + s.id);
    if (!el || el.parentElement !== app || !el.matches('section.scene.scene-' + s.id)) console.error('[app] scene "' + s.id + '" html() must return exactly one <section class="scene scene-' + s.id + '" id="scene-' + s.id + '">');
  });

  function imgReady(img) {
    return new Promise(function (res) {
      var go = function () { (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(res); };
      if (img.complete) go();
      else { img.addEventListener('load', go, { once: true }); img.addEventListener('error', res, { once: true }); }
    });
  }
  function ready() {
    var imgs = Array.prototype.slice.call(app.querySelectorAll('img'));
    return Promise.all([document.fonts ? document.fonts.ready : null, Promise.all(imgs.map(imgReady))]);
  }
  function timeout(ms) { return new Promise(function (res) { setTimeout(function () { res('timeout'); }, ms); }); }

  function throttle(fn, ms) {
    var last = 0;
    return function () { var n = Date.now(); if (n - last >= ms) { last = n; fn(); } };
  }

  function boot() {
    var ctx = { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger, kit: window.kit, audio: window.audio, sky: window.sky, C: C };
    scenes.forEach(function (s) {
      try { s.init(document.getElementById('scene-' + s.id), ctx); }
      catch (e) { console.error('[app] init failed for scene "' + s.id + '"', e); }
    });
    if (hasGsap) {
      ScrollTrigger.refresh();
      ScrollTrigger.addEventListener('scrollEnd', audio.syncFromScroll);
      // whole-page range in scroll px: a body trigger resolves 'bottom bottom' to the first pin's end (the body holds every pin)
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: throttle(audio.syncFromScroll, 150) });
    } else {
      addEventListener('scroll', throttle(audio.syncFromScroll, 150), { passive: true });
    }
    audio.syncFromScroll();
    var h0 = document.body.scrollHeight;
    addEventListener('load', function () {
      if (hasGsap && document.body.scrollHeight !== h0) ScrollTrigger.refresh();
    });
    var onScroll = function () { root.classList.toggle('show-sound', scrollY > 0.4 * innerHeight); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    root.classList.add('is-ready');
    window.__ready = true;
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-begin]')) audio.begin();
  });

  Promise.race([ready(), timeout(12000)]).then(function (r) {
    if (r === 'timeout') console.warn('[app] gave up waiting for fonts/images after 12 s');
    boot();
  });
})();
