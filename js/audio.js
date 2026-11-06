/* Two looping chants crossfaded by tweening element volume (no Web Audio). window.audio. */
(function () {
  var SRC = { lamb: 'assets/audio/lamb-chant.mp3', icon: 'assets/audio/icon-chant.mp3' };
  var TARGET = 0.75, KEY = 'lamb-site-muted';
  var root = document.documentElement, btn = document.getElementById('sound');
  var els = {}, missing = {}, wanted = 'none', armed = false, muted = false, volumeIgnored = false;

  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) {}
  window.__audioZone = 'none';
  window.__audioZoneLog = ['none'];

  Object.keys(SRC).forEach(function (z) {
    var a = new Audio();
    a.loop = true; a.preload = 'auto'; a.volume = 0;
    a.addEventListener('error', function () {
      if (!missing[z]) { missing[z] = true; console.warn('[audio] missing', SRC[z]); }
    });
    a.src = SRC[z];
    els[z] = a;
  });
  // iOS ignores element.volume: detect by read-back.
  try { var p = els.lamb; p.volume = 0.5; volumeIgnored = p.volume !== 0.5; p.volume = 0; } catch (e) { volumeIgnored = true; }

  function fade(z, to, dur) {
    var el = els[z];
    if (volumeIgnored) {
      if (to > 0) { el.volume = 1; var pr = el.play(); if (pr && pr.catch) pr.catch(function () {}); } else el.pause();
      return;
    }
    if (to > 0) { var q = el.play(); if (q && q.catch) q.catch(function () {}); }
    if (window.gsap) {
      gsap.to(el, { volume: to, duration: dur, ease: 'sine.inOut', overwrite: true, onComplete: function () { if (to === 0) el.pause(); } });
    } else { el.volume = to; if (to === 0) el.pause(); }
  }
  function apply(dur) {
    Object.keys(els).forEach(function (z) {
      var on = armed && !muted && wanted === z && !missing[z];
      fade(z, on ? TARGET : 0, dur == null ? 2.5 : dur);
    });
  }
  function ui() {
    root.classList.toggle('audio-muted', muted);
    if (!btn) return;
    var playing = armed && !muted;
    btn.setAttribute('aria-pressed', String(muted));
    btn.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
  }
  var api = {
    begin: function () {
      if (armed) return;
      armed = true; root.classList.add('audio-armed');
      apply(); ui();
    },
    setZone: function (z) {
      if (z !== 'lamb' && z !== 'icon') z = 'none';
      if (z === wanted) return;
      wanted = z; window.__audioZone = z; window.__audioZoneLog.push(z);
      if (armed && !muted) apply();
    },
    toggleMute: function () {
      muted = !muted;
      try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) {}
      if (armed) apply(muted ? 0.6 : 2.5);
      ui();
    },
    syncFromScroll: function () {
      var list = document.querySelectorAll('#app [data-zone]');
      if (!list.length) return;
      // Pinned pages: a section owns the zone once its top reaches the viewport top (pins abut, so "mid-viewport" would
      // switch half a screen early, while the previous pin is still on screen). Lite stacks: mid-viewport.
      var pick = list[0], at = root.classList.contains('is-lite') ? innerHeight * 0.5 : 2;
      // a pinned section is measured by its pin spacer: anticipatePin can fix the section to top 0 a few px before its start
      for (var i = 0; i < list.length; i++) {
        var n = list[i], box = n.parentElement && n.parentElement.classList.contains('pin-spacer') ? n.parentElement : n;
        if (box.getBoundingClientRect().top <= at) pick = n;
      }
      api.setZone(pick.dataset.zone);
    },
    get zone() { return wanted; },
    get armed() { return armed; },
    get muted() { return muted; }
  };
  if (btn) btn.addEventListener('click', function () { if (armed) api.toggleMute(); else { if (muted) api.toggleMute(); api.begin(); } });
  ui();
  window.audio = api;
})();
