import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signupBtn");

// Create overlay element
const overlay = document.createElement("div");
overlay.id = "loadingOverlay";
overlay.innerHTML = `
  <div class="overlay-content">
    <i class="fa fa-spinner fa-spin"></i>
    <p>Creating account...</p>
  </div>
`;
document.body.appendChild(overlay);
overlay.style.display = "none"; // Hidden initially

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const employeeId = document.getElementById("employeeId").value.trim(); // ✅ Employee ID
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  signupBtn.disabled = true;
  signupBtn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Creating Account...`;

  overlay.style.display = "flex"; // Show overlay
  overlay.style.opacity = "1";

  try {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store in Realtime Database under employeeId
    await set(ref(db, "users/" + employeeId), {
      authUid: user.uid,          // ✅ Matches your rules
      employeeId: employeeId,     // ✅ For easy reference
      name: name || "Not Available",
      email: email,
      designation: "Employee",
      sickBalance: 12,
      profilePhoto: "https://via.placeholder.com/150",
      createdAt: new Date().toISOString()
    });

    // Success feedback
    overlay.querySelector(".overlay-content").innerHTML = `
      <i class="fa fa-check-circle" style="color: #4CAF50; font-size: 2rem;"></i>
      <p>Signup Successful</p>
    `;

    // Fade out and redirect
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    }, 800);

  } catch (error) {
    overlay.style.display = "none";
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
    <i class="fa ${type === "success" ? "fa-check-circle" : "fa-times-circle"}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add("show"), 50);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}