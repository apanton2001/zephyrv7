/**
 * Warehouse efficiency utility functions
 * 
 * These functions handle calculations related to warehouse efficiency metrics
 */

/**
 * Factors that contribute to overall warehouse efficiency
 */
export interface EfficiencyFactors {
  orderFulfillment: number; // Percentage (0-100)
  inventoryAccuracy: number; // Percentage (0-100)
  spaceUtilization: number; // Percentage (0-100)
  laborProductivity: number; // Percentage (0-100)
}

/**
 * Weights for each efficiency factor (must sum to 1)
 */
export const defaultFactorWeights = {
  orderFulfillment: 0.35,   // Order fulfillment has highest impact
  inventoryAccuracy: 0.25,  // Inventory accuracy is also critical
  spaceUtilization: 0.20,   // Space utilization is important but slightly less weighted
  laborProductivity: 0.20,  // Labor productivity completes the formula
};

/**
 * Calculate overall warehouse efficiency score based on component factors
 * 
 * @param factors The component efficiency factors
 * @param weights Optional custom weights for each factor (default weights used if not provided)
 * @returns Overall efficiency score (0-100)
 */
export function calculateOverallEfficiency(
  factors: EfficiencyFactors,
  weights = defaultFactorWeights
): number {
  // Ensure all factors are within valid range (0-100)
  const validFactors = {
    orderFulfillment: Math.max(0, Math.min(100, factors.orderFulfillment)),
    inventoryAccuracy: Math.max(0, Math.min(100, factors.inventoryAccuracy)),
    spaceUtilization: Math.max(0, Math.min(100, factors.spaceUtilization)),
    laborProductivity: Math.max(0, Math.min(100, factors.laborProductivity)),
  };

  // Calculate weighted score
  const weightedScore = 
    (validFactors.orderFulfillment * weights.orderFulfillment) +
    (validFactors.inventoryAccuracy * weights.inventoryAccuracy) +
    (validFactors.spaceUtilization * weights.spaceUtilization) +
    (validFactors.laborProductivity * weights.laborProductivity);
  
  // Round to 1 decimal place
  return Math.round(weightedScore * 10) / 10;
}

/**
 * Get a descriptive status for an efficiency score
 * 
 * @param score The efficiency score (0-100)
 * @returns A descriptive status string
 */
export function getEfficiencyStatus(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  if (score >= 60) return 'Needs Improvement';
  return 'Critical';
}

/**
 * Get a color class for an efficiency score (for UI elements)
 * 
 * @param score The efficiency score (0-100)
 * @returns A CSS color class
 */
export function getEfficiencyColorClass(score: number): string {
  if (score >= 90) return 'text-status-success';
  if (score >= 80) return 'text-status-info';
  if (score >= 70) return 'text-status-warning';
  if (score >= 60) return 'text-status-warning';
  return 'text-status-error';
}

/**
 * Get descriptions for each efficiency factor
 * 
 * @returns Object with descriptions for each factor
 */
export function getFactorDescriptions(): Record<keyof EfficiencyFactors, string> {
  return {
    orderFulfillment: 'Percentage of orders fulfilled completely and on time. Factors in order accuracy, timeliness, and customer satisfaction.',
    inventoryAccuracy: 'How closely physical inventory matches system records. Measured through cycle counts and inventory audits.',
    spaceUtilization: 'Effective use of warehouse space. Considers storage density, aisle optimization, and vertical space usage.',
    laborProductivity: 'Efficiency of warehouse staff. Measured by units processed per labor hour and order picking efficiency.',
  };
}
