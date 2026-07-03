import { supabase } from './config.js'

export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export async function signup(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

export async function checkSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Check session error:', error)
    return null
  }
}
