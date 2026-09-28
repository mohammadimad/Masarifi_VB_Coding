/**
 * ==============================================================================
 * إدارة صفحة التقارير المالية (assets/js/reports.js)
 * ==============================================================================
 * يربط صفحة reports.html ببيانات المستخدم الفعلية في Supabase / التخزين المحلي:
 * 1. حارس الجلسة وعرض اسم المستخدم الحقيقي.
 * 2. جلب مصروفات وميزانية الشهر الحالي وحساب المؤشرات المالية الحقيقية.
 * 3. تحديث بطاقات KPI الأربع (صافي التدفق، الميزانية، إجمالي المصروفات، نسبة التوفير).
 * 4. تفعيل أزرار الطباعة والتبويبات وتسجيل الخروج.
 * ==============================================================================
 */

import { requireAuth, getCurrentUser, logout } from './auth.js';
import { getUserProfile, fetchCurrentMonthExpenses, calculateMonthlyTotals } from './db.js';
import { formatCurrency, showToast } from './ui.js';

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. حارس الجلسة
    currentUser = await requireAuth();
    if (!currentUser) return;

    // 2. تحديث اسم المستخدم في الشريط الجانبي
    const user = await getCurrentUser();
    const userNameEl = document.getElementById('user-display-name');
    if (userNameEl && user) {
      const displayName = user.name || (user.email ? user.email.split('@')[0] : 'مستخدم');
      userNameEl.textContent = `أهلاً بك، ${displayName}!`;
    }

    // 3. جلب البيانات وحساب المؤشرات
    await loadReportsData();

    // 4. ربط الأزرار والطباعة
    setupReportsUI();

  } catch (err) {
    console.error('خطأ تهيئة صفحة التقارير:', err);
    showToast('تعذر تحميل بيانات التقارير', 'error');
  }
});

/**
 * جلب بيانات المصروفات وحساب بطاقات الـ KPI
 */
async function loadReportsData() {
  try {
    const profile = await getUserProfile(currentUser?.id);
    const budget = profile.budget || 0;
    const expenses = await fetchCurrentMonthExpenses(currentUser?.id);
    const totals = calculateMonthlyTotals(expenses, budget);

    // KPI 1: صافي التدفق النقدي (المتبقي من الميزانية)
    const netFlowEl = document.getElementById('report-kpi-net-flow');
    if (netFlowEl) {
      const sign = totals.remainingBudget >= 0 ? '+' : '';
      netFlowEl.textContent = `${sign}${formatCurrency(totals.remainingBudget)}`;
      if (totals.remainingBudget < 0) {
        netFlowEl.classList.add('text-error');
      }
    }

    // KPI 2: إجمالي الميزانية المحددة
    const budgetEl = document.getElementById('report-kpi-budget');
    if (budgetEl) {
      budgetEl.textContent = formatCurrency(totals.budget);
    }

    // KPI 3: إجمالي المصروفات الفعلية
    const expensesEl = document.getElementById('report-kpi-expenses');
    if (expensesEl) {
      expensesEl.textContent = formatCurrency(totals.totalExpenses);
    }

    // KPI 4: نسبة الادخار المحققة
    const savingsRateEl = document.getElementById('report-kpi-savings-rate');
    if (savingsRateEl) {
      const savingsRate = totals.budget > 0 
        ? Math.max(0, 100 - totals.spentPercentage)
        : 0;
      savingsRateEl.textContent = `${savingsRate}%`;
    }

  } catch (e) {
    console.error('خطأ تحميل بيانات التقارير:', e);
  }
}

/**
 * ربط أزرار الطباعة والتبديل وتسجيل الخروج
 */
function setupReportsUI() {
  // زر الطباعة
  const btnPrint = document.getElementById("btn-print-report");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => window.print());
  }

  // زر التصدير إلى CSV
  const btnExport = document.getElementById("btn-export-report");
  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      try {
        const expenses = await fetchCurrentMonthExpenses(currentUser?.id);
        if (!expenses || expenses.length === 0) {
          showToast('لا توجد بيانات لتصديرها لهذا الشهر', 'error');
          return;
        }
        
        // Add BOM \uFEFF for Excel UTF-8 Arabic support
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "التاريخ,الوصف,التصنيف,المبلغ\n";
        
        expenses.forEach(exp => {
          const title = (exp.title || "").replace(/"/g, '""');
          const category = (exp.category || "").replace(/"/g, '""');
          const date = exp.date || "";
          const amount = exp.amount || 0;
          csvContent += `"${date}","${title}","${category}",${amount}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Masarifi_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('تم تصدير التقرير (CSV) بنجاح!', 'success');
      } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
      }
    });
  }

  // تبويبات الفترة
  const periodButtons = document.querySelectorAll(".flex.bg-surface-container-high button");
  periodButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      periodButtons.forEach(b => {
        b.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-semibold");
        b.classList.add("text-on-surface-variant", "hover:text-on-surface");
      });
      const clickedBtn = e.currentTarget;
      clickedBtn.classList.remove("text-on-surface-variant", "hover:text-on-surface");
      clickedBtn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-semibold");
    });
  });

  // تسجيل الخروج
  document.querySelectorAll('[data-logout-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('هل ترغب في تسجيل الخروج من حسابك؟')) {
        logout();
      }
    });
  });
}
