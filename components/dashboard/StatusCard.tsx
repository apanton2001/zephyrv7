import React, { ReactNode } from 'react';
import { MetricCard } from '../../components/ui/template-card';

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
  // Map color to status for MetricCard
  const getStatus = () => {
    switch (color) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return undefined;
    }
  };

  // Format value if it's a number
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  // Determine trend direction
  const trendDirection = trend ? (trend.isPositive ? 'up' : 'down') : undefined;

  return (
    <MetricCard
      title={title}
      value={formattedValue}
      icon={icon}
      change={trend?.value}
      trend={trendDirection}
      className={color !== 'default' ? `border-l-4 border-[--template-${color === 'success' ? 'success' : color === 'warning' ? 'warning' : 'error'}]` : ''}
    />
  );
}
