/* Reverse Math Puzzle marketing site: nav, reveal-on-scroll, the tap-to-solve demo, platform hint. No tracking. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');

  // mobile nav
  var burger = d.querySelector('.burger'), links = d.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) { if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  }

  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links && links.classList.contains('open')) {
      links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.focus();
    }
  });

  var y = d.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  // reveal on scroll
  var items = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  // the download page lists the visitor's store first
  var ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) d.body.classList.add('is-android'); else if (/iPhone|iPad|iPod/i.test(ua)) d.body.classList.add('is-ios');

  // tap-to-solve demo: ? × ? + ? = 14 with 3, 2, 4 (3 × 4 + 2 and 4 × 3 + 2 both work)
  var demo = d.getElementById('demo');
  if (demo) {
    var slots = [].slice.call(demo.querySelectorAll('.slot')), tiles = [].slice.call(demo.querySelectorAll('.tile')),
        msg = demo.querySelector('.demo-msg'), val = [null, null, null];
    var say = function (t, c) { msg.textContent = t; msg.className = 'demo-msg ' + (c || ''); };
    var render = function () {
      slots.forEach(function (s, i) { s.textContent = val[i] === null ? '?' : val[i]; s.classList.toggle('filled', val[i] !== null); s.classList.remove('ok', 'bad'); s.setAttribute('aria-label', val[i] === null ? 'Empty blank ' + (i + 1) : 'Blank ' + (i + 1) + ': ' + val[i]); });
      tiles.forEach(function (t) { t.disabled = val.indexOf(+t.dataset.v) !== -1; });
    };
    var check = function () {
      if (val.indexOf(null) !== -1) { say('Tap the numbers to fill the blanks.'); return; }
      var r = val[0] * val[1] + val[2], ex = val[0] + ' × ' + val[1] + ' + ' + val[2];
      if (r === 14) { slots.forEach(function (s) { s.classList.add('ok'); }); say('14! ' + ex + ' = 14. × goes first.', 'ok'); }
      else { slots.forEach(function (s) { s.classList.add('bad'); }); say('Not quite: ' + ex + ' = ' + r + '. Tap a blank to take a number back.', 'bad'); }
    };
    tiles.forEach(function (t) { t.addEventListener('click', function () { var i = val.indexOf(null); if (i === -1) return; val[i] = +t.dataset.v; render(); check(); }); });
    slots.forEach(function (s, i) { s.addEventListener('click', function () { if (val[i] === null) return; val[i] = null; render(); say('Tap the numbers to fill the blanks.'); }); });
    demo.querySelector('.demo-reset').addEventListener('click', function () { val = [null, null, null]; render(); say('Tap the numbers to fill the blanks.'); });
    render();
  }
})();
