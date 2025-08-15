'use client';

import { useState } from 'react';
import { Button, Input, Card, CardBody, Divider } from '@heroui/react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { AppleSignInButton } from './AppleSignInButton';
import { EmailLoginForm } from './EmailLoginForm';
import { EmailSignupForm } from './EmailSignupForm';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const { loginError, signupError } = useAuth();

  const authError = authMode === 'login' ? loginError : signupError;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Error Display */}
      {authError && (
        <Card className="border-danger-200 bg-danger-50">
          <CardBody className="p-4">
            <p className="text-sm text-danger-600 font-medium">{authError}</p>
          </CardBody>
        </Card>
      )}

      {/* Email Authentication Forms */}
      {showEmailAuth ? (
        <div className="space-y-6">
          <div className="flex border-b border-divider">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                authMode === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-default-600 hover:text-default-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                authMode === 'signup'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-default-600 hover:text-default-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authMode === 'login' ? <EmailLoginForm /> : <EmailSignupForm />}

          <div className="text-center">
            <Button
              variant="light"
              onPress={() => setShowEmailAuth(false)}
              className="text-sm"
            >
              ← Back to other sign-in options
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Email Authentication Button */}
          <Button
            onPress={() => setShowEmailAuth(true)}
            className="w-full"
            variant="bordered"
            size="lg"
            startContent={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            }
          >
            Continue with Email
          </Button>

          {/* Divider */}
          <div className="relative">
            <Divider />
            <div className="absolute inset-0 flex justify-center">
              <span className="px-4 bg-content1 text-sm text-default-600">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Providers */}
          <div className="space-y-3">
            <GoogleSignInButton />
            <AppleSignInButton />
          </div>
        </div>
      )}

      <div className="text-center text-xs text-default-500">
        <p>
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}