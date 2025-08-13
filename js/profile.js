import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

let profileData = {};
let isEditing = false;
let currentUid = null;

// === AUTH CHECK ===
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

// === RENDER PROFILE ===
function renderProfile(data) {
  // Profile header
  document.getElementById('fullName').textContent =
    data.basicInfo?.fullName || 'Not Available';
  document.getElementById('profilePhoto').src =
    data.basicInfo?.profilePhoto ||
    'assets/profile.png';
  document.getElementById('designation').textContent =
    data.employmentDetails?.designation || 'Not Available';

  // Basic Info
  document.getElementById('dob').textContent = data.basicInfo?.dob || 'Not Available';
  document.getElementById('gender').textContent = data.basicInfo?.gender || 'Not Available';
  document.getElementById('bloodGroup').textContent = data.basicInfo?.bloodGroup || 'Not Available';
  document.getElementById('maritalStatus').textContent = data.basicInfo?.maritalStatus || 'Not Available';

  // Contact Info
  document.getElementById('personalEmail').textContent = data.contactInfo?.personalEmail || 'Not Available';
  document.getElementById('workEmail').textContent = data.contactInfo?.workEmail || 'Not Available';
  document.getElementById('mobile').textContent = data.contactInfo?.mobile || 'Not Available';
  document.getElementById('alternateMobile').textContent = data.contactInfo?.alternateMobile || 'Not Available';
  document.getElementById('currentAddress').textContent = data.contactInfo?.currentAddress || 'Not Available';
  document.getElementById('permanentAddress').textContent = data.contactInfo?.permanentAddress || 'Not Available';

  // Employment Details
  document.getElementById('employeeId').textContent = data.employmentDetails?.employeeId || 'Not Available';
  document.getElementById('designationDetail').textContent = data.employmentDetails?.designation || 'Not Available';
  document.getElementById('department').textContent = data.employmentDetails?.department || 'Not Available';
  document.getElementById('dateOfJoining').textContent = data.employmentDetails?.dateOfJoining || 'Not Available';
  document.getElementById('employmentType').textContent = data.employmentDetails?.employmentType || 'Not Available';
  document.getElementById('reportingManager').textContent = data.employmentDetails?.reportingManager || 'Not Available';
  document.getElementById('officeLocation').textContent = data.employmentDetails?.officeLocation || 'Not Available';

  // Emergency Contact
  document.getElementById('emergencyName').textContent = data.emergencyContact?.name || 'Not Available';
  document.getElementById('emergencyNumber').textContent = data.emergencyContact?.number || 'Not Available';
  document.getElementById('emergencyRelation').textContent = data.emergencyContact?.relation || 'Not Available';

  // If editing, convert to editable inputs
  if (isEditing) {
    makeEditable();
  }
}

// === CONVERT TO EDITABLE ===
function makeEditable() {
  document.querySelectorAll('.detail span').forEach(span => {
    const labelId = span.id;
    const value = span.textContent === 'Not Available' ? '' : span.textContent;

    let input;
    if (labelId === 'gender') {
      input = document.createElement('select');
      ['Male', 'Female', 'Other'].forEach(optVal => {
        const opt = document.createElement('option');
        opt.value = optVal;
        opt.textContent = optVal;
        if (optVal === value) opt.selected = true;
        input.appendChild(opt);
      });
    } 
    else if (labelId === 'maritalStatus') {
      input = document.createElement('select');
      ['Single', 'Married', 'Divorced', 'Widowed'].forEach(optVal => {
        const opt = document.createElement('option');
        opt.value = optVal;
        opt.textContent = optVal;
        if (optVal === value) opt.selected = true;
        input.appendChild(opt);
      });
    } 
    else if (labelId === 'employmentType') {
      input = document.createElement('select');
      ['Full-time', 'Part-time', 'Contract', 'Intern'].forEach(optVal => {
        const opt = document.createElement('option');
        opt.value = optVal;
        opt.textContent = optVal;
        if (optVal === value) opt.selected = true;
        input.appendChild(opt);
      });
    } 
    else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = value;
    }

    input.dataset.fieldId = labelId; // Store field mapping
    span.replaceWith(input);
  });
}

// === EDIT BUTTON ===
document.getElementById('editBtn').addEventListener('click', () => {
  isEditing = true;
  renderProfile(profileData);
  document.getElementById('editBtn').style.display = 'none';
  document.getElementById('saveBtn').style.display = 'inline-block';
});

// === SAVE BUTTON ===
document.getElementById('saveBtn').addEventListener('click', async () => {
  const inputs = document.querySelectorAll('.detail input, .detail select');

  // Mapping database paths
  const fieldMap = {
    fullName: ['basicInfo', 'fullName'],
    dob: ['basicInfo', 'dob'],
    gender: ['basicInfo', 'gender'],
    bloodGroup: ['basicInfo', 'bloodGroup'],
    maritalStatus: ['basicInfo', 'maritalStatus'],

    personalEmail: ['contactInfo', 'personalEmail'],
    workEmail: ['contactInfo', 'workEmail'],
    mobile: ['contactInfo', 'mobile'],
    alternateMobile: ['contactInfo', 'alternateMobile'],
    currentAddress: ['contactInfo', 'currentAddress'],
    permanentAddress: ['contactInfo', 'permanentAddress'],

    employeeId: ['employmentDetails', 'employeeId'],
    designationDetail: ['employmentDetails', 'designation'],
    department: ['employmentDetails', 'department'],
    dateOfJoining: ['employmentDetails', 'dateOfJoining'],
    employmentType: ['employmentDetails', 'employmentType'],
    reportingManager: ['employmentDetails', 'reportingManager'],
    officeLocation: ['employmentDetails', 'officeLocation'],

    emergencyName: ['emergencyContact', 'name'],
    emergencyNumber: ['emergencyContact', 'number'],
    emergencyRelation: ['emergencyContact', 'relation']
  };

  inputs.forEach(input => {
    const fieldId = input.dataset.fieldId;
    if (fieldMap[fieldId]) {
      const [section, key] = fieldMap[fieldId];
      profileData[section] = profileData[section] || {};
      profileData[section][key] = input.value || 'Not Available';
    }
  });

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