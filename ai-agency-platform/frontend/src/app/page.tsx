'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const [activeDemo, setActiveDemo] = useState('vscode');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Build Intelligent <br />
                <span className="text-yellow-300">AI-Powered</span> Solutions
              </h1>
              <p className="text-xl mb-8">
                Automate your development workflow, create scalable web scraping systems, 
                and deploy intelligent solutions with our AI agency platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/templates" className="btn-primary">
                  Explore Templates
                </Link>
                <Link href="/demo" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-2 px-4 rounded">
                  Live Demo
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="ide-container bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                <div className="bg-gray-800 text-white p-2 flex items-center">
                  <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm">
                    script.py - AI Agency Platform
                  </div>
                </div>
                <div className="p-4 font-mono text-sm text-green-400">
                  <div># AI-powered scraping template</div>
                  <div>from scrapy import Spider</div>
                  <div>from selenium import webdriver</div>
                  <div>from bs4 import BeautifulSoup</div>
                  <div>&nbsp;</div>
                  <div>class AIAgencySpider(Spider):</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;name = 'ai_agency'</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;start_urls = ['https://example.com']</div>
                  <div>&nbsp;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;def parse(self, response):</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;soup = BeautifulSoup(response.text, 'html.parser')</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# AI-powered data extraction</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;data = self.extract_structured_data(soup)</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;yield data</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="section bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powered by Modern Tech Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: 'React', icon: '/images/react.svg', description: 'Frontend UI library' },
              { name: 'Node.js', icon: '/images/nodejs.svg', description: 'Backend runtime' },
              { name: 'Python', icon: '/images/python.svg', description: 'Scraping & automation' },
              { name: 'Selenium', icon: '/images/selenium.svg', description: 'Browser automation' },
              { name: 'MongoDB', icon: '/images/mongodb.svg', description: 'Database storage' }
            ].map((tech) => (
              <div key={tech.name} className="tech-card group">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    {/* Placeholder for image - we'll add real icons later */}
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold">
                      {tech.name[0]}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{tech.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tech.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Marketplace Section */}
      <section className="section">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Template Marketplace
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'E-commerce Scraper', 
                description: 'Extract product data from major e-commerce platforms',
                icon: '🛒',
                category: 'Scraping'
              },
              { 
                title: 'Social Media Monitor', 
                description: 'Track mentions and sentiment across social platforms',
                icon: '📱',
                category: 'Monitoring'
              },
              { 
                title: 'Market Research Tool', 
                description: 'Gather competitive intelligence and market trends',
                icon: '📊',
                category: 'Research'
              },
              { 
                title: 'Competitor Analysis', 
                description: 'Track competitors and analyze their strategies',
                icon: '🔍',
                category: 'Analysis'
              },
              { 
                title: 'Price Tracker', 
                description: 'Monitor price changes across multiple sources',
                icon: '💰',
                category: 'Tracking'
              },
              { 
                title: 'Content Generator', 
                description: 'Automate content creation and distribution',
                icon: '✍️',
                category: 'Automation'
              }
            ].map((template, idx) => (
              <div key={idx} className="template-card">
                <div className="text-4xl mb-4">{template.icon}</div>
                <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {template.category}
                </div>
                <h3 className="text-xl font-bold mb-2">{template.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>
                <Link href={`/templates/${template.title.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Explore Template →
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/templates" className="btn-primary">
              View All Templates
            </Link>
          </div>
        </div>
      </section>

      {/* Client Dashboard Preview */}
      <section className="section bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful Client Dashboard
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <div className="font-medium">AI Agency Dashboard</div>
                <div className="ml-auto flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-blue-600 dark:text-blue-400 text-lg font-bold mb-2">15</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Projects</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-green-600 dark:text-green-400 text-lg font-bold mb-2">98.2%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-purple-600 dark:text-purple-400 text-lg font-bold mb-2">1.2M</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Data Points Collected</div>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 h-64 rounded-lg mb-6 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  [Dashboard Analytics Graph]
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium mb-4">Recent Tasks</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>E-commerce Data Extraction</div>
                      <div className="text-green-600 dark:text-green-400">Completed</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>Competitive Analysis</div>
                      <div className="text-blue-600 dark:text-blue-400">In Progress</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>Social Media Monitoring</div>
                      <div className="text-blue-600 dark:text-blue-400">In Progress</div>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium mb-4">Resource Usage</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm">CPU</div>
                        <div className="text-sm">42%</div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm">Memory</div>
                        <div className="text-sm">68%</div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm">Storage</div>
                        <div className="text-sm">23%</div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="section">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Success Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '3x', label: 'Faster Development' },
              { value: '70%', label: 'Cost Reduction' },
              { value: '24/7', label: 'Monitoring' }
            ].map((metric, idx) => (
              <div key={idx} className="card">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {metric.value}
                </div>
                <div className="text-xl text-gray-600 dark:text-gray-400">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Join thousands of businesses using our AI agency platform to automate their development, 
            scraping, and deployment workflows.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg">
              Get Started
            </Link>
            <Link href="/contact" className="bg-transparent hover:bg-blue-700 border-2 border-white font-bold py-3 px-8 rounded-lg">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
