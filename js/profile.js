import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, child, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

let currentUserId = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUserId = user.uid;

  // Fetch user profile
  const dbRef = ref(db);
  get(child(dbRef, `users/${currentUserId}`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        document.getElementById("empName").value = data.name || "";
        document.getElementById("empDesignation").value = data.designation || "";
        document.getElementById("empDOB").value = data.dob || "";
        document.getElementById("empAddress").value = data.address || "";
        document.getElementById("empEmergency").value = data.emergencyContact || "";
        document.getElementById("empID").value = data.employeeId || "";
        document.getElementById("empBloodGroup").value = data.bloodGroup || "";

        document.getElementById("profilePic").src = data.photo || "https://tamilgeo.wordpress.com/wp-content/uploads/2025/08/images4526844530498709058.png";
      } else {
        alert("Profile data not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching profile:", error);
    });
});

// Handle update
document.getElementById("updateBtn").addEventListener("click", () => {
  if (!currentUserId) return alert("User not authenticated.");

  const updatedData = {
    name: document.getElementById("empName").value,
    designation: document.getElementById("empDesignation").value,
    dob: document.getElementById("empDOB").value,
    address: document.getElementById("empAddress").value,
    emergencyContact: document.getElementById("empEmergency").value,
    employeeId: document.getElementById("empID").value,
    bloodGroup: document.getElementById("empBloodGroup").value,
    photo: document.getElementById("profilePic").src
  };

  update(ref(db, `users/${currentUserId}`), updatedData)
    .then(() => {
      alert("Profile updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    });
});