import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusCard from '../components/dashboard/StatusCard';
import EfficiencyScore from '../components/dashboard/EfficiencyScore';
import { 
  DocumentTextIcon, 
  TruckIcon, 
  ExclamationTriangleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  return (
    <DashboardLayout title="Command Center">
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
            score={95.7} 
            change={4.2} 
            lastUpdated="2 minutes ago" 
          />
        </div>
        
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <button className="text-xs text-primary-light">View All</button>
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
