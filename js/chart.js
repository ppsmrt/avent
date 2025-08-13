<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
function renderGoalChart(attendedDays, totalDays) {
  const ctx = document.getElementById('goalChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Attended', 'Remaining'],
      datasets: [{
        data: [0, totalDays], // Start animation from zero
        backgroundColor: ['#3498db', '#ecf0f1'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: false,
      cutout: '70%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  });

  // Delay to trigger animation after chart load
  setTimeout(() => {
    goalChart.data.datasets[0].data = [attendedDays, totalDays - attendedDays];
    goalChart.update();
    document.getElementById('goalText').textContent = `${attendedDays} / ${totalDays} days`;
  }, 300);
}

// Example usage with animation:
let goalChart;
window.onload = () => {
  const ctx = document.getElementById('goalChart').getContext('2d');
  goalChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Attended', 'Remaining'],
      datasets: [{
        data: [0, 22], // Start with 0 attended for animation
        backgroundColor: ['#3498db', '#ecf0f1'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: false,
      cutout: '70%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Animate to real values
  setTimeout(() => {
    goalChart.data.datasets[0].data = [12, 10]; // Example: 12 attended out of 22
    goalChart.update();
    document.getElementById('goalText').textContent = `12 / 22 days`;
  }, 300);
};
</script>
