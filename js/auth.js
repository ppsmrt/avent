// Firebase SDK v9
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyATZi32dliIzjOCIXcv1MbxOXhkNjogA6Q",
  authDomain: "aventattendance.firebaseapp.com",
  databaseURL: "https://aventattendance-default-rtdb.firebaseio.com/",
  projectId: "aventattendance",
  storageBucket: "aventattendance.appspot.com",
  messagingSenderId: "993022737242",
  appId: "1:993022737242:web:92c380107f73eb70ac1163"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Signup
window.signup = function () {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((cred) => {
      set(ref(db, "users/" + cred.user.uid), {
        name: name,
        email: email
      });
      alert("Signup successful!");
      window.location.href = "dashboard.html";
    })
    .catch((err) => {
      alert(err.message);
    });
};

// Login
window.login = function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((err) => {
      alert(err.message);
    });
};

// Logout
window.logout = function () {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((err) => {
      alert(err.message);
    });
};