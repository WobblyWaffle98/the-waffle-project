// Initialize the chart and data when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadOrdersAndRenderChart();
  
  // Set up a listener for localStorage changes
  window.addEventListener('storage', (event) => {
      if (event.key === "orders") {
          loadOrdersAndRenderChart();
      }
  });
});

// Load orders from localStorage and render the chart
function loadOrdersAndRenderChart() {
  const storedOrders = localStorage.getItem("orders");
  if (storedOrders) {
      const orders = JSON.parse(storedOrders);
      processOrdersAndVisualize(orders);
  } else {
      // Handle case where no orders exist
      renderEmptyChart();
      updateSummaryCards(0, 0, 0, 0);
  }
}

// Process orders and create visualization
function processOrdersAndVisualize(orders) {
  const volumeByMonthAndStatus = {};
  const monthOrder = [];

  function parseVolume(volumeStr) {
      return parseInt(volumeStr.replace(/,/g, ''), 10);
  }

  orders.forEach(order => {
      const month = order.contractMonth;
      const status = order.status;
      if (status === 'expired') return;

      if (!volumeByMonthAndStatus[month]) {
          volumeByMonthAndStatus[month] = { open: 0, locked: 0, filled: 0 };
          monthOrder.push(month);
      }

      if (order.volume) {
          volumeByMonthAndStatus[month][status] += parseVolume(order.volume);
      }
  });

  monthOrder.sort((a, b) => {
      const dateA = new Date('20' + a.split(' ')[1], getMonthNumber(a.split(' ')[0]), 1);
      const dateB = new Date('20' + b.split(' ')[1], getMonthNumber(b.split(' ')[0]), 1);
      return dateA - dateB;
  });

  const chartData = {
      labels: monthOrder,
      datasets: [
          {
              label: 'Open',
              data: monthOrder.map(month => volumeByMonthAndStatus[month].open),
              backgroundColor: '#2980b9',
              borderColor: '#2573a7',
              borderWidth: 1
          },
          {
              label: 'Locked',
              data: monthOrder.map(month => volumeByMonthAndStatus[month].locked),
              backgroundColor: '#f39c12',
              borderColor: '#e67e22',
              borderWidth: 1
          },
          {
              label: 'Filled',
              data: monthOrder.map(month => volumeByMonthAndStatus[month].filled),
              backgroundColor: '#27ae60',
              borderColor: '#219955',
              borderWidth: 1
          }
      ]
  };

  renderChart(chartData);

  const totalOpen = Object.values(volumeByMonthAndStatus).reduce((sum, monthData) => sum + monthData.open, 0);
  const totalLocked = Object.values(volumeByMonthAndStatus).reduce((sum, monthData) => sum + monthData.locked, 0);
  const totalFilled = Object.values(volumeByMonthAndStatus).reduce((sum, monthData) => sum + monthData.filled, 0);
  const activeMonths = monthOrder.length;

  updateSummaryCards(totalOpen, totalLocked, totalFilled, activeMonths);
}

// Render chart with the processed data
function renderChart(chartData) {
  if (window.volumeBarChart) {
      window.volumeBarChart.destroy();
  }

  const ctx = document.getElementById('volumeChart').getContext('2d');
  window.volumeBarChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
          responsive: true,
          maintainAspectRatio: true,  // Prevents unwanted stretching
          scales: {
              x: {
                  stacked: true,
                  title: {
                      display: true,
                      text: 'Contract Month',
                      color: '#ecf0f1'
                  },
                  ticks: {
                      color: '#ecf0f1'
                  },
                  grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                  }
              },
              y: {
                  stacked: true,
                  title: {
                      display: true,
                      text: 'Volume',
                      color: '#ecf0f1'
                  },
                  ticks: {
                      color: '#ecf0f1',
                      callback: function(value) {
                          return formatVolumeForDisplay(value);
                      }
                  },
                  grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                  }
              }
          },
          plugins: {
              legend: {
                  display: false 
              },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          return context.dataset.label + ': ' + formatVolumeForDisplay(context.raw);
                      }
                  }
              }
          }
      }
  });
}

// Render empty chart when no data
function renderEmptyChart() {
  const ctx = document.getElementById('volumeChart').getContext('2d');

  if (window.volumeBarChart) {
      window.volumeBarChart.destroy();
  }

  window.volumeBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['No Data'],
          datasets: [{
              label: 'No Orders Available',
              data: [0],
              backgroundColor: '#555555'
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: true,  // Prevents height expansion
          plugins: {
              legend: {
                  display: false
              }
          }
      }
  });
}

// Update summary cards with calculated totals
function updateSummaryCards(openVol, lockedVol, filledVol, months) {
  document.getElementById('openVolume').textContent = formatVolumeForDisplay(openVol);
  document.getElementById('lockedVolume').textContent = formatVolumeForDisplay(lockedVol);
  document.getElementById('filledVolume').textContent = formatVolumeForDisplay(filledVol);
  document.getElementById('contractMonths').textContent = months;
}

// Helper function to format volume for display
function formatVolumeForDisplay(volume) {
  if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
  } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
  } else {
      return volume.toString();
  }
}

// Helper function to convert month abbreviation to number
function getMonthNumber(monthAbbr) {
  const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  return months[monthAbbr] || 0;
}

// Navigation functions
function goToMandate() {
  window.location.href = "../mandate.html";
}
