(function () {
  var form = document.querySelector('form[aria-label="Custom assay request"]');
  if (!form) return;
  var status = document.getElementById('assay-form-status');
  var submit = form.querySelector('button[type="submit"]');
  var formats = form.querySelectorAll('button[aria-pressed]');
  var selectedFormat = 'Lyophilized';
  var activeStyle = formats[1].getAttribute('style');
  var inactiveStyle = formats[0].getAttribute('style');
  formats.forEach(function (button) {
    button.addEventListener('click', function () {
      selectedFormat = button.querySelector('strong').textContent;
      formats.forEach(function (item) {
        var active = item === button;
        item.setAttribute('aria-pressed', String(active));
        item.setAttribute('style', active ? activeStyle : inactiveStyle);
      });
    });
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;
    status.hidden = false;
    status.textContent = 'Sending your request...';
    submit.disabled = true;
    try {
      var data = new FormData(form);
      var file = form.elements.target_file.files[0];
      if (file && (file.size > 3 * 1024 * 1024 || !/\.(xlsx?|pdf|docx?|csv)$/i.test(file.name))) {
        throw new Error('Upload an Excel, PDF, Word, or CSV file no larger than 3 MB.');
      }
      if (!file) data.delete('target_file');
      var details = ['Targets: ' + form.elements.targets.value.trim(), 'Preferred format: ' + selectedFormat];
      ['sample_type', 'instrument', 'timeline', 'volume'].forEach(function (name) {
        var field = form.elements[name];
        details.push(field.closest('label').childNodes[0].textContent.trim() + ': ' + (field.selectedIndex ? field.value : 'Not specified'));
      });
      details.push('NDA requested: ' + (form.elements.nda.checked ? 'Yes' : 'No'));
      data.set('message', details.join('\n'));
      data.set('interest', 'Custom multiplex qPCR assay development');
      data.set('source', 'custom-assay-development');
      var response = await fetch('/api/panel-assessment', { method: 'POST', body: data });
      var result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to send your request. Please try again.');
      window.location.assign('/traceable-asset-panel/bpx-thank-you-custom-assay');
    } catch (error) {
      status.textContent = error.message || 'Unable to send your request. Please try again.';
      submit.disabled = false;
    }
  });
})();
