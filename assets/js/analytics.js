/* Google Analytics 4 with Consent Mode. Nothing is stored until the visitor accepts; before that, Google only gets cookieless pings. */
(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var ID = 'G-5RBJNVDKT0', KEY = 'rm_consent';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  var denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', denied);
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'granted') gtag('consent', 'update', { analytics_storage: 'granted' });
  window.rmSetConsent = function (v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: v === 'granted' ? 'granted' : 'denied' });
  };
  window.rmConsent = saved;
  gtag('js', new Date());
  gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  if (local) return; // local checks must not count as visits
  var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
