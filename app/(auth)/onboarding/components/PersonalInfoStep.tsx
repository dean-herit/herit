"use client";

import { useMutation } from "@tanstack/react-query";
import { SubmitHandler } from "react-hook-form";

import { SharedPersonalInfoFormProvider } from "@/components/shared/SharedPersonalInfoFormProvider";
import { OnboardingPersonalInfo } from "@/types/shared-personal-info";
import { PersonalInfo } from "@/types/onboarding";

interface PersonalInfoStepProps {
  initialData: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  onComplete: () => void;
  onBack?: () => void;
  loading?: boolean;
}

// Helper functions to convert between onboarding and shared formats
const convertToSharedFormat = (
  data: PersonalInfo,
): Partial<OnboardingPersonalInfo> => ({
  name: `${data.first_name} ${data.last_name}`.trim(),
  email: data.email,
  phone: data.phone_number,
  address_line_1: data.address_line_1,
  address_line_2: data.address_line_2 || "",
  city: data.city,
  county: data.county as any, // Type compatibility - handled by validation
  eircode: data.eircode,
  country: "Ireland",
  photo_url: data.profile_photo || "",
  date_of_birth: data.date_of_birth || "",
});

const convertFromSharedFormat = (
  sharedData: OnboardingPersonalInfo,
): PersonalInfo => {
  const [firstName, ...lastNameParts] = sharedData.name.split(" ");

  return {
    first_name: firstName || "",
    last_name: lastNameParts.join(" ") || "",
    email: sharedData.email || "",
    date_of_birth: sharedData.date_of_birth || "",
    phone_number: sharedData.phone || "",
    address_line_1: sharedData.address_line_1,
    address_line_2: sharedData.address_line_2 || "",
    city: sharedData.city,
    county: sharedData.county || "",
    eircode: sharedData.eircode || "",
    profile_photo: sharedData.photo_url || null,
  };
};

export function PersonalInfoStep({
  initialData,
  onChange,
  onComplete,
  onBack,
  loading,
}: PersonalInfoStepProps) {
  // API mutation for saving personal info
  const savePersonalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfo) => {
      const response = await fetch("/api/onboarding/personal-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: data.phone_number,
          dateOfBirth: data.date_of_birth,
          addressLine1: data.address_line_1,
          addressLine2: data.address_line_2,
          city: data.city,
          county: data.county,
          eircode: data.eircode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to save personal information");
      }

      return response.json();
    },
    onSuccess: () => {
      onComplete();
    },
    onError: (error) => {
      console.error("Personal info save error:", error);
    },
  });

  const handleSharedFormSubmit: SubmitHandler<OnboardingPersonalInfo> = async (
    sharedData,
  ) => {
    // Convert back to onboarding format
    const personalInfoData = convertFromSharedFormat(sharedData);

    // Update parent state
    onChange(personalInfoData);

    // Save via API
    savePersonalInfoMutation.mutate(personalInfoData);
  };

  const isLoading = loading || savePersonalInfoMutation.isPending;

  return (
    <div className="space-y-6" data-testid="personal-info-form">
      {/* Shared Personal Information Form */}
      <SharedPersonalInfoFormProvider
        initialData={convertToSharedFormat(initialData)}
        loading={isLoading}
        mode="onboarding"
        showCancelButton={!!onBack}
        showPhotoUpload={false}
        submitLabel="Continue"
        onCancel={onBack}
        onSubmit={handleSharedFormSubmit}
      />

      {/* Error Display */}
      {savePersonalInfoMutation.error && (
        <div className="mt-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded">
          {savePersonalInfoMutation.error.message}
        </div>
      )}
    </div>
  );
}
