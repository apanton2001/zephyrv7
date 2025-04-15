import React, { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { trackEvent, AnalyticsEvents } from '../../lib/analytics';

// Register the required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceChartProps {
  title: string;
  data: ChartData<'line'>;
  height?: number;
  options?: Partial<ChartOptions<'line'>>;
  periodType?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export default function PerformanceChart({
  title,
  data,
  height = 280,
  options = {},
  periodType = 'week'
}: PerformanceChartProps) {
  // Track chart view
  useEffect(() => {
    trackEvent(AnalyticsEvents.WIDGET_INTERACT, {
      widget: 'performance_chart',
      action: 'view',
      chart_type: title.toLowerCase().replace(/\s+/g, '_')
    });
  }, [title]);

  // Define default options with dark mode theme
  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9CA3AF', // text-text-secondary
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: '#1F2937', // bg-background-dark
        titleColor: '#F9FAFB', // text-text-primary
        bodyColor: '#D1D5DB', // text-text-secondary
        borderColor: '#374151', // border-border
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          // Add percentage sign to values
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + '%';
            }
            return label;
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          // Removed drawBorder property to fix TypeScript error
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF', // text-text-secondary
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)', // gray-600 with opacity
          // Removed drawBorder property to fix TypeScript error
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF', // text-text-secondary
          padding: 8,
          callback: function(value) {
            return value + '%';
          }
        },
        min: 0,
        max: 100,
      },
    },
    elements: {
      line: {
        tension: 0.3, // Smoother curves
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Merge default options with provided options
  const chartOptions = { ...defaultOptions, ...options };

  // Define period selector options
  const periods = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' },
  ];

  // Handle period change
  const handlePeriodChange = (period: string) => {
    trackEvent(AnalyticsEvents.WIDGET_INTERACT, {
      widget: 'performance_chart',
      action: 'period_change',
      period
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        
        {/* Period selector */}
        <div className="flex text-xs">
          {periods.map((period) => (
            <button
              key={period.value}
              className={`px-2 py-1 rounded ${periodType === period.value 
                ? 'bg-primary text-white' 
                : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => handlePeriodChange(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ height }}>
        <Line options={chartOptions} data={data} />
      </div>
    </div>
  );
}

// Helper function to generate demo data for the performance chart
export function generateDemoPerformanceData(
  days = 7,
  includeFactors = true
): ChartData<'line'> {
  // Generate labels (dates)
  const labels = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1) + i);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  // Generate overall efficiency data (between 80-98)
  const overallData = Array.from({ length: days }, () => 
    Math.floor(Math.random() * 18) + 80
  );
  
  // Ensure the last data point is the current efficiency score from the dashboard
  overallData[days - 1] = 95.7;

  // Create chart data object
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Overall Efficiency',
        data: overallData,
        borderColor: '#3B82F6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue-500 with opacity
        fill: true,
        borderWidth: 2,
      }
    ]
  };

  // Add individual factors if requested
  if (includeFactors) {
    // Order Fulfillment (85-99)
    chartData.datasets.push({
      label: 'Order Rate',
      data: Array.from({ length: days }, () => Math.floor(Math.random() * 14) + 85),
      borderColor: '#10B981', // green-500
      backgroundColor: 'transparent',
      borderWidth: 2,
    });
    
    // Inventory Accuracy (84-98)
    chartData.datasets.push({
      label: 'Inventory',
      data: Array.from({ length: days }, () => Math.floor(Math.random() * 14) + 84),
      borderColor: '#6366F1', // indigo-500
      backgroundColor: 'transparent',
      borderWidth: 2,
    });
    
    // Space Utilization (70-95)
    chartData.datasets.push({
      label: 'Space',
      data: Array.from({ length: days }, () => Math.floor(Math.random() * 25) + 70),
      borderColor: '#F59E0B', // amber-500
      backgroundColor: 'transparent',
      borderWidth: 2,
    });
    
    // Labor Productivity (80-97)
    chartData.datasets.push({
      label: 'Productivity',
      data: Array.from({ length: days }, () => Math.floor(Math.random() * 17) + 80),
      borderColor: '#EC4899', // pink-500
      backgroundColor: 'transparent',
      borderWidth: 2,
    });

    // Ensure the last data points match current values from dashboard
    chartData.datasets[1].data[days - 1] = 97.2; // Order Rate
    chartData.datasets[2].data[days - 1] = 94.5; // Inventory
    chartData.datasets[3].data[days - 1] = 88.3; // Space
    chartData.datasets[4].data[days - 1] = 92.1; // Productivity
  }

  return chartData;
}
