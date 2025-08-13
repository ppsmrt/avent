import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signupBtn");

// Overlay setup
const overlay = document.createElement("div");
overlay.id = "loadingOverlay";
overlay.innerHTML = `
  <div class="overlay-content">
    <i class="fa fa-spinner fa-spin"></i>
    <p>Creating account...</p>
  </div>
`;
document.body.appendChild(overlay);
overlay.style.display = "none";

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const employeeId = document.getElementById("employeeId").value.trim();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  signupBtn.disabled = true;
  overlay.style.display = "flex";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store main user record
    await set(ref(db, "users/" + employeeId), {
      authUid: user.uid,
      employeeId: employeeId,
      name: name || "Not Available",
      email: email,
      designation: "Employee",
      sickBalance: 12,
      profilePhoto: "https://via.placeholder.com/150",
      createdAt: new Date().toISOString()
    });

    // Store auth index for fast lookups
    await set(ref(db, "authIndex/" + user.uid), {
      employeeId: employeeId
    });

    overlay.querySelector(".overlay-content").innerHTML = `
      <i class="fa fa-check-circle" style="color: #4CAF50; font-size: 2rem;"></i>
      <p>Signup Successful</p>
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
    signupBtn.disabled = false;
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