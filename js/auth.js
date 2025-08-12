// Firebase v9 CDN SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ====== Firebase Config ======
const firebaseConfig = {
  apiKey: "AIzaSyATZi32dliIzjOCIXcv1MbxOXhkNjogA6Q",
  authDomain: "aventattendance.firebaseapp.com",
  databaseURL: "https://aventattendance-default-rtdb.firebaseio.com",
  projectId: "aventattendance",
  storageBucket: "aventattendance.appspot.com",
  messagingSenderId: "993022737242",
  appId: "1:993022737242:web:92c380107f73eb70ac1163"
};

// ====== Init Firebase ======
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ====== Elements ======
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const signupLink = document.getElementById("signupLink");
const loginLink = document.getElementById("loginLink");

// ====== Switch between login and signup ======
if (signupLink) {
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".login-container").style.display = "none";
    document.querySelector(".signup-container").style.display = "block";
  });
}

if (loginLink) {
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".signup-container").style.display = "none";
    document.querySelector(".login-container").style.display = "block";
  });
}

// ====== Signup ======
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save profile to DB
      await set(ref(db, "users/" + uid), {
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });

      alert("Signup successful!");
      window.location.href = "dashboard.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// ====== Login ======
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// ====== Auto Redirect if Logged In ======
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "dashboard.html";
  }
});