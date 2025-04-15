import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusCard from '../components/dashboard/StatusCard';
import EfficiencyScore from '../components/dashboard/EfficiencyScore';
import PerformanceChart, { generateDemoPerformanceData } from '../components/dashboard/PerformanceChart';
import { trackEvent, AnalyticsEvents } from '../lib/analytics';
import { EfficiencyFactors } from '../lib/utils/warehouseEfficiency';
import { 
  DocumentTextIcon, 
  TruckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  // State for last updated time
  const [lastUpdated, setLastUpdated] = useState<string>("just now");
  // State for efficiency factors
  const [efficiencyFactors, setEfficiencyFactors] = useState<EfficiencyFactors>({
    orderFulfillment: 97.2,
    inventoryAccuracy: 94.5,
    spaceUtilization: 88.3,
    laborProductivity: 92.1
  });
  // State for efficiency change
  const [efficiencyChange, setEfficiencyChange] = useState<number>(4.2);
  // State for chart data
  const [performanceData, setPerformanceData] = useState(generateDemoPerformanceData(7, true));
  // State for period type
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');
  // State for refreshing indicator
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    // Track page view when dashboard loads
    trackEvent(AnalyticsEvents.PAGE_VIEW, { page: 'dashboard' });
  }, []);

  // Function to handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Track refresh action
    trackEvent(AnalyticsEvents.WIDGET_INTERACT, { 
      widget: 'dashboard', 
      action: 'refresh'
    });
    
    // Simulate data fetching (would be replaced with actual API calls)
    setTimeout(() => {
      // Update with new "data"
      const newFactors = {
        orderFulfillment: Math.min(100, efficiencyFactors.orderFulfillment + (Math.random() * 2 - 1)),
        inventoryAccuracy: Math.min(100, efficiencyFactors.inventoryAccuracy + (Math.random() * 2 - 1)),
        spaceUtilization: Math.min(100, efficiencyFactors.spaceUtilization + (Math.random() * 2 - 1)),
        laborProductivity: Math.min(100, efficiencyFactors.laborProductivity + (Math.random() * 2 - 1))
      };
      
      setEfficiencyFactors(newFactors);
      setLastUpdated("just now");
      setPerformanceData(generateDemoPerformanceData(
        periodType === 'day' ? 24 : 
        periodType === 'week' ? 7 : 
        periodType === 'month' ? 30 : 
        periodType === 'quarter' ? 90 : 365, 
        true
      ));
      setIsRefreshing(false);
    }, 1000);
  };

  // Update "last updated" time every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Get minutes since last update
      const minutes = Math.floor((new Date().getTime() - new Date().getTime()) / 60000) + 1;
      setLastUpdated(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`);
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <DashboardLayout title="Command Center">
      {/* Dashboard Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Warehouse Performance Dashboard</h2>
        <button 
          className={`flex items-center text-sm px-3 py-1.5 rounded-md bg-primary-light/10 text-primary-light ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-light/20'}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Active Orders */}
            <StatusCard
              title="Active Orders"
              value="4"
              icon={<DocumentTextIcon className="h-5 w-5" />}
              trend={{ value: 2.1, isPositive: true }}
            />
            
            {/* Pending Shipments */}
            <StatusCard
              title="Pending Shipments"
              value="1"
              icon={<TruckIcon className="h-5 w-5" />}
            />
            
            {/* Low Stock Items */}
            <StatusCard
              title="Low Stock Items"
              value="8"
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              color="warning"
            />
          </div>
          
          {/* Efficiency Score */}
          <EfficiencyScore 
            factors={efficiencyFactors}
            change={efficiencyChange}
            lastUpdated={lastUpdated}
          />
          
          {/* Performance Chart */}
          <div className="mt-6">
            <PerformanceChart 
              title="Warehouse Efficiency Trend"
              data={performanceData}
              periodType={periodType}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <button 
                className="text-xs text-primary-light"
                onClick={() => trackEvent(AnalyticsEvents.MENU_CLICK, { item: 'view_all_activity' })}
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-start space-x-3 py-2 border-b border-border last:border-0">
                  <div className="bg-background-light p-2 rounded-full">
                    <ClockIcon className="h-4 w-4 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Order #ORD-2876 Shipped</p>
                    <p className="text-xs text-text-secondary">10 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order States */}
          <div className="card">
            <h3 className="font-semibold mb-4">Order States</h3>
            <div className="space-y-2">
              {[
                { name: 'Awaiting Confirmation', count: 2, percentage: 25 },
                { name: 'Processing', count: 1, percentage: 40 },
                { name: 'Picking', count: 3, percentage: 80 },
                { name: 'Packing', count: 1, percentage: 15 },
                { name: 'Ready to Ship', count: 2, percentage: 65 },
              ].map((state, index) => (
                <div key={index} className="flex items-center py-1">
                  <span className="text-sm text-text-secondary w-48">{state.name}</span>
                  <div className="flex-1">
                    <div className="w-full bg-background-light h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${state.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium ml-3">{state.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
