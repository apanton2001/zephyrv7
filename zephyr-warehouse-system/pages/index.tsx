import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-800 text-white">
      <Head>
        <title>Zephyr Warehouse Management System</title>
        <meta name="description" content="A comprehensive warehouse management system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <div className="animate-pulse">
          <h1 className="text-4xl font-bold mb-4">
            Zephyr Warehouse Management System
          </h1>
          <p className="text-xl mb-8">Redirecting to dashboard...</p>
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </main>
    </div>
  );
}