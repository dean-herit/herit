"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export function GithubSignInButton() {
  const handleGithubSignIn = () => {
    // For now, show an alert - will be replaced with actual OAuth logic
    alert("Github sign-in not yet implemented");
  };

  return (
    <Button
      className="w-full text-white border-white/50 hover:border-white/70"
      data-component-category="authentication"
      data-component-id="github-signin-button"
      startContent={
        <Icon
          className="text-white"
          data-component-category="ui"
          data-component-id="icon"
          icon="fe:github"
          width={24}
        />
      }
      variant="bordered"
      onPress={handleGithubSignIn}
    >
      Continue with Github
    </Button>
  );
}
