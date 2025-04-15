document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('financialChart').getContext('2d');

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Order Volume',
        data: [120, 150, 180, 200, 220, 210, 230, 250, 270, 300, 320, 350],
        borderColor: 'rgba(58, 127, 242, 1)',
        backgroundColor: 'rgba(58, 127, 242, 0.2)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y1'
      },
      {
        label: 'Revenue',
        data: [10000, 12000, 15000, 18000, 21000, 20000, 23000, 26000, 28000, 31000, 34000, 37000],
        borderColor: 'rgba(13, 189, 139, 1)',
        backgroundColor: 'rgba(13, 189, 139, 0.2)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y2'
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    scales: {
      y1: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Order Volume',
          color: 'rgba(58, 127, 242, 1)'
        },
        ticks: {
          color: 'rgba(58, 127, 242, 1)'
        },
        grid: {
          drawOnChartArea: false,
        }
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Revenue ($)',
          color: 'rgba(13, 189, 139, 1)'
        },
        ticks: {
          color: 'rgba(13, 189, 139, 1)',
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        },
        grid: {
          drawOnChartArea: false,
        }
      },
      x: {
        ticks: {
          color: 'var(--text-secondary)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-primary)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'rgba(51, 51, 51, 0.9)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
      }
    }
  };

  new Chart(ctx, {
    type: 'line',
    data: data,
    options: options
  });
});
