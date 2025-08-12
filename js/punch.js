import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  update
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyATZi32dliIzjOCIXcv1MbxOXhkNjogA6Q",
  authDomain: "aventattendance.firebaseapp.com",
  databaseURL: "https://aventattendance-default-rtdb.firebaseio.com/",
  projectId: "aventattendance",
  storageBucket: "aventattendance.appspot.com",
  messagingSenderId: "993022737242",
  appId: "1:993022737242:web:92c380107f73eb70ac1163"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const OFFICE_LAT = 12.969556;
const OFFICE_LNG = 80.243833;
const ALLOWED_RADIUS = 200; // meters

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    // Check location
    navigator.geolocation.getCurrentPosition((pos) => {
      const dist = getDistanceFromLatLonInMeters(
        pos.coords.latitude,
        pos.coords.longitude,
        OFFICE_LAT,
        OFFICE_LNG
      );

      if (dist <= ALLOWED_RADIUS) {
        enableButtons(user.uid);
      } else {
        alert("You are not inside the office location.");
      }
    });
  }
});

function enableButtons(uid) {
  const inBtn = document.getElementById("punchInBtn");
  const outBtn = document.getElementById("punchOutBtn");

  inBtn.disabled = false;
  outBtn.disabled = false;
  inBtn.classList.remove("btn-disabled");
  outBtn.classList.remove("btn-disabled");

  inBtn.onclick = () => punch(uid, "punchIn");
  outBtn.onclick = () => punch(uid, "punchOut");
}

function punch(uid, type) {
  const today = new Date().toISOString().split("T")[0];
  const time = new Date().toLocaleTimeString();

  update(ref(db, "attendance/" + uid + "/" + today), {
    [type]: time
  }).then(() => {
    alert(type + " recorded at " + time);
  });
}

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}