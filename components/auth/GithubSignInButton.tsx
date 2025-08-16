'use client';

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export function GithubSignInButton() {
  const handleGithubSignIn = () => {
    // For now, show an alert - will be replaced with actual OAuth logic
    alert('Github sign-in not yet implemented');
  };

  return (
    <Button
      onPress={handleGithubSignIn}
      className="w-full text-white border-white/50 hover:border-white/70"
      variant="bordered"
      startContent={<Icon className="text-white" icon="fe:github" width={24} />}
    >
      Continue with Github
    </Button>
  );
}