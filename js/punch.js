import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
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

// === Helper: Get Employee ID ===
async function getEmployeeId(uid) {
  let empId = localStorage.getItem("employeeId");
  if (empId) return empId;

  const indexSnap = await get(ref(db, `authIndex/${uid}`));
  if (indexSnap.exists()) {
    empId = indexSnap.val().employeeId;
    localStorage.setItem("employeeId", empId);
    return empId;
  }
  throw new Error("Employee ID not found");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const empId = await getEmployeeId(user.uid);

    // Show welcome message
    loadUserName(empId);

    // Load today's punches
    loadTodaysPunch(empId);

    // Check location before enabling buttons
    navigator.geolocation.getCurrentPosition((pos) => {
      const dist = getDistanceFromLatLonInMeters(
        pos.coords.latitude,
        pos.coords.longitude,
        OFFICE_LAT,
        OFFICE_LNG
      );

      if (dist <= ALLOWED_RADIUS) {
        enableButtons(empId);
      } else {
        alert("You are not inside the office location.");
      }
    });

  } catch (err) {
    console.error(err);
    alert("Error loading employee profile. Please log in again.");
    await signOut(auth);
    localStorage.clear();
    window.location.href = "login.html";
  }
});

function loadUserName(empId) {
  const nameRef = ref(db, `users/${empId}/name`);
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

function enableButtons(empId) {
  const inBtn = document.getElementById("punchInBtn");
  const outBtn = document.getElementById("punchOutBtn");

  inBtn.disabled = false;
  outBtn.disabled = false;
  inBtn.classList.remove("btn-disabled");
  outBtn.classList.remove("btn-disabled");

  inBtn.onclick = () => punch(empId, "punchIn");
  outBtn.onclick = () => punch(empId, "punchOut");
}

function punch(empId, type) {
  const today = new Date().toISOString().split("T")[0];
  const time = new Date().toLocaleTimeString();

  const punchRef = ref(db, `punches/${empId}/${today}`);

  get(punchRef).then((snapshot) => {
    const data = snapshot.val() || {};
    if (data[type]) {
      alert(type + " already recorded at " + data[type]);
      return;
    }

    update(punchRef, {
      [type]: time,
      authUid: auth.currentUser.uid // ensure it passes your write rules
    }).then(() => {
      alert(type + " recorded at " + time);
      updateUI(type, time);
    });
  });
}

function loadTodaysPunch(empId) {
  const today = new Date().toISOString().split("T")[0];
  const punchRef = ref(db, `punches/${empId}/${today}`);

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