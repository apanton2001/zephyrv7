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
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { TemplateCard, TemplateCardHeader, TemplateCardContent, TemplateCardTitle, TemplateCardFooter } from '../components/ui/template-card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

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
    <DashboardLayout 
      title="Command Center"
      pageTitle="Warehouse Performance Dashboard"
      pageDescription="Real-time metrics and analytics for warehouse operations"
      pageActions={
        <Button 
          className="flex items-center gap-1.5 text-white bg-[--template-primary] hover:bg-[--template-primary-hover]"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      }
    >
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
          <TemplateCard variant="dashboard">
            <TemplateCardHeader>
              <div className="flex items-center justify-between">
                <TemplateCardTitle>Recent Activity</TemplateCardTitle>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[--template-primary]"
                  onClick={() => trackEvent(AnalyticsEvents.MENU_CLICK, { item: 'view_all_activity' })}
                >
                  View All
                </Button>
              </div>
            </TemplateCardHeader>
            
            <TemplateCardContent>
              <div className="space-y-3">
                {[
                  { action: 'Order #ORD-2876 Shipped', time: '10 minutes ago' },
                  { action: 'New inventory received', time: '25 minutes ago' },
                  { action: 'Low stock alert for SKU-3429', time: '1 hour ago' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 py-2 border-b border-[--template-card-border-color] last:border-0">
                    <div className="p-2 rounded-full bg-[--template-gray-100] text-[--template-primary]">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[--template-gray-900]">{activity.action}</p>
                      <p className="text-xs text-[--template-gray-500]">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TemplateCardContent>
            
            <TemplateCardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[--template-primary] border-[--template-primary] border-dashed"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Manual Entry
              </Button>
            </TemplateCardFooter>
          </TemplateCard>
          
          {/* Order States */}
          <TemplateCard variant="dashboard">
            <TemplateCardHeader>
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-[--template-primary]" />
                <TemplateCardTitle>Order States</TemplateCardTitle>
              </div>
            </TemplateCardHeader>
            
            <TemplateCardContent>
              <div className="space-y-3">
                {[
                  { name: 'Awaiting Confirmation', count: 2, percentage: 25, color: 'bg-[--template-info]' },
                  { name: 'Processing', count: 1, percentage: 40, color: 'bg-[--template-primary]' },
                  { name: 'Picking', count: 3, percentage: 80, color: 'bg-[--template-success]' },
                  { name: 'Packing', count: 1, percentage: 15, color: 'bg-[--template-warning]' },
                  { name: 'Ready to Ship', count: 2, percentage: 65, color: 'bg-[--template-accent]' },
                ].map((state, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[--template-gray-700]">{state.name}</span>
                      <span className="text-sm font-medium text-[--template-gray-900]">{state.count}</span>
                    </div>
                    <div className="w-full bg-[--template-gray-100] h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-2 rounded-full", state.color)} 
                        style={{ width: `${state.percentage}%` }}
                      />
                    </div>
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
