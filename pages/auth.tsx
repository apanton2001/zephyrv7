import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function AuthPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const session = useSession();
  const { signup } = router.query;
  
  // Redirect if the user is already logged in
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <Link 
        href="/" 
        className="mb-8 text-primary-light text-2xl font-bold hover:text-primary"
      >
        Zephyr
      </Link>
      
      <div className="w-full max-w-md p-6 bg-background-card rounded-lg shadow-card border border-border">
        <h1 className="text-xl font-bold mb-6 text-center">
          {signup ? 'Create an Account' : 'Sign In to Your Account'}
        </h1>
        
        <div className="auth-container">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4F46E5',
                    brandAccent: '#4338CA',
                    brandButtonText: 'white',
                    inputBackground: '#1F2937',
                    inputBorder: '#374151',
                    inputBorderFocus: '#4F46E5',
                    inputBorderHover: '#4B5563',
                    inputText: '#F9FAFB',
                    inputLabelText: '#9CA3AF',
                    inputPlaceholder: '#6B7280',
                  },
                  space: {
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '6px',
                    buttonBorderRadius: '6px',
                    inputBorderRadius: '6px',
                  },
                },
              },
              className: {
                container: 'auth-form-container',
                button: 'auth-button',
                input: 'auth-input',
                label: 'auth-label',
                message: 'auth-message',
              },
            }}
            view={signup ? 'sign_up' : 'sign_in'}
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/dashboard`}
            magicLink={true}
            // Removing social providers since they aren't configured in Supabase
            // providers={['google', 'github']}
            // socialLayout="horizontal"
          />
        </div>
        
        <div className="mt-6 text-center">
          {signup ? (
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link href="/auth" className="text-primary-light hover:text-primary">
                Sign In
              </Link>
            </p>
          ) : (
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <Link href="/auth?signup=true" className="text-primary-light hover:text-primary">
                Create Account
              </Link>
            </p>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .auth-form-container > div {
          color: #F9FAFB !important;
        }
        .auth-button {
          font-weight: 500 !important;
          transition: all 150ms ease-in-out !important;
        }
        .auth-button:hover {
          opacity: 0.9 !important;
        }
        .auth-input {
          background: #1F2937 !important;
          color: #F9FAFB !important;
        }
        .auth-label {
          color: #9CA3AF !important;
        }
        .auth-message {
          color: #F9FAFB !important;
        }
      `}</style>
    </div>
  );
}
