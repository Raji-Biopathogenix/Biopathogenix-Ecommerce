/* Shared behaviour for the Custom Assays and Molecular Research Solutions landing pages:
   left/right carousels and the quote form (posted to /api/panel-assessment like the other pages). */
(function () {
  'use strict';
  var CONTACT_EMAIL = 'order@biopathogenix.com';

  /* ---------- Carousels: [data-carousel] with a [data-track], prev/next, dots and optional tabs ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-track]');
    var items = Array.prototype.slice.call(track.children);
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dotsBox = root.querySelector('[data-dots]');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-tab]'));
    var dots = [];

    if (dotsBox) {
      items.forEach(function (item, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to item ' + (i + 1));
        b.addEventListener('click', function () { go(i); });
        dotsBox.appendChild(b);
        dots.push(b);
      });
    }

    function current() {
      var left = track.scrollLeft, best = 0, bestDist = Infinity;
      items.forEach(function (item, i) {
        var d = Math.abs(item.offsetLeft - track.offsetLeft - left);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }
    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
    function go(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }
    function update() {
      var i = current();
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = atEnd();
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
      });
    }

    if (prev) prev.addEventListener('click', function () { go(current() - 1); });
    if (next) next.addEventListener('click', function () { go(atEnd() ? items.length - 1 : current() + 1); });
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { go(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var n = (k + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          tabs[n].focus(); go(n);
        }
      });
    });
    var raf;
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Quote form ---------- */
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('button[type="submit"]');
    function show(kind, text) { msg.className = 'form-msg ' + kind; msg.textContent = text; msg.hidden = false; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var el = form.elements;
      var name = el.name.value.trim(), email = el.email.value.trim(), org = el.org.value.trim();
      var details = el.message.value.trim();
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        show('warn', 'Please add your name and a valid work email so we can reply.');
        return;
      }
      if (!window.BPXFormProtection) {
        show('warn', "We couldn't load the form. Please refresh the page, or email " + CONTACT_EMAIL + '.');
        return;
      }
      var payload = {
        name: name, email: email, org: org, phone: '',
        interest: form.dataset.interest,
        message: details || 'No additional details provided.',
        source: form.dataset.source
      };
      btn.disabled = true;
      msg.hidden = true;
      window.BPXFormProtection.fields(form).then(async function (protection) {
        return fetch(await window.BPXFormProtection.endpoint('/panel-assessment/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(Object.assign({}, payload, protection))
        });
      }).then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.message || ''); });
        show('ok', 'Thanks, ' + name.split(' ')[0] + '. Your request is in, and a BioPathogenix specialist will follow up at ' + email + '. We have also sent you a confirmation email.');
        form.reset();
        try { if (window.gtag) window.gtag('event', 'generate_lead', { form: form.dataset.source }); } catch (err) {}
      }).catch(function (err) {
        show('warn', (err && err.message ? err.message + ' ' : "We couldn't send your request. ") + 'Please try again, or email ' + CONTACT_EMAIL + '.');
      }).then(function () { btn.disabled = false; });
    });
  });
})();
