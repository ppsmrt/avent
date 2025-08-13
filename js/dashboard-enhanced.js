// js/dashboard_enhanced.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// CONFIG
const OFFICE_LAT = 12.969556;
const OFFICE_LNG = 80.243833;
const ALLOWED_RADIUS = 200;
const MONTHLY_GOAL_DAYS = 22;

// utilities
function todayKey() { return new Date().toISOString().split('T')[0]; }
function timeNow(){ return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
function toHHMM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

// DOM references
const el = id => document.getElementById(id);
const fullNameEl = el('fullName');
const designationEl = el('designation');
const avatarEl = el('profileAvatar');
const punchInTimeEl = el('punchInTime');
const punchOutTimeEl = el('punchOutTime');
const totalHoursEl = el('totalHours');
const presenceStatusEl = el('presenceStatus');
const aiInsightsEl = el('aiInsights');
const goalFillEl = el('goalFill');
const goalTextEl = el('goalText');
const leaveBalanceEl = el('leaveBalance');
const streaksArea = el('streaksArea');
const alertsArea = el('alertsArea');
const recArea = el('recArea');
const holidaysList = el('holidaysList');
const monthlyChartCtx = document.getElementById('monthlyChart') ? document.getElementById('monthlyChart').getContext('2d') : null;
const heatmapArea = el('heatmapArea');
const moodRow = el('moodRow');

// simple sample holidays
const sampleHolidays = [
  { date: '2025-12-25', name: 'Christmas' },
  { date: '2026-01-01', name: 'New Year' }
];

function renderHolidays() {
  if (!holidaysList) return;
  holidaysList.innerHTML = '';
  const now = new Date();
  const monthAhead = new Date(now.getTime() + 30*24*60*60*1000);
  sampleHolidays.forEach(h => {
    const d = new Date(h.date);
    if (d >= now && d <= monthAhead) {
      const node = document.createElement('div');
      node.textContent = `${h.date} — ${h.name}`;
      holidaysList.appendChild(node);
    }
  });
}

function attachMoodHandlers(uid) {
  if (!moodRow) return;
  moodRow.querySelectorAll('.mood-emoji').forEach(btn => {
    btn.addEventListener('click', async () => {
      moodRow.querySelectorAll('.mood-emoji').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const mood = btn.dataset.mood;
      const today = todayKey();
      await set(ref(db, `mood/${uid}/${today}`), { mood, at: new Date().toISOString() });
      aiInsightsEl.textContent = `Mood saved: ${mood}`;
    });
  });
}

let monthlyChartInstance = null;
function drawMonthlyChart(labels, values) {
  if (!monthlyChartCtx) return;
  if (monthlyChartInstance) monthlyChartInstance.destroy();
  monthlyChartInstance = new Chart(monthlyChartCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Hours',
        data: values,
        backgroundColor: 'rgba(13,59,102,0.9)'
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

function computeInsights(punchHistory) {
  const onTimeCount = punchHistory.filter(p => p.punchIn && p.punctual !== false).length;
  const total = punchHistory.length;
  const pct = total ? Math.round((onTimeCount/total)*100) : 0;
  const earliest = punchHistory.reduce((min, p) => {
    if (!p.punchIn) return min;
    const t = Date.parse(p.date + 'T' + p.punchIn) || null;
    if (!t) return min;
    return (!min || t < min) ? t : min;
  }, null);
  const earliestStr = earliest ? new Date(earliest).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—';
  return { pct, earliest: earliestStr };
}

function computeTotalMinutes(punchIn, punchOut) {
  if (!punchIn || !punchOut) return 0;
  const today = new Date().toISOString().split('T')[0];
  const a = new Date(`${today}T${punchIn}`);
  const b = new Date(`${today}T${punchOut}`);
  if (isNaN(a) || isNaN(b)) return 0;
  let diff = (b - a) / (1000 * 60);
  if (diff < 0) diff = 0;
  return Math.round(diff);
}

function renderHeatmap(dates) {
  if (!heatmapArea) return;
  heatmapArea.innerHTML = '';
  const days = 35;
  for (let i = days-1; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const cell = document.createElement('div');
    cell.className = 'heatday';
    const record = (dates && dates[key]) ? dates[key] : null;
    cell.style.background = record && record.punchIn ? '#cfeef8' : '#f6fbff';
    cell.textContent = `${d.getDate()}`;
    heatmapArea.appendChild(cell);
  }
}

function computeStreaks(dates) {
  const maxLook = 30;
  let streak = 0;
  for (let i=0;i<maxLook;i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (dates && dates[key] && dates[key].punchIn) streak++;
    else break;
  }
  return streak;
}

function renderRecognition() {
  if (!recArea) return;
  recArea.innerHTML = '';
  const sample = [
    { name: 'Priya R', reason: 'Perfect attendance' },
    { name: 'Ravi K', reason: 'Most improved punctuality' }
  ];
  sample.forEach(s => {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `<div class="rec-avatar">${s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
      <div><strong>${s.name}</strong><div class="small-muted">${s.reason}</div></div>`;
    recArea.appendChild(item);
  });
}

async function loadDashboardForUser(user) {
  if (!user) return;
  const uid = user.uid;

  try {
    // FIX: Correct way to fetch user profile from RTDB
    const profileSnap = await get(ref(db, `users/${uid}`));
    const profile = profileSnap.exists() ? profileSnap.val() : null;
    if (profile) {
      fullNameEl && (fullNameEl.textContent = profile.name || user.email.split('@')[0]);
      designationEl && (designationEl.textContent = profile.designation || 'Employee');
      avatarEl && (avatarEl.textContent = (profile.name ? profile.name.split(' ').map(p=>p[0]).slice(0,2).join('') : user.email[0].toUpperCase()));
    }
  } catch (e) {
    console.warn('profile fetch failed', e);
  }

  // ... rest of your punch & UI code unchanged ...
}

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  renderHolidays();
  loadDashboardForUser(user);
});