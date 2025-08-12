import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, child } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

let attendanceRecords = []; // store raw punch data

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
  attendanceRecords = [];

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

        attendanceRecords.push({
          type: record.type,
          date: date.toLocaleDateString(),
          time: date.toLocaleTimeString()
        });
      }
    });
  }

  renderCalendar(events);
}

// Render calendar
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

// Export CSV
document.getElementById("exportCSV").addEventListener("click", () => {
  if (!attendanceRecords.length) return alert("No attendance data to export.");

  let csvContent = "Type,Date,Time\n";
  attendanceRecords.forEach(r => {
    csvContent += `${r.type},${r.date},${r.time}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "attendance_report.csv";
  link.click();
});

// Export PDF
document.getElementById("exportPDF").addEventListener("click", () => {
  if (!attendanceRecords.length) return alert("No attendance data to export.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Aventa Attendance Report", 14, 15);
  doc.autoTable({
    startY: 25,
    head: [['Type', 'Date', 'Time']],
    body: attendanceRecords.map(r => [r.type, r.date, r.time])
  });

  doc.save("attendance_report.pdf");
});
