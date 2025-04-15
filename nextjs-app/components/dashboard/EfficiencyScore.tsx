import React from 'react';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface EfficiencyScoreProps {
  score: number;
  change?: number;
  lastUpdated?: string;
}

export default function EfficiencyScore({ 
  score, 
  change, 
  lastUpdated 
}: EfficiencyScoreProps) {
  // Format the score as a percentage with 1 decimal place
  const formattedScore = `${score.toFixed(1)}%`;
  
  // Determine the progress bar width and color based on score
  const getProgressWidth = () => {
    return `${Math.min(score, 100)}%`;
  };
  
  const getProgressColor = () => {
    if (score >= 90) return 'bg-status-success';
    if (score >= 75) return 'bg-status-info';
    if (score >= 60) return 'bg-status-warning';
    return 'bg-status-error';
  };
  
  // Format the "last updated" time
  const getFormattedTime = () => {
    if (!lastUpdated) return '';
    return `Last Updated: ${lastUpdated}`;
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 text-primary-light mr-2" />
          <h3 className="font-semibold">Warehouse Efficiency</h3>
        </div>
        
        {change !== undefined && (
          <div className={`text-sm font-medium ${change >= 0 ? 'text-status-success' : 'text-status-error'}`}>
            {change >= 0 ? `↗ +${change.toFixed(1)}%` : `↘ ${change.toFixed(1)}%`}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline mb-1">
        <span className="text-4xl font-bold">{formattedScore}</span>
        <span className="ml-auto text-xs text-text-secondary">{getFormattedTime()}</span>
      </div>
      
      <div className="w-full h-2 bg-background-light rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${getProgressColor()}`} 
          style={{ width: getProgressWidth() }}
        />
      </div>
      
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="text-center">
          <span className="block text-xs text-text-secondary">Order Rate</span>
          <span className="font-medium">97.2%</span>
        </div>
        <div className="text-center">
          <span className="block text-xs text-text-secondary">Inventory</span>
          <span className="font-medium">94.5%</span>
        </div>
        <div className="text-center">
          <span className="block text-xs text-text-secondary">Space</span>
          <span className="font-medium">88.3%</span>
        </div>
        <div className="text-center">
          <span className="block text-xs text-text-secondary">Productivity</span>
          <span className="font-medium">92.1%</span>
        </div>
      </div>
    </div>
  );
}
