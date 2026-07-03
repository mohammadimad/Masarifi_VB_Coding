import { getCurrentUser, logout } from './auth.js';

let timerInterval = null;
let seconds = 0;
let isRunning = false;

const achievements = [
  { id: 1, name: "البداية", description: "ابدأ أول جلسة", icon: "🎉", requirement: { sessions: 1 } },
  { id: 2, name: "الصبر", description: "جمع 5 دقائق إجمالية", icon: "⏳", requirement: { totalSeconds: 300 } },
  { id: 3, name: "المثابرة", description: "إكمال 5 جلسات", icon: "🔥", requirement: { sessions: 5 } },
  { id: 4, name: "التفاني", description: "جمع ساعة واحدة إجمالية", icon: "⭐", requirement: { totalSeconds: 3600 } },
  { id: 5, name: "الأسطورة", description: "إكمال 10 جلسات", icon: "👑", requirement: { sessions: 10 } },
  { id: 6, name: "الملاك", description: "جمع 5 ساعات إجمالية", icon: "💎", requirement: { totalSeconds: 18000 } },
];

function loadTimerData() {
  const saved = localStorage.getItem('masarifi_timer');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    totalSessions: 0,
    totalSeconds: 0,
    unlockedAchievements: []
  };
}

function saveTimerData(data) {
  localStorage.setItem('masarifi_timer', JSON.stringify(data));
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

function updateTimerDisplay() {
  document.getElementById('timer-display').textContent = formatTime(seconds);
}

function updateStats(data) {
  document.getElementById('total-sessions').textContent = data.totalSessions;
  document.getElementById('total-time').textContent = formatTime(data.totalSeconds);
  document.getElementById('achievements-count').textContent = data.unlockedAchievements.length;
}

function renderAchievements(data) {
  const list = document.getElementById('achievements-list');
  list.innerHTML = achievements.map(achievement => {
    const isUnlocked = data.unlockedAchievements.includes(achievement.id);
    return `
      <div class="flex items-center gap-3 p-4 rounded-xl border ${isUnlocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}">
        <div class="text-3xl">${isUnlocked ? achievement.icon : '🔒'}</div>
        <div class="flex-1">
          <div class="font-semibold ${isUnlocked ? 'text-green-800' : 'text-gray-700'}">${achievement.name}</div>
          <div class="text-sm ${isUnlocked ? 'text-green-600' : 'text-gray-500'}">${achievement.description}</div>
        </div>
        ${isUnlocked ? '<span class="text-green-500">✓</span>' : ''}
      </div>
    `;
  }).join('');
}

function checkAchievements(data) {
  let newUnlock = false;
  achievements.forEach(achievement => {
    if (data.unlockedAchievements.includes(achievement.id)) return;
    let unlocked = true;
    if (achievement.requirement.sessions && data.totalSessions < achievement.requirement.sessions) {
      unlocked = false;
    }
    if (achievement.requirement.totalSeconds && data.totalSeconds < achievement.requirement.totalSeconds) {
      unlocked = false;
    }
    if (unlocked) {
      data.unlockedAchievements.push(achievement.id);
      newUnlock = true;
      showAchievementNotification(achievement);
    }
  });
  return newUnlock;
}

function showAchievementNotification(achievement) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-yellow-300 p-6 z-50 text-center';
  notification.innerHTML = `
    <div class="text-4xl mb-2">${achievement.icon}</div>
    <div class="font-bold text-lg text-gray-900 mb-1">إنجاز جديد!</div>
    <div class="text-yellow-600 font-semibold">${achievement.name}</div>
    <div class="text-sm text-gray-500 mt-1">${achievement.description}</div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  document.getElementById('start-btn').classList.add('hidden');
  document.getElementById('pause-btn').classList.remove('hidden');
  timerInterval = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  document.getElementById('pause-btn').classList.add('hidden');
  document.getElementById('start-btn').classList.remove('hidden');
  clearInterval(timerInterval);
}

function resetTimer() {
  pauseTimer();
  if (seconds > 0) {
    let data = loadTimerData();
    data.totalSessions += 1;
    data.totalSeconds += seconds;
    if (checkAchievements(data)) {
      saveTimerData(data);
    } else {
      saveTimerData(data);
    }
    updateStats(data);
    renderAchievements(data);
  }
  seconds = 0;
  updateTimerDisplay();
}

function setupEventListeners() {
  document.getElementById('start-btn').addEventListener('click', startTimer);
  document.getElementById('pause-btn').addEventListener('click', pauseTimer);
  document.getElementById('reset-btn').addEventListener('click', resetTimer);

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
}

export async function initializeTimerApp() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const data = loadTimerData();
  updateStats(data);
  renderAchievements(data);
  setupEventListeners();
}
