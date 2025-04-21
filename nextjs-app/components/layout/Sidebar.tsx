import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Squares2X2Icon,
  CubeIcon,
  ChartBarIcon,
  MapPinIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// Navigation items for the sidebar
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon },
  { name: 'Predictive Inventory', href: '/inventory/predictive', icon: ArrowTrendingUpIcon },
  { name: 'AR Picking Assistant', href: '/picking-assistant', icon: MapPinIcon },
  { name: 'Client Order Tracker', href: '/orders', icon: ClipboardDocumentCheckIcon },
  { name: 'Product Locations', href: '/inventory/locations', icon: MapPinIcon },
  { name: 'Low Stock Alerts', href: '/inventory/alerts', icon: ExclamationTriangleIcon },
  { name: 'Employee Tasks', href: '/tasks', icon: UserIcon },
  { name: 'Financial Reports', href: '/reports/financial', icon: ChartBarIcon },
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
          <svg className="h-7 w-7 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
        <div className="mt-2 text-xs text-center text-text-secondary">
          Last Update <span className="font-medium">2 min ago</span>
        </div>
      </div>
    </div>
  );
}
