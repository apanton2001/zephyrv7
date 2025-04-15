# Environment Variables for Zephyr Warehouse Management System

This document outlines the necessary environment variables required to run and deploy the Zephyr Warehouse Management System.

## Overview

Environment variables are used to configure the application without hardcoding sensitive information like API keys or database credentials directly into the source code.

## Required Variables

These variables must be set for the application to function correctly, both locally (in `.env.local`) and in your deployment environment (e.g., Vercel).

1.  **`NEXT_PUBLIC_SUPABASE_URL`**
    *   **Description:** The URL of your Supabase project. This is used by the Supabase client library to connect to your project's API.
    *   **Where to find:** In your Supabase project dashboard under Project Settings > API > Project URL.
    *   **Example:** `https://your-project-id.supabase.co`

2.  **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
    *   **Description:** The public "anon" key for your Supabase project. This key is safe to expose in the browser and is used for client-side interactions with Supabase (authentication, data fetching).
    *   **Where to find:** In your Supabase project dashboard under Project Settings > API > Project API Keys > `anon` `public`.
    *   **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9. ... . ...` (a long JWT string)

3.  **`NEXT_PUBLIC_APP_URL`**
    *   **Description:** The base URL where your application is hosted. This is used for constructing redirect URLs, especially for authentication callbacks.
    *   **Local Development:** `http://localhost:3000`
    *   **Production (Vercel with custom domain):** `https://zephyrwms.com` (or your specific domain)
    *   **Production (Vercel default domain):** `https://your-project-name.vercel.app`

4.  **`DATABASE_URL`**
    *   **Description:** The connection string for direct access to your Supabase PostgreSQL database. This is typically used for server-side operations, migrations, or direct database queries (e.g., using the `postgres` library via `lib/db.ts`).
    *   **Where to find:** In your Supabase project dashboard under Project Settings > Database > Connection string > URI (select the appropriate pooler, usually Transaction Pooler for serverless).
    *   **Important:** You **must** replace `[YOUR-PASSWORD]` with your actual database password set during project creation or in the Database settings.
    *   **Example (Transaction Pooler):** `postgres://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:6543/postgres`

## Local Development Setup (`.env.local`)

1.  Create a file named `.env.local` in the `nextjs-app` directory.
2.  Copy the contents of `.env.local.example` into `.env.local`.
3.  Fill in the values for the required variables using your specific Supabase project details and database password. Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`.

**Example `.env.local`:**

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgres://postgres:your_actual_db_password@db.your-project-id.supabase.co:6543/postgres
```

## Vercel Deployment Setup

1.  Go to your Vercel project dashboard.
2.  Navigate to Settings > Environment Variables.
3.  Add each of the required variables listed above (**Key** and **Value**).
    *   Use your production Supabase details.
    *   Set `NEXT_PUBLIC_APP_URL` to your production domain (`https://zephyrwms.com`).
    *   Ensure you use your actual database password in the `DATABASE_URL`.
4.  Save the environment variables. Vercel will use these during the build and runtime of your deployed application.

**Important Security Note:** Never commit your `.env.local` file or files containing sensitive credentials directly to your Git repository. The `.gitignore` file is configured to prevent this.
