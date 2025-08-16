'use client';

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface GoogleSignInButtonProps {
  onSignInStart?: () => void;
}

export function GoogleSignInButton({ onSignInStart }: GoogleSignInButtonProps = {}) {
  const handleGoogleSignIn = () => {
    // Notify parent component that OAuth is starting
    if (onSignInStart) {
      onSignInStart();
    }
    
    // Directly redirect to Google OAuth endpoint
    // The OAuth flow will handle session management
    window.location.href = '/api/auth/google';
  };

  return (
    <Button
      onPress={handleGoogleSignIn}
      className="w-full text-white border-white/50 hover:border-white/70"
      variant="bordered"
      startContent={<Icon icon="flat-color-icons:google" width={24} />}
    >
      Continue with Google
    </Button>
  );
}