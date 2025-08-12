import { auth, db } from "./firebaseConfig.js";
import { ref, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Office location coordinates
const OFFICE_LAT = 13.0827;  // Example: Chennai
const OFFICE_LNG = 80.2707;
const ALLOWED_RADIUS_METERS = 100; // Within 100 meters

const punchInBtn = document.getElementById("punchIn");
const punchOutBtn = document.getElementById("punchOut");
const statusText = document.getElementById("status");

// Haversine formula to calculate distance
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (value) => (value * Math.PI) / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Check location and enable buttons if inside office area
function checkLocation() {
  if (!navigator.geolocation) {
    statusText.textContent = "Geolocation not supported.";
    return;
  }

  navigator.geolocation.getCurrentPosition((position) => {
    const distance = getDistanceMeters(
      position.coords.latitude,
      position.coords.longitude,
      OFFICE_LAT,
      OFFICE_LNG
    );

    if (distance <= ALLOWED_RADIUS_METERS) {
      statusText.textContent = "You are in the office area.";
      punchInBtn.disabled = false;
      punchOutBtn.disabled = false;
    } else {
      statusText.textContent = "You are outside the office area.";
      punchInBtn.disabled = true;
      punchOutBtn.disabled = true;
    }
  }, () => {
    statusText.textContent = "Unable to retrieve location.";
  });
}

// Punch In
punchInBtn.addEventListener("click", () => {
  const user = auth.currentUser;
  if (user) {
    push(ref(db, `attendance/${user.uid}`), {
      type: "Punch In",
      timestamp: serverTimestamp()
    });
    alert("Punched In successfully!");
  }
});

// Punch Out
punchOutBtn.addEventListener("click", () => {
  const user = auth.currentUser;
  if (user) {
    push(ref(db, `attendance/${user.uid}`), {
      type: "Punch Out",
      timestamp: serverTimestamp()
    });
    alert("Punched Out successfully!");
  }
});

// Run location check on page load
checkLocation();