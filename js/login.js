// js/login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Firebase config (replace with your own)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Form
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch Firestore user doc by email (to get employee ID)
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("No user record found!");
      return;
    }

    let employeeId;
    querySnapshot.forEach((doc) => {
      employeeId = doc.data().employeeId;
    });

    // Store in session for dashboard
    sessionStorage.setItem("employeeId", employeeId);

    // Show success overlay
    showSuccessOverlay("Logged In Successful");

  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

function showSuccessOverlay(message) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.7)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.color = "#fff";
  overlay.style.fontSize = "24px";
  overlay.style.zIndex = "9999";

  const icon = document.createElement("i");
  icon.className = "fas fa-check-circle";
  icon.style.fontSize = "60px";
  icon.style.marginBottom = "20px";
  icon.style.color = "#4CAF50";

  const text = document.createElement("div");
  text.textContent = message;

  overlay.appendChild(icon);
  overlay.appendChild(text);
  document.body.appendChild(overlay);

  // Fade out after 2 seconds
  setTimeout(() => {
    overlay.style.transition = "opacity 0.8s ease";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
      window.location.href = "dashboard.html";
    }, 800);
  }, 2000);
}