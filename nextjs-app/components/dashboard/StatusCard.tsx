import React, { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'success' | 'warning' | 'error';
}

export default function StatusCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'default' 
}: StatusCardProps) {
  
  // Determine background and text color based on status
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'border-status-success/20 bg-status-success/5';
      case 'warning':
        return 'border-status-warning/20 bg-status-warning/5';
      case 'error':
        return 'border-status-error/20 bg-status-error/5';
      default:
        return 'border-border bg-background-card';
    }
  };

  // Icon container background color
  const getIconBackground = () => {
    switch (color) {
      case 'success':
        return 'bg-status-success/10 text-status-success';
      case 'warning':
        return 'bg-status-warning/10 text-status-warning';
      case 'error':
        return 'bg-status-error/10 text-status-error';
      default:
        return 'bg-primary/10 text-primary-light';
    }
  };

  return (
    <div className={`card flex flex-col overflow-hidden ${getColorClasses()}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${getIconBackground()}`}>
          {icon}
        </div>
        
        {trend && (
          <div className={`flex items-center text-xs ${trend.isPositive ? 'text-status-success' : 'text-status-error'}`}>
            {trend.isPositive ? (
              <span>↗ +{trend.value}%</span>
            ) : (
              <span>↘ {trend.value}%</span>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-text-secondary text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}
