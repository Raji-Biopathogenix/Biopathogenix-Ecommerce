/* Custom qPCR assay request form: posts multipart (with an optional file) to /api/panel-assessment
   like the other landing pages. The team email goes to support@ (BCC internal); the submitter gets a confirmation. */
(function () {
  'use strict';
  var CONTACT_EMAIL = 'support@biopathogenix.com';
  var form = document.getElementById('assay-request');
  if (!form) return;
  var msg = form.querySelector('.form-msg');
  var btn = form.querySelector('button[type="submit"]');
  var fileInput = form.elements.target_file;
  var fileLabel = form.querySelector('[data-file-label]');

  function show(kind, text) { msg.className = 'form-msg ' + kind; msg.textContent = text; msg.hidden = false; }

  fileInput.addEventListener('change', function () {
    fileLabel.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Upload File';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = form.elements;
    var name = el.name.value.trim(), email = el.email.value.trim(), targets = el.targets.value.trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      show('warn', 'Please add your name and a valid work email so we can reply.');
      return;
    }
    if (!targets && !fileInput.files[0]) {
      show('warn', 'Please list the targets you want to detect, or attach a file with them.');
      return;
    }
    var file = fileInput.files[0];
    if (file && (file.size > 3 * 1024 * 1024 || !/\.(xlsx?|pdf|docx?|csv)$/i.test(file.name))) {
      show('warn', 'Upload an Excel, PDF, Word, or CSV file no larger than 3 MB.');
      return;
    }
    if (!window.BPXFormProtection) {
      show('warn', "We couldn't load the form. Please refresh the page, or email " + CONTACT_EMAIL + '.');
      return;
    }

    var checked = form.querySelector('input[name="format"]:checked');
    var lines = [
      'Targets: ' + (targets || 'See attached file'),
      'Preferred format: ' + (checked ? checked.value : 'Not specified')
    ];
    [['sample_type', 'Sample type'], ['instrument', 'qPCR instrument'], ['timeline', 'Needed running by'], ['volume', 'Expected volume']].forEach(function (f) {
      lines.push(f[1] + ': ' + (el[f[0]].value.trim() || 'Not specified'));
    });
    lines.push('NDA requested: ' + (el.nda.checked ? 'Yes' : 'No'));
    if (file) lines.push('Attachment: ' + file.name);

    var data = new FormData();
    data.set('name', name);
    data.set('email', email);
    data.set('org', el.org.value.trim());
    data.set('phone', el.phone.value.trim());
    data.set('interest', 'Custom multiplex qPCR assay');
    data.set('message', lines.join('\n'));
    data.set('source', 'qpcr-assays');
    if (file) data.set('target_file', file);

    btn.disabled = true;
    msg.hidden = true;
    window.BPXFormProtection.fields(form).then(async function (protection) {
      Object.keys(protection).forEach(function (k) { data.set(k, protection[k]); });
      return fetch(await window.BPXFormProtection.endpoint('/panel-assessment/'), { method: 'POST', body: data });
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.message || ''); });
      show('ok', 'Thanks, ' + name.split(' ')[0] + '. Your request is in, and a BioPathogenix scientist will reply to ' + email + ' within 24 hours. We have also sent you a confirmation email.');
      form.reset();
      fileLabel.textContent = 'Upload File';
      try { if (window.gtag) window.gtag('event', 'generate_lead', { form: 'qpcr-assays' }); } catch (err) {}
    }).catch(function (err) {
      show('warn', (err && err.message ? err.message + ' ' : "We couldn't send your request. ") + 'Please try again, or email ' + CONTACT_EMAIL + '.');
    }).then(function () { btn.disabled = false; });
  });
})();
