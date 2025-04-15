document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('inventoryHealthChart').getContext('2d');

  const data = {
    labels: ['Healthy Stock', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [82, 12, 6],
      backgroundColor: [
        'rgba(13, 189, 139, 0.8)',
        'rgba(255, 152, 0, 0.8)',
        'rgba(244, 67, 54, 0.8)'
      ],
      borderWidth: 0,
      cutout: '70%',
      borderRadius: 10,
      spacing: 5
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgba(51, 51, 51, 0.9)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true
      }
    }
  };

  const inventoryHealthChart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: options
  });

  // Recommended POs functionality
  const recommendedPOs = 5;
  const totalValue = 4250.00;

  // Update the UI elements dynamically
  const recommendedPOsElement = document.querySelector('.analysis-metric.suggested .metric-value');
  const totalValueElement = document.querySelector('.analysis-metric.suggested .metric-subtext');

  if (recommendedPOsElement) {
    recommendedPOsElement.textContent = recommendedPOs;
  }

  if (totalValueElement) {
    totalValueElement.textContent = `$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} total value`;
  }

  // Function to simulate updating recommended POs based on some logic
  function updateRecommendedPOs(newCount, newValue) {
    if (recommendedPOsElement) {
      recommendedPOsElement.textContent = newCount;
    }
    if (totalValueElement) {
      totalValueElement.textContent = `$${newValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} total value`;
    }
  }

  // Example test: simulate an update after 5 seconds
  setTimeout(() => {
    updateRecommendedPOs(7, 5120.50);
    console.log('Recommended POs updated for testing.');
  }, 5000);
});
