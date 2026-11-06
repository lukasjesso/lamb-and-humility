/* Starfield (canvas#sky) + dawn (#dawn). window.sky = { setLight, light }. */
(function () {
  var cv = document.getElementById('sky'), dawn = document.getElementById('dawn');
  var ctx = cv && cv.getContext('2d');
  var root = document.documentElement;
  var light = 0, stars = [], nStars = 0, W = 0, H = 0, dpr = 1, raf = 0, frame = 0, rt = 0;
  var cols = [[223, 230, 245], [243, 227, 192]];

  function hex(v, fb) {
    v = (v || '').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return fb;
    var n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    var cs = getComputedStyle(root);
    cols = [hex(cs.getPropertyValue('--star'), cols[0]), hex(cs.getPropertyValue('--star-warm'), cols[1])];
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeStars() { // generated once (max count); resize only changes how many are drawn
    var rnd = mulberry32(19);
    stars = [];
    for (var i = 0; i < 520; i++) {
      var u = rnd();
      stars.push({
        x: rnd(), y: rnd(), r: 0.5 + 0.8 * u * u * u,
        a: 0.18 + 0.44 * rnd(), sp: 0.15 + 0.45 * rnd(), ph: rnd() * Math.PI * 2,
        c: rnd() < 0.06 ? 1 : 0
      });
    }
  }
  function isStatic() { // sky.js loads before scene-kit, so test lite conditions directly too
    return root.classList.contains('is-lite') || /[?&]lite=1/.test(location.search) || innerWidth <= 760 ||
      matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function draw(t) {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (light >= 0.999) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var k = 1 - light, TAU = Math.PI * 2;
    for (var i = 0; i < nStars; i++) {
      var s = stars[i], c = cols[s.c];
      var a = s.a * (0.78 + 0.22 * Math.sin(TAU * s.sp * t + s.ph)) * k;
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
      ctx.fill();
    }
  }
  function tick(ms) {
    if (isStatic()) { raf = 0; draw(0); return; }
    raf = requestAnimationFrame(tick);
    if ((frame++ & 1) === 0) draw(ms / 1000);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function start() {
    stop();
    if (isStatic() || document.hidden || light >= 0.999) { draw(0); return; }
    raf = requestAnimationFrame(tick);
  }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    nStars = Math.min(520, Math.max(120, Math.round(350 * (W * H) / (1920 * 1080))));
    start();
  }
  function smooth(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  function setLight(t) {
    t = Math.min(1, Math.max(0, +t || 0));
    if (Math.abs(t - light) < 0.001) return;
    var was = light;
    light = t;
    if (dawn) {
      dawn.style.transform = 'scale(' + (0.08 + 0.92 * t) + ')';
      dawn.style.opacity = smooth(0.08, 0.35, t); // disc stays invisible during the pre-flood glow (html::after)
    }
    root.style.setProperty('--light', t);
    window.__light = t;
    root.classList.toggle('is-dawned', t > 0.999);
    if (isStatic()) draw(0);
    else if (was >= 0.999 || t >= 0.999) start();
  }

  window.__light = 0;
  if (cv) {
    readColors();
    makeStars();
    resize();
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }
  window.sky = { setLight: setLight, refresh: start, get light() { return light; } };
})();
