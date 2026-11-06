/* Landing: title + two paintings; scroll flies the lamb to full-bleed (handoff to the lamb scene). */
window.SCENES = window.SCENES || [];
window.SCENES.push({
  id: 'landing', order: 0,
  html(C) {
    const S = C.site, L = C.lamb.image, I = C.icon.image;
    return '<section class="scene scene-landing" id="scene-landing" data-zone="lamb"><div class="stage">' +
      '<div class="ld-head"><h1 class="display ld-title">' + S.title + '</h1><p class="lede ld-sub">' + S.subtitle + '</p></div>' +
      '<div class="frame ld-lamb"><img class="art" src="' + L.src + '" width="' + L.width + '" height="' + L.height + '" alt="' + L.alt + '"></div>' +
      '<div class="ld-row">' +
        '<figure class="ld-fig ld-fig-lamb"><div class="ld-slot"></div><figcaption class="caption ld-cap">' + S.lambLabel + '</figcaption></figure>' +
        '<figure class="ld-fig ld-fig-icon"><div class="frame ld-icon"><img class="art" src="' + I.src + '" width="' + I.width + '" height="' + I.height + '" alt="' + I.alt + '"></div><figcaption class="caption ld-cap">' + S.iconLabel + '</figcaption></figure>' +
      '</div>' +
      '<div class="ld-cta"><button class="begin" type="button" data-begin>' + S.begin + '</button><p class="caption ld-hint">' + S.beginHint + '</p><span class="ld-cue" aria-hidden="true"></span></div>' +
      '<p class="caption ld-course">' + S.course + '</p>' +
    '</div></section>';
  },
  init(el, { gsap, ScrollTrigger, kit }) {
    const $ = (s) => el.querySelector(s);
    const lamb = $('.ld-lamb'), limg = lamb.querySelector('img'), iimg = $('.ld-icon img'), slot = $('.ld-slot');
    const btn = $('.begin'), hint = $('.ld-hint'), cue = $('.ld-cue');
    const SCREENS = 0.85, S = (x) => x / SCREENS, full = { x: 0, y: 0, w: 100, h: 100 }; // times below are in screens
    const next = document.getElementById('scene-lamb'); // abuts us (class abut): its first frame is our last frame
    let cueTl = null, outTw = null;
    const resetBegin = () => { if (!gsap) return; if (cueTl) cueTl.kill(); if (outTw) outTw.kill(); cueTl = outTw = null; gsap.set([btn, hint, cue], { clearProps: 'all' }); };

    // Begin: click-driven, not scroll. In lite the button stays and takes the reader to the first painting.
    btn.addEventListener('click', () => {
      if (kit.lite) { if (next) next.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
      outTw = gsap.to([btn, hint], { autoAlpha: 0, duration: 0.8, ease: 'power1.out' });
      cueTl = gsap.timeline({ delay: 0.5 })
        .set(cue, { autoAlpha: 1 })
        .fromTo(cue, { scaleY: 0, transformOrigin: '50% 0' }, { scaleY: 1, duration: 1.8, ease: 'power1.inOut' })
        .to(cue, { autoAlpha: 0.35, duration: 0.01 })
        .to(cue, { autoAlpha: 1, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    kit.media(el, {
      full() {
        resetBegin();
        gsap.set([lamb, '.ld-head', '.ld-icon', '.ld-cap', '.ld-course', '.ld-cta'], { clearProps: 'all' });
        const tl = kit.pin(el, { screens: SCREENS });
        kit.frame(limg, full); kit.frame(iimg, full);
        // The lamb frame is the full viewport; tuck it into the slot via transform on the FRAME only.
        const sc = () => slot.getBoundingClientRect().width / innerWidth;
        kit.fade(tl, el.querySelectorAll('.ld-cap, .ld-course, .ld-cta'), { at: 0, dur: S(0.18) });
        tl.to('.ld-head', { y: () => -innerHeight * 0.12, autoAlpha: 0, duration: S(0.32) }, 0);
        tl.to('.ld-fig-icon .ld-icon', { x: () => innerWidth * 0.1, autoAlpha: 0, duration: S(0.28), ease: 'power1.in' }, S(0.04));
        tl.fromTo(lamb,
          { scale: sc, x: () => slot.getBoundingClientRect().left, y: () => slot.getBoundingClientRect().top, transformOrigin: '0 0' },
          { scale: 1, x: 0, y: 0, duration: S(0.72), ease: 'power2.inOut', immediateRender: true }, S(0.09));
        // Handoff inside OUR scrubbed timeline, so both scenes swap on the same frame at any scroll speed:
        // the lamb scene (already pinned at top 0, identical full-bleed frame) is hidden until we end, then we hide.
        if (next) { gsap.set(next, { autoAlpha: 0 }); tl.set(next, { autoAlpha: 1 }, 1); }
        tl.set(el, { autoAlpha: 0 }, 1);
      },
      lite() { resetBegin(); if (gsap) gsap.set(lamb, { clearProps: 'all' }); kit.frame(limg, full); kit.frame(iimg, full); }
    });
  }
});
