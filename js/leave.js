import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

let employeeId = null;
let leaveBalance = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Get employeeId from authIndex
  const indexSnap = await get(ref(db, "authIndex/" + user.uid));
  if (!indexSnap.exists()) {
    alert("Employee record not found.");
    return;
  }
  employeeId = indexSnap.val().employeeId;

  // Load leave balance in real-time
  onValue(ref(db, `users/${employeeId}/leaveBalance`), (snapshot) => {
    if (snapshot.exists()) {
      leaveBalance = snapshot.val();
    } else {
      // Initialize leave balance if missing
      leaveBalance = { SL: 12, CL: 12, PL: 12, EL: 12 };
      update(ref(db, `users/${employeeId}`), { leaveBalance });
    }
    renderLeaveBalance();
    populateLeaveTypes();
  });
});

function populateLeaveTypes() {
  const leaveTypeSelect = document.getElementById("leaveType");
  leaveTypeSelect.innerHTML = `<option value="">Select</option>`;
  Object.keys(leaveBalance).forEach(type => {
    leaveTypeSelect.innerHTML += `<option value="${type}">${type} (${leaveBalance[type]} days left)</option>`;
  });
}

function renderLeaveBalance() {
  const ul = document.getElementById("leaveBalanceList");
  ul.innerHTML = "";
  for (let type in leaveBalance) {
    ul.innerHTML += `<li>${type}: ${leaveBalance[type]} days left</li>`;
  }
}

document.getElementById("leaveForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.getElementById("leaveType").value;
  const startDate = new Date(document.getElementById("startDate").value);
  const endDate = new Date(document.getElementById("endDate").value);
  const reason = document.getElementById("reason").value.trim();

  if (!type || !startDate || !endDate || !reason) {
    alert("Please fill in all fields.");
    return;
  }

  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  if (days <= 0) {
    alert("End date must be after start date.");
    return;
  }

  if (days > leaveBalance[type]) {
    alert(`You don't have enough ${type} balance.`);
    return;
  }

  const leaveData = {
    type,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    days,
    status: "pending",
    reason
  };

  try {
    const newLeaveRef = push(ref(db, `leaveRequests/${employeeId}`));
    await set(newLeaveRef, leaveData);
    alert("✅ Leave request submitted.");
    document.getElementById("leaveForm").reset();
  } catch (err) {
    alert("❌ Error submitting leave: " + err.message);
  }
});
