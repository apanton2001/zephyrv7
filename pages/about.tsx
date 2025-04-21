import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, BuildingOffice2Icon, UserGroupIcon, LightBulbIcon, ChartBarIcon } from '@heroicons/react/24/outline';

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
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-indigo-100 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center text-text-secondary hover:text-primary-light">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
            
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-center text-primary-light">About Zephyr</h1>
              <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                Transforming warehouse management with innovative solutions that drive efficiency and growth.
              </p>
              <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <BuildingOffice2Icon className="h-6 w-6 text-primary-light" />
                  </div>
                  <p className="font-medium">Founded 2022</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <UserGroupIcon className="h-6 w-6 text-primary-light" />
                  </div>
                  <p className="font-medium">Global Team</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <ChartBarIcon className="h-6 w-6 text-primary-light" />
                  </div>
                  <p className="font-medium">Data-Driven</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            
            <section className="mb-16">
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="md:w-1/2 md:pr-8 mb-6 md:mb-0">
                  <h2 className="text-3xl font-bold mb-4 text-primary-light">Our Mission</h2>
                  <p className="text-text-secondary mb-4">
                    At Zephyr, we're on a mission to revolutionize warehouse management with intelligent, intuitive technology that makes complex operations simple. We believe that every warehouse, regardless of size, deserves cutting-edge tools that were once only available to industry giants.
                  </p>
                  <p className="text-text-secondary">
                    Our goal is to help businesses optimize their warehouse operations, reduce costs, and improve efficiency through data-driven insights and automation.
                  </p>
                </div>
                <div className="md:w-1/2 bg-gray-100 rounded-lg p-6 flex items-center justify-center">
                  <div className="relative w-full aspect-video bg-gradient-to-br from-primary/20 to-indigo-100 rounded-md shadow-inner overflow-hidden flex items-center justify-center">
                    <div className="text-primary font-bold text-4xl flex items-center">
                      <LightBulbIcon className="h-12 w-12 mr-2 text-primary-light" />
                      <span>VISION</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-5 mt-8">
                <div className="bg-background-light p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-lg mb-2">Efficiency</h3>
                  <div className="h-1 w-16 bg-primary-light mb-4"></div>
                  <p className="text-text-secondary">Streamline operations to maximize productivity and minimize waste.</p>
                </div>
                <div className="bg-background-light p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-lg mb-2">Visibility</h3>
                  <div className="h-1 w-16 bg-primary-light mb-4"></div>
                  <p className="text-text-secondary">Gain real-time insights into every aspect of your warehouse.</p>
                </div>
                <div className="bg-background-light p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-lg mb-2">Adaptability</h3>
                  <div className="h-1 w-16 bg-primary-light mb-4"></div>
                  <p className="text-text-secondary">Scale and evolve your systems as your business grows.</p>
                </div>
              </div>
            </section>
            
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-primary-light">Our Story</h2>
              
              <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary-light before:to-transparent">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary-light text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">2022</div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4 md:p-6">
                    <h3 className="font-bold text-xl mb-2">The Beginning</h3>
                    <p className="text-text-secondary mb-4">
                      Zephyr was founded by a team of logistics experts and software engineers who saw firsthand the challenges of warehouse management. After years of working with clunky, outdated systems, we decided to build something better.
                    </p>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary-light text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">2023</div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4 md:p-6">
                    <h3 className="font-bold text-xl mb-2">Growth & Evolution</h3>
                    <p className="text-text-secondary mb-4">
                      What started as a simple inventory tracking tool evolved into a comprehensive warehouse management system that's helping businesses transform their operations.
                    </p>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary-light text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">Now</div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4 md:p-6">
                    <h3 className="font-bold text-xl mb-2">Industry Impact</h3>
                    <p className="text-text-secondary mb-4">
                      Today, Zephyr is trusted by growing businesses across multiple industries, from e-commerce and retail to manufacturing and distribution.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-background-light p-6 rounded-lg">
                <div>
                  <div className="text-3xl font-bold text-primary-light">50+</div>
                  <div className="text-text-secondary text-sm">Businesses</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-light">12</div>
                  <div className="text-text-secondary text-sm">Countries</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-light">30%</div>
                  <div className="text-text-secondary text-sm">Avg. Efficiency Gain</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-light">24/7</div>
                  <div className="text-text-secondary text-sm">Support</div>
                </div>
              </div>
            </section>
            
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-primary-light">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6 border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold">Innovation</h3>
                  </div>
                  <p className="text-text-secondary">
                    We're constantly pushing the boundaries of what's possible in warehouse management technology.
                  </p>
                </div>
                <div className="card p-6 border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold">Simplicity</h3>
                  </div>
                  <p className="text-text-secondary">
                    Complex operations shouldn't require complex tools. We make sophisticated technology easy to use.
                  </p>
                </div>
                <div className="card p-6 border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold">Data-Driven</h3>
                  </div>
                  <p className="text-text-secondary">
                    We believe that informed decisions lead to better outcomes. That's why we put data at the center of everything we do.
                  </p>
                </div>
                <div className="card p-6 border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold">Customer Success</h3>
                  </div>
                  <p className="text-text-secondary">
                    Your success is our success. We're committed to helping our customers achieve their goals.
                  </p>
                </div>
              </div>
            </section>
            
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-primary-light">Our Team</h2>
              <p className="text-text-secondary mb-8">
                Zephyr is built by a diverse team of experts in logistics, software engineering, UX design, and data science. We're united by our passion for solving complex problems and creating technology that makes a difference.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-indigo-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary-light">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Alex Chen</h3>
                  <p className="text-text-secondary text-sm">Co-Founder & CEO</p>
                  <p className="text-text-secondary text-sm mt-2">Logistics expert with 15+ years experience</p>
                </div>
                
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-indigo-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary-light">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Sarah Johnson</h3>
                  <p className="text-text-secondary text-sm">Co-Founder & CTO</p>
                  <p className="text-text-secondary text-sm mt-2">Full-stack developer and systems architect</p>
                </div>
                
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-indigo-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary-light">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Michael Rodriguez</h3>
                  <p className="text-text-secondary text-sm">Head of Product</p>
                  <p className="text-text-secondary text-sm mt-2">UX specialist with warehouse expertise</p>
                </div>
              </div>
              
              <div className="bg-background-light p-8 rounded-lg text-center">
                <h3 className="text-xl font-bold mb-4">Join Our Growing Team</h3>
                <p className="text-text-secondary mb-6 max-w-lg mx-auto">
                  We're always looking for talented individuals who are passionate about creating innovative solutions for complex problems.
                </p>
                <Link 
                  href="/careers" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-light border border-primary-light hover:bg-primary-light hover:text-white h-10 px-4 py-2"
                >
                  View Open Positions
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
