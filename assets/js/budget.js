/**
 * ==============================================================================
 * إدارة صفحة الميزانية الشهرية (assets/js/budget.js)
 * ==============================================================================
 * يربط صفحة budget.html ببيانات المستخدم الفعلية في Supabase / التخزين المحلي:
 * 1. فحص حارس الجلسة وعرض اسم المستخدم الحقيقي.
 * 2. جلب الميزانية الحالية ومصروفات الشهر واحتساب المتبقي ونسبة الاستهلاك.
 * 3. تحديث بطاقات KPI الأربع وشريط التقدم بشكل حي وديناميكي.
 * 4. الاستماع لنموذج إضافة/تعديل الميزانية وحفظ القيمة الجديدة فورياً في قاعدة البيانات.
 * 5. إظهار التنبيهات المنبثقة وتحديث الأرقام دون فقدان أي بيانات.
 * ==============================================================================
 */

import { requireAuth, logout, getCurrentUser } from './auth.js';
import { 
  getUserProfile, 
  updateUserBudget, 
  fetchCurrentMonthExpenses, 
  calculateMonthlyTotals, 
  getCurrentMonthDateRange 
} from './db.js';
import { formatCurrency, showToast } from './ui.js';

let currentUser = null;
let currentBudget = 0;
let currentExpenses = [];

/**
 * تهيئة صفحة الميزانية عند التحميل
 */
export async function initializeBudgetPage() {
  try {
    // 1. حارس الجلسة
    currentUser = await requireAuth();
    if (!currentUser) return;

    // 2. تحديث رأس الصفحة والشريط الجانبي
    updateUserDisplay();

    // 3. تحميل وحساب البيانات
    await loadBudgetData();

    // 4. ربط النماذج والأزرار
    setupBudgetListeners();

  } catch (err) {
    console.error('خطأ تهيئة صفحة الميزانية:', err);
    showToast('تعذر تحميل بيانات الميزانية', 'error');
  }
}

/**
 * تحديث معلومات المستخدم في الشريط الجانبي والشهر الحالي
 */
async function updateUserDisplay() {
  const user = await getCurrentUser();
  const userNameEl = document.getElementById('user-display-name');
  if (userNameEl && user) {
    const displayName = user.name || (user.email ? user.email.split('@')[0] : 'مستخدم');
    userNameEl.textContent = `أهلاً بك، ${displayName}!`;
  }

  const { monthName, year } = getCurrentMonthDateRange();
  const monthBadgeEl = document.getElementById('budget-month-badge');
  if (monthBadgeEl) {
    monthBadgeEl.textContent = `شهر ${monthName} ${year}`;
  }
}

/**
 * جلب بيانات الميزانية والمصروفات ورسم البطاقات
 */
export async function loadBudgetData() {
  try {
    const profile = await getUserProfile(currentUser?.id);
    currentBudget = profile.budget || 0;

    currentExpenses = await fetchCurrentMonthExpenses(currentUser?.id);
    const totals = calculateMonthlyTotals(currentExpenses, currentBudget);

    renderKPICards(totals);
    renderDynamicCategoryCards(currentExpenses);

  } catch (err) {
    console.error('خطأ جلب بيانات الميزانية:', err);
  }
}

/**
 * رسم وتحديث بطاقات الـ KPI في صفحة الميزانية
 * @param {Object} totals
 */
function renderKPICards(totals) {
  // البطاقة 1: إجمالي الميزانية المحددة
  const totalAllocatedEl = document.getElementById('budget-kpi-total');
  if (totalAllocatedEl) {
    totalAllocatedEl.textContent = formatCurrency(totals.budget);
  }

  // البطاقة 2: إجمالي المنصرف حتى الآن
  const spentEl = document.getElementById('budget-kpi-spent');
  if (spentEl) {
    spentEl.textContent = formatCurrency(totals.totalExpenses);
  }

  // شريط ونسبة الاستهلاك في البطاقة 2
  const progressBar = document.getElementById('budget-kpi-progress-bar');
  const percentText = document.getElementById('budget-kpi-progress-percent');
  if (progressBar) {
    const safePercent = Math.max(0, Math.min(totals.spentPercentage, 100));
    progressBar.style.width = `${safePercent}%`;
    if (totals.isOverBudget) {
      progressBar.classList.remove('bg-primary-container');
      progressBar.classList.add('bg-error');
    } else {
      progressBar.classList.remove('bg-error');
      progressBar.classList.add('bg-primary-container');
    }
  }
  if (percentText) {
    percentText.textContent = `${totals.spentPercentage}%`;
    if (totals.isOverBudget) {
      percentText.classList.add('text-error');
      percentText.classList.remove('text-primary');
    } else {
      percentText.classList.remove('text-error');
      percentText.classList.add('text-primary');
    }
  }

  // البطاقة 3: المتبقي الكلي الآمن
  const remainingEl = document.getElementById('budget-kpi-remaining');
  if (remainingEl) {
    remainingEl.textContent = formatCurrency(totals.remainingBudget);
    if (totals.remainingBudget < 0) {
      remainingEl.classList.add('text-error');
    } else {
      remainingEl.classList.remove('text-error');
    }
  }

  // البطاقة 4: المعدل اليومي المتبقي
  const burnRateEl = document.getElementById('budget-kpi-burn-rate');
  const daysLeftEl = document.getElementById('budget-kpi-days-left');
  if (burnRateEl) {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, lastDayOfMonth - today.getDate() + 1);
    
    if (daysLeftEl) daysLeftEl.textContent = `متبقي ${daysLeft} يوماً للشهر`;

    if (totals.remainingBudget > 0) {
      const dailyRate = Math.round(totals.remainingBudget / daysLeft);
      burnRateEl.textContent = `$${dailyRate}`;
    } else {
      burnRateEl.textContent = '$0';
    }
  }
}

/**
 * رسم بطاقات التصنيفات بناءً على المصروفات الفعلية في قاعدة البيانات
 */
function renderDynamicCategoryCards(expenses) {
  const container = document.getElementById('dynamic-category-cards');
  if (!container) return;

  if (!expenses || expenses.length === 0) {
    container.innerHTML = `<div class="col-span-1 md:col-span-2 p-xl text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">لا توجد مصروفات حتى الآن لهذا الشهر لتقسيمها على التصنيفات.</div>`;
    return;
  }

  // تجميع المصروفات حسب التصنيف
  const categoryTotals = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'أخرى';
    if (!categoryTotals[cat]) categoryTotals[cat] = 0;
    categoryTotals[cat] += parseFloat(exp.amount) || 0;
  });

  // رسم البطاقات
  container.innerHTML = '';
  Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]).forEach(cat => {
    const amount = categoryTotals[cat];
    const cardHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-lg shadow-sm flex flex-col gap-md relative overflow-hidden transition-all hover:shadow-md min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-sm min-w-0 overflow-hidden">
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm shrink-0">
              <span class="material-symbols-outlined text-2xl">category</span>
            </div>
            <div class="min-w-0 overflow-hidden">
              <h3 class="text-lg font-bold text-on-surface leading-tight truncate">${cat}</h3>
            </div>
          </div>
        </div>
        <div class="flex justify-between items-baseline pt-xs min-w-0 overflow-hidden">
          <div class="min-w-0 w-full overflow-hidden">
            <div class="text-on-surface-variant font-label-sm text-label-sm">إجمالي المنفق</div>
            <div class="text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight truncate w-full" title="${formatCurrency(amount)}">${formatCurrency(amount)}</div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHTML;
  });
}

/**
 * ربط مستمعات الأحداث للنماذج والنوافذ المنبثقة في budget.html
 */
function setupBudgetListeners() {
  // نموذج إضافة ميزانية جديدة
  const newBudgetForm = document.getElementById('form-new-budget');
  if (newBudgetForm) {
    newBudgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('input-new-budget-amount');
      const val = parseFloat(amountInput?.value);

      if (isNaN(val) || val < 0) {
        showToast('يرجى إدخال مبلغ ميزانية صحيح غير سالب', 'error');
        return;
      }

      try {
        await updateUserBudget(currentUser?.id, val);
        document.getElementById('new-budget-modal')?.classList.add('hidden');
        newBudgetForm.reset();
        await loadBudgetData();
        showToast('تم حفظ الميزانية الشهرية بنجاح!', 'success');
      } catch (err) {
        showToast(err.message || 'فشل تحديث الميزانية', 'error');
      }
    });
  }

  // نموذج تعديل الميزانية
  const editBudgetForm = document.getElementById('form-edit-budget');
  if (editBudgetForm) {
    editBudgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('input-edit-budget-amount');
      const val = parseFloat(amountInput?.value);

      if (isNaN(val) || val < 0) {
        showToast('يرجى إدخال مبلغ ميزانية صحيح غير سالب', 'error');
        return;
      }

      try {
        await updateUserBudget(currentUser?.id, val);
        document.getElementById('edit-budget-modal')?.classList.add('hidden');
        await loadBudgetData();
        showToast('تم تعديل الميزانية وحفظ التغييرات بنجاح!', 'success');
      } catch (err) {
        showToast(err.message || 'فشل تعديل الميزانية', 'error');
      }
    });
  }

  // أزرار فتح نافذة التعديل مع ملء القيمة الحالية تلقائياً
  document.querySelectorAll('[data-open-edit-budget]').forEach(btn => {
    btn.addEventListener('click', () => {
      const editInput = document.getElementById('input-edit-budget-amount');
      if (editInput) editInput.value = currentBudget;
      document.getElementById('edit-budget-modal')?.classList.remove('hidden');
    });
  });

  // أزرار حذف الميزانية (تأثير مرئي فقط حيث أنها بيانات تجريبية غير مرتبطة بقاعدة البيانات)
  let cardToDelete = null;
  const deleteModal = document.getElementById('delete-budget-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-budget-btn');

  document.querySelectorAll('[data-delete-budget]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      cardToDelete = e.target.closest('.bg-surface-container-lowest');
      if (deleteModal) {
        deleteModal.classList.remove('hidden');
      }
    });
  });

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (cardToDelete) {
        // FLIP Animation Technique للتنقل المرن
        const grid = cardToDelete.parentElement;
        const allCards = Array.from(grid.children);
        
        // 1. First: حفظ المواقع الحالية لجميع البطاقات
        const firstRects = new Map();
        allCards.forEach(card => {
          if (card !== cardToDelete) {
            firstRects.set(card, card.getBoundingClientRect());
          }
        });

        // تأثير إخفاء البطاقة المحذوفة
        cardToDelete.style.transition = 'all 0.2s ease';
        cardToDelete.style.opacity = '0';
        cardToDelete.style.transform = 'scale(0.8)';

        setTimeout(() => {
          // 2. إزالة البطاقة من الـ DOM (يؤدي إلى إعادة ترتيب الشبكة فوراً)
          cardToDelete.remove();

          // 3. Last: حفظ المواقع الجديدة بعد إعادة الترتيب
          allCards.forEach(card => {
            if (card !== cardToDelete && firstRects.has(card)) {
              const lastRect = card.getBoundingClientRect();
              const firstRect = firstRects.get(card);
              
              // 4. Invert: حساب الفرق وتحريك البطاقات لمواقعها القديمة
              const deltaX = firstRect.left - lastRect.left;
              const deltaY = firstRect.top - lastRect.top;
              
              if (deltaX !== 0 || deltaY !== 0) {
                // إيقاف التحريك مؤقتاً لتطبيق الموقع القديم
                card.style.transition = 'none';
                card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                
                // Force reflow
                requestAnimationFrame(() => {
                  // 5. Play: تشغيل الحركة للموقع الجديد
                  card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)';
                  card.style.transform = 'translate(0, 0)';
                  
                  // تنظيف ستايل الحركة بعد الانتهاء
                  setTimeout(() => {
                    card.style.transition = '';
                    card.style.transform = '';
                  }, 400);
                });
              }
            }
          });
          
          showToast('تم حذف الميزانية الفرعية بنجاح', 'success');
          cardToDelete = null;
        }, 200);
      }
      
      if (deleteModal) {
        deleteModal.classList.add('hidden');
      }
    });
  }

  // تسجيل الخروج
  document.querySelectorAll('[data-logout-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('هل ترغب في تسجيل الخروج من حسابك؟')) {
        logout();
      }
    });
  });
}
