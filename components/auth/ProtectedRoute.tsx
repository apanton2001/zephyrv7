import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../lib/context/AuthContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * A component that protects routes by checking if the user is authenticated.
 * If not, it redirects to the login page.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state if we're checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : <LoadingScreen />;
}
