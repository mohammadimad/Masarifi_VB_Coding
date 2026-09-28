/**
 * ==============================================================================
 * طبقة استعلامات وقواعد البيانات (assets/js/db.js)
 * ==============================================================================
 * الوظائف الأساسية:
 * 1. حصر مصروفات الشهر الحالي ديناميكياً: من اليوم الأول حتى اليوم الأخير من الشهر.
 *    استثناء أي مصروف خارج هذا النطاق لاعتباره أرشيفاً غير نشط على لوحة التحكم.
 * 2. إضافة مصروف جديد (addNewExpense) مع تدقيق المدخلات وحمايتها.
 * 3. حذف مصروف (deleteExpense) بواسطة معرف السجل.
 * 4. جلب وتحديث ميزانية المستخدم الشهرية من جدول profiles.
 * 5. حساب إجماليات الشهر: مجموع المصروفات، المتبقي من الميزانية، ونسبة الاستهلاك.
 * 6. عزل تام لعمليات قاعدة البيانات عن واجهة المستخدم (DOM).
 * ==============================================================================
 */

import { supabase, isConfigured } from './config.js';

// مفاتيح التخزين المحلي للاختبار التلقائي دون الاتصال بقاعدة البيانات
const STORAGE_EXPENSES_KEY = 'masarifi_db_expenses';
const STORAGE_PROFILES_KEY = 'masarifi_db_profiles';

/**
 * حساب النطاق الزمني للشهر الحالي بدقة (من اليوم الأول حتى اليوم الأخير)
 * يعتمد على التاريخ الحالي للجهاز لتحديث الشهر آلياً عند حلول يوم 1 من كل شهر جديد
 * @param {Date} [refDate=new Date()] - تاريخ المرجع
 * @returns {{ startDate: string, endDate: string, year: number, month: number, monthName: string }}
 */
export function getCurrentMonthDateRange(refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0 = يناير, 11 = ديسمبر

  // اليوم الأول من الشهر: YYYY-MM-01
  const firstDay = new Date(year, month, 1);
  // اليوم الأخير من الشهر: يتم حسابه بتمرير 0 لليوم في الشهر التالي
  const lastDay = new Date(year, month + 1, 0);

  // دالة مساعدة لتنسيق التاريخ بصيغة YYYY-MM-DD
  const formatISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const monthNamesArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return {
    startDate: formatISO(firstDay),
    endDate: formatISO(lastDay),
    year: year,
    month: month + 1,
    monthName: monthNamesArabic[month]
  };
}

/**
 * جلب جميع مصروفات الشهر الحالي فقط للمستخدم النشط
 * أي مصروف يقع قبل اليوم الأول أو بعد اليوم الأخير يعتبر أرشيفاً ولا يتم تحميله هنا
 * @param {string} [userId] - معرف المستخدم
 * @returns {Promise<Array>} قائمة المصروفات للشهر الحالي مرتبة من الأحدث للأقدم
 */
export async function fetchCurrentMonthExpenses(userId) {
  const { startDate, endDate } = getCurrentMonthDateRange();

  // في حال الاتصال بـ Supabase
  if (isConfigured && supabase) {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // تطبيق تصفية إضافية بالمستخدم إذا توفر المعرف (مع العلم أن RLS تضمن ذلك تلقائياً)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase fetchCurrentMonthExpenses error:', error);
        throw new Error('تعذر تحميل مصروفات الشهر الحالي: ' + error.message);
      }
      return data || [];
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // النمط الاحتياطي (Fallback Mode)
  // --------------------------------------------------------------------------
  const stored = localStorage.getItem(STORAGE_EXPENSES_KEY);
  let allExpenses = [];
  if (stored) {
    try {
      allExpenses = JSON.parse(stored);
    } catch (e) {
      allExpenses = [];
    }
  }

  // تصفية المصروفات داخل نطاق الشهر الحالي فقط
  const currentMonthExpenses = allExpenses.filter(item => {
    const matchesUser = !userId || item.user_id === userId;
    const inRange = item.date >= startDate && item.date <= endDate;
    return matchesUser && inRange;
  });

  // ترتيب تنازلي حسب التاريخ
  return currentMonthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * إضافة مصروف جديد إلى قاعدة البيانات
 * @param {Object} params
 * @param {string} params.title - وصف المصروف
 * @param {number|string} params.amount - المبلغ
 * @param {string} params.category - التصنيف
 * @param {string} [params.date] - التاريخ بصيغة YYYY-MM-DD
 * @param {string} params.userId - معرف المستخدم
 * @returns {Promise<Object>} المصروف المضاف مع معرفه
 */
export async function addNewExpense({ title, amount, category, date, userId, type }) {
  // 1. تنقية وتدقيق البيانات (Sanitization & Validation)
  if (!title || !title.trim()) {
    throw new Error('يرجى إدخال وصف المصروف بشكل صحيح');
  }

  const cleanAmount = parseFloat(amount);
  if (isNaN(cleanAmount) || cleanAmount <= 0) {
    throw new Error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
  }

  const cleanCategory = category ? category.trim() : 'أخرى';
  const cleanType = type || (cleanCategory === 'راتب' || cleanCategory === 'دخل' ? 'income' : 'expense');
  const cleanDate = date && date.match(/^\d{4}-\d{2}-\d{2}$/) 
    ? date 
    : new Date().toISOString().split('T')[0];

  // 2. التنفيذ عبر Supabase
  if (isConfigured && supabase) {
    try {
      const payload = {
        title: title.trim(),
        amount: Math.round(cleanAmount * 100) / 100, // تقريب لمنزلتين عشريتين
        category: cleanCategory,
        type: cleanType,
        date: cleanDate
      };

      if (userId) {
        payload.user_id = userId;
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Supabase addNewExpense error:', error);
        throw new Error('تعذر حفظ المصروف في قاعدة البيانات: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Add expense error:', error);
      throw error;
    }
  }

  // 3. النمط الاحتياطي
  const newRecord = {
    id: Date.now(),
    user_id: userId || 'demo-user',
    title: title.trim(),
    amount: Math.round(cleanAmount * 100) / 100,
    category: cleanCategory,
    type: cleanType,
    date: cleanDate,
    created_at: new Date().toISOString()
  };

  const stored = localStorage.getItem(STORAGE_EXPENSES_KEY);
  const list = stored ? JSON.parse(stored) : [];
  list.unshift(newRecord);
  localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(list));

  return newRecord;
}

/**
 * حذف مصروف بواسطة معرفه (ID)
 * @param {number|string} expenseId - معرف المصروف
 * @param {string} [userId] - معرف المستخدم
 * @returns {Promise<boolean>} نجاح عملية الحذف
 */
export async function deleteExpense(expenseId, userId) {
  if (!expenseId) {
    throw new Error('معرف المصروف غير صالح');
  }

  if (isConfigured && supabase) {
    try {
      let query = supabase.from('expenses').delete().eq('id', expenseId);
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;
      if (error) {
        console.error('Supabase deleteExpense error:', error);
        throw new Error('تعذر حذف المصروف: ' + error.message);
      }
      return true;
    } catch (error) {
      console.error('Delete expense error:', error);
      throw error;
    }
  }

  // النمط الاحتياطي
  const stored = localStorage.getItem(STORAGE_EXPENSES_KEY);
  if (stored) {
    let list = JSON.parse(stored);
    list = list.filter(item => String(item.id) !== String(expenseId));
    localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(list));
  }
  return true;
}

/**
 * جلب الملف الشخصي للمستخدم والميزانية المحددة من جدول profiles
 * @param {string} userId - معرف المستخدم
 * @returns {Promise<{ id: string, budget: number, updated_at?: string }>}
 */
export async function getUserProfile(userId) {
  if (!userId) {
    return { id: 'guest', budget: 3000.00 };
  }

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('تعذر جلب ملف الميزانية:', error.message);
      }

      if (data) {
        return {
          id: data.id,
          budget: parseFloat(data.budget) || 0,
          updated_at: data.updated_at
        };
      }

      // إذا لم يكن السجل موجوداً بعد، نقوم بإنشائه بقيمة افتراضية
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ id: userId, budget: 0, updated_at: new Date().toISOString() }])
        .select()
        .single();

      return {
        id: userId,
        budget: parseFloat(newProfile?.budget || 0)
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  }

  // النمط الاحتياطي
  const profiles = JSON.parse(localStorage.getItem(STORAGE_PROFILES_KEY) || '{}');
  const userBudget = profiles[userId] !== undefined ? profiles[userId] : 3200.00;
  return { id: userId, budget: parseFloat(userBudget) };
}

/**
 * تحديث ميزانية المستخدم الشهرية في جدول profiles
 * @param {string} userId - معرف المستخدم
 * @param {number|string} newBudget - الميزانية الجديدة
 * @returns {Promise<Object>} السجل المحدث
 */
export async function updateUserBudget(userId, newBudget) {
  const cleanBudget = parseFloat(newBudget);
  if (isNaN(cleanBudget) || cleanBudget < 0) {
    throw new Error('يرجى إدخال ميزانية صالحة غير سالبة');
  }

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          budget: Math.round(cleanBudget * 100) / 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update budget error:', error);
      throw new Error('تعذر تحديث الميزانية: ' + error.message);
    }
  }

  // النمط الاحتياطي
  const profiles = JSON.parse(localStorage.getItem(STORAGE_PROFILES_KEY) || '{}');
  profiles[userId] = cleanBudget;
  localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
  return { id: userId, budget: cleanBudget };
}

/**
 * دالة رياضية بحتة لحساب إجماليات الشهر:
 * 1. مجموع المصروفات (Sum of Expenses)
 * 2. المتبقي من الميزانية (Budget - Expenses)
 * 3. نسبة الاستهلاك المئوية (Spent Percentage)
 * 4. حالة تجاوز الميزانية (isOverBudget)
 * @param {Array} expenses - مصفوفة المصروفات
 * @param {number} [userBudget=0] - الميزانية الشهرية المحددة للمستخدم
 * @returns {{ totalExpenses: number, budget: number, remainingBudget: number, spentPercentage: number, isOverBudget: boolean }}
 */
export function calculateMonthlyTotals(expenses = [], userBudget = 0) {
  const budget = parseFloat(userBudget) || 0;

  let totalIncome = 0;
  let totalExpenses = 0;

  expenses.forEach(item => {
    const val = parseFloat(item.amount) || 0;
    const isIncome = item.type === 'income' || item.category === 'راتب' || item.category === 'دخل';
    if (isIncome) {
      totalIncome += val;
    } else {
      totalExpenses += val;
    }
  });

  const effectiveBudget = budget + totalIncome;
  const remainingBudget = effectiveBudget - totalExpenses;

  let spentPercentage = 0;
  if (effectiveBudget > 0) {
    spentPercentage = (totalExpenses / effectiveBudget) * 100;
  } else if (totalExpenses > 0) {
    spentPercentage = 100;
  }

  const isOverBudget = effectiveBudget > 0 && totalExpenses > effectiveBudget;

  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    budget: Math.round(budget * 100) / 100,
    remainingBudget: Math.round(remainingBudget * 100) / 100,
    spentPercentage: Math.round(spentPercentage),
    isOverBudget: isOverBudget
  };
}
