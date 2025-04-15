import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function About() {
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
          
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">About Zephyr</h1>
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-text-secondary mb-4">
                At Zephyr, we're on a mission to revolutionize warehouse management with intelligent, intuitive technology that makes complex operations simple. We believe that every warehouse, regardless of size, deserves cutting-edge tools that were once only available to industry giants.
              </p>
              <p className="text-text-secondary">
                Our goal is to help businesses optimize their warehouse operations, reduce costs, and improve efficiency through data-driven insights and automation.
              </p>
            </section>
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <p className="text-text-secondary mb-4">
                Zephyr was founded in 2022 by a team of logistics experts and software engineers who saw firsthand the challenges of warehouse management. After years of working with clunky, outdated systems, we decided to build something better.
              </p>
              <p className="text-text-secondary mb-4">
                What started as a simple inventory tracking tool has evolved into a comprehensive warehouse management system that's helping businesses around the world transform their operations.
              </p>
              <p className="text-text-secondary">
                Today, Zephyr is trusted by growing businesses across multiple industries, from e-commerce and retail to manufacturing and distribution.
              </p>
            </section>
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-2">Innovation</h3>
                  <p className="text-text-secondary text-sm">
                    We're constantly pushing the boundaries of what's possible in warehouse management technology.
                  </p>
                </div>
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-2">Simplicity</h3>
                  <p className="text-text-secondary text-sm">
                    Complex operations shouldn't require complex tools. We make sophisticated technology easy to use.
                  </p>
                </div>
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-2">Data-Driven</h3>
                  <p className="text-text-secondary text-sm">
                    We believe that informed decisions lead to better outcomes. That's why we put data at the center of everything we do.
                  </p>
                </div>
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-2">Customer Success</h3>
                  <p className="text-text-secondary text-sm">
                    Your success is our success. We're committed to helping our customers achieve their goals.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mb-4">Our Team</h2>
              <p className="text-text-secondary mb-8">
                Zephyr is built by a diverse team of experts in logistics, software engineering, UX design, and data science. We're united by our passion for solving complex problems and creating technology that makes a difference.
              </p>
              
              <div className="text-center">
                <Link 
                  href="/careers" 
                  className="btn-outline"
                >
                  Join Our Team
                </Link>
              </div>
            </section>
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
