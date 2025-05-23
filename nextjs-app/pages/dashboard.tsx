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
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { TemplateCard, TemplateCardHeader, TemplateCardContent, TemplateCardTitle } from '../components/ui/template-card';
import { Button } from '../components/ui/button';

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
      {/* Dashboard Header with Live Badge */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Command Center</h1>
          <span className="bg-primary/90 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
            Live
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-text-secondary">
          <ClockIcon className="h-4 w-4" />
          <span>Last Updated: {lastUpdated}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Metric Cards Row */}
        <div className="lg:col-span-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Active Orders */}
            <StatusCard
              title="Active Orders"
              value="4"
              icon={<DocumentTextIcon className="h-5 w-5 text-primary" />}
              trend={{ value: 2.1, isPositive: true }}
            />
            
            {/* Pending Shipments */}
            <StatusCard
              title="Pending Shipments"
              value="1"
              icon={<TruckIcon className="h-5 w-5 text-amber-500" />}
            />
            
            {/* Low Stock Items */}
            <StatusCard
              title="Low Stock Items"
              value="8"
              icon={<ExclamationTriangleIcon className="h-5 w-5 text-red-500" />}
              color="warning"
            />
          </div>
        </div>
        
        {/* Efficiency Metric */}
        <div className="lg:col-span-6">
          <TemplateCard className="bg-background-dark border-none">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-medium">Warehouse Efficiency</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">95.7%</span>
                  <span className="text-sm font-medium text-green-500">+{efficiencyChange}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-background-light/50 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full" 
                  style={{ width: '95.7%' }}
                />
              </div>
            </div>
          </TemplateCard>
        </div>
        
        {/* Main Content Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* Performance Chart */}
          <TemplateCard>
            <TemplateCardHeader>
              <div className="flex justify-between items-center">
                <TemplateCardTitle>Performance Metrics</TemplateCardTitle>
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 text-primary-light"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </TemplateCardHeader>
            
            <TemplateCardContent>
              <PerformanceChart 
                title=""
                data={performanceData}
                periodType={periodType}
              />
            </TemplateCardContent>
          </TemplateCard>
          
          {/* Efficiency Score */}
          <EfficiencyScore 
            factors={efficiencyFactors}
            change={efficiencyChange}
            lastUpdated={lastUpdated}
          />
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity */}
          <TemplateCard>
            <TemplateCardHeader>
              <div className="flex items-center justify-between">
                <TemplateCardTitle>Recent Activity</TemplateCardTitle>
                <Button 
                  variant="link"
                  className="h-auto p-0 text-xs text-primary-light"
                  onClick={() => trackEvent(AnalyticsEvents.MENU_CLICK, { item: 'view_all_activity' })}
                >
                  View All
                </Button>
              </div>
            </TemplateCardHeader>
            
            <TemplateCardContent>
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
            </TemplateCardContent>
          </TemplateCard>
          
          {/* Order States */}
          <TemplateCard>
            <TemplateCardHeader>
              <TemplateCardTitle>Order States</TemplateCardTitle>
            </TemplateCardHeader>
            
            <TemplateCardContent>
              <div className="space-y-2">
                {[
                  { name: 'Awaiting Confirmation', count: 2, percentage: 25 },
                  { name: 'Processing', count: 1, percentage: 40 },
                  { name: 'Picking', count: 3, percentage: 80 },
                  { name: 'Packing', count: 1, percentage: 15 },
                  { name: 'Ready to Ship', count: 2, percentage: 65 },
                ].map((state, index) => (
                  <div key={index} className="flex items-center py-1">
                    <span className="text-sm text-text-secondary w-32">{state.name}</span>
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
            </TemplateCardContent>
          </TemplateCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
