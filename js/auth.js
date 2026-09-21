import { supabase, isConfigured } from './config.js';

const DEMO_USER_KEY = 'masarifi_current_user';

export async function login(email, password) {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase Login Error:', error);
      throw error;
    }
  }

  // Fallback mode for local testing without Supabase credentials
  if (!email || !password) {
    throw new Error('يرجى ملء البريد الإلكتروني وكلمة المرور');
  }
  const demoUser = {
    id: 'demo-user-123',
    email: email,
    name: email.split('@')[0] || 'مستخدم',
    created_at: new Date().toISOString()
  };
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  return { user: demoUser, session: { user: demoUser } };
}

export async function signup(email, password) {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Supabase Signup Error:', error);
      throw error;
    }
  }

  // Fallback mode
  if (!email || !password || password.length < 6) {
    throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف');
  }
  return { user: { email }, message: 'تم إنشاء الحساب بنجاح' };
}

export async function logout() {
  if (isConfigured && supabase) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  localStorage.removeItem(DEMO_USER_KEY);
  window.location.href = 'login.html';
}

export async function getCurrentUser() {
  if (isConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user;
    } catch (error) {
      console.error('Get user error:', error);
    }
  }
  const stored = localStorage.getItem(DEMO_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export async function checkSession() {
  if (isConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return session;
    } catch (error) {
      console.error('Check session error:', error);
    }
  }
  const stored = localStorage.getItem(DEMO_USER_KEY);
  return stored ? { user: JSON.parse(stored) } : null;
}
