import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Features() {
  const featureGroups = [
    {
      title: "Dashboard & Analytics",
      features: [
        "Real-time warehouse KPIs with color-coded indicators",
        "Warehouse efficiency calculations and scoring system",
        "Interactive performance charts with historical data",
        "Customizable dashboard widgets",
        "Mobile-optimized view for on-the-go monitoring",
        "Automated report generation and scheduling",
        "Critical event notifications and alerts",
      ]
    },
    {
      title: "Inventory Management",
      features: [
        "Comprehensive SKU management system",
        "Bulk inventory import/export functionality",
        "Barcode and QR code generation and scanning",
        "Batch and serial number tracking",
        "Inventory segmentation by category, supplier, etc.",
        "Low stock and expiration alerts",
        "Streamlined invoice import with preview and validation",
      ]
    },
    {
      title: "Order Processing",
      features: [
        "7-stage order pipeline with visual tracking",
        "Batch order processing capabilities",
        "Automated picking list generation",
        "Order priority management",
        "Multi-channel order aggregation",
        "Shipping label integration",
        "Customer notification system",
      ]
    },
    {
      title: "Warehouse Mapping",
      features: [
        "Visual warehouse layout designer",
        "Zone and aisle management",
        "Heat maps for product velocity",
        "Optimal storage location suggestions",
        "Pick path optimization",
        "Mobile location lookup",
        "Space utilization analysis",
      ]
    },
    {
      title: "Predictive Analytics",
      features: [
        "AI-driven restock recommendations",
        "Seasonal demand forecasting",
        "Inventory turnover optimization",
        "Labor requirement predictions",
        "Shipping time estimations",
        "Performance trend analysis",
        "Anomaly detection for inventory discrepancies",
      ]
    },
    {
      title: "Integrations & API",
      features: [
        "RESTful API for custom integrations",
        "E-commerce platform connectors (Shopify, WooCommerce, etc.)",
        "Shipping provider integrations (UPS, FedEx, DHL, etc.)",
        "Accounting software synchronization",
        "ERP system compatibility",
        "Supplier portal connections",
        "Custom webhook support",
      ]
    },
  ];

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
          
          <div className="space-x-3">
            <Link 
              href="/auth" 
              className="btn-outline text-xs md:text-sm"
            >
              Sign In
            </Link>
            <Link 
              href="/auth?signup=true" 
              className="btn-primary text-xs md:text-sm"
            >
              Get Started
            </Link>
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
          
          <h1 className="text-4xl font-bold mb-4">Feature Overview</h1>
          <p className="text-text-secondary max-w-3xl mb-12">
            Explore all the powerful features that make Zephyr the most comprehensive warehouse management system for growing businesses.
          </p>
          
          <div className="space-y-16">
            {featureGroups.map((group, groupIndex) => (
              <section key={groupIndex}>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center mr-3">
                    {groupIndex + 1}
                  </span>
                  {group.title}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3 p-4 border border-border rounded-md">
                      <div className="flex-shrink-0 mt-0.5">
                        <CheckCircleIcon className="h-5 w-5 text-primary" />
                      </div>
                      <p>{feature}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          
          <div className="mt-16 py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to optimize your warehouse operations?</h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses that have transformed their warehouse efficiency with Zephyr.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth?signup=true"
                className="btn-primary px-8 py-3 text-base"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="btn-outline px-8 py-3 text-base"
              >
                View Pricing
              </Link>
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
