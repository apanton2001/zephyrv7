import React from 'react';
import { ArrowTrendingUpIcon, ClockIcon, DocumentTextIcon, TruckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// A simple component to show a static preview of the dashboard for the landing page
export default function DashboardPreview() {
  const efficiencyFactors = {
    orderFulfillment: 97.2,
    inventoryAccuracy: 94.5,
    spaceUtilization: 88.3,
    laborProductivity: 92.1
  };

  // Calculate average efficiency
  const calculateEfficiency = () => {
    const values = Object.values(efficiencyFactors);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const efficiency = calculateEfficiency();

  return (
    <div className="h-full flex flex-col p-4 text-left overflow-hidden">
      {/* Preview Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Warehouse Performance Dashboard</h2>
        <div className="text-xs border border-primary/20 rounded px-2 py-1 bg-primary/5 text-primary-light">
          Demo View
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Active Orders */}
        <div className="card flex flex-col overflow-hidden border-border bg-background-card">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-primary/10 text-primary-light">
              <DocumentTextIcon className="h-4 w-4" />
            </div>
            <div className="flex items-center text-xs text-status-success">
              <span>↗ +2.1%</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-text-secondary text-xs">Active Orders</p>
            <p className="text-lg font-bold mt-0.5">4</p>
          </div>
        </div>
        
        {/* Pending Shipments */}
        <div className="card flex flex-col overflow-hidden border-border bg-background-card">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-primary/10 text-primary-light">
              <TruckIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-text-secondary text-xs">Pending Shipments</p>
            <p className="text-lg font-bold mt-0.5">1</p>
          </div>
        </div>
        
        {/* Low Stock Items */}
        <div className="card flex flex-col overflow-hidden border-status-warning/20 bg-status-warning/5">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-status-warning/10 text-status-warning">
              <ExclamationTriangleIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-text-secondary text-xs">Low Stock Items</p>
            <p className="text-lg font-bold mt-0.5">8</p>
          </div>
        </div>
      </div>
      
      {/* Efficiency Score */}
      <div className="card mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-primary-light mr-1" />
            <h3 className="font-semibold text-sm">Warehouse Efficiency</h3>
          </div>
          <div className="text-xs font-medium text-status-success">↗ +4.2%</div>
        </div>
        
        <div className="flex items-baseline mb-1">
          <div>
            <span className="text-2xl font-bold">{efficiency.toFixed(1)}%</span>
            <span className="ml-1 text-xs font-medium">Excellent</span>
          </div>
          <span className="ml-auto text-xs text-text-secondary">Demo Data</span>
        </div>
        
        <div className="w-full h-1.5 bg-background-light rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-status-success" 
            style={{ width: `${efficiency}%` }}
          />
        </div>
        
        <div className="mt-3 grid grid-cols-4 gap-2">
          <div className="text-center">
            <span className="block text-[10px] text-text-secondary">Order Rate</span>
            <span className="text-xs font-medium">{efficiencyFactors.orderFulfillment}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] text-text-secondary">Inventory</span>
            <span className="text-xs font-medium">{efficiencyFactors.inventoryAccuracy}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] text-text-secondary">Space</span>
            <span className="text-xs font-medium">{efficiencyFactors.spaceUtilization}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] text-text-secondary">Productivity</span>
            <span className="text-xs font-medium">{efficiencyFactors.laborProductivity}%</span>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="card flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Recent Activity</h3>
          <span className="text-xs text-primary-light">
            View All
          </span>
        </div>
        
        <div className="space-y-2">
          {[
            { title: "Order #ORD-2876 Shipped", time: "10 minutes ago" },
            { title: "Inventory Audit Completed", time: "1 hour ago" },
            { title: "Low Stock Alert - SKU-9823", time: "2 hours ago" }
          ].map((activity, index) => (
            <div key={index} className="flex items-start space-x-2 py-1 border-b border-border last:border-0">
              <div className="bg-background-light p-1.5 rounded-full">
                <ClockIcon className="h-3 w-3 text-text-secondary" />
              </div>
              <div>
                <p className="text-xs font-medium">{activity.title}</p>
                <p className="text-[10px] text-text-secondary">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background-card to-transparent"></div>
      </div>
    </div>
  );
}
