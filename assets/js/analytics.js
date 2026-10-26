/* Google Analytics 4 with Consent Mode. Counted by default outside the EU/EEA/UK/CH; there, nothing is stored until the visitor accepts. Ads are denied everywhere. */
(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var ID = 'G-5RBJNVDKT0', KEY = 'rm_consent';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  // Outside the EU/EEA/UK/Switzerland visits are counted by default (analytics only; ads stay off everywhere).
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'] });
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'granted' || saved === 'denied') gtag('consent', 'update', { analytics_storage: saved });
  // No geo service is called: the banner is decided on the browser time zone; unknown means ask.
  window.rmAskConsent = function () {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    return !tz || /^Europe\//.test(tz) || ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faroe'].indexOf(tz) > -1;
  };
  // Visitors we ask (European time zone) are never counted before they answer, whatever their IP says.
  // A browser Global Privacy Control signal is treated as "no" (no banner, nothing counted).
  if (!saved && (window.rmAskConsent() || navigator.globalPrivacyControl === true)) gtag('consent', 'update', { analytics_storage: 'denied' });
  function clearGa() {
    var host = location.hostname.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^_ga/.test(n)) ['', '; domain=' + host, '; domain=.' + host, '; domain=' + location.hostname].forEach(function (d) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d; });
    });
  }
  window.rmSetConsent = function (v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: v === 'granted' ? 'granted' : 'denied' });
    if (v !== 'granted') clearGa();
  };
  window.rmConsent = saved;
  gtag('js', new Date());
  gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  if (local) return; // local checks must not count as visits
  var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
