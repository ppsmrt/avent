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
        data: [attendedDays, totalDays - attendedDays],
        backgroundColor: ['#3498db', '#ecf0f1'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  });

  document.getElementById('goalText').textContent = `${attendedDays} / ${totalDays} days`;
}

// Example usage:
renderGoalChart(12, 22); // You can call this with live data
</script>
