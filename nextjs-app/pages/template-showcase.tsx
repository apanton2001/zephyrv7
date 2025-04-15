import React from "react";
import { NextPage } from "next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  TemplateCard, 
  TemplateCardHeader, 
  TemplateCardContent, 
  TemplateCardFooter, 
  TemplateCardTitle, 
  TemplateCardDescription,
  MetricCard
} from "../components/ui/template-card";

// Icons for demo purposes
const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 13V17M12 9V17M16 5V17M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13M16 3.13C17.7699 3.58317 19.0078 5.17486 19.0078 7.005C19.0078 8.83514 17.7699 10.4268 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MoneyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69752 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00204 12 2.00204C11.6489 2.00204 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69752 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.27002 7L12 12L20.73 7M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TemplateShowcase: NextPage = () => {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Template Integration Showcase</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">1. Side by Side Comparison</h2>
        <p className="text-lg mb-6">Compare Shadcn UI components with Template-enhanced components</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Shadcn UI Card</h3>
            <Card>
              <CardHeader>
                <CardTitle>Shadcn Card Title</CardTitle>
                <CardDescription>This is a standard Shadcn UI card</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card uses Shadcn UI's default styling, with the standard border, padding, and shadows.</p>
              </CardContent>
              <CardFooter>
                <Button>Shadcn Button</Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Template Enhanced Card</h3>
            <TemplateCard variant="default">
              <TemplateCardHeader>
                <TemplateCardTitle>Template Card Title</TemplateCardTitle>
                <TemplateCardDescription>This is a template-enhanced card</TemplateCardDescription>
              </TemplateCardHeader>
              <TemplateCardContent>
                <p>This card uses our template styling with enhanced shadows, adjusted border-radius, and custom spacing.</p>
              </TemplateCardContent>
              <TemplateCardFooter>
                <Button className="template-btn-primary">Template Button</Button>
              </TemplateCardFooter>
            </TemplateCard>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">2. Template Card Variants</h2>
        <p className="text-lg mb-6">Different card styles from our template integration</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <TemplateCard variant="default">
            <TemplateCardHeader>
              <TemplateCardTitle>Default Card</TemplateCardTitle>
            </TemplateCardHeader>
            <TemplateCardContent>
              <p>Standard template card styling</p>
            </TemplateCardContent>
          </TemplateCard>
          
          <TemplateCard variant="hover">
            <TemplateCardHeader>
              <TemplateCardTitle>Hover Card</TemplateCardTitle>
            </TemplateCardHeader>
            <TemplateCardContent>
              <p>Hover over me to see the effect</p>
            </TemplateCardContent>
          </TemplateCard>
          
          <TemplateCard variant="gradient">
            <TemplateCardHeader>
              <TemplateCardTitle className="text-white">Gradient Card</TemplateCardTitle>
            </TemplateCardHeader>
            <TemplateCardContent>
              <p className="text-white">Card with gradient background</p>
            </TemplateCardContent>
          </TemplateCard>
          
          <TemplateCard status="success" borderPosition="left">
            <TemplateCardHeader>
              <TemplateCardTitle>Success Card</TemplateCardTitle>
            </TemplateCardHeader>
            <TemplateCardContent>
              <p>Card with success status indicator</p>
            </TemplateCardContent>
          </TemplateCard>
          
          <TemplateCard status="error" borderPosition="left">
            <TemplateCardHeader>
              <TemplateCardTitle>Error Card</TemplateCardTitle>
            </TemplateCardHeader>
            <TemplateCardContent>
              <p>Card with error status indicator</p>
            </TemplateCardContent>
          </TemplateCard>
          
          <TemplateCard status="warning" borderPosition="top">
            <TemplateCardHeader>
              <TemplateCardTitle>Warning Card</TemplateCardTitle>
            </TemplateCardHeader>
            <TemplateCardContent>
              <p>Card with warning status and top border</p>
            </TemplateCardContent>
          </TemplateCard>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">3. Specialized Dashboard Cards</h2>
        <p className="text-lg mb-6">Template-specific dashboard components</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Revenue" 
            value={128975} 
            change={12.5} 
            trend="up" 
            format="currency" 
            icon={<MoneyIcon />}
          />
          
          <MetricCard 
            title="Active Users" 
            value={8432} 
            change={3.2} 
            trend="up" 
            icon={<UserIcon />}
          />
          
          <MetricCard 
            title="Conversion Rate" 
            value={24.8} 
            change={-1.8} 
            trend="down" 
            format="percentage" 
            icon={<ChartIcon />}
          />
          
          <MetricCard 
            title="Inventory" 
            value={1253} 
            change={0} 
            trend="neutral" 
            icon={<BoxIcon />}
          />
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">4. Advanced Template + Shadcn Integration</h2>
        <p className="text-lg mb-6">Combining both systems in complex layouts</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TemplateCard variant="dashboard">
              <TemplateCardHeader>
                <div className="flex justify-between items-center">
                  <TemplateCardTitle>Performance Overview</TemplateCardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Weekly</Button>
                    <Button variant="outline" size="sm">Monthly</Button>
                    <Button size="sm">Yearly</Button>
                  </div>
                </div>
              </TemplateCardHeader>
              <TemplateCardContent>
                <div className="h-[300px] flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                  <p className="text-center text-gray-500">Chart Visualization Here</p>
                </div>
              </TemplateCardContent>
            </TemplateCard>
          </div>
          
          <div className="space-y-6">
            <TemplateCard variant="hover" status="info" borderPosition="left">
              <TemplateCardHeader>
                <TemplateCardTitle>Quick Actions</TemplateCardTitle>
              </TemplateCardHeader>
              <TemplateCardContent>
                <div className="flex flex-col gap-2">
                  <Button className="w-full justify-start template-btn-primary">Generate Report</Button>
                  <Button className="w-full justify-start template-btn-secondary">Export Data</Button>
                  <Button className="w-full justify-start" variant="outline">View Details</Button>
                </div>
              </TemplateCardContent>
            </TemplateCard>
            
            <TemplateCard variant="default">
              <TemplateCardHeader>
                <TemplateCardTitle>System Status</TemplateCardTitle>
              </TemplateCardHeader>
              <TemplateCardContent>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Database</span>
                    <span className="text-[--template-success] font-medium">Operational</span>
                  </li>
                  <li className="flex justify-between">
                    <span>API</span>
                    <span className="text-[--template-success] font-medium">Operational</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Storage</span>
                    <span className="text-[--template-warning] font-medium">Degraded</span>
                  </li>
                </ul>
              </TemplateCardContent>
            </TemplateCard>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TemplateShowcase;
