"use client";

import { SubmitHandler } from "react-hook-form";

import { SharedPersonalInfoFormProvider } from "@/components/shared/SharedPersonalInfoFormProvider";
import { SharedPersonalInfo } from "@/types/shared-personal-info";
import { BeneficiaryFormData } from "@/types/beneficiaries";

interface BeneficiaryFormProps {
  initialData?: Partial<BeneficiaryFormData>;
  onSubmit: (data: BeneficiaryFormData) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  mode?: "create" | "edit";
}

// Helper function to convert from SharedPersonalInfo to BeneficiaryFormData
const convertToBeneficiaryData = (
  sharedData: SharedPersonalInfo,
  originalData?: Partial<BeneficiaryFormData>,
): BeneficiaryFormData => ({
  ...originalData,
  name: sharedData.name,
  email: sharedData.email || "",
  phone: sharedData.phone || "",
  pps_number: sharedData.pps_number || "",
  address_line_1: sharedData.address_line_1,
  address_line_2: sharedData.address_line_2 || "",
  city: sharedData.city,
  county: sharedData.county || "",
  eircode: sharedData.eircode || "",
  country: "Ireland",
  photo_url: sharedData.photo_url || "",
  relationship_type: sharedData.relationship_type || "friend",
  percentage: originalData?.percentage,
  specific_assets: originalData?.specific_assets,
  conditions: originalData?.conditions,
});

// Helper function to convert from BeneficiaryFormData to SharedPersonalInfo
const convertToSharedData = (
  beneficiaryData: Partial<BeneficiaryFormData>,
): Partial<SharedPersonalInfo> => ({
  name: beneficiaryData.name || "",
  email: beneficiaryData.email || "",
  phone: beneficiaryData.phone || "",
  pps_number: beneficiaryData.pps_number || "",
  address_line_1: beneficiaryData.address_line_1 || "",
  address_line_2: beneficiaryData.address_line_2 || "",
  city: beneficiaryData.city || "",
  county: beneficiaryData.county || "",
  eircode: beneficiaryData.eircode || "",
  country: "Ireland",
  photo_url: beneficiaryData.photo_url || "",
  relationship_type: beneficiaryData.relationship_type || "friend",
});

export function BeneficiaryForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = "create",
}: BeneficiaryFormProps) {
  const handleSubmit: SubmitHandler<SharedPersonalInfo> = async (data) => {
    // Convert shared form data back to beneficiary format
    const beneficiaryData = convertToBeneficiaryData(data, initialData);

    await onSubmit(beneficiaryData);
  };

  return (
    <div
      className="max-w-6xl mx-auto"
      data-component-category="input"
      data-component-id="beneficiary-form"
    >
      <SharedPersonalInfoFormProvider
        data-component-category="ui"
        data-component-id="shared-personal-info-form-provider"
        initialData={convertToSharedData(initialData || {})}
        loading={loading}
        mode="beneficiary"
        showCancelButton={!!onCancel}
        showPhotoUpload={true}
        submitLabel={
          mode === "create" ? "Add Beneficiary" : "Update Beneficiary"
        }
        onCancel={onCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
