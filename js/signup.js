import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store in Realtime Database
    await set(ref(db, "users/" + user.uid), {
      email: email,
      createdAt: new Date().toISOString()
    });

    alert("Signup successful! Redirecting to dashboard...");
    window.location.href = "dashboard.html";

  } catch (error) {
    alert(error.message);
  }
});