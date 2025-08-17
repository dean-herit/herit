"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Checkbox,
  Link,
  Divider,
  Form,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import { AcmeIcon } from "@/components/AcmeIcon";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading, login, isLoggingIn, loginError } =
    useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login({ email, password });
  };

  useEffect(() => {
    // Check if we're coming back from an OAuth error
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthError = urlParams.has("error");

    if (!isSessionLoading && !isOAuthRedirecting) {
      if (isAuthenticated && !hasOAuthError) {
        // User is authenticated, redirect to dashboard
        router.push("/dashboard");
      } else {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, isSessionLoading, router, isOAuthRedirecting]);

  if (isLoading || isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-default-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-content1 flex min-h-screen w-full items-center justify-end overflow-hidden"
      style={{
        backgroundImage: "url(/login-background.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Brand Logo */}
      <div className="absolute top-10 left-10">
        <div className="flex items-center">
          <AcmeIcon className="text-black" size={60} />
          <p className="font-medium text-black ml-3 text-2xl">HERIT</p>
        </div>
      </div>

      {/* Testimonial */}
      <div className="absolute bottom-10 left-10 hidden md:block">
        <p className="max-w-xl text-white text-3xl font-light">
          <span className="font-medium">&quot;</span>
          Peace of mind in what you leave behind
          <span className="font-medium">&quot;</span>
        </p>
      </div>

      {/* Login Form */}
      <div className="rounded-large bg-transparent backdrop-blur-sm border border-white/50 shadow-xl flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10 mr-8 my-8 text-white">
        <p className="pb-2 text-xl font-medium text-white">Log In</p>

        {loginError && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
            <p className="text-sm text-danger-600">{loginError}</p>
          </div>
        )}

        <Form
          className="flex flex-col gap-3"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <Input
            isRequired
            classNames={{
              label: "text-white",
              input: "text-white placeholder:text-white/50",
              inputWrapper:
                "border-white/50 hover:border-white/70 data-[focus=true]:border-white",
            }}
            label="Email Address"
            name="email"
            placeholder="Enter your email"
            type="email"
            value={email}
            variant="bordered"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            isRequired
            classNames={{
              label: "text-white",
              input: "text-white placeholder:text-white/50",
              inputWrapper:
                "border-white/50 hover:border-white/70 data-[focus=true]:border-white",
            }}
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Icon
                    className="text-white pointer-events-none text-2xl"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="text-white pointer-events-none text-2xl"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            label="Password"
            name="password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            value={password}
            variant="bordered"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex w-full items-center justify-between px-1 py-2">
            <Checkbox
              classNames={{
                label: "text-white",
                wrapper: "before:border-white/50",
              }}
              name="remember"
              size="sm"
            >
              Remember me
            </Checkbox>
            <Link className="text-white" href="#" size="sm">
              Forgot password?
            </Link>
          </div>
          <Button
            className="w-full"
            color="primary"
            isLoading={isLoggingIn}
            type="submit"
          >
            Log In
          </Button>
        </Form>
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1 bg-white/30" />
          <p className="text-tiny text-white shrink-0">OR</p>
          <Divider className="flex-1 bg-white/30" />
        </div>
        <div className="flex flex-col gap-2">
          <GoogleSignInButton
            onSignInStart={() => setIsOAuthRedirecting(true)}
          />
        </div>
        <p className="text-small text-center text-white">
          Need to create an account?&nbsp;
          <Link className="text-white underline" href="/onboarding" size="sm">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
