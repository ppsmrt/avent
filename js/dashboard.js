// js/dashboard.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, push, onValue, set, child, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* CONFIG - office location (decimal) */
const OFFICE_LAT = 12.969556;
const OFFICE_LNG = 80.243833;
const OFFICE_RADIUS_M = 100;

const punchInBtn = document.getElementById("punchInBtn");
const punchOutBtn = document.getElementById("punchOutBtn");
const punchInTimeEl = document.getElementById("punchInTime");
const punchOutTimeEl = document.getElementById("punchOutTime");
const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const sidebar = document.getElementById("sidebar");

/* util: haversine distance (meters) */
function getDistanceMeters(lat1, lon1, lat2, lon2){
  const R = 6371000;
  const toRad = v => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* enable/disable UI according to DB state & location */
function updateButtonsForToday(uid) {
  const todayKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const dayRef = ref(db, `attendance/${uid}/${todayKey}`);

  // Listen for changes
  onValue(dayRef, (snap) => {
    const val = snap.val() || {};
    const punchIn = val.punchIn || null;
    const punchOut = val.punchOut || null;

    punchInTimeEl.textContent = punchIn || "-";
    punchOutTimeEl.textContent = punchOut || "-";

    // logic:
    // if no punchIn -> punchIn enabled (if inside location), punchOut disabled
    // if punchIn exists and no punchOut -> punchIn disabled, punchOut enabled (if inside)
    // if both exist -> both disabled
    if (!punchIn) {
      punchInBtn.dataset.state = "need-in";
      punchOutBtn.dataset.state = "disabled";
    } else if (punchIn && !punchOut) {
      punchInBtn.dataset.state = "disabled";
      punchOutBtn.dataset.state = "need-out";
    } else {
      punchInBtn.dataset.state = "done";
      punchOutBtn.dataset.state = "done";
    }
    updateLocationAndButtons(); // ensure location gating applied
  });
}

/* check location and enable if inside and state demands it */
function updateLocationAndButtons() {
  if (!navigator.geolocation) {
    // fallback: disable both
    setBtnState(punchInBtn, 'disabled');
    setBtnState(punchOutBtn, 'disabled');
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const dist = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, OFFICE_LAT, OFFICE_LNG);
    const inside = dist <= OFFICE_RADIUS_M;
    // punchIn
    if (punchInBtn.dataset.state === "need-in" && inside) setBtnState(punchInBtn, 'enabled');
    else setBtnState(punchInBtn, 'disabled');
    // punchOut
    if (punchOutBtn.dataset.state === "need-out" && inside) setBtnState(punchOutBtn, 'enabled');
    else setBtnState(punchOutBtn, 'disabled');
  }, (err) => {
    // on error, disable actionable buttons
    setBtnState(punchInBtn, 'disabled'); setBtnState(punchOutBtn, 'disabled');
  }, { enableHighAccuracy: true, maximumAge: 20000, timeout: 5000 });
}

/* UI helpers */
function setBtnState(btn, state) {
  btn.disabled = (state !== 'enabled');
  if (state === 'enabled') {
    btn.classList.remove('btn-disabled'); if (btn.classList.contains('btn-primary-small')) btn.classList.remove('btn-disabled');
  } else {
    btn.classList.add('btn-disabled');
  }
}

/* main: auth guard + attach handlers */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  // show user email
  userEmailEl.textContent = user.email;

  // ensure today's listener registered
  updateButtonsForToday(user.uid);

  // set button actions
  punchInBtn.addEventListener("click", async () => {
    // write today's punchIn as HH:MM:SS
    const todayKey = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    await set(ref(db, `attendance/${user.uid}/${todayKey}/punchIn`), timeStr);
    // refresh location gating after write
    updateLocationAndButtons();
  });

  punchOutBtn.addEventListener("click", async () => {
    const todayKey = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    await set(ref(db, `attendance/${user.uid}/${todayKey}/punchOut`), timeStr);
    updateLocationAndButtons();
  });

  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });

  // optional: refresh location gating every 20s while on dashboard
  setInterval(updateLocationAndButtons, 20000);
});