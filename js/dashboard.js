import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyATZi32dliIzjOCIXcv1MbxOXhkNjogA6Q",
  authDomain: "aventattendance.firebaseapp.com",
  databaseURL: "https://aventattendance-default-rtdb.firebaseio.com/",
  projectId: "aventattendance",
  storageBucket: "aventattendance.appspot.com",
  messagingSenderId: "993022737242",
  appId: "1:993022737242:web:92c380107f73eb70ac1163"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    const today = new Date().toISOString().split("T")[0];
    const punchRef = ref(db, "attendance/" + user.uid + "/" + today);

    onValue(punchRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("todayPunch").innerText =
          `Punch In: ${data.punchIn || "Not punched in"}\nPunch Out: ${data.punchOut || "Not punched out"}`;
      } else {
        document.getElementById("todayPunch").innerText = "No punches today";
      }
    });
  }
});