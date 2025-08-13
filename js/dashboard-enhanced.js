// dashboard.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// === DOM elements ===
const profilePhotoEl = document.getElementById("profilePhoto");
const fullNameEl = document.getElementById("fullName");
const designationEl = document.getElementById("designation");
const sickBalanceEl = document.getElementById("sickBalance");
const presenceStatusEl = document.getElementById("presenceStatus");
const holidaysList = document.getElementById("holidaysList");

// === Holidays Data (sample) ===
const sampleHolidays = [
  { date: "2025-12-25", name: "Christmas" },
  { date: "2026-01-01", name: "New Year" }
];

// === Utility ===
function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// === Render Holidays ===
function renderHolidays() {
  if (!holidaysList) return;
  holidaysList.innerHTML = "";
  const now = new Date();
  const monthAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  sampleHolidays.forEach(h => {
    const d = new Date(h.date);
    if (d >= now && d <= monthAhead) {
      const node = document.createElement("div");
      node.textContent = `${h.date} — ${h.name}`;
      holidaysList.appendChild(node);
    }
  });
}

// === Load Dashboard Data ===
async function loadDashboardForUser(user) {
  if (!user) return;
  const uid = user.uid;

  try {
    // --- Fetch Profile ---
    const profileSnap = await get(ref(db, `users/${uid}`));
    if (profileSnap.exists()) {
      const profile = profileSnap.val();
      fullNameEl.textContent = profile.fullName || profile.name || user.email.split("@")[0];
      designationEl.textContent = profile.designation || "Employee";
      if (profile.profilePhoto) {
        profilePhotoEl.src = profile.profilePhoto;
      }
      if (profile.sickBalance !== undefined && sickBalanceEl) {
        sickBalanceEl.textContent = `${profile.sickBalance} days`;
      }
    }

    // --- Fetch Today’s Attendance ---
    const attendanceSnap = await get(ref(db, `punches/${uid}/${todayKey()}`));
    if (attendanceSnap.exists()) {
      const todayData = attendanceSnap.val();
      if (todayData.punchIn && todayData.punchOut) {
        presenceStatusEl.textContent = "Present (Completed Workday)";
        presenceStatusEl.className = "status-present";
      } else if (todayData.punchIn) {
        presenceStatusEl.textContent = "Present (Working)";
        presenceStatusEl.className = "status-present";
      } else {
        presenceStatusEl.textContent = "Absent";
        presenceStatusEl.className = "status-absent";
      }
    } else {
      presenceStatusEl.textContent = "Absent";
      presenceStatusEl.className = "status-absent";
    }

  } catch (e) {
    console.error("Error loading dashboard data:", e);
  }
}

// === Auth State Change ===
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  renderHolidays();
  loadDashboardForUser(user);
});