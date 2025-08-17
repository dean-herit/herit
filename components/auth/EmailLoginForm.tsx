"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import { useAuth } from "@/hooks/useAuth";

export function EmailLoginForm() {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      login({ email, password });
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        isRequired
        errorMessage={errors.email}
        isInvalid={!!errors.email}
        label="Email"
        placeholder="Enter your email"
        type="email"
        value={email}
        variant="bordered"
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        isRequired
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4 text-default-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-default-400" />
            )}
          </button>
        }
        errorMessage={errors.password}
        isInvalid={!!errors.password}
        label="Password"
        placeholder="Enter your password"
        type={showPassword ? "text" : "password"}
        value={password}
        variant="bordered"
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        className="w-full"
        color="primary"
        isDisabled={isLoggingIn}
        isLoading={isLoggingIn}
        size="lg"
        type="submit"
      >
        Sign In
      </Button>
    </form>
  );
}
