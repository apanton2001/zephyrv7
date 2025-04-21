import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');
  
  const sections = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'dashboard', title: 'Dashboard' },
    { id: 'inventory', title: 'Inventory Management' },
    { id: 'orders', title: 'Order Processing' },
    { id: 'locations', title: 'Warehouse Locations' },
    { id: 'users', title: 'User Management' },
    { id: 'api', title: 'API Reference' },
    { id: 'integrations', title: 'Integrations' },
    { id: 'troubleshooting', title: 'Troubleshooting' },
  ];
  
  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Getting Started with Zephyr</h2>
            <p className="text-text-secondary mb-4">
              Welcome to Zephyr Warehouse Management System! This guide will help you set up your
              account and start managing your warehouse operations more efficiently.
            </p>
            
            <h3 className="text-xl font-semibold mt-8 mb-3">Creating Your Account</h3>
            <p className="text-text-secondary mb-4">
              To get started with Zephyr, you'll need to create an account:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary mb-6">
              <li>Go to the <Link href="/auth?signup=true" className="text-primary-light">signup page</Link></li>
              <li>Enter your email address and create a password</li>
              <li>Verify your email address by clicking the link sent to your inbox</li>
              <li>Complete your profile by adding your company information</li>
            </ol>
            
            <h3 className="text-xl font-semibold mt-8 mb-3">Setting Up Your Warehouse</h3>
            <p className="text-text-secondary mb-4">
              Once your account is created, you'll need to set up your warehouse:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary mb-6">
              <li>Navigate to the Settings menu</li>
              <li>Select "Warehouse Setup"</li>
              <li>Enter your warehouse details (name, location, size)</li>
              <li>Define your warehouse zones and locations</li>
              <li>Save your configuration</li>
            </ol>
            
            <h3 className="text-xl font-semibold mt-8 mb-3">Importing Your Inventory</h3>
            <p className="text-text-secondary mb-4">
              After setting up your warehouse, you can import your existing inventory:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary mb-6">
              <li>Go to the Inventory section</li>
              <li>Click "Import Inventory"</li>
              <li>Download the template CSV file</li>
              <li>Fill in your inventory data</li>
              <li>Upload the completed CSV file</li>
              <li>Review and confirm the import</li>
            </ol>
            
            <h3 className="text-xl font-semibold mt-8 mb-3">Next Steps</h3>
            <p className="text-text-secondary mb-4">
              Once you've completed these steps, you're ready to start using Zephyr! Here are some things you might want to do next:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Customize your dashboard widgets</li>
              <li>Set up user accounts for your team members</li>
              <li>Configure your notification preferences</li>
              <li>Connect any third-party integrations</li>
              <li>Explore the advanced features of the system</li>
            </ul>
          </div>
        );
      case 'dashboard':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Dashboard Documentation</h2>
            <p className="text-text-secondary mb-6">
              The Zephyr dashboard provides a real-time overview of your warehouse operations, 
              allowing you to monitor key performance indicators at a glance.
            </p>
            
            <h3 className="text-xl font-semibold mt-8 mb-3">Warehouse Efficiency Score</h3>
            <p className="text-text-secondary mb-4">
              The efficiency score combines multiple factors to give you a comprehensive view of your 
              warehouse performance:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary mb-6">
              <li><strong>Order Fulfillment Rate:</strong> Percentage of orders fulfilled completely and on time</li>
              <li><strong>Inventory Accuracy:</strong> How closely physical inventory matches system records</li>
              <li><strong>Space Utilization:</strong> Effective use of warehouse space</li>
              <li><strong>Labor Productivity:</strong> Efficiency of warehouse staff</li>
            </ul>
            
            <div className="bg-background-light p-4 rounded-md text-text-secondary text-sm mb-6">
              <p className="font-medium mb-1">Pro Tip:</p>
              <p>
                Hover over each efficiency factor to see a detailed description of how it's calculated.
              </p>
            </div>
            
            <h3 className="text-xl font-semibold mt-8 mb-3">Status Cards</h3>
            <p className="text-text-secondary mb-4">
              The status cards at the top of the dashboard provide quick insights into current warehouse activities:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary mb-6">
              <li><strong>Active Orders:</strong> Number of orders currently being processed</li>
              <li><strong>Pending Shipments:</strong> Orders ready to be shipped</li>
              <li><strong>Low Stock Items:</strong> Products that need to be restocked soon</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-8 mb-3">Performance Charts</h3>
            <p className="text-text-secondary">
              The performance charts show historical trends for your warehouse efficiency metrics.
              You can toggle between different time periods (day, week, month, quarter, year) to see
              how your performance has changed over time.
            </p>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              Documentation for this section is currently being developed.
              Check back soon for updates!
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-primary-light text-2xl font-bold">Zephyr</Link>
            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
              Beta
            </span>
          </div>
        </div>
      </header>
      
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-text-secondary hover:text-primary-light">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-8">Documentation</h1>
          
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 md:pr-8 mb-8 md:mb-0">
              <div className="sticky top-4">
                <h3 className="font-semibold text-lg mb-4">Contents</h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`block w-full text-left px-3 py-2 rounded-md ${
                        activeSection === section.id
                          ? 'bg-primary-light/10 text-primary-light'
                          : 'text-text-secondary hover:bg-background-light'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 card p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-text-secondary">
          &copy; {new Date().getFullYear()} Zephyr. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
