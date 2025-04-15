import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CogIcon,
  TruckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Shipping', href: '/shipping', icon: TruckIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div 
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-dark-700 text-white transition-all duration-300 ease-in-out flex flex-col h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-dark-600">
        {collapsed ? (
          <span className="text-2xl font-bold">Z</span>
        ) : (
          <span className="text-xl font-bold">Zephyr WMS</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = router.pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`
                    flex items-center px-2 py-2 rounded-md text-sm font-medium
                    ${isActive 
                      ? 'bg-primary-700 text-white' 
                      : 'text-gray-300 hover:bg-dark-600 hover:text-white'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <item.icon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} aria-hidden="true" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-dark-600">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-md text-gray-300 hover:bg-dark-600 hover:text-white"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;