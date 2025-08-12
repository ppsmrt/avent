// js/dashboard.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set, get, child, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* CONFIG - office location (decimal) */
const OFFICE_LAT = 12.969556;
const OFFICE_LNG = 80.243833;
const OFFICE_RADIUS_M = 100; // meters

/* Elements */
const punchInBtn = document.getElementById("punchInBtn");
const punchOutBtn = document.getElementById("punchOutBtn");
const punchInTimeEl = document.getElementById("punchInTime");
const punchOutTimeEl = document.getElementById("punchOutTime");
const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const sidebar = document.getElementById("sidebar");

/* Utility: Haversine distance in meters */
function getDistanceMeters(lat1, lon1, lat2, lon2){
  const R = 6371000;
  const toRad = v => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* Helpers for UI states */
function setBtnState(btn, enabled) {
  btn.disabled = !enabled;
  if (enabled) btn.classList.remove("btn-disabled");
  else btn.classList.add("btn-disabled");
}

/* Get today's key YYYY-MM-DD */
function todayKey() {
  return new Date().toISOString().split("T")[0];
}

/* Read today's punches for user and update UI state */
function attachTodayListener(uid) {
  const dayRef = ref(db, `punches/${uid}/${todayKey()}`);

  onValue(dayRef, (snap) => {
    const val = snap.val() || {};
    const punchIn = val.punchIn || null;
    const punchOut = val.punchOut || null;

    punchInTimeEl.textContent = punchIn || "-";
    punchOutTimeEl.textContent = punchOut || "-";

    // Determine needed states:
    // - no punchIn => need-in
    // - punchIn && no punchOut => need-out
    // - both exist => done
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
    // After we know DB state, check location to enable actionable buttons
    checkLocationAndApply();
  });
}

/* Check location and enable/disable buttons according to DB states */
function checkLocationAndApply() {
  if (!navigator.geolocation) {
    // no location -> keep both disabled
    setBtnState(punchInBtn, false);
    setBtnState(punchOutBtn, false);
    return;
  }

  navigator.geolocation.getCurrentPosition((pos) => {
    const inside = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, OFFICE_LAT, OFFICE_LNG) <= OFFICE_RADIUS_M;

    // punchIn button:
    if (punchInBtn.dataset.state === "need-in" && inside) setBtnState(punchInBtn, true);
    else setBtnState(punchInBtn, false);

    // punchOut button:
    if (punchOutBtn.dataset.state === "need-out" && inside) setBtnState(punchOutBtn, true);
    else setBtnState(punchOutBtn, false);

  }, (err) => {
    // error retrieving location: disable actionable buttons
    setBtnState(punchInBtn, false);
    setBtnState(punchOutBtn, false);
  }, { enableHighAccuracy: true, maximumAge: 20000, timeout: 6000 });
}

/* Write punchIn for today (HH:MM:SS) */
async function doPunchIn(uid) {
  const timeStr = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  await set(ref(db, `punches/${uid}/${todayKey()}/punchIn`), timeStr);
}

/* Update punchOut for today */
async function doPunchOut(uid) {
  const timeStr = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  await update(ref(db, `punches/${uid}/${todayKey()}`), { punchOut: timeStr });
}

/* Auth guard & wire everything */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // populate small user info
  userEmailEl.textContent = user.email;

  // Attach DB listener for today's punches
  attachTodayListener(user.uid);

  // Button click handlers (no extra checks here; DB listener + location gating control enabling)
  punchInBtn.addEventListener("click", async () => {
    // before writing, verify location once more
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const inside = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, OFFICE_LAT, OFFICE_LNG) <= OFFICE_RADIUS_M;
      if (!inside) { alert("You must be inside the office to Punch In."); return; }
      await doPunchIn(user.uid);
      checkLocationAndApply();
    }, () => alert("Unable to access location."));
  });

  punchOutBtn.addEventListener("click", async () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const inside = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, OFFICE_LAT, OFFICE_LNG) <= OFFICE_RADIUS_M;
      if (!inside) { alert("You must be inside the office to Punch Out."); return; }
      await doPunchOut(user.uid);
      checkLocationAndApply();
    }, () => alert("Unable to access location."));
  });

  // Logout
  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // Periodically refresh location gating while on dashboard (every 20s)
  setInterval(checkLocationAndApply, 20000);
});