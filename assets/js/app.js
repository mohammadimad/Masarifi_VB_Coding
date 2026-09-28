/**
 * ==============================================================================
 * المنسق العام للوحة التحكم (assets/js/app.js)
 * ==============================================================================
 * يجمع بين طبقة المصادقة (auth.js)، طبقة البيانات (db.js)، وطبقة العرض (ui.js):
 * 1. تفعيل حارس الجلسة للتأكد من هوية المستخدم.
 * 2. جلب مصروفات الشهر الحالي والميزانية عند فتح الصفحة.
 * 3. الاستماع لنموذج إضافة المصروف وحفظه في Supabase وتحديث الشاشة فورياً.
 * 4. إدارة عمليات الحذف وتحديث شريط التقدم والبطاقات الإجمالية.
 * 5. إظهار الإشعارات التفاعلية (Toasts) وتجربة مستخدم سلسة.
 * ==============================================================================
 */

import { requireAuth, logout } from './auth.js';
import { 
  fetchCurrentMonthExpenses, 
  addNewExpense, 
  deleteExpense, 
  getUserProfile, 
  calculateMonthlyTotals,
  getCurrentMonthDateRange 
} from './db.js';
import { 
  renderExpensesList, 
  updateSummaryCards, 
  updateProgressBar, 
  showToast,
  openTransactionModal,
  closeTransactionModal 
} from './ui.js';

// حالة التطبيق المحفوظة في الذاكرة (In-Memory State) للشهر الحالي
let currentUser = null;
let currentBudget = 0;
let monthExpenses = [];

/**
 * تهيئة لوحة التحكم الرئيسية وتفعيل كافة المكونات
 */
export async function initializeDashboard() {
  try {
    // 1. فحص حارس الجلسة (Session Guard)
    currentUser = await requireAuth();
    if (!currentUser) return; // تم التحويل لصفحة login.html

    // 2. تحديث اسم المستخدم والشهر في الواجهة
    updateUserInterfaceHeaders();

    // 3. تحميل الميزانية والمصروفات للشهر الحالي
    await refreshDashboardData();

    // 4. ربط مستمعات الأحداث (Event Listeners)
    setupEventListeners();

  } catch (error) {
    console.error('فشل في تهيئة لوحة التحكم:', error);
    showToast('حدث خطأ أثناء تحميل بيانات لوحة التحكم', 'error');
  }
}

/**
 * تحديث نصوص الترحيب وتاريخ الدورة الشهرية
 */
function updateUserInterfaceHeaders() {
  // اسم المستخدم
  const userNameEl = document.getElementById('user-display-name');
  if (userNameEl && currentUser) {
    const displayName = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'مستخدم');
    userNameEl.textContent = `أهلاً بك، ${displayName}!`;
  }

  // تسمية الشهر الحالي
  const { monthName, year } = getCurrentMonthDateRange();
  const monthBadgeEl = document.getElementById('current-month-badge');
  if (monthBadgeEl) {
    monthBadgeEl.textContent = `شهر ${monthName} ${year}`;
  }
}

/**
 * إعادة جلب وحساب بيانات لوحة التحكم ورسمها
 */
async function refreshDashboardData() {
  try {
    // جلب ملف المستخدم والميزانية
    const profile = await getUserProfile(currentUser?.id);
    currentBudget = profile.budget || 0;

    // جلب مصروفات الشهر الحالي فقط (اليوم الأول إلى الأخير)
    monthExpenses = await fetchCurrentMonthExpenses(currentUser?.id);

    // حساب الإجماليات
    const totals = calculateMonthlyTotals(monthExpenses, currentBudget);

    // تحديث بطاقات الإحصائيات
    updateSummaryCards(totals);

    // تحديث شريط التقدم
    updateProgressBar(totals.spentPercentage, totals.isOverBudget);

    // رسم قائمة المصروفات وربط دالة الحذف
    renderExpensesList(monthExpenses, handleDeleteExpense);

  } catch (err) {
    console.error('خطأ تحديث البيانات:', err);
    showToast('تعذر تحديث بيانات الشهر الحالي', 'error');
  }
}

/**
 * معالجة إضافة مصروف جديد من خلال النموذج
 * @param {Event} e 
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('modal-title-input');
  const amountInput = document.getElementById('modal-amount');
  const categorySelect = document.getElementById('modal-category');
  const dateInput = document.getElementById('modal-date');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const title = titleInput?.value.trim();
  const rawAmount = amountInput?.value;
  const category = categorySelect?.value || 'أخرى';
  const date = dateInput?.value || new Date().toISOString().split('T')[0];

  const typeInput = e.target.querySelector('input[name="trans_type"]:checked');
  const type = typeInput ? typeInput.value : (category === 'راتب' || category === 'دخل' ? 'income' : 'expense');

  // التدقيق والتحقق من صحة المدخلات
  if (!title) {
    showToast('يرجى كتابة وصف للعملية', 'error');
    if (titleInput) titleInput.focus();
    return;
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر', 'error');
    if (amountInput) amountInput.focus();
    return;
  }

  // تفعيل حالة التحميل للزر
  const originalBtnText = submitBtn ? submitBtn.innerHTML : 'حفظ العملية';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="inline-block animate-spin mr-1">⌛</span>
      جارٍ الحفظ...
    `;
  }

  try {
    // استدعاء دالة الإضافة في طبقة قواعد البيانات المعزولة
    const savedExpense = await addNewExpense({
      title,
      amount,
      category,
      date,
      type,
      userId: currentUser?.id
    });

    // إضافة المصروف في مقدمة القائمة الحالية بالذاكرة
    monthExpenses.unshift(savedExpense);

    // إعادة حساب الإجماليات وتحديث الواجهة
    const totals = calculateMonthlyTotals(monthExpenses, currentBudget);
    updateSummaryCards(totals);
    updateProgressBar(totals.spentPercentage, totals.isOverBudget);
    renderExpensesList(monthExpenses, handleDeleteExpense);

    // إغلاق النافذة المنبثقة وتفريغ النموذج
    closeTransactionModal();
    if (e.target.reset) e.target.reset();

    // إظهار رسالة النجاح
    showToast('تمت إضافة المصروف بنجاح!', 'success');

  } catch (error) {
    console.error('فشل حفظ المصروف:', error);
    showToast(error.message || 'حدث خطأ أثناء حفظ المصروف', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

/**
 * معالجة حذف مصروف
 * @param {string|number} expenseId 
 */
async function handleDeleteExpense(expenseId) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المصروف نهائياً؟')) {
    return;
  }

  try {
    // الحذف من قاعدة البيانات
    await deleteExpense(expenseId, currentUser?.id);

    // تحديث مصفوفة الذاكرة
    monthExpenses = monthExpenses.filter(item => String(item.id) !== String(expenseId));

    // تحديث الواجهة والملخصات
    const totals = calculateMonthlyTotals(monthExpenses, currentBudget);
    updateSummaryCards(totals);
    updateProgressBar(totals.spentPercentage, totals.isOverBudget);
    renderExpensesList(monthExpenses, handleDeleteExpense);

    showToast('تم حذف المصروف بنجاح', 'success');

  } catch (error) {
    console.error('فشل حذف المصروف:', error);
    showToast(error.message || 'تعذر حذف المصروف', 'error');
  }
}

/**
 * ضبط وربط جميع مستمعات الأحداث في الصفحة
 */
function setupEventListeners() {
  // زر فتح نافذة إضافة العملية
  const openModalBtn = document.getElementById('btn-open-modal');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', openTransactionModal);
  }

  // أزرار إغلاق النافذة المنبثقة
  const closeModalBtns = document.querySelectorAll('[data-close-modal]');
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', closeTransactionModal);
  });

  // نموذج إضافة المصروف
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // أزرار تسجيل الخروج
  const logoutBtns = document.querySelectorAll('[data-logout-btn]');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('هل ترغب في تسجيل الخروج من حسابك؟')) {
        logout();
      }
    });
  });

}


