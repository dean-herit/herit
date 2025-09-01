"use client";

import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";

import { SharedPersonalInfoForm } from "./SharedPersonalInfoForm";

import {
  FormMode,
  onboardingPersonalInfoSchema,
  beneficiaryPersonalInfoSchema,
} from "@/app/types/shared-personal-info";

interface SharedPersonalInfoFormProviderProps {
  mode: FormMode;
  initialData?: Partial<any>;
  onSubmit: SubmitHandler<any>;
  onCancel?: () => void;
  loading?: boolean;
  showPhotoUpload?: boolean;
  submitLabel?: string;
  showCancelButton?: boolean;
  className?: string;
  // OAuth security enhancement
  isFromOAuth?: boolean;
  oauthProvider?: string;
  // Photo deletion tracking
  initialPhotoUrl?: string;
}

export function SharedPersonalInfoFormProvider({
  mode,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  showPhotoUpload = false,
  submitLabel,
  showCancelButton = true,
  className = "",
  isFromOAuth = false,
  oauthProvider,
  initialPhotoUrl,
}: SharedPersonalInfoFormProviderProps) {
  // Use a type-safe approach with union types
  const schema =
    mode === "onboarding"
      ? onboardingPersonalInfoSchema
      : beneficiaryPersonalInfoSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      country: "Ireland",
    } as any, // Use any to handle the dynamic schema types
    mode: "onBlur",
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  });

  // Auto-generate submit label if not provided
  const defaultSubmitLabel =
    mode === "onboarding"
      ? "Continue"
      : initialData?.name
        ? "Update Information"
        : "Add Person";

  return (
    <FormProvider
      {...methods}
      data-component-category="ui"
      data-testid="form-provider"
    >
      <form
        className={`max-w-6xl mx-auto ${className}`}
        data-component-category="input"
        data-testid={`${mode}-personal-info-form-provider`}
        onSubmit={handleSubmit}
      >
        {/* Responsive grid layout */}
        <div
          className="gap-6 mb-6"
          data-component-category="layout"
          data-testid={`${mode}-form-grid`}
        >
          <SharedPersonalInfoForm
            data-component-category="ui"
            data-testid="shared-personal-info-form"
            initialPhotoUrl={initialPhotoUrl}
            isFromOAuth={isFromOAuth}
            mode={mode}
            oauthProvider={oauthProvider}
            showPhotoUpload={showPhotoUpload}
          />
        </div>

        {/* Form Actions */}
        <div
          className="flex justify-end gap-3 pt-4"
          data-component-category="ui"
          data-testid="form-actions"
        >
          {showCancelButton && onCancel && (
            <Button
              data-component-category="navigation"
              data-testid={`${mode}-cancel`}
              isDisabled={loading}
              variant="flat"
              onPress={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            color="primary"
            data-component-category="input"
            data-testid={`${mode}-submit`}
            isLoading={loading}
            type="submit"
          >
            {submitLabel || defaultSubmitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

// Hook for accessing form context in child components
export { useFormContext } from "react-hook-form";
