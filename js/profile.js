<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Profile</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="topbar">
    <h1>My Profile</h1>
    <a href="dashboard.html" class="back-btn">← Back to Dashboard</a>
  </header>

  <main class="profile-container">
    <section class="profile-header">
      <div class="avatar" id="profileAvatar">U</div>
      <div class="info">
        <h2 id="fullName">Loading...</h2>
        <p id="designation">Employee</p>
        <p id="email">email@example.com</p>
      </div>
    </section>

    <section class="profile-details">
      <div class="detail-item"><strong>Employee ID:</strong> <span id="empId">—</span></div>
      <div class="detail-item"><strong>Department:</strong> <span id="department">—</span></div>
      <div class="detail-item"><strong>Date Joined:</strong> <span id="joinDate">—</span></div>
      <div class="detail-item"><strong>Phone:</strong> <span id="phone">—</span></div>
    </section>
  </main>

  <script type="module" src="js/profile.js"></script>
</body>
</html>