"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Link, Divider, Form, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";

import { HeritLogo } from "@/components/HeritLogo";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isSessionLoading,
    signup,
    isSigningUp,
    signupError,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      const { confirmPassword, ...signupData } = formData;

      signup(signupData);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthError = urlParams.has("error");

    if (!isSessionLoading && !isOAuthRedirecting) {
      if (isAuthenticated && !hasOAuthError) {
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
      <div className="absolute top-5 left-5 md:left-10 z-10">
        <div className="flex items-center">
          <HeritLogo className="invert" size={120} />
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

      {/* Signup Form */}
      <div className="rounded-large bg-transparent backdrop-blur-sm border border-white/50 shadow-xl flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10 mr-4 md:mr-8 mt-16 md:my-8 text-white">
        <p className="pb-2 text-xl font-medium text-white">Create Account</p>

        {signupError && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
            <p className="text-sm text-danger-600">{signupError}</p>
          </div>
        )}

        <Form
          className="flex flex-col gap-3"
          data-testid="Form-78zgrpafw"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              isRequired
              classNames={{
                label: "text-white",
                input: "text-white placeholder:text-white/50",
                inputWrapper:
                  "border-white/50 hover:border-white/70 data-[focus=true]:border-white",
                errorMessage: "text-danger-300",
              }}
              data-testid="Input-p8hzp4ygq"
              errorMessage={errors.firstName}
              isInvalid={!!errors.firstName}
              label="First Name"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              variant="bordered"
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
            <Input
              isRequired
              classNames={{
                label: "text-white",
                input: "text-white placeholder:text-white/50",
                inputWrapper:
                  "border-white/50 hover:border-white/70 data-[focus=true]:border-white",
                errorMessage: "text-danger-300",
              }}
              data-testid="Input-x276tzkfu"
              errorMessage={errors.lastName}
              isInvalid={!!errors.lastName}
              label="Last Name"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              variant="bordered"
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </div>

          <Input
            isRequired
            classNames={{
              label: "text-white",
              input: "text-white placeholder:text-white/50",
              inputWrapper:
                "border-white/50 hover:border-white/70 data-[focus=true]:border-white",
              errorMessage: "text-danger-300",
            }}
            data-testid="Input-5mpge24f9"
            errorMessage={errors.email}
            isInvalid={!!errors.email}
            label="Email Address"
            name="email"
            placeholder="Enter your email"
            type="email"
            value={formData.email}
            variant="bordered"
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <Input
            isRequired
            classNames={{
              label: "text-white",
              input: "text-white placeholder:text-white/50",
              inputWrapper:
                "border-white/50 hover:border-white/70 data-[focus=true]:border-white",
              errorMessage: "text-danger-300",
            }}
            data-testid="Input-700eymxo4"
            endContent={
              <button
                data-testid="button-o88zxmwaf"
                type="button"
                onClick={toggleVisibility}
              >
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
            errorMessage={errors.password}
            isInvalid={!!errors.password}
            label="Password"
            name="password"
            placeholder="Create a password"
            type={isVisible ? "text" : "password"}
            value={formData.password}
            variant="bordered"
            onChange={(e) => handleChange("password", e.target.value)}
          />

          <Input
            isRequired
            classNames={{
              label: "text-white",
              input: "text-white placeholder:text-white/50",
              inputWrapper:
                "border-white/50 hover:border-white/70 data-[focus=true]:border-white",
              errorMessage: "text-danger-300",
            }}
            data-testid="Input-555pso95r"
            endContent={
              <button
                data-testid="button-i5j1w1bds"
                type="button"
                onClick={toggleConfirmVisibility}
              >
                {isConfirmVisible ? (
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
            errorMessage={errors.confirmPassword}
            isInvalid={!!errors.confirmPassword}
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm your password"
            type={isConfirmVisible ? "text" : "password"}
            value={formData.confirmPassword}
            variant="bordered"
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
          />

          <Button
            className="w-full"
            color="primary"
            isLoading={isSigningUp}
            type="submit"
          >
            Create Account
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
          Already have an account?&nbsp;
          <Link className="text-white underline" href="/login" size="sm">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
