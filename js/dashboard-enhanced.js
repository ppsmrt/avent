import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Hide the body until auth check finishes
document.body.style.display = "none";

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

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

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

async function getEmployeeId(uid) {
  // Try localStorage first
  let employeeId = localStorage.getItem("employeeId");
  if (employeeId) return employeeId;

  // Fallback: get from authIndex
  const indexSnap = await get(ref(db, `authIndex/${uid}`));
  if (indexSnap.exists()) {
    employeeId = indexSnap.val().employeeId;
    localStorage.setItem("employeeId", employeeId);
    return employeeId;
  }

  throw new Error("Employee ID not found for this user.");
}

async function loadDashboardForUser(user) {
  try {
    const employeeId = await getEmployeeId(user.uid);

    // === Load profile ===
    const profileSnap = await get(ref(db, `users/${employeeId}`));
    if (profileSnap.exists()) {
      const profile = profileSnap.val();
      localStorage.setItem("employeeData", JSON.stringify(profile));

      fullNameEl.textContent = profile.fullName || profile.name || user.email.split("@")[0];
      designationEl.textContent = profile.designation || "Employee";
      if (profile.profilePhoto) {
        profilePhotoEl.src = profile.profilePhoto;
      }
      if (profile.sickBalance !== undefined && sickBalanceEl) {
        sickBalanceEl.textContent = `${profile.sickBalance} days`;
      }
    }

    // === Load attendance for today ===
    const attendanceSnap = await get(ref(db, `punches/${employeeId}/${todayKey()}`));
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
    alert("Error loading dashboard. Please login again.");
    await signOut(auth);
    localStorage.clear();
    window.location.href = "login.html";
  }
}

// === Auth Check & Redirect ===
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.replace("login.html");
  } else {
    document.body.style.display = "block"; // Show dashboard only after auth passes
    renderHolidays();
    loadDashboardForUser(user);
  }
});