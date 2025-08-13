import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

// Create overlay element
const overlay = document.createElement("div");
overlay.id = "loadingOverlay";
overlay.innerHTML = `
  <div class="overlay-content">
    <i class="fa fa-spinner fa-spin"></i>
    <p>Logging in...</p>
  </div>
`;
document.body.appendChild(overlay);
overlay.style.display = "none"; // hidden by default

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  loginBtn.disabled = true;
  loginBtn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Logging in...`;
  overlay.style.display = "flex"; // Show overlay
  overlay.style.opacity = "1";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserRecord(userCredential.user);

    // Change overlay to success message with FA icon
    overlay.querySelector(".overlay-content").innerHTML = `
      <i class="fa fa-check-circle" style="color: #4CAF50;"></i>
      <p>Logged In Successfully</p>
    `;

    // Fade out after short delay
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500); // Wait for fade-out before redirect
    }, 800);

  } catch (error) {
    overlay.style.display = "none";
    showNotification("Login failed: " + error.message, "error");
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
      sickBalance: 12,
      createdAt: new Date().toISOString()
    });
  }
}

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