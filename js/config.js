import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// إعدادات Supabase - ضع رابط المشروع والمفتاح المجهول هنا لتفعيل قاعدة البيانات السحابية
export const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

export const isConfigured = 
  SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && 
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
  Boolean(SUPABASE_URL) && 
  Boolean(SUPABASE_ANON_KEY);

export const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
