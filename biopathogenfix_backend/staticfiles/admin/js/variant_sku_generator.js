// (function () {
//   "use strict";

//   let isSaving = false;  // flag to freeze SKU data during save

//   function init() {
//     const container = document.getElementById("variant-checkboxes");
//     if (!container) { setTimeout(init, 100); return; }

//     const variantsData    = window.VARIANTS_DATA || [];
//     const selectedOptions = new Set(window.SELECTED_OPTIONS || []);

//     if (variantsData.length) {
//       renderVariantCheckboxes(variantsData, selectedOptions);
//       generateSKUPreview();
//     }

//     //  Catch form submit via multiple hooks — Django admin Save button
//     // may use different submit paths
//     const form = document.querySelector("form");
//     if (form) {
//       // Hook 1: standard submit event
//       form.addEventListener("submit", syncFromDOM);

//       // Hook 2: catch Django's _save, _continue, _addanother input clicks
//       form.addEventListener("click", function (e) {
//         const name = e.target.name || "";
//         if (name.startsWith("_")) {
//           isSaving = true;   // freeze — stop any regeneration
//           syncFromDOM();
//         }
//       });
//     }

//     watchCategoryChange();
//   }

//   document.addEventListener("DOMContentLoaded", init);

//   //  Read price/stock from DOM inputs → update _currentSkuData → sync hidden input
//   function syncFromDOM() {
//     if (!window._currentSkuData || !window._currentSkuData.length) return;

//     window._currentSkuData.forEach((sku, idx) => {
//       const priceEl = document.querySelector(`.sku-price-input[data-idx="${idx}"]`);
//       const stockEl = document.querySelector(`.sku-stock-input[data-idx="${idx}"]`);
//       const low_stockEl = document.querySelector(`.sku-low_stock-input[data-idx="${idx}"]`);

//       if (priceEl) sku.price = priceEl.value || "0.00";
//       if (stockEl) sku.stock = parseInt(stockEl.value) || 0;
//       if (low_stockEl) sku.low_stock = parseInt(low_stockEl.value) || 0;

//     });

//     const hiddenSkus = document.getElementById("sku_combinations");
//     if (hiddenSkus) hiddenSkus.value = JSON.stringify(window._currentSkuData);
//   }

//   // Watch category widget 
//   function watchCategoryChange() {
//     const interval = setInterval(function () {
//       const selected = document.getElementById("id_categories_to");
//       if (!selected) return;
//       clearInterval(interval);
//       selected.addEventListener("change", onCategoryChange);
//       const observer = new MutationObserver(onCategoryChange);
//       observer.observe(selected, { childList: true });
//     }, 100);
//   }

//   function onCategoryChange() {
//     const selected    = document.getElementById("id_categories_to");
//     if (!selected) return;
//     const categoryIds = Array.from(selected.options).map(o => String(o.value));
//     const allVariants = window.ALL_VARIANTS_DATA || {};
//     const checkboxContainer = document.getElementById("variant-checkboxes");

//     if (!categoryIds.length) {
//       checkboxContainer.innerHTML = '<p style="color:#999; font-size:13px;">Please select a category above to load variants.</p>';
//       const preview = document.getElementById("sku-preview-section");
//       if (preview) preview.style.display = "none";
//       return;
//     }

//     const seen = new Set();
//     const variants = [];
//     categoryIds.forEach(catId => {
//       (allVariants[catId] || []).forEach(v => {
//         if (!seen.has(v.id)) { seen.add(v.id); variants.push(v); }
//       });
//     });

//     const currentlyChecked = new Set(
//       Array.from(document.querySelectorAll(".variant-option-cb:checked"))
//         .map(cb => parseInt(cb.dataset.optionId))
//     );

//     if (!variants.length) {
//       checkboxContainer.innerHTML = '<p style="color:#999; font-size:13px;">No variants found for selected category.</p>';
//       return;
//     }

//     renderVariantCheckboxes(variants, currentlyChecked);
//     generateSKUPreview();
//   }

//   // Render Checkboxes 
//   function renderVariantCheckboxes(variantsData, selectedOptions) {
//     const container = document.getElementById("variant-checkboxes");
//     if (!container) return;
//     container.innerHTML = "";

//     variantsData.forEach((variant) => {
//       const section = document.createElement("div");
//       section.style.cssText = "margin-bottom:16px; padding:14px 16px; border:1px solid #e0e0e0; border-radius:6px; background:#fafafa;";
//       section.innerHTML = `
//         <div style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
//           <strong style="font-size:13px; color:#333; min-width:120px;">${variant.name}</strong>
//           <label style="font-size:12px; color:#666; cursor:pointer; display:flex; align-items:center; gap:4px;">
//             <input type="checkbox" class="select-all-toggle" data-variant-id="${variant.id}" style="margin:0;">
//             Select All
//           </label>
//         </div>
//         <div class="options-row" style="display:flex; flex-wrap:wrap; gap:8px;">
//           ${variant.options.map(opt => `
//             <label class="option-chip" style="
//               display:inline-flex; align-items:center; gap:6px;
//               padding:5px 14px; border-radius:20px; cursor:pointer;
//               border:2px solid #ccc; background:#fff;
//               font-size:13px; font-weight:500; user-select:none;
//               transition:all 0.15s ease;">
//               <input type="checkbox"
//                 class="variant-option-cb"
//                 data-variant-id="${variant.id}"
//                 data-option-id="${opt.id}"
//                 data-option-value="${opt.value}"
//                 ${selectedOptions.has(opt.id) ? "checked" : ""}
//                 style="display:none;">
//               ${opt.value}
//             </label>
//           `).join("")}
//         </div>
//       `;
//       container.appendChild(section);
//     });

//     styleCheckedChips();

//     // attach click/change directly on each section (no clone trick)
//     container.querySelectorAll(".option-chip").forEach(chip => {
//       chip.addEventListener("click", function () {
//         const cb = chip.querySelector(".variant-option-cb");
//         if (!cb) return;
//         cb.checked = !cb.checked;
//         styleCheckedChips();
//         generateSKUPreview();
//         syncSelectAllToggle(cb.dataset.variantId);
//       });
//     });

//     container.querySelectorAll(".select-all-toggle").forEach(toggle => {
//       toggle.addEventListener("change", function () {
//         const variantId = toggle.dataset.variantId;
//         container.querySelectorAll(`.variant-option-cb[data-variant-id="${variantId}"]`)
//           .forEach(cb => cb.checked = toggle.checked);
//         styleCheckedChips();
//         generateSKUPreview();
//       });
//     });
//   }

//   function styleCheckedChips() {
//     document.querySelectorAll(".option-chip").forEach(label => {
//       const cb = label.querySelector(".variant-option-cb");
//       if (cb && cb.checked) {
//         label.style.background  = "#1a73e8";
//         label.style.color       = "#fff";
//         label.style.borderColor = "#1a73e8";
//       } else {
//         label.style.background  = "#fff";
//         label.style.color       = "#444";
//         label.style.borderColor = "#ccc";
//       }
//     });
//   }

//   function syncSelectAllToggle(variantId) {
//     const checkboxes = document.querySelectorAll(`.variant-option-cb[data-variant-id="${variantId}"]`);
//     const toggle     = document.querySelector(`.select-all-toggle[data-variant-id="${variantId}"]`);
//     if (toggle) toggle.checked = Array.from(checkboxes).every(cb => cb.checked);
//   }

//   //  Generate SKU combinations 
//   function generateSKUPreview() {
//     if (isSaving) return;
//     const allChecked = document.querySelectorAll(".variant-option-cb:checked");
//     const variantMap = {};

//     allChecked.forEach(cb => {
//       const vid = cb.dataset.variantId;
//       if (!variantMap[vid]) variantMap[vid] = [];
//       variantMap[vid].push({ id: parseInt(cb.dataset.optionId), value: cb.dataset.optionValue });
//     });

//     const groups      = Object.values(variantMap);
//     const selectedIds = Array.from(allChecked).map(cb => cb.dataset.optionId);

//     const hiddenSelected = document.getElementById("selected_variant_options");
//     if (hiddenSelected) hiddenSelected.value = selectedIds.join(","); //  empty string if none selected

//     const previewSection = document.getElementById("sku-preview-section");
//     const previewBody    = document.getElementById("sku-preview-body");

//     if (!groups.length) {
//       if (previewSection) previewSection.style.display = "none";
//       window._currentSkuData = [];
//       //  Clear sku_combinations so backend deletes all SKUs
//       const hiddenSkus = document.getElementById("sku_combinations");
//       if (hiddenSkus) hiddenSkus.value = "[]";
//       return;
//     }

//     const combinations = cartesian(groups);
//     const existingSkus = collectExistingSkus();

//     window._currentSkuData = combinations.map(combo => {
//       const skuCode  = combo.map(opt => opt.value).join("-");
//       const existing = existingSkus[skuCode] || {};
//       return {
//         sku_code  : skuCode,
//         option_ids: combo.map(opt => opt.id),
//         price     : existing.price !== undefined ? existing.price : "0.00",
//         stock     : existing.stock !== undefined ? existing.stock : 0,
//         low_stock     : existing.low_stock !== undefined ? existing.low_stock : 0,

//       };
//     });

//     if (previewSection) previewSection.style.display = "block";

//     if (previewBody) {
//       previewBody.innerHTML = window._currentSkuData.map((sku, idx) => `
//         <tr>
//           <td style="padding:8px; border:1px solid #ddd; font-weight:500;">${sku.sku_code}</td>
//           <td style="padding:8px; border:1px solid #ddd;">
//             <input type="number" step="0.01" min="0"
//               class="sku-price-input" data-idx="${idx}" value="${sku.price}"
//               style="width:110px; padding:5px; border:1px solid #ccc; border-radius:4px;">
//           </td>
//           <td style="padding:8px; border:1px solid #ddd;">
//             <input type="number" min="0"
//               class="sku-stock-input" data-idx="${idx}" value="${sku.stock}"
//               style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
//           </td>
//           <td style="padding:8px; border:1px solid #ddd;">
//             <input type="number" min="0"
//               class="sku-low_stock-input" data-idx="${idx}" value="${sku.low_stock_threshold}"
//               style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
//           </td>
//         </tr>
//       `).join("");
//     }

//     // Just sync the hidden input with default values — do NOT read from DOM yet
//     const hiddenSkus = document.getElementById("sku_combinations");
//     if (hiddenSkus) hiddenSkus.value = JSON.stringify(window._currentSkuData);
//   }

//   function collectExistingSkus() {
//     const result = {};

//     // Read from our own preview table inputs only
//     // This preserves typed price/stock when user checks/unchecks options
//     document.querySelectorAll(".sku-price-input").forEach(priceEl => {
//       const idx     = parseInt(priceEl.dataset.idx);
//       const stockEl = document.querySelector(`.sku-stock-input[data-idx="${idx}"]`);
//       const low_stockEl = document.querySelector(`.sku-low_stock-input[data-idx="${idx}"]`);
//       const skuData = window._currentSkuData;
//       if (skuData && skuData[idx]) {
//         result[skuData[idx].sku_code] = {
//           price: priceEl.value || "0.00",
//           stock: stockEl ? parseInt(stockEl.value) || 0 : 0,
//           low_stock: low_stockEl? parseInt(low_stockEl.value) || 0 : 0,
//         };
//       }
//     });

//     return result;
//   }

//   function cartesian(groups) {
//     return groups.reduce(
//       (acc, group) => acc.flatMap(combo => group.map(opt => [...combo, opt])),
//       [[]]
//     );
//   }

// })();


(function () {
  "use strict";

  let isSaving = false;

  function init() {
    const container = document.getElementById("variant-checkboxes");
    if (!container) { setTimeout(init, 100); return; }

    const variantsData = readJsonData("variants-data-json", []);
    const selectedOptions = new Set(readJsonData("selected-options-json", []));
    const allVariantsData = readJsonData("all-variants-json", {});
    const refreshVariants = () => {
      const selectedCategoryIds = getSelectedCategoryIds();
      const variantsToRender = filterVariantsByCategories(
        flattenVariants(allVariantsData),
        selectedCategoryIds
      );

      if (variantsToRender.length) {
        renderVariantCheckboxes(variantsToRender, selectedOptions);
        generateSKUPreview();
      } else {
        renderEmptyVariantState(selectedCategoryIds.length);
      }
    };

    refreshVariants();

    const form = document.querySelector("form");
    if (form) {
      form.addEventListener("submit", syncFromDOM);
      form.addEventListener("click", function (e) {
        const name = e.target.name || "";
        if (name.startsWith("_")) {
          isSaving = true;
          syncFromDOM();
        }
      });
    }

    watchCategoryChange(refreshVariants);
  }

  document.addEventListener("DOMContentLoaded", init);

  function syncFromDOM() {
    if (!window._currentSkuData || !window._currentSkuData.length) return;

    window._currentSkuData.forEach((sku, idx) => {
      const skuCodeEl   = document.querySelector(`.sku-code-input[data-idx="${idx}"]`);
      const priceEl     = document.querySelector(`.sku-price-input[data-idx="${idx}"]`);
      const stockEl     = document.querySelector(`.sku-stock-input[data-idx="${idx}"]`);
      const lowStockEl  = document.querySelector(`.sku-low_stock-input[data-idx="${idx}"]`);
      const weightEl    = document.querySelector(`.sku-weight-input[data-idx="${idx}"]`);
      const lengthEl    = document.querySelector(`.sku-length-input[data-idx="${idx}"]`);
      const widthEl     = document.querySelector(`.sku-width-input[data-idx="${idx}"]`);
      const heightEl    = document.querySelector(`.sku-height-input[data-idx="${idx}"]`);

      if (skuCodeEl)  sku.sku_code  = skuCodeEl.value.trim() || sku.sku_code;
      if (priceEl)    sku.price     = priceEl.value || "0.00";
      if (stockEl)    sku.stock     = parseInt(stockEl.value) || 0;
      if (lowStockEl) sku.low_stock = parseInt(lowStockEl.value) || 0;
      if (weightEl)   sku.weight    = parseFloat(weightEl.value) || 0;
      if (lengthEl)   sku.length    = parseFloat(lengthEl.value) || 0;
      if (widthEl)    sku.width     = parseFloat(widthEl.value)  || 0;
      if (heightEl)   sku.height    = parseFloat(heightEl.value) || 0;
    });

    const hiddenSkus = document.getElementById("sku_combinations");
    if (hiddenSkus) hiddenSkus.value = JSON.stringify(window._currentSkuData);
  }

  function buildServerSkuMap() {
    const result = {};
    readJsonData("existing-skus-json", []).forEach(sku => {
      const key = sku.option_ids.slice().sort((a, b) => a - b).join(",");
      result[key] = sku;
    });
    return result;
  }

  function watchCategoryChange(onChange) {
    const interval = setInterval(function () {
      const sources = getCategorySelectElements();
      if (!sources.length) return;
      clearInterval(interval);
      sources.forEach((select) => {
        select.addEventListener("change", function () {
          onCategoryChange();
          onChange();
        });
      });
      const observer = new MutationObserver(onCategoryChange);
      sources.forEach((select) => {
        observer.observe(select, { childList: true, subtree: true });
      });

      let lastSignature = "";
      setInterval(function () {
        const signature = getSelectedCategoryIds().join(",");
        if (signature !== lastSignature) {
          lastSignature = signature;
          onChange();
        }
      }, 250);
    }, 100);
  }

  function onCategoryChange() {
    const checkboxContainer = document.getElementById("variant-checkboxes");
    const allVariants = readJsonData("all-variants-json", {});
    const variants = filterVariantsByCategories(flattenVariants(allVariants), getSelectedCategoryIds());

    const currentlyChecked = new Set(
      Array.from(document.querySelectorAll(".variant-option-cb:checked"))
        .map(cb => parseInt(cb.dataset.optionId))
    );

    if (!variants.length) {
      renderEmptyVariantState(getSelectedCategoryIds().length);
      return;
    }

    renderVariantCheckboxes(variants, currentlyChecked);
    generateSKUPreview();
  }

  function getSelectedCategoryIds() {
    const ids = new Set();

    // filter_horizontal right panel: ALL options present = selected
    const toPanel = document.getElementById("id_categories_to");
    if (toPanel) {
      Array.from(toPanel.options).forEach((option) => {
        if (option.value !== "") ids.add(String(option.value));
      });
      return Array.from(ids);
    }

    // fallback for plain <select multiple>
    getCategorySelectElements().forEach((select) => {
      Array.from(select.options).forEach((option) => {
        if (option.selected && option.value !== "") ids.add(String(option.value));
      });
    });

    return Array.from(ids);
  }

  function getCategorySelectElements() {
    const selectors = [
      "#id_categories_to",
      "#id_categories",
      'select[name="categories"]',
    ];

    const elements = [];
    selectors.forEach((selector) => {
      const el = document.querySelector(selector);
      if (el && !elements.includes(el)) {
        elements.push(el);
      }
    });
    return elements;
  }

  function filterVariantsByCategories(variants, selectedCategoryIds) {
    if (!selectedCategoryIds.length) return [];

    const categorySet = new Set(selectedCategoryIds.map(String));
    const descendantMap = readJsonData("category-descendants-json", {});
    selectedCategoryIds.forEach((categoryId) => {
      (descendantMap[String(categoryId)] || []).forEach((childId) => {
        categorySet.add(String(childId));
      });
    });

    return variants.filter(variant => {
      const categoryId = variant.category_id === null || variant.category_id === undefined
        ? "null"
        : String(variant.category_id);
      return categorySet.has(categoryId);
    });
  }

  function renderEmptyVariantState(hasSelectedCategories) {
    const checkboxContainer = document.getElementById("variant-checkboxes");
    if (!checkboxContainer) return;
    checkboxContainer.innerHTML = hasSelectedCategories
      ? '<p style="color:#999; font-size:13px;">No variants found for selected category.</p>'
      : '<p style="color:#999; font-size:13px;">Please select a category above to load variants.</p>';
  }

  function flattenVariants(allVariants) {
    const seen = new Set();
    const variants = [];

    (allVariants["null"] || []).forEach((variant) => {
      if (!seen.has(variant.id)) {
        seen.add(variant.id);
        variants.push({ ...variant, category_id: null });
      }
    });

    Object.keys(allVariants).forEach((catId) => {
      if (catId === "null") return;
      (allVariants[catId] || []).forEach((variant) => {
        if (!seen.has(variant.id)) {
          seen.add(variant.id);
          variants.push({ ...variant, category_id: catId });
        }
      });
    });

    return variants;
  }

  function readJsonData(elementId, fallback) {
    const el = document.getElementById(elementId);
    if (!el) return fallback;
    try {
      return JSON.parse(el.textContent || el.innerText || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  }

  function renderVariantCheckboxes(variantsData, selectedOptions) {
    const container = document.getElementById("variant-checkboxes");
    if (!container) return;
    container.innerHTML = "";

    variantsData.forEach((variant) => {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom:16px; padding:14px 16px; border:1px solid #e0e0e0; border-radius:6px; background:#fafafa;";
      section.innerHTML = `
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
          <strong style="font-size:13px; color:#333; min-width:120px;">${variant.name}</strong>
          <label style="font-size:12px; color:#666; cursor:pointer; display:flex; align-items:center; gap:4px;">
            <input type="checkbox" class="select-all-toggle" data-variant-id="${variant.id}" style="margin:0;">
            Select All
          </label>
        </div>
        <div class="options-row" style="display:flex; flex-wrap:wrap; gap:8px;">
          ${variant.options.map(opt => `
            <label class="option-chip" style="
              display:inline-flex; align-items:center; gap:6px;
              padding:5px 14px; border-radius:20px; cursor:pointer;
              border:2px solid #ccc; background:#fff;
              font-size:13px; font-weight:500; user-select:none;
              transition:all 0.15s ease;">
              <input type="checkbox"
                class="variant-option-cb"
                data-variant-id="${variant.id}"
                data-option-id="${opt.id}"
                data-option-value="${opt.value}"
                ${selectedOptions.has(opt.id) ? "checked" : ""}
                style="display:none;">
              ${opt.value}
            </label>
          `).join("")}
        </div>
      `;
      container.appendChild(section);
    });

    styleCheckedChips();

    container.querySelectorAll(".option-chip").forEach(chip => {
      chip.addEventListener("click", function () {
        const cb = chip.querySelector(".variant-option-cb");
        if (!cb) return;
        cb.checked = !cb.checked;
        styleCheckedChips();
        generateSKUPreview();
        syncSelectAllToggle(cb.dataset.variantId);
      });
    });

    container.querySelectorAll(".select-all-toggle").forEach(toggle => {
      toggle.addEventListener("change", function () {
        const variantId = toggle.dataset.variantId;
        container.querySelectorAll(`.variant-option-cb[data-variant-id="${variantId}"]`)
          .forEach(cb => cb.checked = toggle.checked);
        styleCheckedChips();
        generateSKUPreview();
      });
    });
  }

  function styleCheckedChips() {
    document.querySelectorAll(".option-chip").forEach(label => {
      const cb = label.querySelector(".variant-option-cb");
      if (cb && cb.checked) {
        label.style.background  = "#1a73e8";
        label.style.color       = "#fff";
        label.style.borderColor = "#1a73e8";
      } else {
        label.style.background  = "#fff";
        label.style.color       = "#444";
        label.style.borderColor = "#ccc";
      }
    });
  }

  function syncSelectAllToggle(variantId) {
    const checkboxes = document.querySelectorAll(`.variant-option-cb[data-variant-id="${variantId}"]`);
    const toggle     = document.querySelector(`.select-all-toggle[data-variant-id="${variantId}"]`);
    if (toggle) toggle.checked = Array.from(checkboxes).every(cb => cb.checked);
  }

  function generateSKUPreview() {
    if (isSaving) return;
    const allChecked = document.querySelectorAll(".variant-option-cb:checked");
    const variantMap = {};

    allChecked.forEach(cb => {
      const vid = cb.dataset.variantId;
      if (!variantMap[vid]) variantMap[vid] = [];
      variantMap[vid].push({ id: parseInt(cb.dataset.optionId), value: cb.dataset.optionValue });
    });

    const groups      = Object.values(variantMap);
    const selectedIds = Array.from(allChecked).map(cb => cb.dataset.optionId);

    const hiddenSelected = document.getElementById("selected_variant_options");
    if (hiddenSelected) hiddenSelected.value = selectedIds.join(",");

    const previewSection = document.getElementById("sku-preview-section");
    const previewBody    = document.getElementById("sku-preview-body");

    if (!groups.length) {
      if (previewSection) previewSection.style.display = "none";
      window._currentSkuData = [];
      const hiddenSkus = document.getElementById("sku_combinations");
      if (hiddenSkus) hiddenSkus.value = "[]";
      return;
    }

    const combinations  = cartesian(groups);
    const existingSkus  = collectExistingSkus();   // keyed by sorted option_ids string
    const serverSkuMap  = buildServerSkuMap();      // keyed by sorted option_ids string

    window._currentSkuData = combinations.map(combo => {
      const optionIds = combo.map(opt => opt.id).sort((a, b) => a - b);
      const optionKey = optionIds.join(",");
      const autoCode  = combo.map(opt => opt.value).join("-");
      const existing  = existingSkus[optionKey] || serverSkuMap[optionKey] || {};
      return {
        combination_label: combo.map(opt => opt.value).join(" + "),
        sku_code  : existing.sku_code  !== undefined ? existing.sku_code  : autoCode,
        option_ids: combo.map(opt => opt.id),
        price     : existing.price     !== undefined ? existing.price     : "0.00",
        stock     : existing.stock     !== undefined ? existing.stock     : 0,
        low_stock : existing.low_stock !== undefined ? existing.low_stock : 0,
        weight    : existing.weight    !== undefined ? existing.weight    : 0,
        length    : existing.length    !== undefined ? existing.length    : 0,
        width     : existing.width     !== undefined ? existing.width     : 0,
        height    : existing.height    !== undefined ? existing.height    : 0,
      };
    });

    if (previewSection) previewSection.style.display = "block";

    if (previewBody) {
      previewBody.innerHTML = window._currentSkuData.map((sku, idx) => `
        <tr>
          <td style="padding:8px; border:1px solid #ddd; background:#f9f9f9; font-size:12px; color:#444; white-space:nowrap; font-weight:500;">
            ${sku.combination_label}
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="text" class="sku-code-input" data-idx="${idx}" value="${sku.sku_code}"
              style="width:200px; padding:5px; border:1px solid #ccc; border-radius:4px; font-weight:500; font-size:13px;">
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="number" step="0.01" min="0"
              class="sku-price-input" data-idx="${idx}" value="${sku.price}"
              style="width:110px; padding:5px; border:1px solid #ccc; border-radius:4px;">
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="number" min="0"
              class="sku-stock-input" data-idx="${idx}" value="${sku.stock}"
              style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="number" min="0"
              class="sku-low_stock-input" data-idx="${idx}" value="${sku.low_stock}"
              style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="number" min="0"
              class="sku-weight-input" data-idx="${idx}" value="${sku.weight}"
              style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="number" min="0"
              class="sku-length-input" data-idx="${idx}" value="${sku.length}"
              style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="number" min="0"
              class="sku-width-input" data-idx="${idx}" value="${sku.width}"
              style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
          </td>
          <td style="padding:8px; border:1px solid #ddd;">
            <input type="number" min="0"
              class="sku-height-input" data-idx="${idx}" value="${sku.height}"
              style="width:90px; padding:5px; border:1px solid #ccc; border-radius:4px;">
          </td>
        </tr>
      `).join("");
    }

    const hiddenSkus = document.getElementById("sku_combinations");
    if (hiddenSkus) hiddenSkus.value = JSON.stringify(window._currentSkuData);
  }

  function collectExistingSkus() {
    const result  = {};
    const skuData = window._currentSkuData;
    if (!skuData) return result;

    document.querySelectorAll(".sku-price-input").forEach(priceEl => {
      const idx        = parseInt(priceEl.dataset.idx);
      const skuCodeEl  = document.querySelector(`.sku-code-input[data-idx="${idx}"]`);
      const stockEl    = document.querySelector(`.sku-stock-input[data-idx="${idx}"]`);
      const lowStockEl = document.querySelector(`.sku-low_stock-input[data-idx="${idx}"]`);
      const weightEl   = document.querySelector(`.sku-weight-input[data-idx="${idx}"]`);
      const lengthEl   = document.querySelector(`.sku-length-input[data-idx="${idx}"]`);
      const widthEl    = document.querySelector(`.sku-width-input[data-idx="${idx}"]`);
      const heightEl   = document.querySelector(`.sku-height-input[data-idx="${idx}"]`);

      if (skuData[idx]) {
        const optionKey = skuData[idx].option_ids.slice().sort((a, b) => a - b).join(",");
        result[optionKey] = {
          sku_code : skuCodeEl  ? skuCodeEl.value.trim()        : skuData[idx].sku_code,
          price    : priceEl.value || "0.00",
          stock    : stockEl    ? parseInt(stockEl.value)    || 0 : 0,
          low_stock: lowStockEl ? parseInt(lowStockEl.value) || 0 : 0,
          weight   : weightEl   ? parseFloat(weightEl.value) || 0 : 0,
          length   : lengthEl   ? parseFloat(lengthEl.value) || 0 : 0,
          width    : widthEl    ? parseFloat(widthEl.value)  || 0 : 0,
          height   : heightEl   ? parseFloat(heightEl.value) || 0 : 0,
        };
      }
    });
    return result;
  }

  function cartesian(groups) {
    return groups.reduce(
      (acc, group) => acc.flatMap(combo => group.map(opt => [...combo, opt])),
      [[]]
    );
  }

})();
