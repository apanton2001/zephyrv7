document.addEventListener('DOMContentLoaded', function() {
    // Performance Metrics Chart
    const performanceChartCanvas = document.getElementById('performanceChart');
    
    if (performanceChartCanvas) {
        // Generate random data for demonstration
        const generateRandomData = (min, max, count) => {
            const data = [];
            for (let i = 0; i < count; i++) {
                data.push(Math.floor(Math.random() * (max - min + 1)) + min);
            }
            return data;
        };
        
        // Today's hours (for x-axis labels)
        const hours = [];
        const now = new Date();
        const currentHour = now.getHours();
        
        for (let i = 0; i < 12; i++) {
            const hour = (currentHour - 11 + i + 24) % 24; // Get the past 12 hours
            hours.push(hour + ':00');
        }
        
        // Sample metrics data
        const orderFulfillmentRate = generateRandomData(85, 95, 12);
        const inventoryAccuracy = generateRandomData(82, 92, 12);
        const pickingSpeed = generateRandomData(75, 90, 12);
        const overallEfficiency = generateRandomData(80, 92, 12);
        
        // Create the chart
        const performanceChart = new Chart(performanceChartCanvas, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [
                    {
                        label: 'Order Fulfillment',
                        data: orderFulfillmentRate,
                        borderColor: 'rgba(51, 153, 255, 1)', // --info
                        backgroundColor: 'rgba(51, 153, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Inventory Accuracy',
                        data: inventoryAccuracy,
                        borderColor: 'rgba(122, 74, 211, 1)', // --accent-secondary
                        backgroundColor: 'rgba(122, 74, 211, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Picking Speed',
                        data: pickingSpeed,
                        borderColor: 'rgba(249, 177, 21, 1)', // --warning
                        backgroundColor: 'rgba(249, 177, 21, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Overall Efficiency',
                        data: overallEfficiency,
                        borderColor: 'rgba(74, 111, 211, 1)', // --accent-primary
                        backgroundColor: 'rgba(74, 111, 211, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(179, 179, 179, 0.8)' // --text-secondary
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(179, 179, 179, 0.8)' // --text-secondary
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            color: 'rgba(179, 179, 179, 0.8)' // --text-secondary
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 30, 30, 0.9)', // --bg-secondary
                        titleColor: 'rgba(255, 255, 255, 0.9)', // --text-primary
                        bodyColor: 'rgba(179, 179, 179, 0.9)', // --text-secondary
                        borderColor: 'rgba(51, 51, 51, 0.9)', // --border-color
                        borderWidth: 1,
                        cornerRadius: 6, // --border-radius
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
        
        // Handle time filter buttons
        const timeFilterBtns = document.querySelectorAll('.time-filter button');
        
        timeFilterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active class
                timeFilterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update chart data based on the selected time period
                const period = this.textContent.toLowerCase();
                let newLabels = [];
                let dataPoints = 0;
                
                switch (period) {
                    case 'day':
                        newLabels = hours;
                        dataPoints = 12;
                        break;
                    case 'week':
                        newLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        dataPoints = 7;
                        break;
                    case 'month':
                        newLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                        dataPoints = 4;
                        break;
                }
                
                // Generate new random data for demonstration
                performanceChart.data.labels = newLabels;
                performanceChart.data.datasets.forEach((dataset, index) => {
                    let min, max;
                    
                    switch (index) {
                        case 0: // Order Fulfillment
                            min = 85; max = 95;
                            break;
                        case 1: // Inventory Accuracy
                            min = 82; max = 92;
                            break;
                        case 2: // Picking Speed
                            min = 75; max = 90;
                            break;
                        case 3: // Overall Efficiency
                            min = 80; max = 92;
                            break;
                    }
                    
                    dataset.data = generateRandomData(min, max, dataPoints);
                });
                
                // Update the chart
                performanceChart.update();
            });
        });
    }
    
    // Simulated Efficiency Score Calculation
    function updateEfficiencyScore() {
        const orderFulfillment = parseFloat(document.querySelector('.detail-item:nth-child(1) .value').textContent);
        const inventoryAccuracy = parseFloat(document.querySelector('.detail-item:nth-child(2) .value').textContent);
        const spaceUtilization = parseFloat(document.querySelector('.detail-item:nth-child(3) .value').textContent);
        const productivity = parseFloat(document.querySelector('.detail-item:nth-child(4) .value').textContent);
        
        // Weighted calculation
        const weightedScore = (
            (orderFulfillment * 0.35) + 
            (inventoryAccuracy * 0.25) + 
            (spaceUtilization * 0.15) + 
            (productivity * 0.25)
        ).toFixed(0);
        
        // Update the gauge value
        const gaugeElement = document.querySelector('.gauge-value');
        if (gaugeElement) {
            const currentScore = parseInt(gaugeElement.textContent);
            
            // Animated update
            let step = 0;
            const diff = weightedScore - currentScore;
            const duration = 1000; // 1 second
            const fps = 60;
            const totalSteps = duration / (1000 / fps);
            const increment = diff / totalSteps;
            
            const animation = setInterval(() => {
                step++;
                const newScore = Math.round(currentScore + (increment * step));
                gaugeElement.textContent = newScore;
                
                if (step >= totalSteps) {
                    clearInterval(animation);
                    gaugeElement.textContent = weightedScore;
                }
            }, 1000 / fps);
        }
    }
    
    // Update the efficiency score when refresh button is clicked
    const refreshBtn = document.querySelector('.efficiency-score .refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Simulate data refresh with slight randomization
            const detailItems = document.querySelectorAll('.detail-item');
            
            detailItems.forEach((item, index) => {
                const valueElement = item.querySelector('.value');
                const progressElement = item.querySelector('.progress');
                
                if (valueElement && progressElement) {
                    const currentValue = parseFloat(valueElement.textContent);
                    // Random adjustment between -3% and +3%
                    const adjustment = (Math.random() * 6 - 3).toFixed(0);
                    let newValue = currentValue + parseInt(adjustment);
                    
                    // Ensure the value stays within reasonable bounds
                    newValue = Math.max(65, Math.min(98, newValue));
                    
                    // Update the displayed value and progress bar
                    valueElement.textContent = newValue + '%';
                    progressElement.style.width = newValue + '%';
                }
            });
            
            // Recalculate efficiency score based on new values
            updateEfficiencyScore();
            
            // Show refresh notification
            const showNotification = window.showNotification || function(){};
            showNotification('Efficiency metrics updated', 'info');
        });
    }
});
