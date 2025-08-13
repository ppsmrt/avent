import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

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
    // Login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get employeeId from index
    const indexSnap = await get(ref(db, "authIndex/" + user.uid));
    if (!indexSnap.exists()) {
      throw new Error("No employee record found for this account.");
    }
    const { employeeId } = indexSnap.val();

    // Get employee details
    const userSnap = await get(ref(db, "users/" + employeeId));
    if (!userSnap.exists()) {
      throw new Error("Employee details missing in database.");
    }
    const employeeData = userSnap.val();

    // Store in localStorage
    localStorage.setItem("employeeId", employeeId);
    localStorage.setItem("employeeData", JSON.stringify(employeeData));

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