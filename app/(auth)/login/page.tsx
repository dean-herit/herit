'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@heroui/react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSessionLoading) {
      if (isAuthenticated) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, isSessionLoading, router]);

  if (isLoading || isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-default-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-content1/70 backdrop-blur-xl p-8 rounded-2xl border border-divider shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-default-600">Sign in to continue to your estate planning</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}