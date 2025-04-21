import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  ArrowTopRightOnSquareIcon,
  UserIcon
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
    <header className="h-16 bg-background-dark border-b border-border px-4 flex items-center justify-between">
      <div className="flex-1 flex">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search... (Press ⌘K for advanced search)"
            className="bg-background/40 border border-border text-sm rounded-lg pl-10 pr-4 py-2 w-full focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-gray-400 bg-background-light/50 px-1.5 py-0.5 rounded">⌘K</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* View Landing Button */}
        <Link 
          href="/landing" 
          className="hidden md:flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>View Landing</span>
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </Link>
        
        {/* Notifications */}
        <button
          type="button"
          className="relative p-1.5 text-text-secondary rounded-md hover:bg-background-light/40"
        >
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 text-xs font-medium rounded-full bg-red-500 text-white">3</span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center gap-2 p-1.5 text-text-primary rounded-full hover:bg-background-light/20"
          >
            <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center text-white">
              <UserIcon className="h-5 w-5" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
