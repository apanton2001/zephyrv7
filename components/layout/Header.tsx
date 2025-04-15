import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  Cog6ToothIcon, 
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

type HeaderProps = {
  title?: string;
  onMobileMenuToggle?: () => void;
  showMobileMenuButton?: boolean;
};

export default function Header({ 
  title, 
  onMobileMenuToggle,
  showMobileMenuButton = false
}: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="template-header w-full">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Left side - Title and tag */}
        <div className="flex items-center">
          {showMobileMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuToggle}
              className="mr-2 md:hidden"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1.5 7C1.22386 7 1 7.22386 1 7.5C1 7.77614 1.22386 8 1.5 8H13.5C13.7761 8 14 7.77614 14 7.5C14 7.22386 13.7761 7 13.5 7H1.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>
          )}
          
          <h1 className="text-xl font-bold text-[--template-gray-900]">{getPageTitle()}</h1>
          <div className="ml-2 bg-[--template-primary]/20 text-[--template-primary] text-xs px-2 py-0.5 rounded">
            Live
          </div>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className={cn(
            "relative hidden md:flex items-center transition-all duration-200",
            searchActive ? "w-72" : "w-56"
          )}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-[--template-gray-500]" />
            </div>
            <input
              type="text"
              placeholder="Search... (Press ⌘K)"
              className="bg-[--template-gray-100] w-full border-0 rounded-md pl-10 pr-12 py-2 text-sm focus:ring-1 focus:ring-[--template-primary] focus:outline-none"
              onFocus={() => setSearchActive(true)}
              onBlur={() => setSearchActive(false)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs text-[--template-gray-500] bg-[--template-gray-200] px-1.5 py-0.5 rounded">⌘K</span>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-[--template-error] ring-2 ring-white dark:ring-[--template-gray-900]" />
          </Button>
          
          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </Button>
          
          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 px-2"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <UserCircleIcon className="h-6 w-6" />
              <span className="hidden md:inline-block text-sm font-medium">Admin</span>
              <ChevronDownIcon className="h-4 w-4 hidden md:block" />
            </Button>
            
            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-[--template-gray-900] border border-[--template-card-border-color] z-10">
                <div className="px-4 py-2 text-sm text-[--template-gray-500] border-b border-[--template-card-border-color]">
                  <p className="font-medium text-[--template-gray-900] dark:text-[--template-gray-100]">Admin User</p>
                  <p>admin@zephyr.com</p>
                </div>
                <a href="#" className="block px-4 py-2 text-sm text-[--template-gray-700] hover:bg-[--template-gray-100] dark:hover:bg-[--template-gray-800]">
                  Profile
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-[--template-gray-700] hover:bg-[--template-gray-100] dark:hover:bg-[--template-gray-800]">
                  Settings
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-[--template-gray-700] hover:bg-[--template-gray-100] dark:hover:bg-[--template-gray-800] border-t border-[--template-card-border-color]">
                  <div className="flex items-center text-[--template-error]">
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sign out
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
