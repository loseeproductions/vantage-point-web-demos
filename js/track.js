/* Vantage Point — first-party lead source capture.
 *
 * This is the thing we sell, running on our own site.
 *
 * Two tiers, on purpose:
 *   sessionStorage  first touch within THIS visit. First-party, session scoped,
 *                   used only to attach a source to a form the visitor chooses
 *                   to send. No identifier, nothing shared, dies with the tab.
 *   localStorage    first touch across visits. Persistent, so it is gated on
 *                   the same "Accept all" consent the analytics is gated on.
 *
 * First touch is never overwritten. The first campaign that brought someone in
 * is the one that gets the credit, and a later visit cannot quietly rewrite it.
 */
(function () {
  'use strict';
  var SKEY = 'vpw_src_session', LKEY = 'vpw_src_first';
  var FIELDS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','msclkid'];

  function consented() {
    try { return localStorage.getItem('vpw_cookie_consent') === 'all'; } catch (e) { return false; }
  }
  function read(store, key) {
    try { var v = store.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function write(store, key, val) {
    try { store.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function fromUrl() {
    var q = new URLSearchParams(location.search), out = {}, any = false;
    FIELDS.forEach(function (f) { var v = q.get(f); if (v) { out[f] = v.slice(0, 200); any = true; } });
    if (!any) return null;
    return out;
  }

  function classify(src) {
    // What the CRM should say instead of a single "Google" bucket.
    if (!src) return 'direct or unknown';
    if (src.gclid) return 'google paid search';
    if (src.msclkid) return 'microsoft paid search';
    if (src.fbclid) return 'meta';
    var s = (src.utm_source || '').toLowerCase(), m = (src.utm_medium || '').toLowerCase();
    if (m.indexOf('cpc') > -1 || m.indexOf('paid') > -1 || m.indexOf('ppc') > -1) return s ? s + ' paid' : 'paid';
    if (s.indexOf('lsa') > -1 || (src.utm_campaign || '').toLowerCase().indexOf('lsa') > -1) return 'google local services';
    if (s.indexOf('gbp') > -1 || s.indexOf('maps') > -1 || s.indexOf('business_profile') > -1) return 'google business profile';
    if (s) return s + (m ? ' / ' + m : '');
    return 'direct or unknown';
  }

  function capture() {
    var url = fromUrl();
    var ref = document.referrer || '';
    var now = new Date().toISOString();

    var session = read(sessionStorage, SKEY);
    if (!session) {
      session = {
        first_seen: now,
        landing_page: location.pathname + location.search,
        referrer: ref.slice(0, 300)
      };
      FIELDS.forEach(function (f) { if (url && url[f]) session[f] = url[f]; });
      session.source_label = classify(url);
      write(sessionStorage, SKEY, session);
    }

    if (consented()) {
      var first = read(localStorage, LKEY);
      if (!first) write(localStorage, LKEY, session);   // never overwritten
    }
    return session;
  }

  function current() {
    var s = read(sessionStorage, SKEY) || {};
    var f = consented() ? (read(localStorage, LKEY) || {}) : {};
    return {
      first_touch: f.first_seen ? f : null,
      this_visit: s,
      source_label: (f.source_label || s.source_label || 'direct or unknown')
    };
  }

  function attach(form) {
    if (!form || form.__vpwWired) return;
    form.__vpwWired = true;
    form.addEventListener('submit', function () {
      var c = current(), s = c.this_visit, f = c.first_touch || {};
      var pairs = {
        source_label: c.source_label,
        landing_page: s.landing_page || '',
        referrer: s.referrer || '',
        first_seen: (f.first_seen || s.first_seen || ''),
        first_touch_source: (f.source_label || '')
      };
      FIELDS.forEach(function (k) { pairs[k] = s[k] || ''; });
      Object.keys(pairs).forEach(function (k) {
        if (form.querySelector('[name="' + k + '"]')) return;
        var i = document.createElement('input');
        i.type = 'hidden'; i.name = k; i.value = pairs[k];
        form.appendChild(i);
      });
    });
  }

  function wireAll() { document.querySelectorAll('form').forEach(attach); }

  capture();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireAll);
  else wireAll();

  // Phone clicks are a lead too, and they are the ones nobody records.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a) return;
    if (typeof gtag === 'function') {
      gtag('event', 'phone_click', { source_label: current().source_label, page: location.pathname });
    }
  });

  window.vpwSource = current;   // open the console on any page and call vpwSource()
})();
