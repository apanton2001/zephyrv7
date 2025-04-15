import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();
  
  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);
  
  const features = [
    "Real-time warehouse performance monitoring",
    "Predictive inventory analysis and restock alerts",
    "7-stage order processing pipeline",
    "AR-assisted picking for error reduction",
    "Customizable dashboard with dark-mode optimization",
    "Location tracking for every SKU (aisle, bin, shelf)",
  ];
  
  const logoBrands = [
    "Acme Logistics",
    "Global Warehouse Inc.",
    "QuickShip",
    "MegaStore Distribution",
    "FulfillNow",
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-primary-light text-2xl font-bold">Zephyr</div>
            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
              Beta
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-6 text-text-secondary">
            <Link href="#features" className="hover:text-primary-light">Features</Link>
            <Link href="#pricing" className="hover:text-primary-light">Pricing</Link>
            <Link href="#about" className="hover:text-primary-light">About</Link>
            <Link href="/docs" className="hover:text-primary-light">Documentation</Link>
          </nav>
          
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
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Intelligent Warehouse Management
            </h1>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-10">
              Revolutionize your warehouse operations with real-time analytics, predictive insights, and streamlined workflows.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                href="/auth?signup=true"
                className="btn-primary px-8 py-3 text-base"
              >
                Start Free Trial
              </Link>
              <Link
                href="/demo"
                className="btn-outline px-8 py-3 text-base"
              >
                Watch Demo
              </Link>
            </div>
            
            <div className="relative mt-12 max-w-5xl mx-auto">
              <div className="bg-gradient-to-b from-primary/20 to-transparent absolute inset-0 rounded-lg"></div>
              <div className="relative border border-border rounded-lg overflow-hidden shadow-2xl bg-background-dark">
                <div className="aspect-[16/9] bg-background-dark">
                  {/* This would be a screenshot or video of the app dashboard */}
                  <div className="h-full flex items-center justify-center">
                    <div className="text-text-muted">Dashboard Preview</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 bg-background-light">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Powerful Features</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircleIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <Link
                href="/features"
                className="inline-flex items-center text-primary-light hover:text-primary"
              >
                <span>See all features</span>
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* Logos Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-lg text-text-secondary text-center mb-8">
              Trusted by growing warehouse operations worldwide
            </h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {logoBrands.map((brand, index) => (
                <div key={index} className="text-text-muted">
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-primary-light text-lg font-bold mb-4 md:mb-0">Zephyr</div>
            
            <div className="flex space-x-8 text-sm text-text-secondary">
              <Link href="/privacy" className="hover:text-primary-light">Privacy</Link>
              <Link href="/terms" className="hover:text-primary-light">Terms</Link>
              <Link href="/contact" className="hover:text-primary-light">Contact</Link>
            </div>
            
            <div className="mt-4 md:mt-0 text-sm text-text-muted">
              &copy; {new Date().getFullYear()} Zephyr. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
