# Zephyr Analytics Implementation Guide

This document explains how analytics are implemented in the Zephyr Warehouse Management System using Vercel Analytics.

## Overview

We've integrated Vercel Web Analytics to track user interactions across the application. The implementation includes:

1. Base analytics for page views (automatically tracked by `<Analytics />` component)
2. Custom client-side event tracking (product interactions, UI engagement, etc.)
3. Server-side event tracking (for backend operations like data processing)

## Implementation Details

### 1. Base Setup

- **Package**: Added `@vercel/analytics` to the project
- **Integration**: Included the `<Analytics />` component in `_app.tsx`
- **Effect**: Automatically tracks page views, user countries, device information

### 2. Client-Side Event Tracking

We've created a standardized system for client-side event tracking:

```typescript
// lib/analytics.ts
import { track as vercelTrack } from '@vercel/analytics';

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  vercelTrack(eventName, properties);
}

// Predefined event constants
export const AnalyticsEvents = {
  // Event name constants
  SIGN_IN: 'sign_in',
  PAGE_VIEW: 'page_view',
  // etc.
};
```

**Usage Example:**

```typescript
import { trackEvent, AnalyticsEvents } from '../lib/analytics';

// In a component or page
trackEvent(AnalyticsEvents.SIGN_IN, { method: 'email' });
```

### 3. Server-Side Event Tracking

For server operations, we've implemented server-side analytics:

```typescript
// lib/server-analytics.ts
import { track } from '@vercel/analytics/server';
import { AnalyticsEvents } from './analytics';

export async function trackServerEvent(eventName: string, properties?: Record<string, any>) {
  await track(eventName, properties);
}
```

**Usage Example in API Routes:**

```typescript
import { trackServerEvent } from '../../lib/server-analytics';
import { AnalyticsEvents } from '../../lib/analytics';

// In an API route
export default async function handler(req, res) {
  // Process order
  
  // Track event
  await trackServerEvent(AnalyticsEvents.ORDER_COMPLETE, {
    orderId: order.id,
    value: order.total,
  });
  
  res.status(200).json({ success: true });
}
```

## Event Types

We've standardized event names to ensure consistent tracking across the application:

- **Authentication Events**: `sign_in`, `sign_up`, `sign_out`, etc.
- **Navigation Events**: `page_view`, `menu_click`, etc.
- **Inventory Events**: `inventory_search`, `inventory_create`, etc.
- **Order Events**: `order_create`, `order_status_change`, etc.
- **Dashboard Events**: `widget_interact`, `report_generate`, etc.
- **Warehouse Events**: `location_view`, `location_update`, etc.
- **User Preference Events**: `theme_toggle`, `settings_update`, etc.

## Viewing Analytics Data

Analytics data is available in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Click on the "Analytics" tab
3. View page visits, countries, devices, etc.
4. For custom events, see the "Events" section

## Best Practices

1. **Use Predefined Constants**: Always use the `AnalyticsEvents` constants for event names
2. **Meaningful Properties**: Include useful properties that provide context
3. **Keep Properties Simple**: Use flat objects with primitive values
4. **Consistent Naming**: Follow the established naming pattern
5. **Not for PII**: Never include personally identifiable information in analytics

## Future Enhancements

1. **Event Filtering**: Add logic to filter events in development environments
2. **Analytics Dashboard**: Create a custom analytics dashboard in the admin section
3. **Advanced Metrics**: Add conversion tracking and funnel analysis
4. **Data Integration**: Connect analytics data with business metrics
