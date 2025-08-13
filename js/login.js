import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

// Loading overlay
const overlay = document.createElement("div");
overlay.id = "loadingOverlay";
overlay.innerHTML = `
  <div class="overlay-content">
    <i class="fa fa-spinner fa-spin"></i>
    <p>Logging in...</p>
  </div>
`;
document.body.appendChild(overlay);
overlay.style.display = "none";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  loginBtn.disabled = true;
  overlay.style.display = "flex";

  try {
    // 1️⃣ Authenticate user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2️⃣ Get employeeId from authIndex
    const indexSnap = await get(ref(db, `authIndex/${user.uid}`));
    if (!indexSnap.exists()) {
      throw new Error("No employee record found for this account.");
    }
    const { employeeId } = indexSnap.val();

    // 3️⃣ Fetch employee data
    const employeeSnap = await get(ref(db, `users/${employeeId}`));
    if (!employeeSnap.exists()) {
      throw new Error("Employee data not found.");
    }
    const employeeData = employeeSnap.val();

    // 4️⃣ Store locally
    localStorage.setItem("employeeId", employeeId);
    localStorage.setItem("employeeData", JSON.stringify(employeeData));

    // 5️⃣ Success animation
    overlay.querySelector(".overlay-content").innerHTML = `
      <i class="fa fa-check-circle" style="color: #4CAF50; font-size: 2rem;"></i>
      <p>Login Successful</p>
    `;

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
    loginBtn.disabled = false;
  }
});

// Notification function
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