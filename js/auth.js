import { auth, db } from './config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});

// SIGNUP
document.getElementById("signupLink").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = prompt("Enter your email:");
  const password = prompt("Enter a password:");

  if (email && password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await set(ref(db, "users/" + userId), {
        email: email,
        createdAt: new Date().toISOString()
      });

      alert("Account created successfully! You can now log in.");
    } catch (error) {
      alert(error.message);
    }
  }
});
