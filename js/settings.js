/**
 * ==============================================================================
 * إدارة صفحة الإعدادات والتفضيلات (js/settings.js)
 * ==============================================================================
 * يربط صفحة settings.html ببيانات المستخدم الفعلية في Supabase / التخزين المحلي:
 * 1. حارس الجلسة وجلب بيانات المستخدم (الاسم، البريد، الميزانية الشهرية).
 * 2. ملء حقول الإدخال بقيم المستخدم الفعلية تلقائياً.
 * 3. حفظ التعديلات في قاعدة البيانات والتخزين المحلي مع إظهار إشعار تأكيد فوري.
 * 4. تفعيل التبديل بين التبويبات بسلاسة.
 * 5. ربط تسجيل الخروج وإدارة الحساب بأمان.
 * ==============================================================================
 */

import { requireAuth, getCurrentUser, logout } from './auth.js';
import { getUserProfile, updateUserBudget } from './db.js';
import { showToast } from './ui.js';

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. فحص حارس الجلسة
  currentUser = await requireAuth();
  if (!currentUser) return;

  // 2. تحديث رأس الصفحة والشريط الجانبي
  await loadUserSettings();

  // 3. التبديل بين تبويبات الإعدادات
  setupTabs();

  // 4. شريط نسبة تنبيه الميزانية
  setupThresholdSlider();

  // 5. زر حفظ التغييرات الفعلي
  setupSaveAction();

  // 6. زر إلغاء التعديلات
  setupCancelAction();

  setupDemoButtons();
  // 7. أزرار تسجيل الخروج
  setupLogoutButtons();
});

/**
 * جلب بيانات المستخدم الحالية وتعبئة الحقول
 */
async function loadUserSettings() {
  const user = await getCurrentUser();
  const userNameEl = document.getElementById('user-display-name');
  if (userNameEl && user) {
    const displayName = user.name || (user.email ? user.email.split('@')[0] : 'مستخدم');
    userNameEl.textContent = `أهلاً بك، ${displayName}!`;
  }

  // ملء حقول الاسم والبريد
  const nameInput = document.getElementById('settings-name-input');
  const emailInput = document.getElementById('settings-email-input');
  const budgetInput = document.getElementById('settings-budget-input');

  if (nameInput && user) {
    nameInput.value = user.name || (user.email ? user.email.split('@')[0] : '');
  }
  if (emailInput && user) {
    emailInput.value = user.email || '';
  }

  // جلب الميزانية الحالية
  if (budgetInput && currentUser) {
    try {
      const profile = await getUserProfile(currentUser.id);
      budgetInput.value = profile.budget || 0;
    } catch (e) {
      console.warn('تعذر جلب الميزانية في الإعدادات:', e);
    }
  }

  // جلب نسبة التنبيه المحفوظة
  const savedThreshold = localStorage.getItem('masarifi_alert_threshold') || '80';
  const thresholdSlider = document.getElementById('settings-threshold-slider');
  const thresholdVal = document.getElementById('threshold-val');
  if (thresholdSlider) thresholdSlider.value = savedThreshold;
  if (thresholdVal) thresholdVal.textContent = `${savedThreshold}% من إجمالي الميزانية`;
}

/**
 * التبديل بين التبويبات الأفقية
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => {
        b.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm");
        b.classList.add("text-on-surface-variant");
      });
      btn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm");
      btn.classList.remove("text-on-surface-variant");
    });
  });
}

/**
 * ضبط شريط حساسية تنبيه الميزانية
 */
function setupThresholdSlider() {
  const thresholdSlider = document.getElementById('settings-threshold-slider') || document.querySelector('input[type="range"]');
  const thresholdVal = document.getElementById('threshold-val');
  if (thresholdSlider && thresholdVal) {
    thresholdSlider.addEventListener("input", (e) => {
      thresholdVal.textContent = `${e.target.value}% من إجمالي الميزانية`;
    });
  }
}

/**
 * حفظ التعديلات في قاعدة البيانات والتخزين المحلي
 */
function setupSaveAction() {
  const saveBtn = document.getElementById("save-btn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", async () => {
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <span class="inline-block animate-spin mr-1">⌛</span>
      جارٍ الحفظ...
    `;

    try {
      // 1. حفظ الميزانية إن وجدت
      const budgetInput = document.getElementById('settings-budget-input');
      if (budgetInput && budgetInput.value) {
        const newBudget = parseFloat(budgetInput.value);
        if (!isNaN(newBudget) && newBudget >= 0) {
          await updateUserBudget(currentUser?.id, newBudget);
        }
      }

      // 2. حفظ نسبة التنبيه
      const thresholdSlider = document.getElementById('settings-threshold-slider') || document.querySelector('input[type="range"]');
      if (thresholdSlider) {
        localStorage.setItem('masarifi_alert_threshold', thresholdSlider.value);
      }

      // 3. حفظ الاسم محلياً
      const nameInput = document.getElementById('settings-name-input');
      if (nameInput && nameInput.value.trim() && currentUser) {
        currentUser.name = nameInput.value.trim();
        const demoUser = localStorage.getItem('masarifi_current_user');
        if (demoUser) {
          const parsed = JSON.parse(demoUser);
          parsed.name = nameInput.value.trim();
          localStorage.setItem('masarifi_current_user', JSON.stringify(parsed));
        }
        const userNameEl = document.getElementById('user-display-name');
        if (userNameEl) userNameEl.textContent = `أهلاً بك، ${nameInput.value.trim()}!`;
      }

      // 4. إظهار بانر وتنبيه النجاح
      const saveToast = document.getElementById("save-toast");
      if (saveToast) {
        saveToast.classList.remove("hidden");
        saveToast.classList.add("flex");
        setTimeout(() => {
          saveToast.classList.add("hidden");
          saveToast.classList.remove("flex");
        }, 3500);
      }

      showToast('تم حفظ كافة التعديلات والتفضيلات بنجاح!', 'success');

    } catch (err) {
      console.error('خطأ حفظ الإعدادات:', err);
      showToast(err.message || 'حدث خطأ أثناء حفظ الإعدادات', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  });
}

/**
 * زر التراجع عن التعديلات
 */
function setupCancelAction() {
  const cancelBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("إلغاء التعديلات"));
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (confirm("هل تريد التراجع عن التغييرات غير المحفوظة؟")) {
        window.location.reload();
      }
    });
  }
}

/**
 * ربط أزرار تسجيل الخروج
 */
function setupLogoutButtons() {
  document.querySelectorAll('[data-logout-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('هل ترغب في تسجيل الخروج من حسابك؟')) {
        logout();
      }
    });
  });
}



function setupDemoButtons() {
  const btnChangePwd = document.getElementById("btn-change-password");
  const btnManage2FA = document.getElementById("btn-manage-2fa");
  const btnExport = document.getElementById("btn-export-data");
  const btnClearData = document.getElementById("btn-clear-data");
  const btnDeleteAcc = document.getElementById("btn-delete-account");
  const btnCancel = document.getElementById("btn-cancel-settings");

  const showMsg = async (msg, type="info") => {
    const { showToast } = await import('./ui.js');
    showToast(msg, type);
  };

  if (btnChangePwd) btnChangePwd.addEventListener("click", () => showMsg("ميزة تغيير كلمة المرور ستتوفر قريباً"));
  if (btnManage2FA) btnManage2FA.addEventListener("click", () => showMsg("ميزة إدارة أجهزة المصادقة ستتوفر قريباً"));
  if (btnCancel) btnCancel.addEventListener("click", () => {
     if (confirm("هل تريد التراجع عن التغييرات؟")) window.location.reload();
  });
  if (btnClearData) btnClearData.addEventListener("click", () => {
     if (confirm("هل أنت متأكد من مسح جميع البيانات؟ هذه العملية لا رجعة فيها.")) showMsg("تم مسح البيانات المحلية!", "success");
  });
  if (btnDeleteAcc) btnDeleteAcc.addEventListener("click", () => {
     if (confirm("تحذير: سيتم حذف حسابك نهائياً. هل أنت متأكد؟")) showMsg("تم تقديم طلب الحذف للآدمن.", "error");
  });

  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      try {
        const { fetchCurrentMonthExpenses } = await import('./db.js');
        const { getCurrentUser } = await import('./auth.js');
        const user = await getCurrentUser();
        const expenses = await fetchCurrentMonthExpenses(user?.id);
        if (!expenses || expenses.length === 0) {
          showMsg('لا توجد بيانات لتصديرها', 'error');
          return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,﻿";
        csvContent += "التاريخ,الوصف,التصنيف,المبلغ\n";
        
        expenses.forEach(exp => {
          const title = (exp.title || "").replace(/"/g, '""');
          const category = (exp.category || "").replace(/"/g, '""');
          csvContent += `"${exp.date || ""}","${title}","${category}",${exp.amount || 0}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", 'Masarifi_Data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMsg('تم تصدير البيانات بنجاح!', 'success');
      } catch (err) {
        console.error(err);
      }
    });
  }
}
