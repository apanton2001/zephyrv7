import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Pricing() {
  const pricingTiers = [
    {
      name: 'Starter',
      price: '$49',
      features: [
        'Up to 3 warehouses',
        '2,000 SKUs',
        '5 user accounts',
        'Basic reporting',
        'Email support',
      ],
      popular: false,
      buttonText: 'Get Started',
    },
    {
      name: 'Professional',
      price: '$129',
      features: [
        'Up to 10 warehouses',
        'Unlimited SKUs',
        '25 user accounts',
        'Advanced analytics',
        'Priority support',
        'API access',
        'Custom integrations'
      ],
      popular: true,
      buttonText: 'Try Professional',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: [
        'Unlimited warehouses',
        'Unlimited SKUs',
        'Unlimited user accounts',
        'Custom analytics',
        'Dedicated support',
        'SLA guarantee',
        'Custom development',
        'On-premise options'
      ],
      popular: false,
      buttonText: 'Contact Sales',
    }
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
          
          <h1 className="text-4xl font-bold text-center mb-4">Pricing Plans</h1>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-12">
            Choose the perfect plan for your warehouse management needs. All plans include a 14-day free trial.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`card p-6 border ${tier.popular ? 'border-primary' : 'border-border'} relative`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 mt-4 mr-4">
                    <span className="bg-primary text-white text-xs py-1 px-2 rounded">Popular</span>
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-text-secondary">/month</span>}
                </div>
                
                <ul className="space-y-2 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-2 rounded-md font-medium ${tier.popular 
                  ? 'bg-primary text-white' 
                  : 'bg-background-light text-text-primary hover:bg-background-light/80'}`}
                >
                  {tier.buttonText}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
            <p className="text-text-secondary mb-6">
              Contact our sales team for custom pricing and tailored solutions for your specific needs.
            </p>
            <Link 
              href="/contact" 
              className="btn-outline"
            >
              Contact Sales
            </Link>
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
