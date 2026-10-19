/* Shared by React forms and standalone landing pages. No secrets live here. */
(function () {
  'use strict';
  var configuration;
  var scriptReady;

  function config() {
    if (!configuration) {
      configuration = fetch('/api/form-protection-config', { cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) throw new Error('Unable to load spam protection. Please try again.');
          return response.json();
        }).catch(function (error) { configuration = null; throw error; });
    }
    return configuration;
  }

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (!scriptReady) {
      scriptReady = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.onload = resolve;
        script.onerror = function () {
          script.remove();
          scriptReady = null;
          reject(new Error('Unable to load spam protection. Please try again.'));
        };
        document.head.appendChild(script);
      });
    }
    return scriptReady;
  }

  function initialize(form) {
    if (form.elements.website) return;
    var trap = document.createElement('div');
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';
    var label = document.createElement('label');
    label.textContent = 'Leave this field empty';
    var input = document.createElement('input');
    input.name = 'website';
    input.type = 'text';
    input.tabIndex = -1;
    input.autocomplete = 'off';
    label.appendChild(input);
    trap.appendChild(label);
    form.appendChild(trap);
  }

  async function fields(form) {
    initialize(form);
    var website = form.elements.website.value;
    var settings = await config();
    if (!settings.site_key || website) return { website: website };
    await loadTurnstile();
    var container = document.createElement('div');
    container.style.gridColumn = '1 / -1';
    form.appendChild(container);
    // Generate a fresh token for every attempt, including retries after a server error.
    var token = await new Promise(function (resolve, reject) {
      var widget;
      var timer = setTimeout(function () { finish(new Error('Spam protection timed out. Please try again.')); }, 120000);
      function finish(error, value) {
        clearTimeout(timer);
        if (widget !== undefined) window.turnstile.remove(widget);
        container.remove();
        if (error) reject(error); else resolve(value);
      }
      try {
        widget = window.turnstile.render(container, {
          sitekey: settings.site_key,
          action: 'contact_form',
          appearance: 'interaction-only',
          callback: function (value) { finish(null, value); },
          'error-callback': function () { finish(new Error('Spam protection failed. Please try again.')); },
          'expired-callback': function () { finish(new Error('Spam protection expired. Please try again.')); }
        });
      } catch (error) { finish(error); }
    });
    return { website: website, turnstile_token: token };
  }

  window.BPXFormProtection = {
    initialize: initialize,
    fields: fields,
    endpoint: async function (path) {
      var settings = await config();
      return settings.api_base_url.replace(/\/$/, '') + path;
    }
  };
  document.querySelectorAll('form[data-spam-protected]').forEach(initialize);
})();
