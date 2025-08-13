import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const messageBox = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // Show spinner & disable button
  loginBtn.disabled = true;
  loginBtn.innerHTML = `<div class="btn-spinner"></div> Logging in...`;
  messageBox.textContent = "";
  messageBox.className = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);

    messageBox.textContent = "✅ Login successful! Redirecting...";
    messageBox.className = "success-message";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  } catch (error) {
    messageBox.textContent = "❌ " + error.message;
    messageBox.className = "error-message";
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Login";
  }
});