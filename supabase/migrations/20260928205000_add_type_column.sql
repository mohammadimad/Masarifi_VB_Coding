-- إضافة عمود نوع العملية (income أو expense) إلى جدول المصروفات
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense';
