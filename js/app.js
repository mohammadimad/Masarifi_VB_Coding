import { getCurrentUser, logout } from './auth.js';

let todos = [];
let currentFilter = 'all';

export async function initializeTodoApp() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  loadTodos();
  setupEventListeners();
}

function loadTodos() {
  const savedTodos = localStorage.getItem('masarifi_todos');
  if (savedTodos) {
    todos = JSON.parse(savedTodos);
  }
  renderTodos();
  updateStats();
}

function saveTodos() {
  localStorage.setItem('masarifi_todos', JSON.stringify(todos));
}

function renderTodos() {
  const todoList = document.getElementById('todo-list');
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  if (filteredTodos.length === 0) {
    todoList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p>لا توجد مهام</p>
      </div>
    `;
    return;
  }

  todoList.innerHTML = filteredTodos.map(todo => `
    <div class="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 ${todo.completed ? 'opacity-60' : ''}">
      <div class="flex items-center gap-3">
        <button class="todo-toggle w-7 h-7 rounded-full border-2 flex items-center justify-center ${todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-500'}" data-id="${todo.id}">
          ${todo.completed ? '<span class="text-white text-sm">✓</span>' : ''}
        </button>
        <span class="${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}">${todo.text}</span>
      </div>
      <button class="todo-delete text-gray-400 hover:text-red-500 transition-colors" data-id="${todo.id}">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.todo-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      toggleTodo(id);
    });
  });

  document.querySelectorAll('.todo-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      deleteTodo(id);
    });
  });
}

function addTodo(text) {
  const newTodo = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.unshift(newTodo);
  saveTodos();
  renderTodos();
  updateStats();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
    updateStats();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  updateStats();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  renderTodos();
  updateStats();
}

function setFilter(filter) {
  currentFilter = filter;
  updateFilterButtons();
  renderTodos();
}

function updateFilterButtons() {
  const buttons = {
    'filter-all': 'all',
    'filter-active': 'active',
    'filter-completed': 'completed'
  };

  Object.entries(buttons).forEach(([btnId, filter]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (filter === currentFilter) {
        btn.className = 'px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm';
      } else {
        btn.className = 'px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm';
      }
    }
  });
}

function updateStats() {
  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.length - activeCount;
  document.getElementById('todo-stats').innerHTML = `
    <span>${activeCount} مهمة جارية</span>
    ${completedCount > 0 ? ` • <span>${completedCount} مهمة مكتملة</span>` : ''}
  `;
}

function setupEventListeners() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await logout();
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }

  const addForm = document.getElementById('add-todo-form');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('todo-input');
      if (input && input.value.trim()) {
        addTodo(input.value.trim());
        input.value = '';
      }
    });
  }

  document.getElementById('filter-all')?.addEventListener('click', () => setFilter('all'));
  document.getElementById('filter-active')?.addEventListener('click', () => setFilter('active'));
  document.getElementById('filter-completed')?.addEventListener('click', () => setFilter('completed'));

  document.getElementById('clear-completed')?.addEventListener('click', clearCompleted);
}
