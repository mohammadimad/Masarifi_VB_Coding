/**
 * Masarifi In-Page Visual Inspector
 * أداة الفحص البصري التفاعلية داخل الصفحة
 */
(function () {
  if (window.__MASARIFI_INSPECTOR_LOADED__) return;
  window.__MASARIFI_INSPECTOR_LOADED__ = true;

  let isInspectMode = false;
  let hoveredEl = null;
  let selectedEl = null;

  // Create Overlay Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'masarifi-inspector-styles';
  styleEl.textContent = `
    #masarifi-inspect-box {
      position: fixed;
      pointer-events: none;
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.15);
      z-index: 999990;
      transition: all 0.05s ease-out;
      border-radius: 4px;
      display: none;
    }
    #masarifi-inspect-tooltip {
      position: fixed;
      background: #1e1b4b;
      color: #e0e7ff;
      font-family: monospace, sans-serif;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 999995;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      white-space: nowrap;
      direction: ltr;
    }
    #masarifi-inspector-btn {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 999999;
      background: #3525cd;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 9999px;
      font-family: 'Cairo', sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(53, 37, 205, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    }
    #masarifi-inspector-btn:hover {
      background: #4338ca;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(53, 37, 205, 0.5);
    }
    #masarifi-inspector-btn.active {
      background: #ea580c;
      box-shadow: 0 6px 20px rgba(234, 88, 12, 0.4);
    }
    #masarifi-inspector-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      max-width: calc(100vw - 40px);
      max-height: 80vh;
      background: #ffffff;
      color: #1e1b4b;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      border: 1px solid #e0e7ff;
      z-index: 999998;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Cairo', sans-serif;
      direction: rtl;
    }
    .dark #masarifi-inspector-panel {
      background: #181824;
      color: #e2dfff;
      border-color: #2e2e42;
    }
    #masarifi-inspector-panel header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .dark #masarifi-inspector-panel header {
      background: #232234;
      border-color: #2e2e42;
    }
    #masarifi-inspector-panel .body {
      padding: 16px;
      overflow-y: auto;
      font-size: 13px;
    }
    .masarifi-badge {
      display: inline-block;
      padding: 2px 6px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      direction: ltr;
    }
    .dark .masarifi-badge {
      background: #312e81;
      color: #c7d2fe;
    }
    .masarifi-btn-action {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .masarifi-btn-action:hover {
      background: #e2e8f0;
    }
    .dark .masarifi-btn-action {
      background: #2a293d;
      color: #e2dfff;
      border-color: #3d3c56;
    }
    .dark .masarifi-btn-action:hover {
      background: #35344d;
    }
    .masarifi-input {
      width: 100%;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 12px;
      margin-top: 4px;
      box-sizing: border-box;
      direction: ltr;
      font-family: monospace;
    }
    .dark .masarifi-input {
      background: #12111c;
      border-color: #3d3c56;
      color: #fff;
    }
  `;
  document.head.appendChild(styleEl);

  // Inspector Elements
  const inspectBox = document.createElement('div');
  inspectBox.id = 'masarifi-inspect-box';
  document.body.appendChild(inspectBox);

  const tooltip = document.createElement('div');
  tooltip.id = 'masarifi-inspect-tooltip';
  document.body.appendChild(tooltip);

  // Floating Toggle Button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'masarifi-inspector-btn';
  toggleBtn.innerHTML = `<span>🔍</span><span>فحص العناصر</span>`;
  document.body.appendChild(toggleBtn);

  // Inspection Details Panel
  const panel = document.createElement('div');
  panel.id = 'masarifi-inspector-panel';
  panel.innerHTML = `
    <header>
      <div style="font-weight: bold; display: flex; align-items: center; gap: 6px;">
        <span>🎯 العنصر المحدد</span>
        <span id="masarifi-panel-tag" class="masarifi-badge"></span>
      </div>
      <button id="masarifi-panel-close" style="background:none; border:none; cursor:pointer; font-size:16px; color:inherit;">✕</button>
    </header>
    <div class="body">
      <!-- Breadcrumb / Selector -->
      <div style="margin-bottom: 12px;">
        <label style="font-weight: 600; font-size: 11px; color: #64748b;">مسار العنصر (CSS Selector):</label>
        <div id="masarifi-panel-selector" style="font-family: monospace; font-size: 11px; background:#f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 4px; word-break: break-all; direction: ltr;"></div>
      </div>

      <!-- Quick Actions -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button id="masarifi-copy-selector" class="masarifi-btn-action" style="flex:1;">
          📋 نسخ المحدد
        </button>
        <button id="masarifi-copy-prompt" class="masarifi-btn-action" style="flex:1; background: #4f46e5; color: white; border: none;">
          🤖 نسخ للذكاء الاصطناعي
        </button>
      </div>

      <!-- Classes -->
      <div style="margin-bottom: 12px;">
        <label style="font-weight: 600; font-size: 11px; color: #64748b;">فئات الـ CSS (Classes):</label>
        <textarea id="masarifi-input-classes" class="masarifi-input" rows="2"></textarea>
      </div>

      <!-- Live Tweaker -->
      <div style="font-weight: 700; margin-top: 14px; margin-bottom: 8px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
        ⚡ تعديل مباشر وتجربة حية:
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
        <div>
          <label style="font-size: 11px; color: #64748b;">لون الخلفية:</label>
          <input type="text" id="masarifi-tweak-bg" class="masarifi-input" placeholder="#ffffff or rgb(...)">
        </div>
        <div>
          <label style="font-size: 11px; color: #64748b;">لون النص:</label>
          <input type="text" id="masarifi-tweak-color" class="masarifi-input" placeholder="#000000">
        </div>
      </div>
      <div style="margin-bottom: 10px;">
        <label style="font-size: 11px; color: #64748b;">نص العنصر (Text Content):</label>
        <input type="text" id="masarifi-tweak-text" class="masarifi-input">
      </div>
      <div style="display: flex; gap: 6px; margin-top: 12px;">
        <button id="masarifi-tweak-hide" class="masarifi-btn-action" style="font-size: 11px;">
          👁️ إخفاء / إظهار
        </button>
        <button id="masarifi-tweak-remove" class="masarifi-btn-action" style="font-size: 11px; color: #ef4444;">
          🗑️ حذف مؤقتاً
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Helper: check if element is part of inspector UI
  function isInspectorElement(el) {
    return (
      el === inspectBox ||
      el === tooltip ||
      el === toggleBtn ||
      el === panel ||
      panel.contains(el) ||
      toggleBtn.contains(el)
    );
  }

  // Helper: generate full unique CSS selector
  function getCssSelector(el) {
    if (!(el instanceof Element)) return '';
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      if (el.id) {
        path.unshift('#' + el.id);
        break;
      }
      let selector = el.nodeName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const classes = el.className
          .trim()
          .split(/\s+/)
          .filter((c) => !c.startsWith('masarifi-') && !c.includes(':') && !c.includes('/'))
          .slice(0, 2);
        if (classes.length) selector += '.' + classes.join('.');
      }
      let sibling = el;
      let nth = 1;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.nodeName.toLowerCase() === el.nodeName.toLowerCase()) nth++;
      }
      if (nth > 1) selector += `:nth-of-type(${nth})`;
      path.unshift(selector);
      el = el.parentElement;
      if (el && el.tagName.toLowerCase() === 'body') break;
    }
    return path.join(' > ');
  }

  // Update Highlight Box
  function updateInspectBox(el) {
    if (!el) {
      inspectBox.style.display = 'none';
      tooltip.style.display = 'none';
      return;
    }
    const rect = el.getBoundingClientRect();
    inspectBox.style.display = 'block';
    inspectBox.style.top = `${rect.top}px`;
    inspectBox.style.left = `${rect.left}px`;
    inspectBox.style.width = `${rect.width}px`;
    inspectBox.style.height = `${rect.height}px`;

    // Tooltip
    tooltip.style.display = 'block';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const firstClass = el.classList.length ? `.${el.classList[0]}` : '';
    tooltip.textContent = `${tag}${id}${firstClass} | ${Math.round(rect.width)} × ${Math.round(rect.height)}px`;

    let tooltipTop = rect.top - 28;
    if (tooltipTop < 10) tooltipTop = rect.bottom + 8;
    tooltip.style.top = `${tooltipTop}px`;
    tooltip.style.left = `${Math.max(10, rect.left)}px`;
  }

  // Toggle Inspect Mode
  function setInspectMode(active) {
    isInspectMode = active;
    if (isInspectMode) {
      toggleBtn.classList.add('active');
      toggleBtn.innerHTML = `<span>⏹️</span><span>إيقاف الفحص</span>`;
      document.body.style.cursor = 'crosshair';
    } else {
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = `<span>🔍</span><span>فحص العناصر</span>`;
      document.body.style.cursor = '';
      updateInspectBox(null);
      hoveredEl = null;
    }
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setInspectMode(!isInspectMode);
  });

  // Mousemove for hover highlight
  document.addEventListener(
    'mousemove',
    (e) => {
      if (!isInspectMode) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || isInspectorElement(target)) {
        updateInspectBox(null);
        hoveredEl = null;
        return;
      }
      hoveredEl = target;
      updateInspectBox(target);
    },
    true
  );

  // Click to select and inspect
  document.addEventListener(
    'click',
    (e) => {
      if (!isInspectMode) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || isInspectorElement(target)) return;

      e.preventDefault();
      e.stopPropagation();

      selectedEl = target;
      openPanel(target);
      setInspectMode(false); // Stop inspecting on click
      updateInspectBox(selectedEl);
    },
    true
  );

  // Keyboard shortcut Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isInspectMode) setInspectMode(false);
      else closePanel();
    }
  });

  // Open Panel with Element Details
  function openPanel(el) {
    const computed = window.getComputedStyle(el);
    const selector = getCssSelector(el);

    document.getElementById('masarifi-panel-tag').textContent = `<${el.tagName.toLowerCase()}>`;
    document.getElementById('masarifi-panel-selector').textContent = selector;
    document.getElementById('masarifi-input-classes').value = el.className || '';

    // Live tweaker fields
    document.getElementById('masarifi-tweak-bg').value = computed.backgroundColor;
    document.getElementById('masarifi-tweak-color').value = computed.color;
    document.getElementById('masarifi-tweak-text').value = el.childElementCount === 0 ? el.textContent.trim() : '(يحتوي على عناصر فرعية)';

    panel.style.display = 'flex';
  }

  function closePanel() {
    panel.style.display = 'none';
    updateInspectBox(null);
    selectedEl = null;
  }

  document.getElementById('masarifi-panel-close').addEventListener('click', closePanel);

  // Copy Selector Action
  document.getElementById('masarifi-copy-selector').addEventListener('click', () => {
    if (!selectedEl) return;
    const selector = getCssSelector(selectedEl);
    navigator.clipboard.writeText(selector);
    const btn = document.getElementById('masarifi-copy-selector');
    btn.textContent = '✅ تم النسخ!';
    setTimeout(() => {
      btn.textContent = '📋 نسخ المحدد';
    }, 1500);
  });

  // Copy Prompt for AI
  document.getElementById('masarifi-copy-prompt').addEventListener('click', () => {
    if (!selectedEl) return;
    const selector = getCssSelector(selectedEl);
    const classes = selectedEl.className;
    const text = selectedEl.textContent.trim().slice(0, 100);
    const prompt = `أريد تعديل العنصر التالي في الصفحة:
- المحدد (Selector): ${selector}
- نوع الوسم: <${selectedEl.tagName.toLowerCase()}>
- الفئات الحالية (Classes): "${classes}"
- النص الظاهر: "${text}"

المطلوب:
[اكتب التعديل الذي تريده هنا، مثلاً: تغيير اللون أو الحجم أو مكان العنصر]`;

    navigator.clipboard.writeText(prompt);
    const btn = document.getElementById('masarifi-copy-prompt');
    btn.textContent = '✅ تم نسخ الطلب جاهزاً!';
    setTimeout(() => {
      btn.textContent = '🤖 نسخ للذكاء الاصطناعي';
    }, 1500);
  });

  // Real-time Class modification
  document.getElementById('masarifi-input-classes').addEventListener('input', (e) => {
    if (selectedEl) {
      selectedEl.className = e.target.value;
      updateInspectBox(selectedEl);
    }
  });

  // Real-time Style Tweaks
  document.getElementById('masarifi-tweak-bg').addEventListener('input', (e) => {
    if (selectedEl) selectedEl.style.backgroundColor = e.target.value;
  });
  document.getElementById('masarifi-tweak-color').addEventListener('input', (e) => {
    if (selectedEl) selectedEl.style.color = e.target.value;
  });
  document.getElementById('masarifi-tweak-text').addEventListener('input', (e) => {
    if (selectedEl && selectedEl.childElementCount === 0) selectedEl.textContent = e.target.value;
  });
  document.getElementById('masarifi-tweak-hide').addEventListener('click', () => {
    if (selectedEl) {
      selectedEl.style.display = selectedEl.style.display === 'none' ? '' : 'none';
      updateInspectBox(selectedEl.style.display === 'none' ? null : selectedEl);
    }
  });
  document.getElementById('masarifi-tweak-remove').addEventListener('click', () => {
    if (selectedEl) {
      selectedEl.remove();
      closePanel();
    }
  });
})();
