/**
 * ==============================================================================
 * ملف المصادقة وإدارة الجلسات وحماية المسارات (assets/js/auth.js)
 * ==============================================================================
 * الوظائف الأساسية:
 * 1. تسجيل مستخدم جديد (signUp) مع إنشاء سجل ملف شخصي للميزانية.
 * 2. تسجيل الدخول (login) والتحقق من كلمة المرور والبريد الإلكتروني.
 * 3. تسجيل الخروج (logout) وإنهاء الجلسة بأمان وإعادة التوجيه لصفحة الدخول.
 * 4. حارس الجلسة (Session Guard):
 *    - requireAuth(): يمنع الوصول إلى لوحة التحكم إذا لم يكن مسجلاً، ويعيده لـ login.html.
 *    - requireGuest(): يمنع المسجلين من فتح صفحة login.html، ويعيدهم لـ index.html.
 * ==============================================================================
 */

import { supabase, isConfigured } from './config.js';

// مفتاح حفظ المستخدم التجريبي في التخزين المحلي عند عدم توفر مفاتيح Supabase
const DEMO_USER_KEY = 'masarifi_current_user';

/**
 * تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
 * @param {string} email - البريد الإلكتروني للمستخدم
 * @param {string} password - كلمة المرور
 * @returns {Promise<Object>} كائن يحتوي على بيانات المستخدم والجلسة
 * @throws {Error} عند فشل عملية تسجيل الدخول أو خطأ في البيانات
 */
export async function login(email, password) {
  // التحقق من صحة المدخلات الأساسية
  if (!email || !email.trim()) {
    throw new Error('يرجى إدخال البريد الإلكتروني');
  }
  if (!password) {
    throw new Error('يرجى إدخال كلمة المرور');
  }

  // إذا كانت إعدادات Supabase مفعلة، نستخدم عميل Supabase الرسمي
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        // تحويل أخطاء Supabase الشائعة لرسائل عربية واضحة للمستخدم
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إليك');
        }
        throw new Error(error.message || 'فشل تسجيل الدخول، يرجى المحاولة لاحقاً');
      }

      return data;
    } catch (error) {
      console.error('Supabase Login Error:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // النمط الاحتياطي (Fallback Mode) للاختبار المحلي والتطوير بدون إنترنت
  // --------------------------------------------------------------------------
  const cleanEmail = email.trim().toLowerCase();
  const demoUser = {
    id: 'demo-user-' + btoa(cleanEmail).substring(0, 8),
    email: cleanEmail,
    name: cleanEmail.split('@')[0] || 'مستخدم',
    created_at: new Date().toISOString()
  };

  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  return { user: demoUser, session: { user: demoUser } };
}

/**
 * إنشاء حساب جديد لمستخدم
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور (على الأقل 6 خانات)
 * @returns {Promise<Object>} بيانات المستخدم المسجل
 * @throws {Error} عند تعذر إنشاء الحساب
 */
export async function signup(email, password) {
  if (!email || !email.trim()) {
    throw new Error('يرجى إدخال البريد الإلكتروني');
  }
  if (!password || password.length < 6) {
    throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
  }

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول');
        }
        throw new Error(error.message || 'تعذر إنشاء الحساب');
      }

      // إذا نجح التسجيل ولديه user_id، نتأكد من تهيئة سجل الميزانية في جدول profiles
      if (data?.user?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            budget: 0.00,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (profileErr) {
          console.warn('تنبيه تهيئة الملف الشخصي:', profileErr);
        }
      }

      return data;
    } catch (error) {
      console.error('Supabase Signup Error:', error);
      throw error;
    }
  }

  // النمط الاحتياطي للتسجيل
  const cleanEmail = email.trim().toLowerCase();
  const demoUser = {
    id: 'demo-user-' + btoa(cleanEmail).substring(0, 8),
    email: cleanEmail,
    name: cleanEmail.split('@')[0] || 'مستخدم',
    created_at: new Date().toISOString()
  };

  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  return { user: demoUser, message: 'تم إنشاء الحساب بنجاح' };
}

/**
 * تسجيل الخروج ومسح بيانات الجلسة وإعادة التوجيه إلى صفحة تسجيل الدخول
 * @returns {Promise<void>}
 */
export async function logout() {
  if (isConfigured && supabase) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('خطأ تسجيل الخروج من Supabase:', error);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // إزالة بيانات المستخدم التجريبي من التخزين المحلي
  localStorage.removeItem(DEMO_USER_KEY);

  // إعادة التوجيه لصفحة تسجيل الدخول
  window.location.href = 'login.html';
}

/**
 * استرجاع بيانات المستخدم المسجل حالياً
 * @returns {Promise<Object|null>} كائن المستخدم أو null إن لم يكن مسجلاً
 */
export async function getCurrentUser() {
  if (isConfigured && supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Get user warning:', error.message);
      }
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0] || 'مستخدم',
          created_at: user.created_at
        };
      }
    } catch (error) {
      console.error('فشل استرجاع بيانات المستخدم:', error);
    }
  }

  // التحقق من النمط الاحتياطي المحلي
  const stored = localStorage.getItem(DEMO_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('خطأ قراءة المستخدم التجريبي:', e);
    }
  }

  return null;
}

/**
 * التحقق من وجود جلسة دخول نشطة للمستخدم
 * @returns {Promise<Object|null>} كائن الجلسة أو null
 */
export async function checkSession() {
  if (isConfigured && supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.warn('Check session error:', error.message);
      if (session) return session;
    } catch (error) {
      console.error('خطأ فحص الجلسة:', error);
    }
  }

  const stored = localStorage.getItem(DEMO_USER_KEY);
  if (stored) {
    try {
      const user = JSON.parse(stored);
      return { user };
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * حارس الجلسة لصفحات لوحة التحكم (Protected Pages Guard)
 * يتم استدعاؤه في بداية تحميل صفحات Dashboard مثل index.html
 * إذا لم يكن المستخدم مسجلاً، يتم تحويله فوراً لصفحة الدخول.
 * @returns {Promise<Object>} بيانات المستخدم الحالي المؤكد
 */
export async function requireAuth() {
  const session = await checkSession();
  if (!session || !session.user) {
    window.location.replace('login.html');
    return null;
  }
  return session.user;
}

/**
 * حارس الجلسة لصفحات المصادقة (Guest Only Pages Guard)
 * يتم استدعاؤه في صفحة login.html
 * إذا كان المستخدم مسجلاً بالفعل، يتم تحويله إلى لوحة التحكم الرئيسية index.html
 */
export async function requireGuest() {
  const session = await checkSession();
  if (session && session.user) {
    window.location.replace('index.html');
  }
}
