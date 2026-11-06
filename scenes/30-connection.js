/* THE EIGHT CONNECTIONS. One 100vh .conn per connection, each with its own pin; the pins abut (class abut). See README.md.
   Every connection plays the same film: title card, picture A with its text, the swap to picture B on the other side with its
   text, then the takeaway card. Content `style` picks how the pictures come and go and how the text is set (STYLES). */
window.SCENES = window.SCENES || [];
(function () {
  var IMG = {
    lamb: { src: 'assets/img/zurbaran-prado-2952.jpg', w: 2952, h: 1750, alt: 'Zurbarán’s Lamb of God: a bound white lamb on a stone ledge against black.' },
    icon: { src: 'assets/img/icon-600.jpg', w: 600, h: 828, alt: 'The Greek icon Extreme Humility: Christ crowned with thorns on a gold ground.' }
  };
  var CAP = 2.8; // the icon is 600px wide: never magnify a detail past about 2.8x its natural pixels (lite: LITE_CAP)
  var LITE_CAP = 1.5, LITE_MAXW = 640; // lite: the frame is never wider than 1.5x the scan's pixels (phones would otherwise show 2x JPEG blocks)
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var px = function (which, crop) { return { w: crop.w / 100 * IMG[which].w, h: crop.h / 100 * IMG[which].h }; };

  // Per-style parameters of the one come-and-go. from/to: where a picture enters from and leaves to, as fractions of the
  // viewport (x is signed outward, toward the picture's own edge). IN/OUT: entrance/exit length in screens. ar: frame aspect.
  // grow: the frame's starting scale. slow: zoom through the whole time the picture is up. reverse: zoom zoomTo -> crop.
  var STYLES = {
    rise: { ar: function (a) { return Math.max(a, 4 / 3); }, from: { y: 0.2 }, to: { y: 0.2 }, IN: 0.35, OUT: 0.25 },
    'quote-first': { ar: function () { return 4 / 3; }, quoteFirst: true },
    portrait: { ar: function () { return 0.8; }, grow: 0.72, IN: 0.35, slow: true },
    timeline: { from: { x: 0.4 }, to: { x: 0.4 }, IN: 0.4, OUT: 0.28 },
    banner: { from: { y: -0.24 }, to: { y: -0.24 }, IN: 0.35, OUT: 0.25, ide: true },
    'pull-back': { reverse: true, grow: 0.94 }, // a gentle grow, or it would cancel the pull-back
    dawn: { dawn: true },
    crossing: { crossing: true }
  };

  // Frame aspect = crop aspect (lamb). The low-res icon blends toward the zoom target's aspect so the cap leaves a usable size.
  function geom(which, p, st) {
    var c = px(which, p.crop), z = px(which, p.zoomTo), arC = c.w / c.h, arZ = z.w / z.h;
    var ar = which === 'icon' ? Math.sqrt(arC * arZ) : arC;
    if (st.ar) ar = st.ar(ar);
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
  var ref = function (s) { var m = /\(([^()]+)\)\s*$/.exec(s); return m ? m[1] : ''; }; // "… (Genesis 22:13)" -> "Genesis 22:13"
  function panel(c, which, side, isB) {
    var p = c[which], q = p.quote, s = c.style, tline = s === 'timeline';
    var kick = function (r) { return r ? '<span class="kicker tref">' + esc(r) + '</span>' : ''; };
    // quote-first: a last line ending in ":" introduces the quotation, so it is set above it (class lead)
    var line = function (l, i) {
      var lead = s === 'quote-first' && q && i === p.lines.length - 1 && /:$/.test(l);
      return '<p class="lede reveal' + (tline ? ' trow' + (ref(l) ? '' : ' noref') : '') + (lead ? ' lead' : '') + '" data-l="' + l.length + '">' + (tline ? kick(ref(l)) : '') + esc(l) + '</p>';
    };
    var deco = s === 'pull-back' ? '<span class="rule deco"></span>' : '';
    // timeline / pull-back: the reference moves up into the kicker ("Isaiah 52:13 (KJV)"), the speaker stays beneath, nothing
    // said twice. The cite keeps the whole text (lite shows it; the film hides the moved part, .cref)
    var kq = q && (tline || s === 'pull-back'), dot = q ? q.cite.indexOf(' · ') : -1;
    var qk = kq ? (dot < 0 ? q.cite : q.cite.slice(0, dot)) : '';
    var qc = !q ? '' : !kq ? '<cite>' + esc(q.cite) + '</cite>' : dot < 0 ? '<cite class="cref-only"><span class="cref">' + esc(q.cite) + '</span></cite>' :
      '<cite><span class="cref">' + esc(q.cite.slice(0, dot + 3)) + '</span>' + esc(q.cite.slice(dot + 3)) + '</cite>';
    return '<div class="cpanel pic-' + side + (isB ? ' cp-b' : '') + '" data-which="' + which + '"' + (s === 'crossing' ? '' : ' data-swap-panel') + '>' +
      '<div class="pslot">' + frame(which, geom(which, p, STYLES[s])) + '</div>' +
      '<div class="ctxt">' + deco + p.lines.map(line).join('') +
      (q ? '<blockquote class="quote reveal' + (tline ? ' trow' : '') + (s === 'quote-first' ? ' keep' : '') + '" data-l="' + q.text.length + '">' +
        kick(qk) + esc(q.text) + qc + '</blockquote>' : '') + deco + '</div></div>';
  }
  // takeaway thumbnails: one 4:3 frame for both paintings, showing the zoomTo detail with room around it (a detail too
  // big for the box keeps its top: the icon's head)
  var TH_AR = 4 / 3;
  function thumbCrop(which, z) {
    var N = IMG[which], zw = z.w / 100 * N.w, zh = z.h / 100 * N.h, cx = z.x / 100 * N.w + zw / 2, cy = z.y / 100 * N.h + zh / 2;
    var w = Math.max(zw, zh * TH_AR) * 1.4, h = w / TH_AR, k = Math.min(1, N.w / w, N.h / h); w *= k; h *= k;
    var cl = function (v, m) { return Math.max(0, Math.min(m, v)); }, y = h < zh ? z.y / 100 * N.h : cy - h / 2;
    return { x: cl(cx - w / 2, N.w - w) / N.w * 100, y: cl(y, N.h - h) / N.h * 100, w: w / N.w * 100, h: h / N.h * 100 };
  }
  function pairFrame(which, p) {
    var z = px(which, p.zoomTo), ar = z.w / z.h;
    return frame(which, { ar: ar, arz: ar, maxh: 99999, lw: liteW(which, z) });
  }
  // Reading time in screens: every item is full-bright for at least `read` (a line 0.33 + chars/2400, a quotation
  // 0.5 + chars/700). An item fades in over FI and dims 0.3 after the next one lands, so a line is followed after
  // read - (0.3 - FI); the LAST item of a panel holds FI + read before the panel leaves.
  var FI = 0.18;
  function weights(els) {
    return els.map(function (k, i) {
      var L = +k.dataset.l, q = k.tagName === 'BLOCKQUOTE', read = q ? 0.5 + L / 700 : 0.33 + L / 2400;
      return i < els.length - 1 ? (q ? read : read - (0.3 - FI)) : FI + read;
    });
  }
  var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  var TIN = 0.2, THOLD = 0.8, TOUT = 0.15; // takeaway: in, hold, out (screens)

  window.SCENES.push({
    id: 'connection', order: 30,
    html(C) {
      return '<section class="scene scene-connection abut" id="scene-connection">' + C.connections.map(function (c, i) {
        var first = c.first, second = first === 'lamb' ? 'icon' : 'lamb', sideA = i % 2 === 0 ? 'left' : 'right', sideB = sideA === 'left' ? 'right' : 'left';
        var pair = c.dawn ? '<div class="cpair"><div class="pairrow">' + pairFrame('lamb', c.lamb) + pairFrame('icon', c.icon) + '</div>' +
          '<div class="finale is-day"><p class="lede">' + esc(c.finale.caption) + '</p><p class="caption">' + esc(c.finale.cite) + '</p></div></div>' : '';
        var ide = STYLES[c.style].ide ? '<div class="ide"><span class="rule"></span><p class="greek display">Ἴδε</p><span class="rule"></span></div>' : '';
        var thumb = function (which, side) { return '<div class="th th-' + side + '">' + frame(which, { ar: TH_AR, arz: TH_AR, maxh: 99999 }) + '</div>'; };
        var take = '<div class="ctake' + (c.dawn ? ' is-day' : '') + '"><div class="ccard"><p class="kicker">Takeaway</p><p class="lede">' + esc(c.takeaway.text) +
          '</p><p class="caption">' + esc(c.takeaway.cite) + '</p></div>' + thumb(first, sideA) + thumb(second, sideB) + '</div>';
        return '<div class="conn st-' + c.style + (i ? ' abut' : '') + (c.day ? ' is-day' : '') + '" id="conn-' + c.id + '" data-zone="' + c.zone + '"' + (c.style === 'crossing' ? '' : ' data-swap-group') + '>' +
          '<div class="ctitle"><p class="kicker">Connection ' + esc(c.numeral) + '</p><h2 class="display' + (c.title.length > 24 ? ' long' : '') + '">' + esc(c.title) + '</h2><p class="lede">' + esc(c.blurb) + '</p></div>' +
          panel(c, first, sideA, false) + panel(c, second, sideB, true) + pair + ide + take + '</div>';
      }).join('') + '</section>';
    },
    init(el, { kit, C }) {
      var conns = Array.prototype.slice.call(el.querySelectorAll('.conn'));
      var setup = function (fn) { conns.forEach(function (n, i) { fn(n, C.connections[i], i); }); };

      kit.media(el, {
        full() {
          setup(function (n, c) {
            var st = STYLES[c.style], first = c.first, second = first === 'lamb' ? 'icon' : 'lamb', dawn = !!st.dawn;
            var P = n.querySelectorAll('.cpanel'), A = P[0], B = P[1], card = n.querySelector('.ctitle'), take = n.querySelector('.ctake');
            var q = function (Pn, s) { return Pn.querySelector(s); }, sa = q(A, '.pslot'), sb = q(B, '.pslot');
            var sA = A.classList.contains('pic-left') ? -1 : 1, sB = -sA; // each picture's outward direction
            var items = function (Pn) {
              var r = Array.prototype.slice.call(Pn.querySelectorAll('.ctxt .reveal')), isQ = function (k) { return k.tagName === 'BLOCKQUOTE'; };
              var isL = function (k) { return k.classList.contains('lead'); };
              return st.quoteFirst ? r.filter(isL).concat(r.filter(isQ), r.filter(function (k) { return !isQ(k) && !isL(k); })) : r;
            };
            var ra = items(A), rb = items(B), wa = weights(ra), wb = weights(rb);

            // ---- beats, in screens ----
            var IN = st.IN || 0.25, OUT = st.OUT || 0.2, SW = 0.3, DX = 1.0, tA = 0.8; // DX: the crossing's length
            var LA = 0.15 + sum(wa), swapAt = tA + LA, X0 = swapAt + 0.1;
            var tB = dawn ? swapAt + 0.55 * SW : st.crossing ? X0 + DX - 0.35 : swapAt + OUT;
            var LB = 0.15 + sum(wb), endB = tB + LB, tK, tI = 0;
            // VII: the text ends in the dark, then the light floods (FL) over the pair, the caption lands in full light and holds
            var FL = 1.5, GAP = 0.15, HOLD = 1.0, OUTP = 0.3, EX = 0.2;
            var tF = endB + EX + GAP, tC = tF + FL + 0.05;
            if (dawn) tK = tC + 0.15 + HOLD + OUTP;
            else { tK = endB + OUT; if (st.ide) { tI = tK; tK += 0.22 + 0.4 + 0.12; } }
            var S = tK + TIN + THOLD + TOUT;
            window.__connS = (window.__connS || {}); window.__connS[c.id] = +S.toFixed(2);
            window.__connBeats = (window.__connBeats || {});
            window.__connBeats[c.id] = { S: +S.toFixed(2), A: +(tA - 0.1).toFixed(2), swap: +swapAt.toFixed(2), B: +tB.toFixed(2), endB: +endB.toFixed(2), ide: tI ? +tI.toFixed(2) : null, flood: dawn ? +tF.toFixed(2) : null, takeaway: +tK.toFixed(2) };
            var f = function (s) { return s / S; };
            var tl = kit.pin(n, { screens: S });
            var W = function (k) { return function () { return k * innerWidth; }; }, H = function (k) { return function () { return k * innerHeight; }; };

            // title card: rises in, holds, rises out; gone before A's picture starts (the card is centred, over the picture slot)
            kit.fadeIn(tl, card, { at: 0, dur: f(0.22), y: 30 });
            tl.to(card, { autoAlpha: 0, y: -26, duration: f(0.2) }, f(tA - 0.3));

            // own reveal: weighted slots, previous item dims once the next has been up a while (a .keep item never dims)
            function reveal(els, t0, ws) {
              var t = t0;
              els.forEach(function (k, i) {
                tl.fromTo(k, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: f(FI) }, f(t));
                if (i > 0 && !els[i - 1].classList.contains('keep')) tl.to(els[i - 1], { opacity: 0.38, duration: f(0.15) }, f(t + 0.3));
                t += ws[i];
              });
            }
            function enter(slot, s, at) {
              var a = { autoAlpha: 0 }, b = { autoAlpha: 1, duration: f(IN), ease: 'power2.out' }, o = st.from || {};
              if (o.y) { a.y = H(o.y); b.y = 0; }
              if (o.x) { a.x = W(s * o.x); b.x = 0; }
              tl.fromTo(slot, a, b, f(at));
            }
            function leave(slot, s, at) {
              var b = { autoAlpha: 0, duration: f(OUT), ease: 'power2.in' }, o = st.to || {};
              if (o.y) b.y = H(o.y);
              if (o.x) b.x = W(s * o.x);
              tl.to(slot, b, f(at));
            }
            // one picture's stay: the frame grows, the picture zooms (crop -> zoomTo, or back), its text plays from t0 + 0.15
            function run(Pn, which, t0, tEnd, els, ws) {
              var p = c[which], fr = q(Pn, '.frame'), img = fr.querySelector('img');
              var a = capped(which, p.crop, fr), b = capped(which, p.zoomTo, fr), z0 = st.slow ? t0 - 0.1 : t0 + 0.15, z1 = st.slow ? tEnd + OUT : tEnd - 0.1;
              kit.grow(tl, fr, { from: st.grow || 0.86, to: 1, at: f(t0), dur: f((st.slow ? z1 : tEnd - 0.1) - t0) });
              kit.zoom(tl, img, st.reverse ? b : a, st.reverse ? a : b, { at: f(z0), dur: f(z1 - z0) });
              var deco = Pn.querySelectorAll('.deco');
              if (deco.length) tl.fromTo(deco, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.2) }, f(t0));
              reveal(els, t0 + 0.15, ws);
            }

            // A: its picture starts the instant the card is gone (tA-0.1): no blank beat, and no card text over the picture
            enter(sa, sA, tA - 0.1);
            run(A, first, tA, swapAt, ra, wa);
            if (dawn) {
              kit.swap(tl, A, B, { fromSide: B.classList.contains('pic-left') ? 'left' : 'right', at: f(swapAt), dur: f(SW) });
            } else if (st.crossing) {
              // A's text leaves, then the two pass in opposite directions: A slides out toward its own edge, dipping back and
              // fading behind, while B sweeps in from that same edge, in front, across the middle to its own side. B is opaque
              // from the start (it enters from off-screen), so there is never a half-faded dark box on the cream page.
              kit.fade(tl, q(A, '.ctxt'), { at: f(swapAt), dur: f(0.15) });
              tl.to(sa, { x: W(sA * 0.45), scale: 0.85, duration: f(0.6), ease: 'power1.in' }, f(X0));
              tl.to(sa, { autoAlpha: 0, duration: f(0.4) }, f(X0 + 0.15));
              tl.fromTo(sb, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.01) }, f(X0));
              tl.fromTo(sb, { x: W(sA * 0.98) }, { x: 0, duration: f(DX), ease: 'power1.inOut' }, f(X0));
            } else {
              // A leaves (its text with it), then B's panel takes over and its picture comes in on the other side
              kit.fade(tl, q(A, '.ctxt'), { at: f(swapAt), dur: f(0.15) });
              leave(sa, sA, swapAt);
              tl.to(A, { autoAlpha: 0, duration: f(0.01) }, f(tB - 0.01));
              tl.fromTo(B, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.01) }, f(tB));
              enter(sb, sB, tB);
            }
            run(B, second, tB, endB, rb, wb);

            if (dawn) {
              var row = n.querySelector('.pairrow'), fin = n.querySelector('.finale'), fr = row.querySelectorAll('.frame');
              kit.frame(fr[0].querySelector('img'), c.lamb.zoomTo); kit.frame(fr[1].querySelector('img'), c.icon.zoomTo);
              // No dim ghost before the light: B's text leaves, B's picture glides onto its twin in the pair (same zoomTo crop, so the
              // same scan scale once heights match) while the other picture fades in beside it, then the twins swap invisibly.
              var tP = endB + 0.15, tM = endB + 0.3, gDur = tC + 0.15 + HOLD - tP, sP = 0.9 + 0.1 * (tM - tP) / gDur;
              var fb = q(B, '.frame'), mate = fr[second === 'lamb' ? 0 : 1], other = fr[second === 'lamb' ? 1 : 0];
              var mid = function (el) { var x = el.offsetWidth / 2, y = el.offsetHeight / 2; for (var e = el; e && e !== n; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return { x: x, y: y }; };
              kit.fade(tl, q(B, '.ctxt'), { at: f(endB), dur: f(0.15) });
              tl.to(fb, { x: function () { return mid(mate).x - mid(fb).x; }, y: function () { return mid(mate).y - mid(fb).y; },
                scale: function () { return sP * mate.offsetHeight / fb.offsetHeight; }, duration: f(tM - endB - 0.05), ease: 'power2.inOut' }, f(endB + 0.05));
              tl.fromTo(row, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.01) }, f(tP));
              tl.fromTo(other, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.2) }, f(tP)); // after B's text is gone (same side)
              tl.fromTo(mate, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(0.04) }, f(tM));
              kit.fade(tl, B, { at: f(tM + 0.04), dur: f(0.01) });
              kit.grow(tl, fr, { from: 0.9, to: 1, at: f(tP), dur: f(gDur) });
              tl.fromTo(fin, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: f(0.15) }, f(tC));
              tl.to([row, fin], { autoAlpha: 0, duration: f(OUTP) }, f(tK - OUTP));
              // glow (light <= .06) until tF, flood tF..tF+FL, then light 1 for the rest of the page
              kit.dawn(tl, { glowUntil: tF / (tF + FL), glow: 0.06, end: (tF + FL) / S });
            } else {
              kit.fade(tl, q(B, '.ctxt'), { at: f(endB), dur: f(0.15) });
              leave(sb, sB, endB);
              if (tI) { // V: "Ἴδε" rises alone between its hairlines, holds, and goes before the takeaway
                var ide = n.querySelector('.ide');
                tl.fromTo(ide, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: f(0.22), ease: 'power2.out' }, f(tI));
                tl.to(ide, { autoAlpha: 0, duration: f(0.12) }, f(tI + 0.62));
              }
            }

            // the takeaway: the paintings, small at the lower corners, fade in with the card; it holds, then all of it goes
            n.querySelectorAll('.th img').forEach(function (im, k) { var w = k ? second : first; kit.frame(im, thumbCrop(w, c[w].zoomTo)); });
            tl.fromTo(take, { autoAlpha: 0 }, { autoAlpha: 1, duration: f(TIN) }, f(tK));
            tl.fromTo(q(take, '.ccard'), { y: 16 }, { y: 0, duration: f(TIN), ease: 'power2.out' }, f(tK));
            tl.to(take, { autoAlpha: 0, duration: f(TOUT) }, f(tK + TIN + THOLD));
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
