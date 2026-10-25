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


  // analytics consent banner and download-click events (Google Analytics 4; see analytics.js)
  function track(name, params) { if (typeof gtag === 'function') gtag('event', name, params); }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '', store = h.indexOf('apps.apple.com') > -1 ? 'app_store' : h.indexOf('play.google.com') > -1 ? 'google_play' : h.indexOf('play.reversemathpuzzle.com') > -1 ? 'web_player' : '';
    if (store) { track('download_click', { store: store, where: a.getAttribute('data-where') || 'link', page_path: location.pathname }); return; }
  });
  d.addEventListener('toggle', function (e) { var t = e.target; if (t && t.tagName === 'DETAILS' && t.open) { var q = t.querySelector('summary'); track('faq_open', { question: q ? q.textContent.trim().slice(0, 80) : '' }); } }, true);
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.btn, .nav-links a, .footer a'); if (!a || a.id === 'cookie-choices' || a.hasAttribute('data-store')) return;
    track('link_tap', { text: (a.textContent || '').trim().slice(0, 40), href: (a.getAttribute('href') || '').slice(0, 100), page_path: location.pathname });
  });
  function showBanner() {
    if (d.getElementById('consent')) return;
    var b = d.createElement('div'); b.id = 'consent'; b.className = 'consent'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Analytics choice');
    b.innerHTML = '<p>We count visits with Google Analytics. Cookies only if you accept. <a href="/privacy-policy/#website">Details</a></p><div class="consent-btns"><button type="button" class="btn btn-ink" data-v="granted">Accept</button><button type="button" class="btn btn-light" data-v="denied">No thanks</button></div>';
    b.addEventListener('click', function (e) { var v = e.target.getAttribute && e.target.getAttribute('data-v'); if (!v) return; if (window.rmSetConsent) window.rmSetConsent(v); b.remove(); });
    d.body.appendChild(b);
  }
  if (!window.rmConsent && window.rmAskConsent && window.rmAskConsent()) setTimeout(showBanner, 2500);
  var cc = d.getElementById('cookie-choices'); if (cc) cc.addEventListener('click', function (e) { e.preventDefault(); showBanner(); });

  if (/BytedanceWebview|musical_ly|trill|Instagram|FBAN|FBAV|Snapchat/i.test(navigator.userAgent || '')) { d.documentElement.classList.add('in-app-browser'); track('in_app_browser', { page_path: location.pathname }); }
  var sticky = d.getElementById('sticky-install');
  if (sticky) { var onScroll = function () { sticky.hidden = false; sticky.classList.toggle('show', window.scrollY > 380); }; window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  // which sections people reach (counts only)
  if ('IntersectionObserver' in window) {
    var seen = {}, so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !seen[e.target.id]) { seen[e.target.id] = 1; track('section_view', { section: e.target.id, page_path: location.pathname }); } }); }, { threshold: 0.4 });
    [].forEach.call(d.querySelectorAll('section[id]'), function (el) { so.observe(el); });
  }

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
      if (r === 14) { d.body.classList.add('demo-solved'); slots.forEach(function (s) { s.classList.add('ok'); }); say('14! ' + ex + ' = 14. × goes first.', 'ok'); track('demo_result', { result: 'solved' }); }
      else { slots.forEach(function (s) { s.classList.add('bad'); }); say('Not quite: ' + ex + ' = ' + r + '. Tap a blank to take a number back.', 'bad'); track('demo_result', { result: 'wrong' }); }
    };
    var demoStarted = false;
    tiles.forEach(function (t) { t.addEventListener('click', function () { if (!demoStarted) { demoStarted = true; track('demo_start'); } var i = val.indexOf(null); if (i === -1) return; val[i] = +t.dataset.v; render(); check(); }); });
    slots.forEach(function (s, i) { s.addEventListener('click', function () { if (val[i] === null) return; val[i] = null; render(); say('Tap the numbers to fill the blanks.'); }); });
    demo.querySelector('.demo-reset').addEventListener('click', function () { val = [null, null, null]; render(); say('Tap the numbers to fill the blanks.'); });
    render();
  }
})();
