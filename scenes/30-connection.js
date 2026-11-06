/* THE EIGHT CONNECTIONS. One 100vh .conn per connection, each with its own pin; the pins abut (class abut). See README.md. */
window.SCENES = window.SCENES || [];
(function () {
  var IMG = {
    lamb: { src: 'assets/img/zurbaran-prado-2952.jpg', w: 2952, h: 1750, alt: 'Zurbarán’s Lamb of God: a bound white lamb on a stone ledge against black.' },
    icon: { src: 'assets/img/icon-600.jpg', w: 600, h: 828, alt: 'The Greek icon Extreme Humility: Christ crowned with thorns on a gold ground.' }
  };
  var CAP = 2.8; // the icon is 600px wide: never magnify a detail past about 2.8x its natural pixels (lite: LITE_CAP)
  var LITE_CAP = 2, LITE_MAXW = 640; // lite at desktop width must not stretch the scan across the column
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var px = function (which, crop) { return { w: crop.w / 100 * IMG[which].w, h: crop.h / 100 * IMG[which].h }; };

  // Frame aspect = crop aspect (lamb). The low-res icon blends toward the zoom target's aspect so the cap leaves a usable size.
  function geom(which, p) {
    var c = px(which, p.crop), z = px(which, p.zoomTo), arC = c.w / c.h, arZ = z.w / z.h;
    var ar = which === 'icon' ? Math.sqrt(arC * arZ) : arC;
    var maxW = which === 'icon' ? Math.min(CAP * z.w, CAP * z.h * ar) : 99999;
    return { ar: ar, arz: arZ, maxh: Math.round(maxW / ar), lw: liteW(which, z) };
  }
  function liteW(which, z) { return which === 'icon' ? Math.min(LITE_MAXW, Math.round(LITE_CAP * z.w)) : 960; }
  // Desktop: the icon frame is at least 34vw (CSS), so a small zoom target would pass CAP. Widen it around its own centre
  // until the scan is shown at no more than CAP x: the zoom gets gentler, the picture stays the hero.
  function capped(which, c, fr) {
    if (which !== 'icon' || !fr.offsetWidth) return c;
    var N = IMG.icon, s = Math.max(fr.offsetWidth / (c.w / 100 * N.w), fr.offsetHeight / (c.h / 100 * N.h));
    if (s <= CAP) return c;
    var k = s / CAP, w = Math.min(100, c.w * k), h = Math.min(100, c.h * k);
    var cl = function (v, m) { return Math.max(0, Math.min(m, v)); };
    return { x: cl(c.x + c.w / 2 - w / 2, 100 - w), y: cl(c.y + c.h / 2 - h / 2, 100 - h), w: w, h: h };
  }
  function frame(which, g) {
    var i = IMG[which];
    return '<div class="frame" style="--ar:' + g.ar.toFixed(4) + ';--arz:' + g.arz.toFixed(4) + ';--maxh:' + g.maxh + 'px;--lw:' + (g.lw || 960) + 'px"><img class="art" src="' + i.src + '" width="' + i.w + '" height="' + i.h + '" alt="' + esc(i.alt) + '"></div>';
  }
  function panel(c, which, side, isB) {
    var p = c[which], q = p.quote;
    return '<div class="cpanel pic-' + side + (isB ? ' cp-b' : '') + '" data-which="' + which + '" data-swap-panel>' +
      '<div class="pslot">' + frame(which, geom(which, p)) + '</div>' +
      '<div class="ctxt">' + p.lines.map(function (l) { return '<p class="lede reveal">' + esc(l) + '</p>'; }).join('') +
      (q ? '<blockquote class="quote reveal">' + esc(q.text) + '<cite>' + esc(q.cite) + '</cite></blockquote>' : '') + '</div></div>';
  }
  function pairFrame(which, p) {
    var z = px(which, p.zoomTo), ar = z.w / z.h;
    return frame(which, { ar: ar, arz: ar, maxh: 99999, lw: liteW(which, z) });
  }

  window.SCENES.push({
    id: 'connection', order: 30,
    html(C) {
      return '<section class="scene scene-connection abut" id="scene-connection">' + C.connections.map(function (c, i) {
        var first = c.first, second = first === 'lamb' ? 'icon' : 'lamb', sideA = i % 2 === 0 ? 'left' : 'right', sideB = sideA === 'left' ? 'right' : 'left';
        var pair = c.dawn ? '<div class="cpair"><div class="pairrow">' + pairFrame('lamb', c.lamb) + pairFrame('icon', c.icon) + '</div>' +
          '<div class="finale is-day"><p class="lede">' + esc(c.finale.caption) + '</p><p class="caption">' + esc(c.finale.cite) + '</p></div></div>' : '';
        return '<div class="conn' + (i ? ' abut' : '') + (c.day ? ' is-day' : '') + '" id="conn-' + c.id + '" data-zone="' + c.zone + '" data-swap-group>' +
          '<div class="ctitle"><p class="kicker">Connection ' + esc(c.numeral) + '</p><h2 class="display' + (c.title.length > 24 ? ' long' : '') + '">' + esc(c.title) + '</h2><p class="lede">' + esc(c.blurb) + '</p></div>' +
          panel(c, first, sideA, false) + panel(c, second, sideB, true) + pair + '</div>';
      }).join('') + '</section>';
    },
    init(el, { kit, C }) {
      var conns = Array.prototype.slice.call(el.querySelectorAll('.conn'));
      var setup = function (fn) { conns.forEach(function (n, i) { fn(n, C.connections[i], i); }); };

      kit.media(el, {
        full() {
          setup(function (n, c) {
            var first = c.first, second = first === 'lamb' ? 'icon' : 'lamb', dawn = !!c.dawn;
            var P = n.querySelectorAll('.cpanel'), A = P[0], B = P[1], card = n.querySelector('.ctitle');
            // pacing in screens: a line holds 0.2 + chars/2400 (full-bright ~0.33-0.38), a quotation 0.5 + chars/700
            var w = function (p) { return p.lines.map(function (l) { return 0.2 + l.length / 2400; }).concat(p.quote ? [0.5 + p.quote.text.length / 700] : []); };
            var len = function (p) { return 0.15 + w(p).reduce(function (a, b) { return a + b; }, 0); };
            var SW = 0.3, EX = 0.2, tA = 0.8;
            var LA = len(c[first]), swapAt = tA + LA, tB = swapAt + 0.55 * SW, LB = len(c[second]), endB = tB + LB;
            // VII: the text ends in the dark, then the light floods (FL) over the pair, the caption lands in full light and holds
            var FL = 1.5, GAP = 0.15, HOLD = 1.0, OUT = 0.3;
            var tF = endB + EX + GAP, tC = tF + FL + 0.05, S = dawn ? tC + 0.15 + HOLD + OUT : endB + EX;
            window.__connS = (window.__connS || {}); window.__connS[c.id] = +S.toFixed(2);
            var f = function (s) { return s / S; };
            var tl = kit.pin(n, { screens: S });

            // title card: rises in, holds, rises out; gone before A's picture starts (the card is centred, over the picture slot)
            kit.fadeIn(tl, card, { at: 0, dur: f(0.22), y: 30 });
            tl.to(card, { autoAlpha: 0, y: -26, duration: f(0.2) }, f(tA - 0.3));

            // own reveal: weighted slots, previous line dims only once the next has been up a while
            function reveal(ctxt, t0, ws) {
              var kids = ctxt.querySelectorAll('.reveal'), t = t0;
              kids.forEach(function (k, i) {
                tl.fromTo(k, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: f(0.18) }, f(t));
                if (i > 0) tl.to(kids[i - 1], { opacity: 0.38, duration: f(0.15) }, f(t + 0.3));
                t += ws[i];
              });
            }
            function run(Pn, which, t0, L) {
              var p = c[which], fr = Pn.querySelector('.frame'), img = fr.querySelector('img');
              kit.frame(img, p.crop);
              kit.grow(tl, fr, { from: 0.86, to: 1, at: f(t0), dur: f(L - 0.1) });
              kit.zoom(tl, img, p.crop, capped(which, p.zoomTo, fr), { at: f(t0 + 0.15), dur: f(L - 0.25) });
              reveal(Pn.querySelector('.ctxt'), t0 + 0.15, w(p));
            }
            // A's picture starts the instant the card is gone (tA-0.1): no blank beat, and no card text over the picture
            tl.fromTo(A.querySelector('.pslot'), { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.25) }, f(tA - 0.1));
            run(A, first, tA, LA);
            kit.swap(tl, A, B, { fromSide: B.classList.contains('pic-left') ? 'left' : 'right', at: f(swapAt), dur: f(SW) });
            run(B, second, tB, LB);
            if (!dawn) kit.fade(tl, B, { at: f(endB), dur: f(EX) });

            if (dawn) {
              var row = n.querySelector('.pairrow'), fin = n.querySelector('.finale'), fr = row.querySelectorAll('.frame');
              kit.frame(fr[0].querySelector('img'), c.lamb.zoomTo); kit.frame(fr[1].querySelector('img'), c.icon.zoomTo);
              // No dim ghost before the light: B's text leaves, B's picture glides onto its twin in the pair (same zoomTo crop, so the
              // same scan scale once heights match) while the other picture fades in beside it, then the twins swap invisibly.
              var tP = endB + 0.15, tM = endB + 0.3, gDur = tC + 0.15 + HOLD - tP, sP = 0.9 + 0.1 * (tM - tP) / gDur;
              var fb = B.querySelector('.frame'), mate = fr[second === 'lamb' ? 0 : 1], other = fr[second === 'lamb' ? 1 : 0];
              var mid = function (el) { var x = el.offsetWidth / 2, y = el.offsetHeight / 2; for (var e = el; e && e !== n; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return { x: x, y: y }; };
              kit.fade(tl, B.querySelector('.ctxt'), { at: f(endB), dur: f(0.15) });
              tl.to(fb, { x: function () { return mid(mate).x - mid(fb).x; }, y: function () { return mid(mate).y - mid(fb).y; },
                scale: function () { return sP * mate.offsetHeight / fb.offsetHeight; }, duration: f(tM - endB - 0.05), ease: 'power2.inOut' }, f(endB + 0.05));
              tl.fromTo(row, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.01) }, f(tP));
              tl.fromTo(other, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.2) }, f(tP)); // after B's text is gone (same side)
              tl.fromTo(mate, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.04) }, f(tM));
              kit.fade(tl, B, { at: f(tM + 0.04), dur: f(0.01) });
              kit.grow(tl, fr, { from: 0.9, to: 1, at: f(tP), dur: f(gDur) });
              tl.fromTo(fin, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: f(0.15) }, f(tC));
              tl.to([row, fin], { autoAlpha: 0, duration: f(OUT) }, f(S - OUT)); // VIII abuts: leave the cream page empty
              // glow (light <= .06) until tF, flood tF..tF+FL, then light 1 for the rest of the page
              kit.dawn(tl, { glowUntil: tF / (tF + FL), glow: 0.06, end: (tF + FL) / S });
            }
          });
        },
        lite() {
          setup(function (n, c) {
            n.querySelectorAll('.cpanel').forEach(function (p) { kit.frame(p.querySelector('img'), c[p.dataset.which].zoomTo); });
            if (c.dawn) { var im = n.querySelectorAll('.pairrow img'); kit.frame(im[0], c.lamb.zoomTo); kit.frame(im[1], c.icon.zoomTo); }
          });
        }
      });
    }
  });
})();
