import { supabase } from './config.js'
import { getCurrentUser, logout } from './auth.js'

let transactions = []
let currentUser = null

export async function initializeApp() {
  currentUser = await getCurrentUser()
  if (!currentUser) {
    window.location.href = 'login.html'
    return
  }
  await loadTransactions()
  renderDashboard()
  setupEventListeners()
}

async function loadTransactions() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', currentUser.id)
      .gte('date', startOfMonth)
      .order('date', { ascending: false })
    
    if (error) throw error
    transactions = data || []
  } catch (error) {
    console.error('Load transactions error:', error)
    alert('حدث خطأ أثناء تحميل المعاملات')
  }
}

function renderDashboard() {
  renderStats()
  renderTransactions()
}

function renderStats() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpense
  
  document.getElementById('total-income').textContent = formatCurrency(totalIncome)
  document.getElementById('total-expense').textContent = formatCurrency(totalExpense)
  document.getElementById('balance').textContent = formatCurrency(balance)
}

function renderTransactions() {
  const container = document.getElementById('transactions-list')
  
  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p>لا توجد معاملات لهذا الشهر</p>
      </div>
    `
    return
  }
  
  container.innerHTML = transactions.map(transaction => `
    <div class="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}">
          <span class="${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} text-xl">
            ${transaction.type === 'income' ? '+' : '-'}
          </span>
        </div>
        <div>
          <p class="font-medium text-gray-900">${transaction.description}</p>
          <p class="text-sm text-gray-500">${formatDate(transaction.date)}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
          ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
        </p>
      </div>
    </div>
  `).join('')
}

function formatCurrency(amount) {
  return amount.toLocaleString('ar-EG') + ' ج.م'
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ar-EG')
}

async function addTransaction(transaction) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: currentUser.id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date
      })
      .select()
    
    if (error) throw error
    transactions = [data[0], ...transactions]
    renderDashboard()
    closeModal()
  } catch (error) {
    console.error('Add transaction error:', error)
    alert('حدث خطأ أثناء إضافة المعاملة')
  }
}

function openModal() {
  document.getElementById('transaction-modal').classList.remove('hidden')
}

function closeModal() {
  document.getElementById('transaction-modal').classList.add('hidden')
  document.getElementById('transaction-form').reset()
}

function setupEventListeners() {
  document.getElementById('add-transaction-btn').addEventListener('click', openModal)
  document.getElementById('cancel-btn').addEventListener('click', closeModal)
  document.getElementById('logout-btn').addEventListener('click', handleLogout)
  
  document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    const transaction = {
      amount: parseFloat(formData.get('amount')),
      type: formData.get('type'),
      description: formData.get('description'),
      date: formData.get('date') || new Date().toISOString().split('T')[0]
    }
    
    await addTransaction(transaction)
  })
  
  document.getElementById('transaction-modal').addEventListener('click', (e) => {
    if (e.target.id === 'transaction-modal') {
      closeModal()
    }
  })
}

async function handleLogout() {
  try {
    await logout()
    window.location.href = 'login.html'
  } catch (error) {
    console.error('Logout error:', error)
  }
}
