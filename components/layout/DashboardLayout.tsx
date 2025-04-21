import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../lib/utils';

type DashboardLayoutProps = {
  children: ReactNode;
  title?: string;
  fullWidth?: boolean;
  showPageTitle?: boolean;
  pageTitle?: string;
  pageDescription?: string;
  breadcrumbs?: {
    label: string;
    href: string;
  }[];
  pageActions?: ReactNode;
};

export default function DashboardLayout({ 
  children, 
  title,
  fullWidth = false,
  showPageTitle = true,
  pageTitle,
  pageDescription,
  breadcrumbs,
  pageActions
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Toggle mobile menu state
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Determine effective page title
  const effectivePageTitle = pageTitle || title;

  return (
    <div className="template-layout-container">
      {/* Header */}
      <Header 
        title={title}
        showMobileMenuButton={true}
        onMobileMenuToggle={toggleMobileMenu}
      />
      
      <div className="template-sidebar-layout">
        {/* Sidebar - fixed on mobile, normal on desktop */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div 
          className={cn(
            "template-content-with-sidebar",
            sidebarCollapsed && "template-content-sidebar-collapsed"
          )}
        >
          {/* Page Header with Title and Breadcrumbs */}
          {showPageTitle && (effectivePageTitle || breadcrumbs) && (
            <div className="mb-6 px-6 pt-6">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex items-center text-sm text-[--template-gray-500] mb-2">
                  {breadcrumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="mx-2">/</span>}
                      <a 
                        href={crumb.href}
                        className="hover:text-[--template-gray-700]"
                      >
                        {crumb.label}
                      </a>
                    </React.Fragment>
                  ))}
                </div>
              )}
              
              {effectivePageTitle && (
                <div className="flex flex-wrap items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[--template-gray-900]">
                      {effectivePageTitle}
                    </h1>
                    {pageDescription && (
                      <p className="mt-1 text-sm text-[--template-gray-500]">
                        {pageDescription}
                      </p>
                    )}
                  </div>
                  
                  {pageActions && (
                    <div className="mt-4 sm:mt-0 flex space-x-3">
                      {pageActions}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Page Content */}
          <div className={cn(
            "px-6 pb-6",
            fullWidth ? "w-full" : "max-w-7xl mx-auto"
          )}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
