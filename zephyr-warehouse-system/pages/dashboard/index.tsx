import React from 'react';
import { 
  CubeIcon, 
  ShoppingCartIcon, 
  TruckIcon, 
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data for dashboard
const kpiData = [
  { 
    title: 'Total Inventory', 
    value: '12,456', 
    change: '+5.2%', 
    isPositive: true,
    icon: CubeIcon,
    color: 'bg-blue-500'
  },
  { 
    title: 'Pending Orders', 
    value: '243', 
    change: '+12.3%', 
    isPositive: false,
    icon: ShoppingCartIcon,
    color: 'bg-purple-500'
  },
  { 
    title: 'Shipments Today', 
    value: '87', 
    change: '+3.7%', 
    isPositive: true,
    icon: TruckIcon,
    color: 'bg-green-500'
  },
  { 
    title: 'Active Users', 
    value: '32', 
    change: '0%', 
    isPositive: true,
    icon: UserGroupIcon,
    color: 'bg-yellow-500'
  },
];

// Mock data for charts
const orderData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Orders',
      data: [650, 590, 800, 810, 760, 850, 920],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const inventoryData = {
  labels: ['Electronics', 'Clothing', 'Food', 'Furniture', 'Books', 'Tools'],
  datasets: [
    {
      label: 'Current Stock',
      data: [4500, 3200, 2100, 1800, 2700, 1500],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
      ],
    },
  ],
};

// Chart options
const lineOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Order Trends',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const barOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Inventory by Category',
    },
  },
};

// Recent activities mock data
const recentActivities = [
  { id: 1, activity: 'Order #12345 processed', time: '5 minutes ago', user: 'John Doe' },
  { id: 2, activity: 'New inventory received: SKU-789', time: '1 hour ago', user: 'Jane Smith' },
  { id: 3, activity: 'Shipment #5678 marked as delivered', time: '3 hours ago', user: 'Mike Johnson' },
  { id: 4, activity: 'Low stock alert: SKU-456', time: '5 hours ago', user: 'System' },
  { id: 5, activity: 'New user registered', time: '1 day ago', user: 'Admin' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <button className="btn btn-primary">
            Generate Report
          </button>
          <button className="btn btn-outline">
            Export Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div key={index} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                <div className="flex items-center mt-1">
                  {kpi.isPositive ? (
                    <ArrowUpIcon className="h-4 w-4 text-success-DEFAULT" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-error-DEFAULT" />
                  )}
                  <span className={`text-sm ml-1 ${kpi.isPositive ? 'text-success-DEFAULT' : 'text-error-DEFAULT'}`}>
                    {kpi.change}
                  </span>
                </div>
              </div>
              <div className={`${kpi.color} p-3 rounded-lg`}>
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <Line options={lineOptions} data={orderData} />
        </div>
        <div className="card p-4">
          <Bar options={barOptions} data={inventoryData} />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start border-b border-gray-200 dark:border-dark-600 pb-3">
              <div className="bg-gray-100 dark:bg-dark-600 p-2 rounded-full mr-3">
                <UserGroupIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{activity.activity}</p>
                <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{activity.time}</span>
                  <span className="mx-2">•</span>
                  <span>{activity.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button className="text-primary-600 dark:text-primary-400 text-sm hover:underline">
            View All Activities
          </button>
        </div>
      </div>

      {/* Warehouse Efficiency Score */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-4">Warehouse Efficiency Score</h2>
        <div className="flex items-center justify-between">
          <div className="w-full max-w-xs">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                    Current Score
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary-600">
                    85%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200">
                <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600"></div>
              </div>
            </div>
          </div>
          <div className="ml-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Picking Accuracy</p>
                <p className="text-lg font-bold">98.2%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order Fulfillment</p>
                <p className="text-lg font-bold">92.7%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Space Utilization</p>
                <p className="text-lg font-bold">78.5%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Labor Efficiency</p>
                <p className="text-lg font-bold">81.3%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;