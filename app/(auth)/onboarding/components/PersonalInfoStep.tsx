"use client";

import { useState } from "react";
import { Input } from "@heroui/react";
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
const convertToSharedFormat = (data: PersonalInfo): Partial<OnboardingPersonalInfo> => ({
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
});

const convertFromSharedFormat = (sharedData: OnboardingPersonalInfo, dateOfBirth: string): PersonalInfo => {
  const [firstName, ...lastNameParts] = sharedData.name.split(" ");
  return {
    first_name: firstName || "",
    last_name: lastNameParts.join(" ") || "",
    email: sharedData.email || "",
    date_of_birth: dateOfBirth,
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
  const [dateOfBirth, setDateOfBirth] = useState(initialData.date_of_birth || "");
  const [dateOfBirthError, setDateOfBirthError] = useState<string>("");

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

  const handleSharedFormSubmit: SubmitHandler<OnboardingPersonalInfo> = async (sharedData) => {
    // Validate date of birth
    if (!dateOfBirth) {
      setDateOfBirthError("Date of birth is required");
      return;
    }
    
    setDateOfBirthError("");
    
    // Convert back to onboarding format
    const personalInfoData = convertFromSharedFormat(sharedData, dateOfBirth);
    
    // Update parent state
    onChange(personalInfoData);
    
    // Save via API
    savePersonalInfoMutation.mutate(personalInfoData);
  };

  const handleDateOfBirthChange = (value: string) => {
    setDateOfBirth(value);
    if (dateOfBirthError) {
      setDateOfBirthError("");
    }
  };

  const isLoading = loading || savePersonalInfoMutation.isPending;

  return (
    <div 
      className="space-y-6"
      data-component-category="authentication"
      data-component-id="components-personal-info-step"
      data-testid="personal-info-form"
    >
      {/* Date of Birth - Additional field for onboarding */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <Input
          isRequired
          data-testid="date-of-birth-input"
          errorMessage={dateOfBirthError}
          isInvalid={!!dateOfBirthError}
          label="Date of Birth"
          type="date"
          value={dateOfBirth}
          variant="bordered"
          onChange={(e) => handleDateOfBirthChange(e.target.value)}
        />
      </div>

      {/* Shared Personal Information Form */}
      <SharedPersonalInfoFormProvider
        mode="onboarding"
        initialData={convertToSharedFormat(initialData)}
        onSubmit={handleSharedFormSubmit}
        onCancel={onBack}
        loading={isLoading}
        showPhotoUpload={false}
        submitLabel="Continue"
        showCancelButton={!!onBack}
      />
      
      {/* Error Display */}
      {savePersonalInfoMutation.error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {savePersonalInfoMutation.error.message}
        </div>
      )}
    </div>
  );
}