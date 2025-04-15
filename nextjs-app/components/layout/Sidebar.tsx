import React, { useState } from 'react';
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
  BellAlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

// Navigation items for the sidebar with nested structure
const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon 
  },
  { 
    name: 'Inventory', 
    href: '/inventory', 
    icon: CubeIcon,
    children: [
      { name: 'Overview', href: '/inventory' },
      { name: 'Predictive', href: '/inventory/predictive', icon: ArrowTrendingUpIcon },
      { name: 'Locations', href: '/inventory/locations', icon: MapIcon },
      { name: 'Alerts', href: '/inventory/alerts', icon: BellAlertIcon },
    ]
  },
  { name: 'AR Picking Assistant', href: '/picking-assistant', icon: MapIcon },
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentCheckIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentCheckIcon },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: ChartPieIcon,
    children: [
      { name: 'Financial', href: '/reports/financial', icon: BanknotesIcon },
      { name: 'Performance', href: '/reports/performance', icon: ArrowTrendingUpIcon },
    ]
  },
  { name: 'Clients', href: '/clients', icon: UserGroupIcon },
];

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Check if a navigation item is active
  const isActive = (href: string) => {
    return router.asPath === href || router.asPath.startsWith(`${href}/`);
  };

  // Toggle expanded state for an item
  const toggleExpandItem = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Check if a parent item should show as active (if it or any child is active)
  const isParentActive = (item: { name: string; href: string; children?: any[] }) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  return (
    <div className={cn(
      "template-sidebar flex flex-col h-full",
      collapsed && "template-sidebar-collapsed"
    )}>
      {/* Sidebar Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-[--template-card-border-color]">
        {!collapsed && (
          <div className="text-[--template-primary] flex items-center">
            <ArrowPathIcon className="h-6 w-6 mr-2" />
            <span className="text-lg font-bold">Zephyr</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-md hover:bg-[--template-gray-100]",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        </button>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {!collapsed && (
          <p className="px-3 text-xs font-semibold text-[--template-gray-500] tracking-wider uppercase mb-2">
            NAVIGATION
          </p>
        )}
        
        <ul className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const active = isParentActive(item);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems[item.name];
            
            return (
              <li key={item.name}>
                <div
                  className={cn(
                    "template-nav-item flex items-center px-3 py-2 text-sm rounded-md w-full cursor-pointer",
                    active ? "template-nav-item-active bg-[--template-primary] text-white" : 
                      "hover:bg-[--template-gray-100] text-[--template-gray-700]",
                    collapsed ? "justify-center" : "justify-between"
                  )}
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpandItem(item.name);
                    } else {
                      router.push(item.href);
                    }
                  }}
                >
                  <div className="flex items-center">
                    {item.icon && (
                      <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                    )}
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                  
                  {!collapsed && hasChildren && (
                    <div className="transform transition-transform duration-200 ease-in-out">
                      {isExpanded ? 
                        <ChevronLeftIcon className="h-4 w-4 rotate-90" /> : 
                        <ChevronRightIcon className="h-4 w-4" />
                      }
                    </div>
                  )}
                </div>
                
                {/* Dropdown for nested items */}
                {!collapsed && hasChildren && isExpanded && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.children.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <li key={child.name}>
                          <Link 
                            href={child.href}
                            className={cn(
                              "template-nav-item flex items-center px-3 py-2 text-sm rounded-md",
                              childActive ? "template-nav-item-active bg-[--template-primary] text-white" : 
                                "hover:bg-[--template-gray-100] text-[--template-gray-700]"
                            )}
                          >
                            {child.icon && (
                              <child.icon className="h-4 w-4 mr-3" />
                            )}
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Sidebar Footer */}
      <div className="mt-auto p-4 border-t border-[--template-card-border-color]">
        {!collapsed ? (
          <div className="rounded-md p-2 bg-[--template-gray-50] flex items-center">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[--template-success] animate-pulse"></div>
              <p className="text-sm">System Status</p>
            </div>
            <p className="ml-auto text-sm text-[--template-gray-500]">Operational</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-[--template-success] animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
