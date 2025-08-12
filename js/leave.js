import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, push, set, onValue, query, orderByChild, equalTo } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

let currentUser = null;

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    currentUser = user;
    loadMyLeaves();
  }
});

document.getElementById("leaveForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const reason = document.getElementById("reason").value;

  const newRef = push(ref(db, "leaveRequests"));
  await set(newRef, {
    userId: currentUser.uid,
    startDate,
    endDate,
    reason,
    status: "Pending",
    submittedAt: Date.now()
  });

  alert("Leave request submitted!");
  e.target.reset();
});

function loadMyLeaves() {
  const q = query(ref(db, "leaveRequests"), orderByChild("userId"), equalTo(currentUser.uid));
  onValue(q, (snapshot) => {
    const tbody = document.querySelector("#leaveTable tbody");
    tbody.innerHTML = "";
    snapshot.forEach((child) => {
      const req = child.val();
      const row = `<tr>
        <td>${req.startDate}</td>
        <td>${req.endDate}</td>
        <td>${req.reason}</td>
        <td>${req.status}</td>
      </tr>`;
      tbody.innerHTML += row;
    });
  });
}
