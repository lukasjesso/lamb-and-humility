/* Lamb of God intro: one pinned scrubbed timeline (~8 screens, computed from the beats below). Contract: README.md. */
window.SCENES = window.SCENES || [];
(function () {
  var FULL = { x: 0, y: 0, w: 100, h: 100 };
  var DRIFT = { x: 2, y: 2, w: 96, h: 96 };  // the painting keeps moving through the history: a slow push-in
  // history: groups of up to 3 lines; the previous line dims LAG after the next arrives, so a line is full-bright
  // LINE_AT + LAG - REV = 0.34 screens, the group's last GLEN - FADE - 2 * LINE_AT - REV = 0.36
  var G0 = 1.73, GLEN = 1.3, LINE_AT = 0.36, LAG = 0.08, FADE = 0.12, REV = 0.1;
  var MOVE = 0.42;                                                      // the painting back to the centre
  var DP = 0.56, DTRAVEL = 0.13;                                        // details: period (caption full-bright 0.34), travel
  var OUT = 0.45;                                                       // after the last detail: zoom back 0.2, fade 0.3 from +0.15

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function figHtml(h, i, cls) {
    return '<figure class="' + cls + '" data-i="' + i + '"><div class="frame"><img class="art" src="' + esc(h.img.src) + '" width="1600" height="1000" alt="' + esc(h.img.alt) + '"></div>' +
      '<p class="caption">' + esc(h.img.credit) + '</p></figure>';
  }

  window.SCENES.push({
    id: 'lamb', order: 10,
    html(C) {
      var L = C.lamb, groups = [], i;
      for (i = 0; i < L.history.length; i += 3) groups.push(L.history.slice(i, i + 3).map(function (h, k) { return { h: h, i: i + k }; }));
      return '<section class="scene scene-lamb abut" id="scene-lamb" data-zone="lamb"><div class="stage">' +
        '<div class="frame main"><img class="art" src="' + esc(L.image.src) + '" width="' + L.image.width + '" height="' + L.image.height + '" alt="' + esc(L.image.alt) + '"></div>' +
        '<div class="scrim"></div>' +
        '<div class="head"><p class="kicker">' + esc(L.kicker) + '</p><h2 class="display">' + esc(L.heading) + '</h2><p class="lede sub">' + esc(L.subheading) + '</p></div>' +
        '<div class="facts-strip">' + L.facts.map(function (f) { return '<div class="fact"><span class="label">' + esc(f.label) + '</span><span class="value">' + esc(f.value) + '</span></div>'; }).join('') + '</div>' +
        '<div class="hist">' + groups.map(function (g) {
          return '<div class="grp">' + g.map(function (o) {
            return '<div class="item" data-i="' + o.i + '"><p class="lede line">' + esc(o.h.line) + '</p>' + (o.h.img ? figHtml(o.h, o.i, 'fig-lite') : '') + '</div>';
          }).join('') + '</div>';
        }).join('') + '</div>' +
        '<div class="figs">' + L.history.map(function (h, i) { return h.img ? figHtml(h, i, 'fig') : ''; }).join('') + '</div>' +
        '<div class="details">' + L.details.map(function (d) {
          return '<figure class="detail"><div class="frame"><img class="art" src="' + esc(L.image.src) + '" width="' + L.image.width + '" height="' + L.image.height + '" alt=""></div><p class="caption">' + esc(d.caption) + '</p></figure>';
        }).join('') + '</div>' +
        '</div></section>';
    },

    init(el, { gsap, kit, C }) {
      var L = C.lamb, q = function (s) { return el.querySelector(s); }, qa = function (s) { return Array.prototype.slice.call(el.querySelectorAll(s)); };

      // Supporting images may be missing: drop their figures (both copies) so the line still shows.
      qa('.fig, .fig-lite').forEach(function (f) {
        var im = f.querySelector('img');
        var ok = function () { f.style.setProperty('--ar', im.naturalWidth + '/' + im.naturalHeight); };
        if (im.complete && !im.naturalWidth) f.remove();
        else if (im.naturalWidth) ok();
        else { im.addEventListener('load', ok); im.addEventListener('error', function () { f.remove(); }); }
      });

      var mainFrame = q('.main'), mainImg = mainFrame.querySelector('img.art');
      var head = q('.head'), heading = q('.head .display'), sub = q('.head .sub'), scrim = q('.scrim');
      var facts = qa('.facts-strip .fact'), factsEl = q('.facts-strip');
      var groups = qa('.grp');
      var figs = {}; qa('.fig').forEach(function (f) { figs[f.dataset.i] = f; });
      var dets = qa('.detail');
      var headStart = function () { return innerHeight * 0.84 - head.offsetHeight; };

      kit.media(el, {
        full() {
          var hEnd = G0 + groups.length * GLEN, MV = hEnd - 0.02, D0 = MV + MOVE, dEnd = D0 + L.details.length * DP, SCREENS = dEnd + OUT;
          var S = function (x) { return x / SCREENS; }; // timeline times are written in screens
          var tl = kit.pin(el, { screens: SCREENS });
          kit.frame(mainImg, FULL);
          qa('.fig img').forEach(function (im) { kit.frame(im, FULL); });

          // Beat 1: opening. Scrim rises bottom-left, text fades up over it (head starts at the bottom).
          tl.fromTo(scrim, { autoAlpha: 0, yPercent: 18 }, { autoAlpha: 1, yPercent: 0, duration: S(0.35) }, 0);
          [q('.kicker'), heading, sub].forEach(function (n, i) { tl.fromTo(n, { autoAlpha: 0 }, { autoAlpha: 1, duration: S(0.26) }, S(0.05 + i * 0.12)); });

          // Beat 2: settle. The painting moves right first, then the heading follows up-left under the scrim.
          kit.grow(tl, mainFrame, { from: 1, to: 0.56, at: S(0.5), dur: S(0.5), ease: 'power2.inOut' });
          tl.fromTo(mainFrame, { xPercent: 0, yPercent: 0 }, { xPercent: 20, yPercent: 0, duration: S(0.5), ease: 'power2.inOut' }, S(0.5));
          tl.fromTo(head, { y: headStart }, { y: 0, duration: S(0.45), ease: 'power2.inOut' }, S(0.65));
          tl.fromTo(heading, { scale: 1 }, { scale: 0.55, duration: S(0.45), ease: 'power2.inOut' }, S(0.65));
          tl.fromTo(sub, { y: 0 }, { y: function () { return -0.45 * heading.offsetHeight; }, duration: S(0.45), ease: 'power2.inOut' }, S(0.65));
          tl.to(scrim, { autoAlpha: 0, duration: S(0.3) }, S(0.95));
          kit.reveal(tl, factsEl, { selector: '.fact', at: S(1.02), dur: S(0.32), y: 14 }); // the last fact is full at 1.33
          tl.to(factsEl, { autoAlpha: 0, duration: S(0.12) }, S(1.67));

          // Beat 3: history, groups of up to 3, supporting figures where the painting sits.
          groups.forEach(function (grp, g) {
            var s0 = S(G0 + g * GLEN), items = qa('.grp:nth-child(' + (g + 1) + ') .item');
            items.forEach(function (it, k) {
              var ln = it.querySelector('.line'), t = s0 + k * S(LINE_AT), f = figs[it.dataset.i];
              tl.fromTo(ln, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: S(REV) }, t);
              if (k > 0) tl.to(items[k - 1].querySelector('.line'), { opacity: 0.5, duration: S(REV) }, t + S(LAG));
              if (!f) return;
              var last = k === items.length - 1, next = last ? s0 + S(GLEN - FADE) : s0 + (k + 1) * S(LINE_AT);
              tl.fromTo(f, { autoAlpha: 0 }, { autoAlpha: 1, duration: S(REV) }, t);
              tl.to(f, { autoAlpha: 0, duration: S(REV) }, next);
              if (!(k > 0 && figs[items[k - 1].dataset.i])) tl.fromTo(mainFrame, { opacity: 1 }, { opacity: 0.15, duration: S(REV), immediateRender: false }, t);
              if (!(!last && figs[items[k + 1].dataset.i])) tl.fromTo(mainFrame, { opacity: 0.15 }, { opacity: 1, duration: S(REV), immediateRender: false }, next);
            });
            tl.to(grp, { autoAlpha: 0, duration: S(FADE) }, s0 + S(GLEN - FADE));
          });
          // slow push-in across the history so the painting never sits still: the frame grows (0.6 x 100vw at +20% stays inside the
          // viewport) while the picture inside tightens
          tl.fromTo(mainFrame, { scale: 0.56 }, { scale: 0.6, ease: 'none', duration: S(MV - 1.0), immediateRender: false }, S(1.0));
          kit.zoom(tl, mainImg, FULL, DRIFT, { at: S(1.0), dur: S(MV - 1.0) });

          // Beat 4: the painting returns to the centre, large; the zoom visits each detail, then backs out.
          tl.to(head, { autoAlpha: 0, duration: S(0.2) }, S(hEnd - 0.2)); // gone before the painting crosses its column
          tl.fromTo(mainFrame, { scale: 0.6, xPercent: 20, yPercent: 0 }, { scale: 0.86, xPercent: 0, yPercent: -3, duration: S(MOVE), ease: 'power2.inOut', immediateRender: false }, S(MV));
          var prev = DRIFT, ar = mainFrame.clientWidth / mainFrame.clientHeight;
          // kit.frame cover-fits into the 16:9 window: widen each crop to that aspect so the whole detail is shown
          var fit = function (c) {
            var nw = mainImg.naturalWidth || L.image.width, nh = mainImg.naturalHeight || L.image.height;
            var w = c.w / 100 * nw, h = c.h / 100 * nh;
            if (w / h < ar) w = h * ar; else h = w / ar;
            var pw = Math.min(100, w / nw * 100), ph = Math.min(100, h / nh * 100);
            return { x: Math.max(0, Math.min(100 - pw, c.x + c.w / 2 - pw / 2)), y: Math.max(0, Math.min(100 - ph, c.y + c.h / 2 - ph / 2)), w: pw, h: ph };
          };
          L.details.forEach(function (d, i) {
            var t = S(D0 + i * DP), cap = dets[i], win = fit(d.crop);
            kit.zoom(tl, mainImg, prev, win, { at: t, dur: S(DTRAVEL), ease: 'power2.inOut' });
            tl.fromTo(cap, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: S(0.07) }, t + S(0.06));
            tl.to(cap, { autoAlpha: 0, duration: S(0.07) }, t + S(DP - 0.09));
            prev = win;
          });
          kit.zoom(tl, mainImg, prev, FULL, { at: S(dEnd), dur: S(0.2), ease: 'power2.inOut' });

          // Beat 5: exit to black; the starfield remains (the icon scene abuts and fades in on the next scroll).
          tl.to(mainFrame, { autoAlpha: 0, duration: S(OUT - 0.15) }, S(dEnd + 0.15));
          kit.frame(mainImg, FULL); // zooms render their start crop when built; the timeline starts on the full painting
        },
        lite() {
          kit.frame(mainImg, FULL);
          qa('.fig-lite img').forEach(function (im) { kit.frame(im, FULL); });
          dets.forEach(function (f, i) { kit.frame(f.querySelector('img.art'), L.details[i].crop); });
        }
      });
    }
  });
})();
