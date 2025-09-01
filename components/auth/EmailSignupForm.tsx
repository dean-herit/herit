"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import { useAuth } from "@/hooks/useAuth";

export function EmailSignupForm() {
  const { signup, isSigningUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const { confirmPassword, ...signupData } = formData;

      signup(signupData);
    }
  };

  return (
    <form
      className="space-y-4"
      data-testid="form-v6460rlcl"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <Input
          isRequired
          data-testid="Input-oyn7jvuvk"
          errorMessage={errors.firstName}
          isInvalid={!!errors.firstName}
          label="First Name"
          placeholder="First name"
          value={formData.firstName}
          variant="bordered"
          onChange={(e) => handleChange("firstName", e.target.value)}
        />

        <Input
          isRequired
          data-testid="Input-6910kw7o7"
          errorMessage={errors.lastName}
          isInvalid={!!errors.lastName}
          label="Last Name"
          placeholder="Last name"
          value={formData.lastName}
          variant="bordered"
          onChange={(e) => handleChange("lastName", e.target.value)}
        />
      </div>

      <Input
        isRequired
        data-testid="Input-77q8l81vs"
        errorMessage={errors.email}
        isInvalid={!!errors.email}
        label="Email"
        placeholder="Enter your email"
        type="email"
        value={formData.email}
        variant="bordered"
        onChange={(e) => handleChange("email", e.target.value)}
      />

      <Input
        isRequired
        data-testid="Input-vf6nu2vzm"
        endContent={
          <button
            className="focus:outline-none"
            data-testid="button-yz403emj6"
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
        placeholder="Create a password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        variant="bordered"
        onChange={(e) => handleChange("password", e.target.value)}
      />

      <Input
        isRequired
        data-testid="Input-tdmdy5y7u"
        endContent={
          <button
            className="focus:outline-none"
            data-testid="button-iyqqiqu98"
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-4 w-4 text-default-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-default-400" />
            )}
          </button>
        }
        errorMessage={errors.confirmPassword}
        isInvalid={!!errors.confirmPassword}
        label="Confirm Password"
        placeholder="Confirm your password"
        type={showConfirmPassword ? "text" : "password"}
        value={formData.confirmPassword}
        variant="bordered"
        onChange={(e) => handleChange("confirmPassword", e.target.value)}
      />

      <Button
        className="w-full"
        color="primary"
        isDisabled={isSigningUp}
        isLoading={isSigningUp}
        size="lg"
        type="submit"
      >
        Create Account
      </Button>
    </form>
  );
}
