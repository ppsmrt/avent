import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await ensureUserRecord(user);
    window.location.href = "dashboard.html";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  loginBtn.disabled = true;
  loginBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Logging in...`;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserRecord(userCredential.user);
    window.location.href = "dashboard.html";
  } catch (error) {
    showNotification("Login failed: " + error.message, "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Login";
  }
});

async function ensureUserRecord(user) {
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    await set(userRef, {
      basicInfo: {
        fullName: "Not Available",
        profilePhoto: ""
      },
      employmentDetails: {
        designation: "Not Available"
      },
      email: user.email || "",
      createdAt: new Date().toISOString()
    });
  }
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === "success" ? "fa-check-circle" : "fa-times-circle"}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add("show"), 50);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}