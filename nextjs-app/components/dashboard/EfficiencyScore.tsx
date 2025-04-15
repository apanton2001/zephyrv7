import React, { useState } from 'react';
import { ArrowTrendingUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { calculateOverallEfficiency, getEfficiencyStatus, getEfficiencyColorClass, getFactorDescriptions, EfficiencyFactors } from '../../lib/utils/warehouseEfficiency';
import { trackEvent, AnalyticsEvents } from '../../lib/analytics';
import { TemplateCard, TemplateCardHeader, TemplateCardContent, TemplateCardTitle } from '../../components/ui/template-card';

interface EfficiencyScoreProps {
  // Overall score can be provided directly or calculated from factors
  score?: number;
  // Individual efficiency factors
  factors?: EfficiencyFactors;
  // Historical comparison
  change?: number;
  // Last updated timestamp
  lastUpdated?: string;
  // Whether to show factor tooltips
  showTooltips?: boolean;
}

export default function EfficiencyScore({ 
  score, 
  factors = {
    orderFulfillment: 97.2,
    inventoryAccuracy: 94.5,
    spaceUtilization: 88.3,
    laborProductivity: 92.1
  },
  change, 
  lastUpdated,
  showTooltips = true
}: EfficiencyScoreProps) {
  // State for active tooltip
  const [activeTooltip, setActiveTooltip] = useState<keyof EfficiencyFactors | null>(null);

  // Get factor descriptions for tooltips
  const factorDescriptions = getFactorDescriptions();
  
  // Calculate overall score if not provided directly
  const effectiveScore = score ?? calculateOverallEfficiency(factors);
  
  // Format the score as a percentage with 1 decimal place
  const formattedScore = `${effectiveScore.toFixed(1)}%`;
  
  // Get a text status based on the score
  const efficiencyStatus = getEfficiencyStatus(effectiveScore);
  
  // Determine the progress bar width and color based on score
  const getProgressWidth = () => {
    return `${Math.min(effectiveScore, 100)}%`;
  };
  
  const getProgressColor = () => {
    if (effectiveScore >= 90) return 'bg-[--template-success]';
    if (effectiveScore >= 75) return 'bg-[--template-info]';
    if (effectiveScore >= 60) return 'bg-[--template-warning]';
    return 'bg-[--template-error]';
  };
  
  // Format the "last updated" time
  const getFormattedTime = () => {
    if (!lastUpdated) return '';
    return `Last Updated: ${lastUpdated}`;
  };

  // Handle mouse entering a factor box (for tooltips)
  const handleMouseEnter = (factor: keyof EfficiencyFactors) => {
    setActiveTooltip(factor);
    // Track analytics event
    trackEvent(AnalyticsEvents.WIDGET_INTERACT, { 
      widget: 'efficiency_score', 
      action: 'tooltip_view',
      factor
    });
  };

  // Handle mouse leaving a factor box
  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  // Determine card status based on score
  const getCardStatus = () => {
    if (effectiveScore >= 90) return "success" as const;
    if (effectiveScore >= 75) return "info" as const;
    if (effectiveScore >= 60) return "warning" as const;
    return "error" as const;
  };

  const cardStatus = getCardStatus();

  return (
    <TemplateCard 
      variant="default"
      status={cardStatus}
      borderPosition="left"
    >
      <TemplateCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary-light mr-2" />
            <TemplateCardTitle>Warehouse Efficiency</TemplateCardTitle>
          </div>
          
          {change !== undefined && (
            <div className={`text-sm font-medium ${change >= 0 ? 'text-[--template-success]' : 'text-[--template-error]'}`}>
              {change >= 0 ? `↗ +${change.toFixed(1)}%` : `↘ ${change.toFixed(1)}%`}
            </div>
          )}
        </div>
      </TemplateCardHeader>
      
      <TemplateCardContent>
        <div className="flex items-baseline mb-1">
          <div>
            <span className="text-4xl font-bold">{formattedScore}</span>
            <span className="ml-2 text-sm font-medium">{efficiencyStatus}</span>
          </div>
          <span className="ml-auto text-xs text-text-secondary">{getFormattedTime()}</span>
        </div>
        
        <div className="w-full h-2 bg-background-light rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${getProgressColor()}`} 
            style={{ width: getProgressWidth() }}
          />
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-4">
          {/* Order Fulfillment */}
          <div 
            className="text-center relative"
            onMouseEnter={() => handleMouseEnter('orderFulfillment')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center justify-center">
              <span className="block text-xs text-text-secondary mr-1">Order Rate</span>
              {showTooltips && (
                <InformationCircleIcon className="h-3 w-3 text-text-secondary" />
              )}
            </div>
            <span className="font-medium">{factors.orderFulfillment.toFixed(1)}%</span>
            
            {/* Tooltip */}
            {showTooltips && activeTooltip === 'orderFulfillment' && (
              <div className="absolute z-10 w-48 px-3 py-2 text-xs text-left bg-background-dark border border-border rounded-md shadow-lg -left-14 -top-16">
                {factorDescriptions.orderFulfillment}
              </div>
            )}
          </div>
          
          {/* Inventory Accuracy */}
          <div 
            className="text-center relative"
            onMouseEnter={() => handleMouseEnter('inventoryAccuracy')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center justify-center">
              <span className="block text-xs text-text-secondary mr-1">Inventory</span>
              {showTooltips && (
                <InformationCircleIcon className="h-3 w-3 text-text-secondary" />
              )}
            </div>
            <span className="font-medium">{factors.inventoryAccuracy.toFixed(1)}%</span>
            
            {/* Tooltip */}
            {showTooltips && activeTooltip === 'inventoryAccuracy' && (
              <div className="absolute z-10 w-48 px-3 py-2 text-xs text-left bg-background-dark border border-border rounded-md shadow-lg -left-14 -top-16">
                {factorDescriptions.inventoryAccuracy}
              </div>
            )}
          </div>
          
          {/* Space Utilization */}
          <div 
            className="text-center relative"
            onMouseEnter={() => handleMouseEnter('spaceUtilization')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center justify-center">
              <span className="block text-xs text-text-secondary mr-1">Space</span>
              {showTooltips && (
                <InformationCircleIcon className="h-3 w-3 text-text-secondary" />
              )}
            </div>
            <span className="font-medium">{factors.spaceUtilization.toFixed(1)}%</span>
            
            {/* Tooltip */}
            {showTooltips && activeTooltip === 'spaceUtilization' && (
              <div className="absolute z-10 w-48 px-3 py-2 text-xs text-left bg-background-dark border border-border rounded-md shadow-lg -left-14 -top-16">
                {factorDescriptions.spaceUtilization}
              </div>
            )}
          </div>
          
          {/* Labor Productivity */}
          <div 
            className="text-center relative"
            onMouseEnter={() => handleMouseEnter('laborProductivity')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center justify-center">
              <span className="block text-xs text-text-secondary mr-1">Productivity</span>
              {showTooltips && (
                <InformationCircleIcon className="h-3 w-3 text-text-secondary" />
              )}
            </div>
            <span className="font-medium">{factors.laborProductivity.toFixed(1)}%</span>
            
            {/* Tooltip */}
            {showTooltips && activeTooltip === 'laborProductivity' && (
              <div className="absolute z-10 w-48 px-3 py-2 text-xs text-left bg-background-dark border border-border rounded-md shadow-lg -left-14 -top-16">
                {factorDescriptions.laborProductivity}
              </div>
            )}
          </div>
        </div>
      </TemplateCardContent>
    </TemplateCard>
  );
}
