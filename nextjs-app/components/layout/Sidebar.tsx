import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  CubeIcon,
  ChartPieIcon,
  ArrowPathIcon,
  MapIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

// Navigation items for the sidebar
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon },
  { name: 'Predictive Inventory', href: '/inventory/predictive', icon: ArrowTrendingUpIcon },
  { name: 'AR Picking Assistant', href: '/picking-assistant', icon: MapIcon },
  { name: 'Client Order Tracker', href: '/orders', icon: ClipboardDocumentCheckIcon },
  { name: 'Product Locations', href: '/inventory/locations', icon: MapIcon },
  { name: 'Low Stock Alerts', href: '/inventory/alerts', icon: BellAlertIcon },
  { name: 'Employee Tasks', href: '/tasks', icon: ClipboardDocumentCheckIcon },
  { name: 'Financial Reports', href: '/reports/financial', icon: BanknotesIcon },
  { name: 'Client Database', href: '/clients', icon: UserGroupIcon },
];

export default function Sidebar() {
  const router = useRouter();
  
  // Check if a navigation item is active
  const isActive = (href: string) => {
    return router.asPath === href || router.asPath.startsWith(`${href}/`);
  };

  return (
    <div className="flex flex-col h-full bg-background-dark border-r border-border">
      <div className="px-4 py-5 flex items-center">
        <div className="text-primary-light flex items-center">
          <ArrowPathIcon className="h-7 w-7 mr-2" />
          <span className="text-xl font-bold">Zephyr</span>
        </div>
      </div>
      
      <div className="mt-2 px-2 space-y-1">
        <p className="px-3 text-xs font-semibold text-text-muted tracking-wider uppercase mb-2">
          NAVIGATION
        </p>
        
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.name}
              href={item.href} 
              className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-auto p-4">
        <div className="rounded-md p-2 bg-background-light flex items-center">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-status-success animate-pulse"></div>
            <p className="text-sm">System Status</p>
          </div>
          <p className="ml-auto text-sm text-text-secondary">Operational</p>
        </div>
      </div>
    </div>
  );
}
