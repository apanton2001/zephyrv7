# Getting Started with Zephyr Warehouse Management System

Welcome to Zephyr, your advanced warehouse management solution! This guide will help you quickly get up and running with your new system.

## What's Included

This project provides a complete warehouse management solution with:

- **Modern UI**: Dark-mode optimized interface designed for warehouse environments
- **Dashboard**: Real-time KPIs and warehouse efficiency metrics
- **Inventory Management**: Track products, locations, and stock levels
- **Order Processing**: 7-stage order pipeline with visual tracking
- **Authentication**: User management with Supabase Auth
- **Predictive Analytics**: Smart inventory forecasting
- **Responsive Design**: Works on desktops, tablets, and mobile devices

## Quick Start Guide

### 1. Install Dependencies

Run the included installation script:

```bash
./install_dependencies.bat
```

This will install all required packages for the Next.js application.

### 2. Configure Supabase

1. Create a [Supabase](https://supabase.com) account if you don't have one
2. Create a new Supabase project
3. Set up your database by following the instructions in [DATABASE_SETUP.md](./DATABASE_SETUP.md)
4. Copy your Supabase URL and anon key from the Supabase dashboard

### 3. Environment Setup

1. Create a `.env.local` file by copying the example:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in the `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 4. Start Development Server

Start the development server to test the application locally:

```bash
cd nextjs-app
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

### 5. Explore the Application

- **Landing Page**: Home page with features description
- **Authentication**: Sign up and log in functionality
- **Dashboard**: Central command center with KPIs
- **Navigation**: Access all warehouse modules

## Project Structure

The project is organized as follows:

- `/components`: Reusable UI components
  - `/layout`: Layout-related components (Sidebar, Header)
  - `/dashboard`: Dashboard-specific components
  - `/inventory`, `/orders`, etc.: Feature-specific components
  - `/ui`: Generic UI components
- `/pages`: Next.js pages and API routes
- `/lib`: Utility functions and Supabase client
- `/styles`: Global styles and Tailwind configuration
- `/public`: Static assets
- `/types`: TypeScript type definitions

## Next Steps

1. **Customize**: Modify the components and styles to match your brand
2. **Extend**: Add additional features specific to your warehouse needs
3. **Connect**: Integrate with your real inventory and order systems
4. **Deploy**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to Vercel

## Development Workflow

1. **Local Development**: Make changes and test locally
2. **Testing**: Verify functionality across different devices
3. **Deployment**: Push to GitHub and deploy via Vercel
4. **Production**: Monitor performance and gather user feedback

## Common Tasks

### Adding a New Feature

1. Create components in the appropriate directory
2. Add any required database tables in Supabase
3. Create or modify pages to incorporate the new feature
4. Update navigation as needed

### Customizing the UI

1. Modify Tailwind theme in `tailwind.config.js`
2. Update global styles in `styles/globals.css`
3. Modify component styles directly in component files

### Adding Authentication Roles

1. Create role definitions in Supabase
2. Update Row Level Security policies
3. Modify UI to show/hide features based on user role

## Getting Help

- Review project documentation files
- Check [Next.js Documentation](https://nextjs.org/docs)
- Refer to [Supabase Documentation](https://supabase.com/docs)

Enjoy building with Zephyr Warehouse Management System!
