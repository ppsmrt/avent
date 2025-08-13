import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signupBtn");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const name = document.getElementById("signupName").value.trim();

  // Show loading spinner
  signupBtn.disabled = true;
  signupBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Creating Account...`;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await set(ref(db, "users/" + user.uid), {
      name: name,
      email: email,
      createdAt: new Date().toISOString()
    });

    // Show success notification
    showNotification("Signup successful!", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);

  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    signupBtn.disabled = false;
    signupBtn.innerHTML = "Sign Up";
  }
});

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