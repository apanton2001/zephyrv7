import React from 'react';
import { useRouter } from 'next/router';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  Cog6ToothIcon, 
  UserCircleIcon,
  SunIcon 
} from '@heroicons/react/24/outline';

type HeaderProps = {
  title?: string;
};

export default function Header({ title }: HeaderProps) {
  const router = useRouter();
  
  // Get the current page title based on route or use provided title
  const getPageTitle = () => {
    if (title) return title;
    
    // Get from route
    const path = router.asPath;
    if (path === '/dashboard') return 'Command Center';
    if (path.startsWith('/inventory')) return 'Inventory Management';
    if (path.startsWith('/orders')) return 'Order Processing';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/clients')) return 'Client Database';
    if (path.startsWith('/tasks')) return 'Task Management';
    
    return 'Zephyr Warehouse';
  };

  return (
    <header className="h-16 bg-background border-b border-border px-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">{getPageTitle()}</h1>
        <div className="ml-2 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
          Live
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            placeholder="Search... (Press ⌘K for advanced search)"
            className="input pl-10 pr-4 py-1.5 w-64"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-text-muted bg-border px-1.5 py-0.5 rounded">⌘K</span>
          </div>
        </div>
        
        {/* Notifications */}
        <button
          type="button"
          className="relative p-1.5 text-text-secondary rounded-md hover:bg-background-light"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-status-error ring-2 ring-background" />
        </button>
        
        {/* Settings */}
        <button
          type="button"
          className="p-1.5 text-text-secondary rounded-md hover:bg-background-light"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
        
        {/* View/Toggle Button */}
        <button
          type="button"
          className="hidden md:flex items-center px-3 py-1 text-xs text-text-secondary bg-background-light rounded-md hover:bg-border"
        >
          <span>View Landing</span>
        </button>
        
        {/* User */}
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center space-x-3 p-1.5 text-text-primary rounded-md hover:bg-background-light"
          >
            <UserCircleIcon className="h-6 w-6" />
            <span className="hidden md:inline-block text-sm">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
