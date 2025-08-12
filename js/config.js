// Firebase v9 CDN SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATZi32dliIzjOCIXcv1MbxOXhkNjogA6Q",
  authDomain: "aventattendance.firebaseapp.com",
  projectId: "aventattendance",
  storageBucket: "aventattendance.firebasestorage.app",
  messagingSenderId: "993022737242",
  appId: "1:993022737242:web:92c380107f73eb70ac1163"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
