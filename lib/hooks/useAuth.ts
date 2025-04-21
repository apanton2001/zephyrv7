import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession, useUser } from '@supabase/auth-helpers-react';
import { User } from '@supabase/auth-helpers-nextjs';

export function useAuth() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const session = useSession();
  const user = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [session]);

  // Redirect to login page if not authenticated and trying to access a protected route
  useEffect(() => {
    if (!loading && !session && isProtectedRoute(router.pathname)) {
      router.push('/auth');
    }
  }, [session, loading, router]);

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Check if this is a protected route
  const isProtectedRoute = (path: string) => {
    const protectedRoutes = [
      '/dashboard',
      '/inventory',
      '/orders',
      '/reports',
      '/clients',
      '/tasks'
    ];
    
    return protectedRoutes.some(route => 
      path === route || path.startsWith(`${route}/`)
    );
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!session,
    isProtectedRoute
  };
}
