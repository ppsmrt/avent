import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  get
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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Get employeeId from authIndex
  const indexSnap = await get(ref(db, "authIndex/" + user.uid));
  if (!indexSnap.exists()) {
    alert("No employee record found.");
    return;
  }
  const empId = indexSnap.val().employeeId;

  // Load today's punch info
  const today = new Date().toISOString().split("T")[0];
  const punchRef = ref(db, "attendance/" + user.uid + "/" + today);
  onValue(punchRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      document.getElementById("todayPunch").innerText =
        `Punch In: ${data.punchIn || "Not punched in"}\nPunch Out: ${data.punchOut || "Not punched out"}`;
    } else {
      document.getElementById("todayPunch").innerText = "No punches today";
    }
  });

  // Load leave balances
  const leaveRef = ref(db, `users/${empId}/leaveBalance`);
  onValue(leaveRef, (snapshot) => {
    if (snapshot.exists()) {
      const leaves = snapshot.val();
      document.getElementById("leaveSL").innerText = leaves.sl ?? 0;
      document.getElementById("leaveCL").innerText = leaves.cl ?? 0;
      document.getElementById("leavePL").innerText = leaves.pl ?? 0;
      document.getElementById("leaveEL").innerText = leaves.el ?? 0;
    } else {
      document.getElementById("leaveSL").innerText = "0";
      document.getElementById("leaveCL").innerText = "0";
      document.getElementById("leavePL").innerText = "0";
      document.getElementById("leaveEL").innerText = "0";
    }
  });
});