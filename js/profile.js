import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// DOM references
const el = id => document.getElementById(id);
const avatarEl = el('profileAvatar');
const fullNameEl = el('fullName');
const designationEl = el('designation');
const emailEl = el('email');
const empIdEl = el('empId');
const departmentEl = el('department');
const joinDateEl = el('joinDate');
const phoneEl = el('phone');

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  emailEl.textContent = user.email || '—';

  try {
    const snap = await get(child(ref(db), `users/${user.uid}`));
    if (snap.exists()) {
      const profile = snap.val();
      fullNameEl.textContent = profile.name || '—';
      designationEl.textContent = profile.designation || '—';
      avatarEl.textContent = profile.name 
        ? profile.name.split(' ').map(p => p[0]).slice(0, 2).join('')
        : (user.email[0] || 'U').toUpperCase();

      empIdEl.textContent = profile.empId || '—';
      departmentEl.textContent = profile.department || '—';
      joinDateEl.textContent = profile.joinDate || '—';
      phoneEl.textContent = profile.phone || '—';
    }
  } catch (e) {
    console.error("Failed to fetch profile:", e);
  }
});