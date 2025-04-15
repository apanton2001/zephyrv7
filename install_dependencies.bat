@echo off
echo Installing dependencies for Zephyr Warehouse Management System...

cd nextjs-app

echo Installing core dependencies...
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react @supabase/auth-ui-react @supabase/auth-ui-shared

echo Installing UI and utility libraries...
npm install @heroicons/react @tanstack/react-query @tanstack/react-table chart.js react-chartjs-2 framer-motion date-fns react-hook-form zod react-qr-code

echo Installing dev dependencies...
npm install --save-dev @types/react @types/node @types/react-dom typescript tailwindcss postcss autoprefixer

echo All dependencies have been installed!
