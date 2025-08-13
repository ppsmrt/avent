import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Hide body initially and show loading spinner
document.body.style.opacity = "0";
document.body.style.transition = "opacity 0.5s ease-in-out";
const loader = document.createElement("div");
loader.id = "loadingSpinner";
loader.style.cssText = `
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-size: 18px; color: #555; text-align: center;
`;
loader.innerHTML = `<i class="fas fa-spinner fa-spin" style="font-size:24px;"></i><br>Loading Dashboard...`;
document.body.appendChild(loader);

// === DOM Elements ===
const profilePhotoEl = document.getElementById("profileAvatarImg");
const fullNameEl = document.getElementById("fullName");
const designationEl = document.getElementById("designation");
const sickBalanceEl = document.getElementById("sickBalance");
const presenceStatusEl = document.getElementById("presenceStatus");
const holidaysList = document.getElementById("holidaysList");

let profileLoaded = false;
let attendanceLoaded = false;

function checkDataLoaded() {
  if (profileLoaded && attendanceLoaded) {
    loader.remove();
    document.body.style.opacity = "1"; // fade-in
  }
}

// === Sample Holidays ===
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
  let employeeId = localStorage.getItem("employeeId");
  if (employeeId) return employeeId;

  // Try authIndex mapping
  const indexSnap = await get(ref(db, `authIndex/${uid}`));
  if (indexSnap.exists()) {
    employeeId = indexSnap.val().employeeId;
    localStorage.setItem("employeeId", employeeId);
    return employeeId;
  }

  // Fallback search in users node
  const usersSnap = await get(ref(db, "users"));
  if (usersSnap.exists()) {
    const usersData = usersSnap.val();
    for (const empId in usersData) {
      if (usersData[empId].authUid === uid) {
        localStorage.setItem("employeeId", empId);
        return empId;
      }
    }
  }

  throw new Error("Employee ID not found for this user.");
}

function loadDashboardForUser(employeeId, user) {
  // === Real-time profile listener ===
  onValue(ref(db, `users/${employeeId}`), snapshot => {
    if (snapshot.exists()) {
      const profile = snapshot.val();
      localStorage.setItem("employeeData", JSON.stringify(profile));

      fullNameEl.innerHTML = `<i class="fas fa-user-circle" style="color:#007bff;"></i> ${profile.fullName || profile.name || user.email.split("@")[0]}`;
      designationEl.innerHTML = `<i class="fas fa-briefcase" style="color:#28a745;"></i> ${profile.designation || "Employee"}`;
      profilePhotoEl.src = profile.profilePhoto || "assets/profile.png";

      if (sickBalanceEl && profile.sickBalance !== undefined) {
        sickBalanceEl.textContent = `${profile.sickBalance} days`;
      }
    } else {
      profilePhotoEl.src = "assets/profile.png";
      fullNameEl.textContent = "Unknown User";
      designationEl.textContent = "N/A";
    }
    profileLoaded = true;
    checkDataLoaded();
  });

  // === Real-time attendance listener ===
  onValue(ref(db, `punches/${employeeId}/${todayKey()}`), snapshot => {
    if (snapshot.exists()) {
      const todayData = snapshot.val();
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
    attendanceLoaded = true;
    checkDataLoaded();
  });
}

// === Auth Check ===
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("login.html");
  } else {
    try {
      renderHolidays();
      const employeeId = await getEmployeeId(user.uid);
      loadDashboardForUser(employeeId, user);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      alert("Error loading dashboard. Please login again.");
      await signOut(auth);
      localStorage.clear();
      window.location.href = "login.html";
    }
  }
});