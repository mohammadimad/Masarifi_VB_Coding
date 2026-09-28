/**
 * ==============================================================================
 * ملف إعدادات وتهيئة عميل Supabase (assets/js/config.js)
 * ==============================================================================
 * الغرض:
 * - تهيئة الاتصال بقاعدة بيانات Supabase السحابية عبر CDN الرسمي.
 * - استخراج بيانات الاتصال من متغيرات البيئة أو localStorage أو الثوابت.
 * - توفير عميل مهيأ ومحمي بـ RLS للاستخدام في جميع أنحاء التطبيق.
 * - دعم نمط العمل التجريبي (Offline Fallback) لضمان عمل الواجهة إذا لم تتوفر المفاتيح بعد.
 * ==============================================================================
 */

// استيراد دالة إنشاء عميل Supabase من CDN الرسمي بدون أي أدوات بناء (No npm, No Bundler)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/**
 * مفاتيح الاتصال الافتراضية
 * يمكن للمطور تعديلها مباشرة هنا أو ضبطها عبر window.__ENV__ أو من صفحة الإعدادات
 */
const DEFAULT_SUPABASE_URL = 'https://your-project.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'your-anon-key-here';

/**
 * دالة استرجاع المتغيرات إما من window.__ENV__ أو التخزين المحلي أو الثابت
 */
function getEnvConfig(key, defaultValue) {
  // 1. فحص كائن متغيرات البيئة العامة إذا كان معرفاً
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  // 2. فحص التخزين المحلي في حال تم ضبطها ديناميكياً من واجهة المستخدم
  if (typeof localStorage !== 'undefined') {
    const localVal = localStorage.getItem(`MASARIFI_${key}`);
    if (localVal) return localVal;
  }
  // 3. القيمة الافتراضية
  return defaultValue;
}

// قراءة رابط المشروع والمفتاح المجهول (Anon Key)
export const SUPABASE_URL = getEnvConfig('SUPABASE_URL', DEFAULT_SUPABASE_URL);
export const SUPABASE_ANON_KEY = getEnvConfig('SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY);

/**
 * التحقق مما إذا كانت مفاتيح Supabase قد تم ضبطها بقيم حقيقية وصالحة
 */
export const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
  SUPABASE_URL !== 'https://your-project.supabase.co' &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
  SUPABASE_ANON_KEY !== 'your-anon-key-here' &&
  SUPABASE_URL.startsWith('https://')
);

/**
 * تهيئة كائن عميل Supabase
 * إذا لم تكن المفاتيح مضبوطة، يعود الكائن بـ null لتفعيل النمط التجريبي التلقائي بأمان
 */
export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true, // حفظ الجلسة تلقائياً في التخزين المحلي للمتصفح
        autoRefreshToken: true, // تجديد الـ JWT تلقائياً
        detectSessionInUrl: true // التقاط روابط تأكيد البريد الإلكتروني تلقائياً
      }
    })
  : null;

/**
 * دالة مساعدة لتحديث مفاتيح الاتصال يدوياً وحفظها في المتصفح
 * @param {string} url - رابط مشروع Supabase
 * @param {string} key - مفتاح Anon Key للمشروع
 */
export function setSupabaseCredentials(url, key) {
  if (url && key) {
    localStorage.setItem('MASARIFI_SUPABASE_URL', url.trim());
    localStorage.setItem('MASARIFI_SUPABASE_ANON_KEY', key.trim());
    window.location.reload();
  }
}
