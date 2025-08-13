// header.js
export function loadHeader(activePage = 'dashboard') {
  // Map of page names to titles & icons
  const pageConfig = {
    dashboard: { title: 'Dashboard', icon: 'fas fa-home' },
    punch: { title: 'Punch In/Out', icon: 'fas fa-fingerprint' },
    reports: { title: 'Reports', icon: 'fas fa-chart-line' },
    profile: { title: 'Profile', icon: 'fas fa-user' },
    settings: { title: 'Settings', icon: 'fas fa-cog' }
  };

  const { title, icon } = pageConfig[activePage] || { title: '', icon: '' };

  const headerHTML = `
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <header class="app-header">
      <div class="header-left">
        <button class="menu-toggle" onclick="document.querySelector('.sidebar').classList.toggle('active')">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      <div class="header-title"><i class="${icon}" style="margin-right:8px;"></i>${title}</div>
      <div class="header-right">
        <a href="settings.html"><i class="fas fa-cog"></i></a>
      </div>
    </header>

    <!-- SIDEBAR -->
    <div class="sidebar">
      <h2>Avanta</h2>
      <a href="dashboard.html" ${activePage === 'dashboard' ? 'class="active"' : ''}><i class="fas fa-home"></i> Dashboard</a>
      <a href="punch.html" ${activePage === 'punch' ? 'class="active"' : ''}><i class="fas fa-fingerprint"></i> Punch In/Out</a>
      <a href="reports.html" ${activePage === 'reports' ? 'class="active"' : ''}><i class="fas fa-chart-line"></i> Reports</a>
      <a href="profile.html" ${activePage === 'profile' ? 'class="active"' : ''}><i class="fas fa-user"></i> Profile</a>
      <a href="settings.html" ${activePage === 'settings' ? 'class="active"' : ''}><i class="fas fa-cog"></i> Settings</a>
      <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', headerHTML);
}
