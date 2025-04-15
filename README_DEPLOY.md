# Zephyr MVP: Quick Deploy Guide (Next.js + Supabase + Vercel)

## 1. Scaffold the Project

```bash
npx create-next-app@latest zephyr-mvp -e with-tailwindcss
cd zephyr-mvp
npm install @supabase/supabase-js
```

## 2. Add Supabase Client

Create `lib/supabaseClient.js`:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 3. Add Environment Variables

Create a `.env.local` file in the root:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 4. Example Usage

Edit `pages/index.js` to test Supabase connection:

```js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    supabase
      .from('test_table')
      .select('*')
      .then(({ data }) => setData(data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Zephyr MVP + Supabase</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/zephyr-mvp.git
git push -u origin main
```

## 6. Deploy to Vercel

- Go to [vercel.com](https://vercel.com/)
- Import your GitHub repo
- Set the environment variables in the Vercel dashboard
- Deploy!

## 7. Done!

Visit your Vercel URL to see your live app connected to Supabase.

---

**Tips:**
- Make sure your Supabase table (e.g., `test_table`) exists and is public for testing.
- You can now build out features, auth, and dashboards on this foundation.