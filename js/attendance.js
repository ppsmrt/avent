import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, child } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Check login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadAttendance(user.uid);
  }
});

async function loadAttendance(userId) {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "attendance/" + userId));

  const events = [];

  if (snapshot.exists()) {
    snapshot.forEach((entry) => {
      const record = entry.val();
      if (record.timestamp) {
        const date = new Date(record.timestamp);
        events.push({
          title: record.type === "in" ? "Punch In" : "Punch Out",
          start: date.toISOString(),
          color: record.type === "in" ? "#2ecc71" : "#e74c3c"
        });
      }
    });
  }

  renderCalendar(events);
}

function renderCalendar(events) {
  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,listWeek"
    },
    events: events
  });
  calendar.render();
}
