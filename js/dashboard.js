import { auth, db } from "./firebaseConfig.js";
import { ref, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Office coordinates & radius in meters
const officeLat = 12.969556;
const officeLng = 80.243833;
const officeRadius = 100; // meters

const punchInBtn = document.getElementById("punchInBtn");
const punchOutBtn = document.getElementById("punchOutBtn");

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (x) => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function checkLocationAndEnableButtons() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser");
    return;
  }
  
  navigator.geolocation.getCurrentPosition((pos) => {
    const distance = getDistance(
      pos.coords.latitude,
      pos.coords.longitude,
      officeLat,
      officeLng
    );

    if (distance <= officeRadius) {
      punchInBtn.disabled = false;
      punchOutBtn.disabled = false;
    } else {
      punchInBtn.disabled = true;
      punchOutBtn.disabled = true;
      alert("You are outside the office area.");
    }
  }, () => {
    alert("Unable to retrieve your location");
  });
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    checkLocationAndEnableButtons();

    punchInBtn.addEventListener("click", () => {
      push(ref(db, "attendance/" + user.uid), {
        type: "punch_in",
        time: new Date().toISOString()
      });
      alert("Punched In successfully!");
    });

    punchOutBtn.addEventListener("click", () => {
      push(ref(db, "attendance/" + user.uid), {
        type: "punch_out",
        time: new Date().toISOString()
      });
      alert("Punched Out successfully!");
    });
  }
});