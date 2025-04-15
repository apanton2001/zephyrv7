# Zephyr Warehouse Management System

A comprehensive warehouse management solution built with Next.js and Supabase, featuring real-time data visualization, predictive analytics, and cutting-edge workflow management tools.

## Features

- **Dashboard & Performance Monitoring**: Real-time warehouse KPIs with color-coded indicators
- **Inventory Management**: CRUD operations, bulk imports, location tracking, barcode support
- **Predictive Analysis**: AI-driven restock alerts based on historical data modeling
- **Order Processing**: 7-stage order pipeline with visual timeline
- **Warehouse Mapping**: 2D visualization of warehouse layout and locations
- **Task Management**: Assignable tasks with priorities and performance tracking
- **Client Database**: Comprehensive client information with segmentation capabilities
- **Mobile-Optimized**: Responsive design works on all devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **State Management**: React Query, Context API
- **Styling**: Tailwind CSS, CSS-in-JS
- **Charts & Visualization**: Chart.js with React-Chartjs-2
- **Authentication**: Supabase Auth with social login support
- **Database**: PostgreSQL via Supabase
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier available)
- Vercel account (optional, for deployment)

### Installation

1. Clone this repository
   ```
   git clone https://your-repository-url/zephyr-warehouse.git
   cd zephyr-warehouse
   ```

2. Install dependencies
   ```
   # Run the installation script
   ./install_dependencies.bat
   ```
   
   Or manually:
   ```
   cd nextjs-app
   npm install
   ```

3. Create a .env.local file (using .env.local.example as a template)
   ```
   cp .env.local.example .env.local
   ```

4. Fill in your Supabase credentials in .env.local:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000 # Change in production
   ```

5. Start the development server
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

The application requires specific database tables in Supabase. For detailed setup instructions, see the [Database Setup Guide](./DATABASE_SETUP.md).

## Deployment

This project is configured for easy deployment to Vercel with Supabase as the backend. For step-by-step deployment instructions, see the [Deployment Guide](./DEPLOYMENT.md).

## Project Structure

```
zephyr-warehouse/
├── components/       # Reusable UI components
│   ├── layout/       # Layout components (Sidebar, Header)
│   ├── dashboard/    # Dashboard-specific components
│   ├── inventory/    # Inventory-specific components
│   ├── orders/       # Order-specific components
│   └── ui/           # Generic UI components
├── lib/              # Utility functions and hooks
│   ├── supabaseClient.ts   # Supabase client configuration
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Helper functions
├── pages/            # Next.js pages
│   ├── _app.tsx      # Main app wrapper
│   ├── index.tsx     # Landing page
│   ├── auth.tsx      # Authentication page
│   ├── dashboard.tsx # Main dashboard
│   └── [other pages]
├── public/           # Static assets
├── styles/           # Global styles
└── types/            # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
