import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  update,
  get,
  onValue
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
    return;
  }

  // Show welcome message
  loadUserName(user.uid);

  // Load today's punches from DB
  loadTodaysPunch(user.uid);

  // Check location before enabling buttons
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
});

function loadUserName(uid) {
  const nameRef = ref(db, "users/" + uid + "/name");
  get(nameRef).then((snapshot) => {
    const name = snapshot.val() || "User";
    document.querySelector(".welcome-message").innerHTML =
      `<i class="fas fa-user"></i> Welcome, <strong>${name}</strong>`;
    document.querySelector(".instructions").innerHTML = `
      <i class="fas fa-info-circle"></i> Please punch in when you arrive and punch out before leaving.<br>
      <i class="fas fa-exclamation-triangle text-warning"></i> Warning: Multiple punches in the same session are not allowed.
    `;
  });
}

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

  const punchRef = ref(db, "attendance/" + uid + "/" + today);

  get(punchRef).then((snapshot) => {
    const data = snapshot.val() || {};
    if (data[type]) {
      alert(type + " already recorded at " + data[type]);
      return;
    }

    update(punchRef, {
      [type]: time
    }).then(() => {
      alert(type + " recorded at " + time);
      updateUI(type, time);
    });
  });
}

function loadTodaysPunch(uid) {
  const today = new Date().toISOString().split("T")[0];
  const punchRef = ref(db, "attendance/" + uid + "/" + today);

  onValue(punchRef, (snapshot) => {
    const data = snapshot.val() || {};
    updateUI("punchIn", data.punchIn || "--");
    updateUI("punchOut", data.punchOut || "--");
  });
}

function updateUI(type, time) {
  if (type === "punchIn") {
    document.getElementById("punchDate").textContent = new Date().toLocaleDateString();
    document.getElementById("lastPunch").textContent = "In: " + time;
  } else if (type === "punchOut") {
    document.getElementById("lastPunch").textContent += " | Out: " + time;
  }
}

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}