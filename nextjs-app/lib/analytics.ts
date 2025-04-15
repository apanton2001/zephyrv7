import { track as vercelTrack } from '@vercel/analytics';

/**
 * Track a custom event with optional properties
 * 
 * @param eventName The name of the event to track
 * @param properties Optional properties to include with the event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  vercelTrack(eventName, properties);
}

// Common events
export const AnalyticsEvents = {
  // Auth events
  SIGN_IN: 'sign_in',
  SIGN_UP: 'sign_up',
  SIGN_OUT: 'sign_out',
  PASSWORD_RESET: 'password_reset',
  
  // Navigation events
  PAGE_VIEW: 'page_view',
  MENU_CLICK: 'menu_click',
  
  // Inventory events
  INVENTORY_SEARCH: 'inventory_search',
  INVENTORY_CREATE: 'inventory_create',
  INVENTORY_UPDATE: 'inventory_update',
  INVENTORY_DELETE: 'inventory_delete',
  
  // Order events
  ORDER_CREATE: 'order_create',
  ORDER_UPDATE: 'order_update',
  ORDER_STATUS_CHANGE: 'order_status_change',
  ORDER_COMPLETE: 'order_complete',
  
  // Dashboard events
  WIDGET_INTERACT: 'widget_interact',
  REPORT_GENERATE: 'report_generate',
  REPORT_EXPORT: 'report_export',
  
  // Warehouse location events
  LOCATION_VIEW: 'location_view',
  LOCATION_UPDATE: 'location_update',
  
  // User preference events
  THEME_TOGGLE: 'theme_toggle',
  SETTINGS_UPDATE: 'settings_update'
};
