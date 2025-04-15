import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Replace 'test_table' with your actual Supabase table name
    supabase
      .from('test_table')
      .select('*')
      .then(({ data, error }) => {
        setData(data);
        setError(error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Zephyr MVP + Supabase</h1>
      <p className="mb-2">This page fetches data from your Supabase table.</p>
      {error && <div className="text-red-400 mb-2">Error: {error.message}</div>}
      <pre className="bg-gray-800 p-4 rounded w-full max-w-xl overflow-x-auto">
        {data ? JSON.stringify(data, null, 2) : 'Loading...'}
      </pre>
    </div>
  );
}