import { track } from '@vercel/analytics/server';

/**
 * Track a server-side event with optional properties
 * 
 * @param eventName The name of the event to track
 * @param properties Optional properties to include with the event
 */
export async function trackServerEvent(eventName: string, properties?: Record<string, any>) {
  await track(eventName, properties);
}

// This file uses the same event constants from analytics.ts
// Import AnalyticsEvents from './analytics' when using this in server components or API routes
