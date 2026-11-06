/* Scene "icon": Extreme Humility intro. One pinned timeline, planned in SCREENS and converted to fractions.
   The icon frame is the only picture that zooms; its box morphs with the crop so the low-res scan is never pushed past MAXS x. */
window.SCENES = window.SCENES || [];
window.SCENES.push({
  id: 'icon', order: 20,
  html(C) {
    const I = C.icon, M = I.image, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const ar = c => ((c.w * M.width) / (c.h * M.height)).toFixed(4);
    const crop = c => `<div class="frame ic-crop" data-crop="${c.x},${c.y},${c.w},${c.h}" style="--ar:${ar(c)}"><img class="art" src="${M.src}" width="${M.width}" height="${M.height}" alt=""></div>`;
    // history groups of at most 3 lines, sizes as even as possible (10 lines -> 3,3,2,2)
    const n = I.history.length, ng = Math.ceil(n / 3), base = Math.floor(n / ng), extra = n % ng;
    let k = 0, hist = '';
    for (let g = 0; g < ng; g++) {
      const sz = base + (g < extra ? 1 : 0);
      hist += `<div class="ic-panel ic-p-hist" data-start="${k}" data-n="${sz}">` +
        I.history.slice(k, k + sz).map(h => `<p class="ic-line reveal">${esc(h.line)}</p>`).join('') + '</div>';
      k += sz;
    }
    const figs = I.history.map((h, i) => h.img ? `<figure class="ic-fig ic-opt" data-line="${i}"><div class="frame"><img class="art" src="${h.img.src}" width="1600" height="1000" alt="${esc(h.img.alt)}"></div><figcaption class="caption">${esc(h.img.credit)}</figcaption></figure>` : '').join('');
    const kas = (I.history.find(h => h.img && /kastoria/.test(h.img.src)) || { img: { src: 'assets/img/support/kastoria-man-of-sorrows.jpg', alt: '', credit: '' } }).img;
    const card = (c, thumb) => `<div class="ic-card">${thumb}<h3 class="title">${esc(c.title)}</h3>` +
      c.lines.map((l, i) => `<p class="${i ? '' : 'lede'}">${esc(l)}</p>`).join('') + '</div>';
    const thumbK = `<div class="ic-thumbwrap is-k"><div class="frame ic-thumb"><img class="art" src="${kas.src}" width="1600" height="1000" alt="${esc(kas.alt)}"></div><p class="caption">${esc(kas.credit)}</p></div>`;
    const thumbI = `<div class="ic-thumbwrap"><div class="frame ic-thumb" style="--ar:${(M.width / M.height).toFixed(4)}"><img class="art" src="${M.src}" width="${M.width}" height="${M.height}" alt=""></div><p class="caption">${esc(I.heading)}</p></div>`;
    return `<section class="scene scene-icon abut" id="scene-icon" data-zone="lamb"><div class="stage">
<div class="ic-slot"><div class="ic-iconwrap"><div class="frame ic-frame"><img class="art" src="${M.src}" width="${M.width}" height="${M.height}" alt="${esc(M.alt)}"></div></div>${figs}</div>
<div class="ic-right">
<div class="ic-panel ic-p-open"><p class="kicker reveal">${esc(I.kicker)}</p><h2 class="display reveal">${esc(I.heading)}</h2><p class="caption reveal">${esc(I.subheading)}</p>
<div class="facts-strip reveal">${I.facts.map(f => `<div class="fact"><span class="label">${esc(f.label)}</span><span class="value">${esc(f.value)}</span></div>`).join('')}</div></div>
<div class="ic-grp ic-calls">${I.callouts.map(c => `<div class="ic-panel ic-p-call">${crop(c.crop)}<p class="greek reveal">${esc(c.greek)}</p><p class="ic-translit reveal">${esc(c.translit)}</p><p class="lede reveal">${esc(c.meaning)}</p><p class="caption reveal">${esc(c.ref)}</p></div>`).join('')}</div>
${hist}
<div class="ic-grp ic-dets">${I.details.map(d => `<div class="ic-panel ic-p-detail">${crop(d.crop)}<p class="ic-cap">${esc(d.caption)}</p></div>`).join('')}</div>
<div class="ic-panel ic-p-hymn"><p class="kicker">${esc(I.hymn.intro)}</p><div class="ic-hlines">${I.hymn.lines.map(l => `<p class="ic-hline reveal">${esc(l)}</p>`).join('')}</div><p class="caption ic-cite">${esc(I.hymn.cite)}</p></div>
</div>
<div class="ic-names"><div class="ic-cardwrap">${card(I.names.left, thumbK)}</div><span class="ic-vrule"></span><div class="ic-cardwrap">${card(I.names.right, thumbI)}</div></div>
</div></section>`;
  },

  init(el, { gsap, kit, C }) {
    const I = C.icon, q = s => el.querySelector(s), qa = s => Array.from(el.querySelectorAll(s));
    const FULL = { x: 0, y: 0, w: 100, h: 100 }, MAXS = 2.5;

    // Optional support images: drop whatever did not load, before any timeline exists.
    const sizeFrom = (img, frame) => { img.setAttribute('width', img.naturalWidth); img.setAttribute('height', img.naturalHeight); frame.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(4)); };
    const kImg = q('.ic-thumbwrap.is-k img');
    if (!kImg || !kImg.naturalWidth) q('.ic-thumbwrap.is-k').remove(); // keep the icon copy
    else sizeFrom(kImg, kImg.parentElement);
    qa('.ic-fig').forEach(f => { const im = f.querySelector('img'); if (!im.naturalWidth) f.remove(); else sizeFrom(im, im.parentElement); });

    const slot = q('.ic-slot'), wrap = q('.ic-iconwrap'), frame = q('.ic-frame'), img = frame.querySelector('img');
    const NAT = { w: img.naturalWidth || I.image.width, h: img.naturalHeight || I.image.height };
    const parse = f => { const a = f.dataset.crop.split(',').map(Number); return { x: a[0], y: a[1], w: a[2], h: a[3] }; };

    // Box that shows `c` at most MAXS x natural, as large as the slot allows.
    function render(c) {
      const cw = c.w / 100 * NAT.w, ch = c.h / 100 * NAT.h;
      const s = Math.min(slot.clientWidth / cw, slot.clientHeight / ch, MAXS);
      frame.style.width = cw * s + 'px'; frame.style.height = ch * s + 'px';
      img._box = { w: cw * s, h: ch * s };
      kit.frame(img, c);
    }

    let cur = null; // one refresh listener for the scene's life; full() sets what it runs
    kit.onRefresh(() => cur && cur());
    kit.media(el, {
      full() {
        // ---- plan, in screens ----
        const B1 = 0.9, LC = 0.72, SLOT = 0.34, HOLD = 0.15, GF = 0.12, DD = 0.55, DQ = 0.68, HY = 0.3, LEAD = 0.2, NAMES = 0.9, QH = 0.4;
        const quoteDet = i => /[“"]/.test(I.details[i].caption), dDur = i => quoteDet(i) ? DQ : DD;
        const calls = qa('.ic-p-call'), hists = qa('.ic-p-hist'), dets = qa('.ic-p-detail'), figs = qa('.ic-fig');
        const open = q('.ic-p-open'), hymn = q('.ic-p-hymn'), names = q('.ic-names');
        const cardW = qa('.ic-cardwrap'), vr = q('.ic-vrule');
        const cs = calls.map((_, i) => B1 + i * LC), back = B1 + calls.length * LC;
        let t = back + 0.15; const gs = [];
        const holdOf = g => /[“"]/.test(g.lastElementChild.textContent) ? QH : HOLD;
        hists.forEach(g => { gs.push(t); t += (+g.dataset.n) * SLOT + holdOf(g) + GF; });
        const dStart = dets.map((_, i) => dets.slice(0, i).reduce((a, _x, j) => a + dDur(j), 0));
        const ns = t, ds = ns + NAMES, dEnd = ds + LEAD + dets.reduce((a, _x, j) => a + dDur(j), 0);
        const hy = dEnd, H0 = hy + 0.5, TOTAL = H0 + HY * I.hymn.lines.length + 0.1 + 0.15 + 0.25 + 0.3, T = s => Math.min(1, s / TOTAL), D = s => s / TOTAL;
        const tl = kit.pin(el, { screens: Math.round(TOTAL * 10) / 10 });
        const ft = (target, from, to, at, dur) => tl.fromTo(target, from, Object.assign({ duration: D(dur), immediateRender: false }, to), T(at));
        const iconOp = (a, b, at, dur) => ft(wrap, { opacity: a }, { opacity: b }, at, dur);
        const panelIn = (p, at) => tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(0.05) }, T(at));
        const panelOut = (p, at, dur = GF) => kit.fade(tl, p, { at: T(at), dur: D(dur) });

        render(FULL);
        qa('.ic-fig img, .ic-thumb img').forEach(im => kit.frame(im, FULL));

        // Beat 1: opening
        tl.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: D(0.35) }, 0); // quick enough that the lamb->icon boundary does not empty the sky
        kit.grow(tl, slot, { from: 0.88, to: 1, at: 0, dur: D(B1) });
        kit.reveal(tl, open, { at: 0, dur: D(0.55), y: 18 });
        panelOut(open, B1 - 0.18, 0.18); // gone before the first callout's text arrives (same column)

        // Beat 2: reading the icon
        const crops = [FULL].concat(I.callouts.map(c => c.crop));
        const zoom = (a, b, at, dur) => { const p = { t: 0 }; tl.to(p, { t: 1, duration: D(dur), onUpdate() { render(kit.lerpCrop(a, b, p.t)); } }, T(at)); };
        calls.forEach((p, i) => {
          const c = cs[i];
          zoom(crops[i], crops[i + 1], c, 0.4);
          if (i) panelOut(calls[i - 1], c, 0.12);
          panelIn(p, c + 0.13);
          kit.reveal(tl, p, { at: T(c + 0.13), dur: D(0.32), y: 16 });
        });
        panelOut(calls[calls.length - 1], back, 0.12);
        zoom(crops[crops.length - 1], FULL, back, 0.45);

        // Beat 3: history, groups of at most 3, figures take the icon's place
        iconOp(1, 0.55, back, 0.4);
        const figAt = f => { const i = +f.dataset.line; const gi = hists.findIndex(g => i >= +g.dataset.start && i < +g.dataset.start + +g.dataset.n); return { gi, at: gs[gi] + (i - +hists[gi].dataset.start) * SLOT }; };
        hists.forEach((g, gi) => {
          const n = +g.dataset.n, s = gs[gi], e = s + n * SLOT + holdOf(g);
          panelIn(g, s);
          kit.reveal(tl, g, { at: T(s), dur: D(n * SLOT), dim: 0.5, y: 16 });
          panelOut(g, e);
        });
        let lastDim = 0.55;
        figs.forEach((f, fi) => {
          const { gi, at } = figAt(f), g = hists[gi];
          const gEnd = gs[gi] + (+g.dataset.n) * SLOT + holdOf(g), nx = figs[fi + 1] && figAt(figs[fi + 1]);
          const out = nx && nx.gi === gi ? nx.at : gEnd;
          kit.fadeIn(tl, f, { at: T(at), dur: D(0.15), y: 10 });
          kit.fade(tl, f, { at: T(out), dur: D(0.12) });
          iconOp(0.55, 0, at, 0.15);
          if (!(nx && nx.gi === gi) && gi < hists.length - 1) iconOp(0, 0.55, out, 0.12);
          if (!(nx && nx.gi === gi) && gi === hists.length - 1) lastDim = 0;
        });

        // Beat 4: two names
        iconOp(lastDim, 0, ns - GF, 0.3); // the icon is gone before the cards land on its spot
        panelIn(names, ns + 0.05);
        kit.fadeIn(tl, cardW[0], { at: T(ns + 0.05), dur: D(0.25), y: 20 });
        kit.fadeIn(tl, cardW[1], { at: T(ns + 0.15), dur: D(0.25), y: 20 });
        tl.fromTo(vr, { autoAlpha: 0, scaleY: 0 }, { autoAlpha: 0.7, scaleY: 1, duration: D(0.3) }, T(ns + 0.05));
        kit.fade(tl, names, { at: T(ns + NAMES - 0.1), dur: D(0.1) });

        // Beat 5: what is in the picture
        iconOp(0, 1, ds, LEAD);
        dets.forEach((p, i) => {
          const c = ds + LEAD + dStart[i], a = i ? I.details[i - 1].crop : FULL;
          zoom(a, I.details[i].crop, c, 0.35);
          if (i) panelOut(dets[i - 1], c, 0.12);
          kit.fadeIn(tl, p, { at: T(c + 0.12), dur: D(0.12), y: 14 });
        });
        panelOut(dets[dets.length - 1], hy, 0.12);

        // Beat 6: the hymn; the icon grows very slowly
        zoom(I.details[I.details.length - 1].crop, FULL, hy, 0.5);
        ft(frame, { scale: 1 }, { scale: 1.07 }, hy, TOTAL - hy - 0.05);
        panelIn(hymn, hy + 0.2);
        const hk = hymn.querySelector('.kicker'), hl = hymn.querySelector('.ic-hlines'), hc = hymn.querySelector('.ic-cite');
        kit.fadeIn(tl, hk, { at: T(hy + 0.25), dur: D(0.15) });
        kit.reveal(tl, hl, { at: T(H0), dur: D(HY * I.hymn.lines.length), dim: 0.55, y: 14 });
        kit.fadeIn(tl, hc, { at: T(H0 + HY * I.hymn.lines.length + 0.1), dur: D(0.15) });

        // Beat 7: exit to the starfield
        panelOut(hymn, TOTAL - 0.3, 0.3);
        iconOp(1, 0, TOTAL - 0.3, 0.3);

        cur = () => { if (!kit.lite && img._crop && img.isConnected && frame.style.width) render(img._crop); };
      },
      lite() {
        cur = null;
        frame.style.width = frame.style.height = ''; img._box = null;
        qa('.frame').forEach(f => { const im = f.querySelector('img'); im._box = null; kit.frame(im, f.dataset.crop ? parse(f) : FULL); });
      }
    });
  }
});
