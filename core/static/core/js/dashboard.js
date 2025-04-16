document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the dashboard page
  const ctx = document.getElementById('inventoryStatusChart');
  if (!ctx) return;
  
  // Get chart data from global variables that will be set in the template
  // These will be populated by the Django view
  const chartLabels = window.inventoryChartLabels || [];
  const chartData = window.inventoryChartData || [];
  
  // Define colors (you can customize these)
  const backgroundColors = [
    'rgba(220, 53, 69, 0.7)',  // Danger (Out of Stock)
    'rgba(255, 193, 7, 0.7)',   // Warning (Low Stock)
    'rgba(25, 135, 84, 0.7)',  // Success (In Stock)
    'rgba(108, 117, 125, 0.7)' // Secondary (Unknown/Other)
  ];
  const borderColors = [
    'rgba(220, 53, 69, 1)',
    'rgba(255, 193, 7, 1)',
    'rgba(25, 135, 84, 1)',
    'rgba(108, 117, 125, 1)'
  ];
  
  // Map labels to colors dynamically (ensure order matches if statuses aren't guaranteed)
  // This is a simple approach; a more robust one would map explicitly
  const chartBackgroundColors = chartLabels.map(label => {
    if (label === 'Out of Stock') return backgroundColors[0];
    if (label === 'Low Stock') return backgroundColors[1];
    if (label === 'In Stock') return backgroundColors[2];
    return backgroundColors[3]; // Default/Unknown
  });
  const chartBorderColors = chartLabels.map(label => {
    if (label === 'Out of Stock') return borderColors[0];
    if (label === 'Low Stock') return borderColors[1];
    if (label === 'In Stock') return borderColors[2];
    return borderColors[3]; // Default/Unknown
  });

  if (ctx && chartLabels.length > 0 && chartData.length > 0) {
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Inventory Status',
          data: chartData,
          backgroundColor: chartBackgroundColors,
          borderColor: chartBorderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, // Adjust as needed
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += context.parsed;
                }
                // Optional: Add percentage
                // const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                // const percentage = ((context.parsed / total) * 100).toFixed(1) + '%';
                // label += ` (${percentage})`; 
                return label;
              }
            }
          }
        }
      }
    });
  } else {
    console.log("Chart canvas not found or no data for chart.");
    // Optionally display a message in the card body if no data
    if(ctx && chartLabels.length === 0) {
      ctx.parentNode.innerHTML = '<p class="text-muted text-center">No inventory data available for chart.</p>';
    }
  }
}); 