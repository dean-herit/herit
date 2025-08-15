'use client';

import { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { useAuth } from '@/hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export function EmailSignupForm() {
  const { signup, isSigningUp } = useAuth();
  const [formData, setFormData] = useState({
    given_name: '',
    family_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.given_name.trim()) {
      newErrors.given_name = 'First name is required';
    }
    
    if (!formData.family_name.trim()) {
      newErrors.family_name = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const { confirmPassword, ...signupData } = formData;
      signup(signupData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name"
          placeholder="First name"
          value={formData.given_name}
          onChange={(e) => handleChange('given_name', e.target.value)}
          isInvalid={!!errors.given_name}
          errorMessage={errors.given_name}
          variant="bordered"
          isRequired
        />
        
        <Input
          label="Last Name"
          placeholder="Last name"
          value={formData.family_name}
          onChange={(e) => handleChange('family_name', e.target.value)}
          isInvalid={!!errors.family_name}
          errorMessage={errors.family_name}
          variant="bordered"
          isRequired
        />
      </div>
      
      <Input
        type="email"
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        isInvalid={!!errors.email}
        errorMessage={errors.email}
        variant="bordered"
        isRequired
      />
      
      <Input
        label="Password"
        placeholder="Create a password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        isInvalid={!!errors.password}
        errorMessage={errors.password}
        variant="bordered"
        type={showPassword ? 'text' : 'password'}
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
        isRequired
      />
      
      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(e) => handleChange('confirmPassword', e.target.value)}
        isInvalid={!!errors.confirmPassword}
        errorMessage={errors.confirmPassword}
        variant="bordered"
        type={showConfirmPassword ? 'text' : 'password'}
        endContent={
          <button
            className="focus:outline-none"
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
        isRequired
      />
      
      <Button
        type="submit"
        color="primary"
        className="w-full"
        size="lg"
        isLoading={isSigningUp}
        isDisabled={isSigningUp}
      >
        Create Account
      </Button>
    </form>
  );
}