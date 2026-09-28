-- ==============================================================================
-- مخطط قاعدة بيانات "مصاريفي" (Masarifi) - Supabase PostgreSQL Schema
-- ==============================================================================
-- يحتوي هذا الملف على تعريف الجداول، المفاتيح الخارجية، وسياسات الأمان (RLS)
-- لضمان عزل بيانات كل مستخدم وحمايتها تماماً.
-- ==============================================================================

-- 1. جدول الملف الشخصي والميزانية (profiles)
-- يرتبط بحساب المستخدم في auth.users لتخزين الميزانية الشهرية المحددة.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (budget >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تعليق توضيحي للجدول
COMMENT ON TABLE public.profiles IS 'جدول الملف الشخصي للمستخدم لتخزين الميزانية الشهرية';

-- 2. جدول المصروفات (expenses)
-- يخزن سجلات المصروفات لكل مستخدم مع التصنيف والتاريخ والمبلغ.
CREATE TABLE IF NOT EXISTS public.expenses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (trim(title) <> ''),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تعليق توضيحي للجدول
COMMENT ON TABLE public.expenses IS 'جدول المصروفات والعمليات المالية الشهرية لكل مستخدم';

-- إنشاء فهارس (Indexes) لتحسين سرعة الاستعلامات حسب المستخدم والتاريخ
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON public.expenses (user_id, created_at DESC);

-- ==============================================================================
-- 3. تفعيل أمان مستوى الصفوف (Row Level Security - RLS)
-- يمنع أي مستخدم من قراءة أو كتابة أي بيانات لا تخص حسابه الشخصي.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- سياسات جدول profiles
-- ------------------------------------------------------------------------------

-- السماح للمستخدم بقراءة ملفه الشخصي فقط
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- السماح للمستخدم بإنشاء ملفه الشخصي
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- السماح للمستخدم بتحديث ملفه الشخصي وميزانيته
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- سياسات جدول expenses
-- ------------------------------------------------------------------------------

-- السماح للمستخدم بقراءة مصروفاته فقط
CREATE POLICY "Users can view their own expenses" 
ON public.expenses 
FOR SELECT 
USING (auth.uid() = user_id);

-- السماح للمستخدم بإضافة مصروف جديد لحسابه فقط
CREATE POLICY "Users can insert their own expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- السماح للمستخدم بتعديل مصروفاته الخاصة فقط
CREATE POLICY "Users can update their own expenses" 
ON public.expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- السماح للمستخدم بحذف مصروفاته الخاصة فقط
CREATE POLICY "Users can delete their own expenses" 
ON public.expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. دالة ومحفز (Trigger) لإنشاء سجل Profile تلقائياً عند تسجيل أي مستخدم جديد
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, budget, updated_at)
    VALUES (NEW.id, 0.00, now())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل المحفز بعد إنشاء حساب في auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
