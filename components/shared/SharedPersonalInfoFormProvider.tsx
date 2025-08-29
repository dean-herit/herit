"use client";

import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";

import { SharedPersonalInfoForm } from "./SharedPersonalInfoForm";

import {
  SharedPersonalInfo,
  FormMode,
  onboardingPersonalInfoSchema,
  beneficiaryPersonalInfoSchema,
} from "@/types/shared-personal-info";

interface SharedPersonalInfoFormProviderProps {
  mode: FormMode;
  initialData?: Partial<SharedPersonalInfo>;
  onSubmit: SubmitHandler<SharedPersonalInfo>;
  onCancel?: () => void;
  loading?: boolean;
  showPhotoUpload?: boolean;
  submitLabel?: string;
  showCancelButton?: boolean;
  className?: string;
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
}: SharedPersonalInfoFormProviderProps) {
  // Choose schema based on mode
  const schema =
    mode === "onboarding"
      ? onboardingPersonalInfoSchema
      : beneficiaryPersonalInfoSchema;

  // Set up form with React Hook Form
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      country: "Ireland",
      ...initialData,
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data as SharedPersonalInfo);
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
      data-component-id="form-provider"
    >
      <form
        className={`max-w-6xl mx-auto ${className}`}
        data-component-category="input"
        data-component-id={`${mode}-personal-info-form-provider`}
        onSubmit={handleSubmit}
      >
        {/* Responsive grid layout */}
        <div
          className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6"
          data-component-category="layout"
          data-component-id={`${mode}-form-grid`}
        >
          <SharedPersonalInfoForm
            data-component-category="ui"
            data-component-id="shared-personal-info-form"
            mode={mode}
            showPhotoUpload={showPhotoUpload}
          />
        </div>

        {/* Form Actions */}
        <div
          className="flex justify-end gap-3 pt-4 border-t"
          data-component-category="ui"
          data-component-id="form-actions"
        >
          {showCancelButton && onCancel && (
            <Button
              data-component-category="navigation"
              data-component-id="cancel-button"
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
            data-component-id="submit-button"
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
