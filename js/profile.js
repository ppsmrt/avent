import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

let profileData = {};
let isEditing = false;
let currentUid = null;
let employeeId = null;

async function getEmployeeId(uid) {
  // Try authIndex first
  const indexSnap = await get(ref(db, `authIndex/${uid}`));
  if (indexSnap.exists()) {
    return indexSnap.val().employeeId;
  }

  // Fallback: search in users node for matching authUid
  const usersSnap = await get(ref(db, "users"));
  if (usersSnap.exists()) {
    const usersData = usersSnap.val();
    for (const empId in usersData) {
      if (usersData[empId].authUid === uid) {
        return empId;
      }
    }
  }

  throw new Error("Employee ID not found for this user.");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUid = user.uid;

  try {
    employeeId = await getEmployeeId(currentUid);
    const snapshot = await get(ref(db, `users/${employeeId}`));
    profileData = snapshot.exists() ? snapshot.val() : {};
    renderProfile(profileData);
  } catch (err) {
    console.error(err);
    alert("Error loading profile. Please contact admin.");
  }
});

function renderProfile(data) {
  document.getElementById('fullName').textContent =
    data.basicInfo?.fullName || 'Not Available';
  document.getElementById('profilePhoto').src =
    data.basicInfo?.profilePhoto || 'assets/profile.png';
  document.getElementById('designation').textContent =
    data.employmentDetails?.designation || 'Not Available';

  if (isEditing) {
    makeEditable();
  }
}

function makeEditable() {
  document.querySelectorAll('.detail span').forEach(span => {
    const value = span.textContent === 'Not Available' ? '' : span.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    span.replaceWith(input);
  });
}

document.getElementById('editBtn').addEventListener('click', () => {
  isEditing = true;
  renderProfile(profileData);
  document.getElementById('editBtn').style.display = 'none';
  document.getElementById('saveBtn').style.display = 'inline-block';
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const inputs = document.querySelectorAll('.detail input');
  let index = 0;

  profileData.basicInfo = profileData.basicInfo || {};
  profileData.employmentDetails = profileData.employmentDetails || {};

  profileData.basicInfo.fullName = inputs[index++]?.value || 'Not Available';
  profileData.basicInfo.profilePhoto = inputs[index++]?.value || '';
  profileData.employmentDetails.designation = inputs[index++]?.value || 'Not Available';

  try {
    await update(ref(db, `users/${employeeId}`), profileData);
    isEditing = false;
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    renderProfile(profileData);
    alert('✅ Profile updated successfully!');
  } catch (err) {
    alert('❌ Error updating profile: ' + err.message);
  }
});