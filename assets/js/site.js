/* ReverseMath marketing site: nav, reveal-on-scroll, the tap-to-solve demo, platform hint. No tracking. */
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
    // GA4 names (2026-11): platform (ios | android | web) and surface (the badge's position) are registered event dimensions; this event used the unregistered names store and where (page_path is not needed: GA4 reads page_location)
    if (store) { track('download_click', { platform: store === 'app_store' ? 'ios' : store === 'google_play' ? 'android' : 'web', surface: a.getAttribute('data-where') || 'link' }); return; }
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
    var seen = {}, so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !seen[e.target.id]) { seen[e.target.id] = 1; track('section_view', { section: e.target.id, page_path: location.pathname }); } }); }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    [].forEach.call(d.querySelectorAll('section[id], [data-sv]'), function (el) { so.observe(el); });
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
  // Tap puts the number in the first blank. Drag drops it on a blank. Pointer events (touch, pen, mouse), with a click fallback for old browsers and keyboards.
  var demo = d.getElementById('demo');
  if (demo) {
    var slots = [].slice.call(demo.querySelectorAll('.slot')), tiles = [].slice.call(demo.querySelectorAll('.tile')),
        msg = demo.querySelector('.demo-msg'), val = [null, null, null],
        calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches,
        hasPointer = 'PointerEvent' in window;
    var say = function (t, c) { msg.textContent = t; msg.className = 'demo-msg ' + (c || ''); };
    var render = function () {
      slots.forEach(function (s, i) { s.textContent = val[i] === null ? '?' : val[i]; s.classList.toggle('filled', val[i] !== null); s.classList.remove('ok', 'bad'); s.setAttribute('aria-label', val[i] === null ? 'Empty blank ' + (i + 1) : 'Blank ' + (i + 1) + ': ' + val[i]); });
      tiles.forEach(function (t) { t.disabled = val.indexOf(+t.dataset.v) !== -1; });
    };
    var burst = function () {
      if (calm) return;
      var colors = ['#F2A81D', '#FFD65C', '#3FA866', '#E5533D', '#2D6FA4'], n = 16, host = demo.querySelector('.demo-top') || demo;
      for (var k = 0; k < n; k++) {
        var b = d.createElement('i'), a = (Math.PI * 2 * k) / n + Math.random() * .4, r = 60 + Math.random() * 40;
        b.className = 'bit'; b.style.setProperty('--dx', Math.cos(a) * r + 'px'); b.style.setProperty('--dy', Math.sin(a) * r + 'px'); b.style.background = colors[k % colors.length];
        host.appendChild(b); setTimeout(function (x) { x.remove(); }, 900, b);
      }
    };
    var check = function () {
      if (val.indexOf(null) !== -1) { say('Drag or tap a number into a blank.'); return; }
      var r = val[0] * val[1] + val[2], ex = val[0] + ' × ' + val[1] + ' + ' + val[2];
      if (r === 14) {
        d.body.classList.add('demo-solved'); slots.forEach(function (s) { s.classList.add('ok'); }); say('14! ' + ex + ' = 14. × goes first.', 'ok');
        demo.classList.remove('win'); void demo.offsetWidth; demo.classList.add('win'); burst();
        track('demo_result', { result: 'solved' }); track('demo_puzzle_solved', { mode: 'demo', level: 'novice' });
      } else { slots.forEach(function (s) { s.classList.add('bad'); }); say('Not quite: ' + ex + ' = ' + r + '. Tap a blank to take a number back.', 'bad'); track('demo_result', { result: 'wrong' }); }
    };
    var demoStarted = false;
    var fillAt = function (i, v) {
      if (i < 0 || val[i] !== null) return;
      if (!demoStarted) { demoStarted = true; track('demo_start'); }
      val[i] = v; render();
      slots[i].classList.remove('pop'); void slots[i].offsetWidth; slots[i].classList.add('pop');
      check();
    };
    // the blank under the finger; a blank counts a little beyond its edge so a near miss still lands
    var slotAt = function (x, y) {
      var best = -1, bd = 1e9;
      slots.forEach(function (s, k) {
        var r = s.getBoundingClientRect(), pad = 14;
        if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) return;
        var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), dist = dx * dx + dy * dy;
        if (dist < bd) { bd = dist; best = k; }
      });
      return best;
    };
    var firstEmpty = function () { return val.indexOf(null); };
    tiles.forEach(function (t) {
      if (hasPointer) t.addEventListener('pointerdown', function (e) {
        if (t.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
        var sx = e.clientX, sy = e.clientY, pid = e.pointerId, moved = false, far = 0, ghost = null, done = false;
        t.classList.add('lift');
        var cleanup = function () {
          done = true; t.classList.remove('lift', 'dragging');
          d.removeEventListener('pointermove', move); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', cancel);
          slots.forEach(function (s) { s.classList.remove('over'); });
          if (ghost) { ghost.remove(); ghost = null; }
        };
        var move = function (ev) {
          if (ev.pointerId !== pid || done) return;
          var dist = Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy); far = Math.max(far, dist);
          if (!moved && dist > 10) { moved = true; t.classList.add('dragging'); ghost = t.cloneNode(true); ghost.className = 'tile tile-ghost'; ghost.removeAttribute('id'); ghost.setAttribute('aria-hidden', 'true'); d.body.appendChild(ghost); }
          if (moved && ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; var o = slotAt(ev.clientX, ev.clientY); slots.forEach(function (s, k) { s.classList.toggle('over', k === o && val[k] === null); }); }
        };
        var up = function (ev) {
          if (ev.pointerId !== pid || done) return;
          var o = moved ? slotAt(ev.clientX, ev.clientY) : -1, v = +t.dataset.v;
          cleanup();
          if (moved && o > -1 && val[o] === null) fillAt(o, v);
          else if (far <= 24) fillAt(firstEmpty(), v);   // a tap with a little finger wobble is still a tap
        };
        var cancel = function (ev) { if (ev.pointerId === pid) cleanup(); };
        d.addEventListener('pointermove', move); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', cancel);
      });
      // keyboard (detail 0), and every tap where pointer events do not exist
      t.addEventListener('click', function (e) { if (t.disabled) return; if (!hasPointer || e.detail === 0) fillAt(firstEmpty(), +t.dataset.v); });
    });
    slots.forEach(function (s, i) { s.addEventListener('click', function () { if (val[i] === null) return; val[i] = null; render(); say('Drag or tap a number into a blank.'); }); });
    demo.querySelector('.demo-reset').addEventListener('click', function () { val = [null, null, null]; render(); say('Drag or tap a number into a blank.'); });
    render();
  }

  // the store card in the hero: counted when seen, and when a badge is tapped
  var heroCard = d.getElementById('hero-install');
  if (heroCard) {
    if ('IntersectionObserver' in window) { var ho = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { track('install_card_shown', { where: 'hero' }); ho.disconnect(); } }, { threshold: 0.6 }); ho.observe(heroCard); }
    heroCard.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[data-store]')) track('install_card_click', { where: 'hero' }); });
  }
})();
