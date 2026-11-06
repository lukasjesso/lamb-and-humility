/* Kit demo scenes. Mounted only via ?only=demo,demo-dawn. Proves pin, grow, zoom, reveal(dim), swap, dawn. */
window.SCENES = window.SCENES || [];

window.SCENES.push({
  id: 'demo', order: 990, demo: true,
  html() {
    return '<section class="scene scene-demo" id="scene-demo" data-zone="lamb"><div class="stage" data-swap-group>' +
      '<div class="demo-panel demo-a" data-swap-panel>' +
        '<div class="frame demo-frame"><img class="art" src="assets/img/zurbaran-prado-2952.jpg" width="2952" height="1750" alt="Zurbaran, Lamb of God"></div>' +
        '<div class="demo-text"><p class="kicker">Kit demo</p>' +
          '<p class="lede reveal">Line one: the lamb is bound.</p><p class="lede reveal">Line two: feet tied together.</p>' +
          '<p class="lede reveal">Line three: head turned away.</p><p class="lede reveal">Line four: no struggle.</p>' +
          '<p class="lede reveal">Line five: the picture zooms to the hooves.</p></div>' +
      '</div>' +
      '<div class="demo-panel demo-b" data-swap-panel>' +
        '<div class="demo-text"><p class="kicker">Second panel</p><p class="title">Text on the left.</p><p class="lede">The icon sits on the right, framed at the bound wrists.</p></div>' +
        '<div class="frame demo-frame demo-frame-icon"><img class="art" src="assets/img/icon-600.jpg" width="600" height="828" alt="Icon, Extreme Humility"></div>' +
      '</div>' +
    '</div></section>';
  },
  init(el, { kit }) {
    const full = { x: 0, y: 0, w: 100, h: 100 }, hooves = { x: 52, y: 60, w: 30, h: 36 };
    const a = el.querySelector('.demo-a'), b = el.querySelector('.demo-b');
    const img = a.querySelector('img.art'), icon = b.querySelector('img.art');
    kit.media(el, {
      full() {
        const tl = kit.pin(el, { screens: 4 });
        kit.frame(img, full); kit.frame(icon, { x: 20, y: 76, w: 60, h: 24 });
        kit.grow(tl, a.querySelector('.frame'), { from: 0.86, to: 1, at: 0, dur: 0.3 });
        kit.zoom(tl, img, full, hooves, { at: 0.3, dur: 0.3 });
        kit.reveal(tl, a.querySelector('.demo-text'), { at: 0.05, dur: 0.55, dim: 0.38 });
        kit.swap(tl, a, b, { fromSide: 'right', at: 0.62, dur: 0.2 });
      },
      lite() {
        kit.frame(img, hooves); kit.frame(icon, { x: 20, y: 76, w: 60, h: 24 });
      }
    });
  }
});

window.SCENES.push({
  id: 'demo-dawn', order: 991, demo: true,
  html() {
    return '<section class="scene scene-demo-dawn is-day" id="scene-demo-dawn" data-zone="icon"><div class="stage">' +
      '<div class="dd-center"><p class="lede dd-line">Still night. Look to the left.</p>' +
      '<p class="lede dd-after">Plain lede text: dark ink once the page is daylight.</p>' +
      '<p class="caption dd-caption">Light came from the left and the page is warm daylight.</p></div></div></section>';
  },
  init(el, { kit }) {
    kit.media(el, {
      full() {
        const tl = kit.pin(el, { screens: 3 });
        kit.dawn(tl);
        kit.fade(tl, el.querySelector('.dd-line'), { at: 0.6, dur: 0.1 });
        kit.fadeIn(tl, el.querySelectorAll('.dd-after, .dd-caption'), { at: 0.95, dur: 0.05 });
      }
    });
  }
});

window.SCENES.push({
  id: 'demo-end', order: 992, demo: true, with: 'demo-dawn', // auto-mounted with demo-dawn
  html() {
    return '<section class="scene scene-demo-end is-day" id="scene-demo-end" data-zone="icon"><div class="stage"><p class="caption">End of demo.</p></div></section>';
  },
  init() {}
});
