// js/dashboard_enhanced.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, child, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// CONFIG
const OFFICE_LAT = 12.969556;
const OFFICE_LNG = 80.243833;
const ALLOWED_RADIUS = 200; // meters for location checks (if used)
const MONTHLY_GOAL_DAYS = 22; // example

// utilities
function todayKey() { return new Date().toISOString().split('T')[0]; }
function timeNow(){ return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
function toHHMM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}
function getDistanceMeters(lat1, lon1, lat2, lon2){
  const R = 6371000;
  const toRad = v => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// DOM references (safe-get)
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

// simple sample holidays (can be pulled from DB later)
const sampleHolidays = [
  { date: '2025-12-25', name: 'Christmas' },
  { date: '2026-01-01', name: 'New Year' }
];

// helper: render holidays
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

// mood handling
function attachMoodHandlers(uid) {
  if (!moodRow) return;
  moodRow.querySelectorAll('.mood-emoji').forEach(btn => {
    btn.addEventListener('click', async () => {
      moodRow.querySelectorAll('.mood-emoji').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const mood = btn.dataset.mood;
      // save to /mood/{uid}/{YYYY-MM-DD} = { mood, at }
      const today = todayKey();
      await set(ref(db, `mood/${uid}/${today}`), { mood, at: new Date().toISOString() });
      // small feedback
      aiInsightsEl.textContent = `Mood saved: ${mood}`;
    });
  });
}

// draw monthly chart (Chart.js required)
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
      scales: {
        y: { beginAtZero: true }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// stub: compute punctuality insights from punches (basic)
function computeInsights(punchHistory) {
  // punchHistory: array of {date, punchIn, punchOut} for month
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

// compute hours between punchIn/punchOut (assumes HH:MM format)
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

// fill heatmap placeholder
function renderHeatmap(dates) {
  if (!heatmapArea) return;
  heatmapArea.innerHTML = '';
  // create 35 boxes (last 35 days)
  const days = 35;
  for (let i = days-1; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const cell = document.createElement('div');
    cell.className = 'heatday';
    const record = (dates && dates[key]) ? dates[key] : null;
    if (record && record.punchIn) cell.style.background = '#cfeef8';
    else cell.style.background = '#f6fbff';
    cell.textContent = `${d.getDate()}`;
    heatmapArea.appendChild(cell);
  }
}

// compute streaks simple: consecutive days present last N days
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

// load recognition (placeholder) — can be from DB
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

// load data for current user
async function loadDashboardForUser(user) {
  if (!user) return;
  const uid = user.uid;

  // fetch profile
  try {
    const profileSnap = await get(child(ref(db), `users/${uid}`));
    const profile = profileSnap.exists() ? profileSnap.val() : null;
    if (profile) {
      fullNameEl && (fullNameEl.textContent = profile.name || user.email.split('@')[0]);
      designationEl && (designationEl.textContent = profile.designation || 'Employee');
      avatarEl && (avatarEl.textContent = (profile.name ? profile.name.split(' ').map(p=>p[0]).slice(0,2).join('') : user.email[0].toUpperCase()));
    }
  } catch (e) {
    console.warn('profile fetch failed', e);
  }

  // fetch punches for the month (simple: under 'punches/{uid}')
  const monthKeyPrefix = new Date().toISOString().slice(0,7); // YYYY-MM
  try {
    const punchesSnap = await get(child(ref(db), `punches/${uid}`));
    const punches = punchesSnap.exists() ? punchesSnap.val() : {};
    // build arrays for last 30 days
    const today = new Date();
    const labels = [];
    const hoursData = [];
    const datesObj = {}; // key->record
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      labels.push(key.slice(-2));
      const rec = punches[key] || {};
      datesObj[key] = rec;
      const min = computeTotalMinutes(rec.punchIn, rec.punchOut);
      hoursData.push(Number((min/60).toFixed(2)));
    }

    // draw chart
    drawMonthlyChart(labels, hoursData);

    // heatmap
    renderHeatmap(datesObj);

    // set punches for today
    const todayKeyStr = todayKey();
    const todayRec = punches[todayKeyStr] || {};
    punchInTimeEl && (punchInTimeEl.textContent = todayRec.punchIn || '--');
    punchOutTimeEl && (punchOutTimeEl.textContent = todayRec.punchOut || '--');
    const minutes = computeTotalMinutes(todayRec.punchIn, todayRec.punchOut);
    totalHoursEl && (totalHoursEl.textContent = minutes ? toHHMM(minutes) : '--');

    // goal progress: days present in month
    const daysPresent = Object.keys(punches).filter(k => k.startsWith(monthKeyPrefix) && punches[k].punchIn).length;
    const perc = Math.min(100, Math.round((daysPresent / MONTHLY_GOAL_DAYS) * 100));
    if (goalFillEl) goalFillEl.style.width = perc + '%';
    if (goalTextEl) goalTextEl.textContent = `${daysPresent} / ${MONTHLY_GOAL_DAYS} days`;

    // streaks
    const streak = computeStreaks(punches);
    streaksArea && (streaksArea.innerHTML = `<div class="streak-badge">${streak} day streak</div>`);

    // leave balance placeholder (can be pulled from /leave/{uid})
    leaveBalanceEl && (leaveBalanceEl.textContent = `5 / 2`);

    // AI insights
    const hist = Object.keys(punches).map(k => ({ date: k, ...punches[k] }));
    const ins = computeInsights(hist);
    aiInsightsEl && (aiInsightsEl.textContent = `On-time ${ins.pct}% this month. Earliest arrival: ${ins.earliest}`);

    // alerts: check rules
    const alerts = [];
    // example: missing punch out yesterday?
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().split('T')[0];
    if (punches[yKey] && punches[yKey].punchIn && !punches[yKey].punchOut) {
      alerts.push({ text: `Missing punch out on ${yKey}` });
    }
    // late today example: if punchIn > 09:30 => late
    if (todayRec && todayRec.punchIn) {
      const fields = todayRec.punchIn.split(':');
      const hh = parseInt(fields[0],10);
      const mm = parseInt(fields[1],10);
      if (hh > 9 || (hh === 9 && mm > 30)) alerts.push({ text: `Late today (${todayRec.punchIn})` });
    }
    // render alerts
    if (alertsArea) {
      alertsArea.innerHTML = '';
      if (alerts.length === 0) {
        alertsArea.innerHTML = `<div class="small-muted">No alerts</div>`;
      } else {
        alerts.forEach(a => {
          const n = document.createElement('div'); n.className = 'alert'; n.textContent = a.text;
          alertsArea.appendChild(n);
        });
      }
    }

    // recognition
    renderRecognition();

    // attach mood handlers
    attachMoodHandlers(uid);

  } catch (e) {
    console.error('punches fetch failed', e);
  }
}

// auth guard + init
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  // render static UI pieces
  renderHolidays();
  // load dashboard data
  loadDashboardForUser(user);
});