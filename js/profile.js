import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const dbRef = ref(db);
  get(child(dbRef, `users/${user.uid}`)).then((snapshot) => {
    if (!snapshot.exists()) return;

    const data = snapshot.val();

    // Basic Info
    document.getElementById('fullName').textContent = data.basicInfo?.fullName || '—';
    document.getElementById('profilePhoto').src = data.basicInfo?.profilePhoto || 'https://tamilgeo.wordpress.com/wp-content/uploads/2025/08/images4526844530498709058.png';
    document.getElementById('dob').textContent = data.basicInfo?.dob || '—';
    document.getElementById('gender').textContent = data.basicInfo?.gender || '—';
    document.getElementById('bloodGroup').textContent = data.basicInfo?.bloodGroup || '—';
    document.getElementById('maritalStatus').textContent = data.basicInfo?.maritalStatus || '—';

    // Contact Info
    document.getElementById('personalEmail').textContent = data.contactInfo?.personalEmail || '—';
    document.getElementById('workEmail').textContent = data.contactInfo?.workEmail || '—';
    document.getElementById('mobile').textContent = data.contactInfo?.mobile || '—';
    document.getElementById('alternateMobile').textContent = data.contactInfo?.alternateMobile || '—';
    document.getElementById('currentAddress').textContent = data.contactInfo?.currentAddress || '—';
    document.getElementById('permanentAddress').textContent = data.contactInfo?.permanentAddress || '—';

    // Employment
    document.getElementById('designation').textContent = data.employmentDetails?.designation || '—';
    document.getElementById('employeeId').textContent = data.employmentDetails?.employeeId || '—';
    document.getElementById('designationDetail').textContent = data.employmentDetails?.designation || '—';
    document.getElementById('department').textContent = data.employmentDetails?.department || '—';
    document.getElementById('dateOfJoining').textContent = data.employmentDetails?.dateOfJoining || '—';
    document.getElementById('employmentType').textContent = data.employmentDetails?.employmentType || '—';
    document.getElementById('reportingManager').textContent = data.employmentDetails?.reportingManager || '—';
    document.getElementById('officeLocation').textContent = data.employmentDetails?.officeLocation || '—';

    // Emergency
    document.getElementById('emergencyName').textContent = data.emergencyInfo?.contactName || '—';
    document.getElementById('emergencyNumber').textContent = data.emergencyInfo?.contactNumber || '—';
    document.getElementById('emergencyRelation').textContent = data.emergencyInfo?.relation || '—';
  });
});