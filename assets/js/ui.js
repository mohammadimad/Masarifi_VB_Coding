/**
 * ==============================================================================
 * طبقة العرض والواجهة التفاعلية (assets/js/ui.js)
 * ==============================================================================
 * الوظائف الأساسية:
 * 1. تنسيق التواريخ آلياً: عرض "اليوم" إذا أضيف المصروف في نفس اليوم، أو صيغة YYYY-MM-DD.
 * 2. تنسيق العملات والمبالغ المالية ($X,XXX.XX).
 * 3. رسم قائمة المصروفات (renderExpensesList) وتحديث DOM بدون إعادة تحميل الصفحة.
 * 4. تحديث بطاقات ملخص لوحة التحكم (المتبقي، الميزانية، إجمالي المصروفات).
 * 5. تحديث شريط التقدم لاستهلاك الميزانية ديناميكياً مع تلوينه بالأحمر عند التجاوز (> 100%).
 * 6. نظام الإشعارات المنبثقة (Toasts) التفاعلية لرسائل النجاح والخطأ.
 * 7. تنقية المدخلات ومنع القيم السالبة أو غير الصالحة.
 * ==============================================================================
 */

// أيقونات التصنيفات المعتمدة بتصميم Material Symbols
export const CATEGORY_ICONS = {
  'تسوق': 'shopping_bag',
  'البقالة': 'shopping_bag',
  'طعام': 'restaurant',
  'مواصلات': 'local_gas_station',
  'فواتير': 'receipt_long',
  'راتب': 'payments',
  'صحة': 'medical_services',
  'تعليم': 'school',
  'ترفيه': 'sports_esports',
  'أخرى': 'category'
};

/**
 * تنظيف وتأمين النصوص ضد هجمات XSS
 * @param {string} str - النص المراد تنظيفه
 * @returns {string} النص بعد تنقيته
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * تنسيق التاريخ وفق المتطلبات:
 * عرض "اليوم" إذا كان المصروف مسجلاً بتاريخ اليوم، وإلا بصيغة YYYY-MM-DD
 * @param {string} dateStr - تاريخ المصروف بصيغة YYYY-MM-DD
 * @param {string} [category] - تصنيف المصروف للعرض بجانب التاريخ
 * @returns {string} التاريخ المنسق
 */
export function formatExpenseDate(dateStr, category = '') {
  if (!dateStr) return category || 'اليوم';

  // مقارنة التاريخ مع تاريخ اليوم بالتقويم المحلي
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // حساب الأمس أيضاً لتحسين تجربة المستخدم
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yestY = yesterday.getFullYear();
  const yestM = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yestD = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yestY}-${yestM}-${yestD}`;

  let label = '';
  if (dateStr === todayStr) {
    label = 'اليوم';
  } else if (dateStr === yesterdayStr) {
    label = 'أمس';
  } else {
    label = dateStr; // التنسيق القياسي YYYY-MM-DD
  }

  return category ? `${category} • ${label}` : label;
}

/**
 * تنسيق الأرقام كعملة نقدية بالدولار
 * @param {number|string} amount - المبلغ
 * @returns {string} المبلغ منسقاً، مثل $1,250.00
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * عرض رسالة تنبيه منبثقة (Toast Notification) أنيقة في أعلى الشاشة
 * @param {string} message - نص الرسالة
 * @param {'success'|'error'|'info'} [type='success'] - نوع التنبيه
 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('masarifi-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'masarifi-toast-container';
    container.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 pointer-events-none w-11/12 max-w-sm';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const isError = type === 'error';
  const icon = isError ? 'error' : (type === 'info' ? 'info' : 'check_circle');

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-y-[-10px] opacity-0 pointer-events-auto ${
    isError 
      ? 'bg-red-50 border-red-200 text-error' 
      : 'bg-green-50 border-green-200 text-green-700'
  }`;

  toast.innerHTML = `
    <span class="material-symbols-outlined text-xl flex-shrink-0">${icon}</span>
    <span class="flex-grow">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // تأثير الظهور السلس
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-10px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  // الاختفاء التلقائي بعد 3.5 ثوانٍ
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * رسم قائمة المصروفات للشهر الحالي في عنصر DOM
 * @param {Array} expenses - قائمة المصروفات
 * @param {Function} [onDeleteClick] - دالة يتم استدعاؤها عند الضغط على زر الحذف
 */
export function renderExpensesList(expenses = [], onDeleteClick = null) {
  const container = document.getElementById('transactions-list');
  if (!container) return;

  // في حال كانت القائمة فارغة
  if (!expenses || expenses.length === 0) {
    container.innerHTML = `
      <div class="py-14 text-center text-on-surface-variant flex flex-col items-center justify-center p-4">
        <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-3">
          <span class="material-symbols-outlined text-3xl text-outline">receipt_long</span>
        </div>
        <p class="font-bold text-base text-on-surface">لا توجد مصروفات مسجلة لهذا الشهر</p>
        <p class="text-xs text-outline mt-1 max-w-xs">ابدأ بإضافة مصروفاتك الجديدة عبر زر "إضافة عملية" لتتبع ميزانيتك بدقة.</p>
      </div>
    `;
    return;
  }

  // رسم السجلات
  container.innerHTML = expenses.map(item => {
    const isIncome = item.type === 'income' || item.category === 'راتب' || item.category === 'دخل';
    const iconName = isIncome ? 'trending_up' : (CATEGORY_ICONS[item.category] || 'payments');
    const formattedDate = formatExpenseDate(item.date, item.category);

    const amountDisplay = isIncome ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`;
    const amountColorClass = isIncome ? 'text-green-600' : 'text-error';
    const iconBgClass = isIncome ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-error border-red-100';

    return `
      <div class="p-4 flex items-center justify-between hover:bg-surface-variant/10 transition-colors border-b border-outline-variant/30 last:border-b-0 group" data-expense-row="${item.id}">
        <!-- المبلغ وزر الحذف -->
        <div class="flex items-center gap-3 order-2 md:order-1">
          <button 
            data-action="delete-expense" 
            data-id="${item.id}"
            class="p-2 text-on-surface-variant/70 hover:text-error hover:bg-red-50 rounded-xl transition-all duration-150 opacity-90 group-hover:opacity-100" 
            title="حذف العملية"
            aria-label="حذف العملية"
          >
            <span class="material-symbols-outlined text-[20px]">delete</span>
          </button>
          <div class="font-bold text-base ${amountColorClass} min-w-[95px] text-left" dir="ltr">
            ${amountDisplay}
          </div>
        </div>

        <!-- الأيقونة والوصف والتاريخ -->
        <div class="flex items-center gap-3.5 order-1 md:order-2">
          <div class="w-11 h-11 rounded-2xl ${iconBgClass} flex items-center justify-center flex-shrink-0 border shadow-xs">
            <span class="material-symbols-outlined text-[22px]">${iconName}</span>
          </div>
          <div>
            <div class="font-bold text-sm text-on-surface">${escapeHtml(item.title)}</div>
            <div class="text-xs text-on-surface-variant mt-0.5">${escapeHtml(formattedDate)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // ربط أحداث أزرار الحذف
  if (typeof onDeleteClick === 'function') {
    container.querySelectorAll('[data-action="delete-expense"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        onDeleteClick(id);
      });
    });
  }
}

/**
 * تحديث بطاقات ملخص لوحة التحكم:
 * 1. المتبقي من الميزانية (stat-current-balance)
 * 2. إجمالي الدخل المحقق (stat-total-income)
 * 3. إجمالي المصروفات (stat-total-expenses)
 * @param {Object} totals
 */
export function updateSummaryCards({ totalExpenses, totalIncome = 0, budget, remainingBudget }) {
  const balanceEl = document.getElementById('stat-current-balance');
  const incomeEl = document.getElementById('stat-total-income');
  const expensesEl = document.getElementById('stat-total-expenses');

  // بطاقة الرصيد المتبقي
  if (balanceEl) {
    balanceEl.textContent = formatCurrency(remainingBudget);
    if (remainingBudget < 0) {
      balanceEl.classList.remove('text-primary');
      balanceEl.classList.add('text-error');
    } else {
      balanceEl.classList.remove('text-error');
      balanceEl.classList.add('text-primary');
    }
  }

  // بطاقة إجمالي الدخل
  if (incomeEl) {
    const displayIncome = totalIncome > 0 ? (budget + totalIncome) : budget;
    incomeEl.textContent = formatCurrency(displayIncome);
  }

  // بطاقة إجمالي المصروفات
  if (expensesEl) {
    expensesEl.textContent = formatCurrency(totalExpenses);
  }
}

/**
 * تحديث شريط تقدم استهلاك الميزانية ديناميكياً
 * @param {number} spentPercentage - نسبة الاستهلاك (0% - 100%+)
 * @param {boolean} isOverBudget - هل تم تجاوز الميزانية المحددة
 */
export function updateProgressBar(spentPercentage = 0, isOverBudget = false) {
  const progressBar = document.getElementById('budget-progress-bar');
  const progressPercentText = document.getElementById('budget-progress-percent');
  const progressStatusText = document.getElementById('budget-progress-status');

  const safePercentage = Math.max(0, Math.min(spentPercentage, 100));

  if (progressBar) {
    progressBar.style.width = `${safePercentage}%`;

    // إذا تجاوزت المصروفات الميزانية (> 100%)، يتغير لون الشريط للأحمر التحذيري
    if (isOverBudget || spentPercentage > 100) {
      progressBar.classList.remove('bg-primary-container', 'bg-primary');
      progressBar.classList.add('bg-error');
    } else {
      progressBar.classList.remove('bg-error');
      progressBar.classList.add('bg-primary-container');
    }
  }

  if (progressPercentText) {
    progressPercentText.textContent = `${spentPercentage}%`;
    if (isOverBudget) {
      progressPercentText.classList.add('text-error');
      progressPercentText.classList.remove('text-primary');
    } else {
      progressPercentText.classList.remove('text-error');
      progressPercentText.classList.add('text-primary');
    }
  }

  if (progressStatusText) {
    if (isOverBudget) {
      progressStatusText.textContent = 'تنبيه: تم تجاوز الميزانية الشهرية المحددة!';
      progressStatusText.className = 'text-xs font-semibold text-error';
    } else {
      progressStatusText.textContent = 'ضمن النطاق المالي المستهدف';
      progressStatusText.className = 'text-xs text-on-surface-variant';
    }
  }
}

/**
 * التحكم بنافذة إضافة المصروف (فتح وإغلاق)
 */
export function openTransactionModal() {
  const modal = document.getElementById('transaction-modal');
  const form = document.getElementById('transaction-form');
  const dateInput = document.getElementById('modal-date');

  if (form) form.reset();
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  if (modal) modal.classList.remove('hidden');
}

export function closeTransactionModal() {
  const modal = document.getElementById('transaction-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * إعداد ديناميكية التصنيفات بناءً على نوع العملية
 */
export function setupModalCategories() {
  const transTypeRadios = document.querySelectorAll('input[name="trans_type"]');
  if (transTypeRadios.length === 0) return;

  function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('modal-category') || document.querySelector('select[id*="category"]');
    if (!categorySelect) return;

    const expenseCategories = [
      { value: 'البقالة', text: 'البقالة والتسوق' },
      { value: 'طعام', text: 'طعام ومطاعم' },
      { value: 'مواصلات', text: 'مواصلات وبنزين' },
      { value: 'فواتير', text: 'فواتير وخدمات' },
      { value: 'صحة', text: 'صحة وأدوية' },
      { value: 'ترفيه', text: 'ترفيه وتسلية' },
      { value: 'أخرى', text: 'أخرى' }
    ];

    const incomeCategories = [
      { value: 'راتب', text: 'راتب ودخل شهري' },
      { value: 'أرباح', text: 'أرباح أعمال' },
      { value: 'هدايا', text: 'هدايا وعطايا' },
      { value: 'استثمار', text: 'عوائد استثمار' },
      { value: 'أخرى', text: 'أخرى' }
    ];

    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.value;
      option.textContent = cat.text;
      categorySelect.appendChild(option);
    });
  }

  transTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateCategoryOptions(e.target.value);
    });
  });

  // تشغيل أولي
  const checkedRadio = document.querySelector('input[name="trans_type"]:checked');
  if (checkedRadio) updateCategoryOptions(checkedRadio.value);
}

document.addEventListener('DOMContentLoaded', setupModalCategories);
