import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, set, update, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

let profileData = {};
let isEditing = false;
let currentUid = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUid = user.uid;
  const dbRef = ref(db);

  get(child(dbRef, `users/${user.uid}`)).then((snapshot) => {
    if (!snapshot.exists()) return;

    profileData = snapshot.val();
    renderProfile(profileData);
  });
});

function renderProfile(data) {
  // Display data in spans
  document.getElementById('fullName').textContent = data.basicInfo?.fullName || '—';
  document.getElementById('profilePhoto').src = data.basicInfo?.profilePhoto || 'https://tamilgeo.wordpress.com/wp-content/uploads/2025/08/images4526844530498709058.png';
  document.getElementById('designation').textContent = data.employmentDetails?.designation || '—';

  // Replace all spans with editable fields if editing
  if (isEditing) {
    makeEditable();
  }
}

function makeEditable() {
  document.querySelectorAll('.detail span').forEach(span => {
    const currentValue = span.textContent;
    const input = document.createElement('input');
    input.value = currentValue !== '—' ? currentValue : '';
    span.replaceWith(input);
  });
}

// Edit Button
document.getElementById('editBtn').addEventListener('click', () => {
  isEditing = true;
  renderProfile(profileData);
  document.getElementById('editBtn').style.display = 'none';
  document.getElementById('saveBtn').style.display = 'inline-block';
});

// Save Button
document.getElementById('saveBtn').addEventListener('click', () => {
  const inputs = document.querySelectorAll('.detail input');
  let index = 0;

  // Flatten & Update profileData
  Object.keys(profileData).forEach(section => {
    Object.keys(profileData[section]).forEach(field => {
      profileData[section][field] = inputs[index].value;
      index++;
    });
  });

  // Save to Firebase
  update(ref(db, `users/${currentUid}`), profileData).then(() => {
    isEditing = false;
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    renderProfile(profileData);
    alert('Profile updated successfully!');
  }).catch(err => {
    alert('Error updating profile: ' + err.message);
  });
});