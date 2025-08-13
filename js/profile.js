import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

let profileData = {};
let isEditing = false;
let currentUid = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUid = user.uid;
  const snapshot = await get(ref(db, `users/${currentUid}`));

  profileData = snapshot.exists() ? snapshot.val() : {};
  renderProfile(profileData);
});

function renderProfile(data) {
  // View mode display
  document.getElementById('fullName').textContent =
    data.basicInfo?.fullName || 'Not Available';
  document.getElementById('profilePhoto').src =
    data.basicInfo?.profilePhoto ||
    'https://tamilgeo.wordpress.com/wp-content/uploads/2025/08/images4526844530498709058.png';
  document.getElementById('designation').textContent =
    data.employmentDetails?.designation || 'Not Available';

  // Convert to editable if needed
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

// Edit button
document.getElementById('editBtn').addEventListener('click', () => {
  isEditing = true;
  renderProfile(profileData);
  document.getElementById('editBtn').style.display = 'none';
  document.getElementById('saveBtn').style.display = 'inline-block';
});

// Save button
document.getElementById('saveBtn').addEventListener('click', async () => {
  const inputs = document.querySelectorAll('.detail input');
  let index = 0;

  // Ensure structure exists
  profileData.basicInfo = profileData.basicInfo || {};
  profileData.employmentDetails = profileData.employmentDetails || {};

  // Update basicInfo
  profileData.basicInfo.fullName = inputs[index++].value || 'Not Available';
  profileData.basicInfo.profilePhoto = inputs[index++].value || '';
  profileData.employmentDetails.designation = inputs[index++].value || 'Not Available';

  try {
    await update(ref(db, `users/${currentUid}`), profileData);
    isEditing = false;
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    renderProfile(profileData);
    alert('✅ Profile updated successfully!');
  } catch (err) {
    alert('❌ Error updating profile: ' + err.message);
  }
});