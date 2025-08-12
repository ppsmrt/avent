import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, push, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Office coordinates (latitude, longitude)
const OFFICE_LAT = 40.712776;  // Example: New York
const OFFICE_LNG = -74.005974;
const ALLOWED_RADIUS = 0.2; // in km

const statusMessage = document.getElementById("statusMessage");
const punchInBtn = document.getElementById("punchInBtn");
const punchOutBtn = document.getElementById("punchOutBtn");

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    checkLocationPermission();
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Check location & enable buttons if inside allowed area
function checkLocationPermission() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const distance = getDistanceFromLatLonInKm(latitude, longitude, OFFICE_LAT, OFFICE_LNG);

      if (distance <= ALLOWED_RADIUS) {
        statusMessage.textContent = "You are at the office. You can punch in/out.";
        punchInBtn.disabled = false;
        punchOutBtn.disabled = false;
      } else {
        statusMessage.textContent = "You are not at the office location.";
      }
    }, () => {
      statusMessage.textContent = "Location permission denied.";
    });
  } else {
    statusMessage.textContent = "Geolocation not supported.";
  }
}

// Punch In
punchInBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  await push(ref(db, "attendance/" + user.uid), {
    type: "in",
    timestamp: serverTimestamp()
  });

  alert("Punched In successfully!");
});

// Punch Out
punchOutBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  await push(ref(db, "attendance/" + user.uid), {
    type: "out",
    timestamp: serverTimestamp()
  });

  alert("Punched Out successfully!");
});

// Calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
    }
