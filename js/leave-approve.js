import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, onValue, update } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadAllLeaves();
  }
});

function loadAllLeaves() {
  onValue(ref(db, "leaveRequests"), (snapshot) => {
    const tbody = document.querySelector("#leaveTable tbody");
    tbody.innerHTML = "";
    snapshot.forEach((child) => {
      const req = child.val();
      const row = `<tr>
        <td>${req.userId}</td>
        <td>${req.startDate}</td>
        <td>${req.endDate}</td>
        <td>${req.reason}</td>
        <td>${req.status}</td>
        <td>
          <button onclick="approveLeave('${child.key}')">Approve</button>
          <button onclick="rejectLeave('${child.key}')">Reject</button>
        </td>
      </tr>`;
      tbody.innerHTML += row;
    });
  });
}

window.approveLeave = (id) => {
  update(ref(db, "leaveRequests/" + id), { status: "Approved" });
};

window.rejectLeave = (id) => {
  update(ref(db, "leaveRequests/" + id), { status: "Rejected" });
};
