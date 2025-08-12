import { auth, db } from "./firebase-config.js";
import { ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// --- Office Location (Latitude & Longitude) ---
const OFFICE_LAT = 12.969555; 
const OFFICE_LNG = 80.243833;
const LOCATION_RADIUS = 150; // in meters

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Calculate distance between two coordinates (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Check if inside office location
function checkLocationAccess(callback) {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const distance = getDistance(
        position.coords.latitude,
        position.coords.longitude,
        OFFICE_LAT,
        OFFICE_LNG
      );
      callback(distance <= LOCATION_RADIUS);
    },
    () => alert("Unable to get location. Please enable location services."),
    { enableHighAccuracy: true }
  );
}

// Update punch buttons state
function setPunchButtonState(inAllowed, outAllowed) {
  document.getElementById("punchInBtn").disabled = !inAllowed;
  document.getElementById("punchOutBtn").disabled = !outAllowed;
}

// Load today's punch data
async function loadTodayPunches(uid) {
  const today = getTodayDate();
  const punchRef = child(ref(db), `punches/${uid}/${today}`);
  const snap = await get(punchRef);

  if (snap.exists()) {
    const data = snap.val();
    document.getElementById("punchInTime").innerText = data.punchIn || "-";
    document.getElementById("punchOutTime").innerText = data.punchOut || "-";
  } else {
    document.getElementById("punchInTime").innerText = "-";
    document.getElementById("punchOutTime").innerText = "-";
  }
}

// Punch In
async function punchIn(uid) {
  checkLocationAccess((inside) => {
    if (!inside) {
      alert("You must be inside the office location to Punch In.");
      return;
    }
    const now = new Date().toLocaleTimeString();
    const today = getTodayDate();
    set(ref(db, `punches/${uid}/${today}`), { punchIn: now });
    loadTodayPunches(uid);
  });
}

// Punch Out
async function punchOut(uid) {
  checkLocationAccess((inside) => {
    if (!inside) {
      alert("You must be inside the office location to Punch Out.");
      return;
    }
    const now = new Date().toLocaleTimeString();
    const today = getTodayDate();
    update(ref(db, `punches/${uid}/${today}`), { punchOut: now });
    loadTodayPunches(uid);
  });
}

// --- Authentication State ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadTodayPunches(user.uid);

    // Attach button events
    document.getElementById("punchInBtn").addEventListener("click", () => punchIn(user.uid));
    document.getElementById("punchOutBtn").addEventListener("click", () => punchOut(user.uid));

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      signOut(auth);
    });

  } else {
    window.location.href = "login.html";
  }
});