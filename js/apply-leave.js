import { db } from "./firebase-config.js";
import { ref, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const leaveForm = document.getElementById("leaveForm");

leaveForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const employeeId = localStorage.getItem("employeeId");
  if (!employeeId) {
    alert("You are not logged in.");
    return;
  }

  const leaveType = document.getElementById("leaveType").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const halfDay = document.getElementById("halfDay").checked;
  const reason = document.getElementById("reason").value.trim();

  try {
    const newRequestRef = push(ref(db, `leaveRequests/${employeeId}`));
    await set(newRequestRef, {
      type: leaveType,
      startDate,
      endDate,
      halfDay,
      reason,
      status: "Pending",
      appliedOn: new Date().toISOString()
    });

    alert("Leave request submitted successfully!");
    leaveForm.reset();

  } catch (error) {
    console.error("Error submitting leave:", error);
    alert("Failed to submit leave request.");
  }
});
