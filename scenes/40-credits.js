/* Credits and thank-you: sources, images and music, then the closing card. */
window.SCENES = window.SCENES || [];
window.SCENES.push({
  id: 'credits', order: 40,
  html(C) {
    const k = C.credits, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const link = (t, u) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>` : esc(t);
    const per = Math.ceil(k.sources.length / 3) || 1;
    const col = list => `<ul class="cr-list cr-col reveal">${list.map(s => `<li>${link(s.label, s.url)}</li>`).join('')}</ul>`;
    const groups = [0, 1, 2].map(i => k.sources.slice(i * per, (i + 1) * per)).filter(g => g.length);
    const rows = list => list.map(x => `<li>${esc(x.title)} · ${esc(x.source)} · ${esc(x.license)}</li>`).join('');
    const music = k.audio && k.audio.length;
    return `<section class="scene scene-credits is-day abut" id="scene-credits" data-zone="icon"><div class="stage">
<div class="cr-panel cr-sources"><p class="kicker">Sources</p><div class="cr-cols">${groups.map(col).join('')}</div></div>
<div class="cr-panel cr-media${music ? '' : ' cr-one'}"><div class="cr-cols"><div class="cr-block"><p class="kicker">Images</p><ul class="cr-list">${rows(k.images)}</ul></div>${music ? `<div class="cr-block"><p class="kicker">Music</p><ul class="cr-list">${rows(k.audio)}</ul></div>` : ''}</div>
<p class="cr-listen">Listen: ${link(k.barber.label, k.barber.url)}</p></div>
<div class="cr-card"><p class="display">${esc(k.thanks)}</p><p class="lede">${esc(k.builtWith)}</p><p class="caption">${esc(k.course)}</p></div>
</div></section>`;
  },
  init(el, { kit, audio }) {
    const $ = s => el.querySelector(s), src = $('.cr-sources'), media = $('.cr-media'), card = $('.cr-card');
    kit.media(el, {
      full() {
        // times in screens; the last card is fully up at 3.33 and holds ~0.5 screen so a steady scroll-through lands on it
        const SCREENS = 3.85, S = x => x / SCREENS;
        const tl = kit.pin(el, { screens: SCREENS });
        kit.fadeIn(tl, src, { at: 0, dur: S(0.18) });
        kit.reveal(tl, src, { at: S(0.18), dur: S(1.26), y: 14 });
        kit.fade(tl, src, { at: S(1.75), dur: S(0.21) });
        kit.fadeIn(tl, media, { at: S(1.96), dur: S(0.21) });
        kit.fade(tl, media, { at: S(2.8), dur: S(0.21) });
        kit.fadeIn(tl, card, { at: S(3.05), dur: S(0.28), y: 20 }); // after the media list is fully gone (3.01)
        // zone marker must flip only when the card arrives; an always-top absolute card would flip it at pin start
        // the scrub settles after the last scroll event, so push the change to the audio director ourselves
        tl.eventCallback('onUpdate', () => {
          const z = tl.progress() >= S(3.15) ? 'none' : 'icon';
          if (el.dataset.zone !== z) { el.dataset.zone = z; audio.syncFromScroll(); }
        });
      },
      lite() {}
    });
  }
});
