# Deployment Guide for Zephyr Warehouse Management System

This guide walks you through deploying the Zephyr Warehouse Management System using Vercel for the frontend and Supabase for the backend.

## Prerequisites

- A [Supabase](https://supabase.com) account with a configured project
- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com) account for version control
- Completed database setup (refer to [DATABASE_SETUP.md](./DATABASE_SETUP.md))

## Preparing for Deployment

### 1. Set Up Version Control

First, initialize a Git repository and push your code:

```bash
# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit of Zephyr Warehouse Management System"

# Add remote repository (replace with your GitHub repository URL)
git remote add origin https://github.com/your-username/zephyr-warehouse.git

# Push to GitHub
git push -u origin main
```

### 2. Configure Environment Variables

Make sure all necessary environment variables are set in your `.env.local` file. For production, you'll need to add these to Vercel.

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase public API key
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://your-app.vercel.app)

### 3. Update Database Security

Before deployment, review your Supabase Row Level Security (RLS) policies to ensure they're production-ready:

1. Navigate to the **Authentication** settings in Supabase
2. Configure proper redirect URLs for authentication
3. Review and tighten RLS policies as needed
4. Set up proper backups for your production database

## Deploying to Vercel

### 1. Connect to Vercel

The easiest way to deploy is directly from GitHub:

1. Push your repository to GitHub
2. Log in to [Vercel](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `nextjs-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: (leave default)
   - **Development Command**: `npm run dev`

### 2. Environment Variables

Add your environment variables in the Vercel project settings:

1. Navigate to Project → Settings → Environment Variables
2. Add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

### 3. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your application will be deployed to a URL like `https://your-app.vercel.app`

## Post-Deployment Steps

### 1. Configure Authentication Redirects

Update your Supabase authentication settings with your production URL:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. Update the Site URL to your production URL
4. Add any additional redirect URLs if needed

### 2. Set Up Custom Domain (Optional)

If you want to use a custom domain:

1. Navigate to your Vercel project dashboard
2. Go to Settings → Domains
3. Add your custom domain and follow the DNS configuration instructions

### 3. Monitor Performance

After deployment, monitor your application:

1. Set up [Vercel Analytics](https://vercel.com/analytics) to track performance
2. Check Supabase logs for any backend issues
3. Set up alerts for critical errors

## CI/CD Workflow

Vercel automatically deploys your application when you push changes to your GitHub repository. For more control:

1. Configure [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github) for branch previews
2. Set up preview deployments for pull requests
3. Implement testing in your GitHub Actions workflow before deployment

## Troubleshooting

### Common Issues

1. **Authentication Redirect Errors**
   - Ensure redirect URLs are correctly configured in Supabase
   - Check environment variables in Vercel

2. **Database Connection Issues**
   - Verify Supabase API keys are correctly set
   - Check for RLS policy issues that might be blocking requests

3. **Build Failures**
   - Review Vercel build logs for errors
   - Ensure all dependencies are correctly listed in package.json

### Getting Help

If you encounter issues:
1. Check Vercel deployment logs
2. Review Supabase database logs
3. Consult the [Next.js deployment documentation](https://nextjs.org/docs/deployment)
4. Review the [Supabase documentation](https://supabase.com/docs)

## Backup and Disaster Recovery

Always maintain backups of your production database:

1. Set up regular database backups in Supabase
2. Document the restore process
3. Periodically test the restoration process

## Security Considerations

1. Do not commit `.env` files to your repository
2. Implement proper RLS policies in Supabase
3. Configure authentication timeout settings appropriately
4. Use environment-specific settings for development and production
