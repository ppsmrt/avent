// js/auth.js
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.body.classList.add("fade-out");
    setTimeout(() => window.location.href = "dashboard.html", 350);
  } catch (err) {
    alert(err.message);
  }
});

signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    // Write profile to Realtime Database
    await set(ref(db, `users/${uid}`), {
      name, email, createdAt: new Date().toISOString()
    });
    alert("Account created — welcome " + (name||"") );
    document.body.classList.add("fade-out");
    setTimeout(() => window.location.href = "dashboard.html", 350);
  } catch (err) {
    alert(err.message);
  }
});
