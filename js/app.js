import { checkSession, logout, getCurrentUser } from './auth.js';
import { supabase, isConfigured } from './config.js';

// Default initial transactions matching the Google Stitch design
const DEFAULT_TRANSACTIONS = [
  {
    id: 't-1',
    type: 'expense',
    title: 'تسوق سوبر ماركت',
    category: 'البقالة',
    icon: 'shopping_bag',
    date: '2026-10-14',
    dateDisplay: 'البقالة • اليوم، 10:30 ص',
    amount: 120.50
  },
  {
    id: 't-2',
    type: 'income',
    title: 'الراتب الشهري',
    category: 'راتب',
    icon: 'payments',
    date: '2026-10-13',
    dateDisplay: 'دخل • أمس، 09:00 ص',
    amount: 3500.00
  },
  {
    id: 't-3',
    type: 'expense',
    title: 'عشاء في مطعم',
    category: 'طعام',
    icon: 'restaurant',
    date: '2026-10-12',
    dateDisplay: 'طعام • 12 أكتوبر، 08:15 م',
    amount: 45.00
  },
  {
    id: 't-4',
    type: 'expense',
    title: 'بنزين السيارة',
    category: 'مواصلات',
    icon: 'local_gas_station',
    date: '2026-10-10',
    dateDisplay: 'مواصلات • 10 أكتوبر، 05:40 م',
    amount: 60.00
  }
];

const CATEGORY_ICONS = {
  'تسوق': 'shopping_bag',
  'البقالة': 'shopping_bag',
  'طعام': 'restaurant',
  'مواصلات': 'local_gas_station',
  'فواتير': 'receipt_long',
  'راتب': 'payments',
  'صحة': 'medical_services',
  'أخرى': 'category'
};

const STORAGE_KEY = 'masarifi_transactions';

let transactions = [];
let editingTransactionId = null;

export async function initializeDashboard() {
  // Session check
  const session = await checkSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  // Update user name display if available
  const user = await getCurrentUser();
  const userNameEl = document.getElementById('user-display-name');
  if (userNameEl && user) {
    const displayName = user.name || (user.email ? user.email.split('@')[0] : 'مستخدم');
    userNameEl.textContent = `أهلاً بك، ${displayName}!`;
  }

  loadTransactions();
  setupEventListeners();
}

function loadTransactions() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      transactions = JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing stored transactions:', e);
      transactions = [...DEFAULT_TRANSACTIONS];
    }
  } else {
    transactions = [...DEFAULT_TRANSACTIONS];
    saveTransactions();
  }

  renderTransactions();
  updateSummaryCards();
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(amount) {
  return '$' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function updateSummaryCards() {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
    }
  });

  // Stitch base balance reference ($12,450 starting context)
  const baseBalance = 10100;
  const currentBalance = baseBalance + totalIncome - totalExpenses;

  const currentBalanceEl = document.getElementById('stat-current-balance');
  const totalIncomeEl = document.getElementById('stat-total-income');
  const totalExpensesEl = document.getElementById('stat-total-expenses');

  if (currentBalanceEl) currentBalanceEl.textContent = formatCurrency(currentBalance);
  if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totalIncome);
  if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(totalExpenses);
}

function renderTransactions() {
  const listContainer = document.getElementById('transactions-list');
  if (!listContainer) return;

  if (transactions.length === 0) {
    listContainer.innerHTML = `
      <div class="py-12 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl mb-2 text-outline">receipt_long</span>
        <p class="font-medium text-sm">لا توجد عمليات مسجلة حالياً</p>
        <p class="text-xs text-outline mt-1">اضغط على "إضافة عملية" لإضافة دخلك أو مصروفاتك</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = transactions.map(t => {
    const isIncome = t.type === 'income';
    const amountClass = isIncome ? 'text-green-600' : 'text-error';
    const amountSign = isIncome ? '+' : '-';
    const iconBg = isIncome ? 'bg-green-100 text-green-600' : 'bg-surface-variant text-on-surface-variant';
    const iconName = t.icon || CATEGORY_ICONS[t.category] || 'category';

    return `
      <div class="p-4 flex items-center justify-between hover:bg-surface-variant/10 transition-colors border-b border-outline-variant/30 last:border-b-0">
        <!-- Amount & Actions -->
        <div class="flex items-center gap-2 order-2 md:order-1">
          <button 
            data-action="edit" 
            data-id="${t.id}"
            class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-all duration-200 flex items-center justify-center" 
            title="تعديل العملية"
            aria-label="تعديل العملية"
          >
            <span class="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button 
            data-action="delete" 
            data-id="${t.id}"
            class="p-2 text-on-surface-variant hover:text-error hover:bg-red-100 rounded-full transition-all duration-200 flex items-center justify-center" 
            title="حذف العملية"
            aria-label="حذف العملية"
          >
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
          <div class="font-bold text-sm md:text-base ${amountClass} min-w-[90px] text-left" dir="ltr">
            ${amountSign}${formatCurrency(t.amount)}
          </div>
        </div>

        <!-- Info & Category Icon -->
        <div class="flex items-center gap-3 order-1 md:order-2">
          <div class="w-11 h-11 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-[22px]">${iconName}</span>
          </div>
          <div>
            <div class="font-semibold text-sm text-on-surface">${escapeHtml(t.title)}</div>
            <div class="text-xs text-on-surface-variant mt-0.5">${escapeHtml(t.dateDisplay || t.category)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach action listeners
  listContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteTransaction(id);
    });
  });

  listContainer.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditModal(id);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function deleteTransaction(id) {
  if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderTransactions();
  updateSummaryCards();
}

function openAddModal() {
  editingTransactionId = null;
  const modal = document.getElementById('transaction-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('transaction-form');

  if (modalTitle) modalTitle.textContent = 'إضافة عملية جديدة';
  if (form) form.reset();

  // Set default date to today
  const dateInput = document.getElementById('modal-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Default type: Expense
  const expenseRadio = document.querySelector('input[name="trans_type"][value="expense"]');
  if (expenseRadio) expenseRadio.checked = true;

  if (modal) modal.classList.remove('hidden');
}

function openEditModal(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;

  editingTransactionId = id;
  const modal = document.getElementById('transaction-modal');
  const modalTitle = document.getElementById('modal-title');

  if (modalTitle) modalTitle.textContent = 'تعديل العملية';

  const titleInput = document.getElementById('modal-title-input');
  const amountInput = document.getElementById('modal-amount');
  const categorySelect = document.getElementById('modal-category');
  const dateInput = document.getElementById('modal-date');
  const typeRadio = document.querySelector(`input[name="trans_type"][value="${transaction.type}"]`);

  if (titleInput) titleInput.value = transaction.title;
  if (amountInput) amountInput.value = transaction.amount;
  if (categorySelect) categorySelect.value = transaction.category;
  if (dateInput) dateInput.value = transaction.date;
  if (typeRadio) typeRadio.checked = true;

  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('transaction-modal');
  if (modal) modal.classList.add('hidden');
  editingTransactionId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('modal-title-input');
  const amountInput = document.getElementById('modal-amount');
  const categorySelect = document.getElementById('modal-category');
  const dateInput = document.getElementById('modal-date');
  const typeRadio = document.querySelector('input[name="trans_type"]:checked');

  const title = titleInput ? titleInput.value.trim() : '';
  const amount = amountInput ? parseFloat(amountInput.value) : 0;
  const category = categorySelect ? categorySelect.value : 'أخرى';
  const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  const type = typeRadio ? typeRadio.value : 'expense';

  if (!title || !amount || amount <= 0) {
    alert('يرجى كتابة وصف ومبلغ صحيح للعملية');
    return;
  }

  const icon = CATEGORY_ICONS[category] || 'category';
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
  const dateDisplay = `${category} • ${formattedDate}`;

  if (editingTransactionId) {
    // Edit existing
    const index = transactions.findIndex(t => t.id === editingTransactionId);
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        type,
        title,
        amount,
        category,
        icon,
        date,
        dateDisplay
      };
    }
  } else {
    // Add new
    const newTransaction = {
      id: 't-' + Date.now(),
      type,
      title,
      amount,
      category,
      icon,
      date,
      dateDisplay
    };
    transactions.unshift(newTransaction);
  }

  saveTransactions();
  renderTransactions();
  updateSummaryCards();
  closeModal();
}

function setupEventListeners() {
  // Add transaction button
  const openModalBtn = document.getElementById('btn-open-modal');
  if (openModalBtn) openModalBtn.addEventListener('click', openAddModal);

  // Close modal buttons
  const closeModalBtns = document.querySelectorAll('[data-close-modal]');
  closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));

  // Form submit
  const form = document.getElementById('transaction-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  // Logout buttons
  const logoutBtns = document.querySelectorAll('[data-logout-btn]');
  logoutBtns.forEach(btn => btn.addEventListener('click', () => {
    if (confirm('هل تريد تسجيل الخروج؟')) {
      logout();
    }
  }));
}
