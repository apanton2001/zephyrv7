import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTheme } from 'next-themes';

export default function UIComponents() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-primary-light text-2xl font-bold">Zephyr</Link>
            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
              UI Components
            </span>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
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
          
          <h1 className="text-4xl font-bold mb-12">Shadcn UI Components</h1>
          
          {/* Button Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Buttons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Default</h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Outline & Ghost</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Sizes</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Card Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Analytics</CardTitle>
                  <CardDescription>View your warehouse performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Your warehouse efficiency score is 87%</p>
                </CardContent>
                <CardFooter>
                  <Button>View Details</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>Current inventory levels and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>12 items require restocking</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">View Inventory</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Order Processing</CardTitle>
                  <CardDescription>Manage and track customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>8 orders pending fulfillment</p>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary">Process Orders</Button>
                </CardFooter>
              </Card>
            </div>
          </section>
          
          {/* Form Elements Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Form Elements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input Fields</CardTitle>
                  <CardDescription>Basic form input elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="default-input" className="block text-sm font-medium mb-2">
                      Default Input
                    </label>
                    <Input id="default-input" placeholder="Enter some text" />
                  </div>
                  
                  <div>
                    <label htmlFor="disabled-input" className="block text-sm font-medium mb-2">
                      Disabled Input
                    </label>
                    <Input id="disabled-input" placeholder="Disabled input" disabled />
                  </div>
                  
                  <div>
                    <label htmlFor="with-icon" className="block text-sm font-medium mb-2">
                      With Label
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input id="with-icon" placeholder="0.00" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Select Field</CardTitle>
                  <CardDescription>Dropdown select component</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="select-warehouse" className="block text-sm font-medium mb-2">
                      Warehouse Location
                    </label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>North America</SelectLabel>
                          <SelectItem value="nyc">New York</SelectItem>
                          <SelectItem value="lax">Los Angeles</SelectItem>
                          <SelectItem value="chi">Chicago</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Europe</SelectLabel>
                          <SelectItem value="ldn">London</SelectItem>
                          <SelectItem value="par">Paris</SelectItem>
                          <SelectItem value="ber">Berlin</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="select-status" className="block text-sm font-medium mb-2">
                      Order Status
                    </label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
          
          {/* Form Demo */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Sample Form</h2>
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>Enter the details for a new inventory item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product-name" className="block text-sm font-medium mb-2">
                      Product Name
                    </label>
                    <Input id="product-name" placeholder="Enter product name" />
                  </div>
                  
                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium mb-2">
                      SKU
                    </label>
                    <Input id="sku" placeholder="e.g. WH-1234-ABC" />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Input id="description" placeholder="Product description" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                      Quantity
                    </label>
                    <Input id="quantity" type="number" placeholder="0" min="0" />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium mb-2">
                      Price ($)
                    </label>
                    <Input id="price" type="number" placeholder="0.00" min="0" step="0.01" />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2">
                      Category
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Product</Button>
              </CardFooter>
            </Card>
          </section>
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
