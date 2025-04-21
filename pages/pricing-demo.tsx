import React from 'react';
import { PricingInteraction } from "../components/ui/pricing-interaction";
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PricingInteractionDemo() {
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
          
          <h1 className="text-3xl font-bold mb-8 text-center">Interactive Pricing Component</h1>
          
          <div className="flex flex-col items-center justify-center">
            <PricingInteraction
              starterMonth={9.99}
              starterAnnual={7.49}
              proMonth={19.99}
              proAnnual={17.49}
            />
          </div>
          
          <div className="mt-12 max-w-2xl mx-auto bg-background-light p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">About This Component</h2>
            <p className="text-text-secondary mb-4">
              This interactive pricing component allows users to toggle between monthly and yearly billing cycles, 
              with smooth animations and dynamic price updates. The component is fully responsive and works well on all devices.
            </p>
            <p className="text-text-secondary">
              The interaction design follows best practices for pricing selection, with clear visual feedback and 
              a prominent call-to-action button.
            </p>
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
