import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Fetch user profile
  const dbRef = ref(db);
  get(child(dbRef, `users/${user.uid}`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("empName").textContent = data.name || "—";
        document.getElementById("empDesignation").textContent = data.designation || "—";
        document.getElementById("empDOB").textContent = data.dob || "—";
        document.getElementById("empAddress").textContent = data.address || "—";
        document.getElementById("empEmergency").textContent = data.emergencyContact || "—";
        document.getElementById("empID").textContent = data.employeeId || "—";
        document.getElementById("empBloodGroup").textContent = data.bloodGroup || "—";
      } else {
        alert("Profile data not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching profile:", error);
    });
});