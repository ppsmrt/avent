import { db } from "./firebase-config.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Table where pending leave requests will show
const leaveRequestsTable = document.getElementById("leaveRequestsTable");

// Listen for leave requests
onValue(ref(db, "leaveRequests"), snapshot => {
  leaveRequestsTable.innerHTML = "";
  if (snapshot.exists()) {
    const requests = snapshot.val();
    for (const reqId in requests) {
      const req = requests[reqId];
      if (req.status === "pending") {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${req.employeeId}</td>
          <td>${req.name}</td>
          <td>${req.leaveType.toUpperCase()}</td>
          <td>
            <button class="btn btn-info btn-sm" data-id="${reqId}">View</button>
          </td>
        `;
        leaveRequestsTable.appendChild(row);
      }
    }
  }
});

// View Request in Popup
document.addEventListener("click", async e => {
  if (e.target && e.target.matches(".btn-info")) {
    const reqId = e.target.getAttribute("data-id");
    const reqSnap = await get(ref(db, `leaveRequests/${reqId}`));
    if (!reqSnap.exists()) return alert("Request not found");

    const req = reqSnap.val();
    document.getElementById("popupEmpId").textContent = req.employeeId;
    document.getElementById("popupName").textContent = req.name;
    document.getElementById("popupType").textContent = req.leaveType;
    document.getElementById("popupFrom").textContent = req.fromDate;
    document.getElementById("popupTo").textContent = req.toDate;
    document.getElementById("popupReason").textContent = req.reason;

    // Approve button logic
    document.getElementById("approveBtn").onclick = async () => {
      const days = calculateLeaveDays(req.fromDate, req.toDate);
      const balancesRef = ref(db, `users/${req.employeeId}/leaveBalances`);

      const balancesSnap = await get(balancesRef);
      if (!balancesSnap.exists()) return alert("Employee leave balances not found");

      const balances = balancesSnap.val();
      const current = balances[req.leaveType] || 0;

      if (current < days) {
        return alert(`Insufficient ${req.leaveType.toUpperCase()} balance!`);
      }

      // Deduct leave days & approve request
      await update(ref(db, `users/${req.employeeId}/leaveBalances`), {
        [req.leaveType]: current - days
      });

      await update(ref(db, `leaveRequests/${reqId}`), {
        status: "approved",
        hrComment: document.getElementById("hrComment").value || "",
        approvedAt: new Date().toISOString()
      });

      alert("Leave approved and balance updated!");
      document.getElementById("leavePopup").style.display = "none";
    };

    // Reject button logic
    document.getElementById("rejectBtn").onclick = async () => {
      await update(ref(db, `leaveRequests/${reqId}`), {
        status: "rejected",
        hrComment: document.getElementById("hrComment").value || "",
        rejectedAt: new Date().toISOString()
      });
      alert("Leave rejected");
      document.getElementById("leavePopup").style.display = "none";
    };

    document.getElementById("leavePopup").style.display = "block";
  }
});

// Calculate days between two dates
function calculateLeaveDays(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  const diff = Math.abs(end - start) / (1000 * 60 * 60 * 24) + 1; // inclusive
  return diff;
}