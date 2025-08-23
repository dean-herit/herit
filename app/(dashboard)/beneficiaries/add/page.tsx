"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { BeneficiaryForm } from "@/components/beneficiaries/BeneficiaryForm";
import { useCreateBeneficiary } from "@/hooks/useBeneficiaries";
import { BeneficiaryFormData } from "@/types/beneficiaries";

export default function AddBeneficiaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const createMutation = useCreateBeneficiary();

  const handleSubmit = async (data: BeneficiaryFormData) => {
    try {
      setLoading(true);
      await createMutation.mutateAsync(data);
      toast.success("Beneficiary added successfully");
      router.push("/beneficiaries");
    } catch {
      toast.error("Failed to add beneficiary");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/beneficiaries");
  };

  return (
    <div
      className="max-w-5xl mx-auto p-6"
      data-component-category="layout"
      data-component-id="add-beneficiary-page"
    >
      {/* Header */}
      <div
        className="mb-6"
        data-component-category="layout"
        data-component-id="add-beneficiary-header"
      >
        <Button
          className="mb-4"
          data-component-category="navigation"
          data-component-id="back-to-beneficiaries-button"
          startContent={
            <ArrowLeftIcon
              className="h-4 w-4"
              data-component-category="ui"
              data-component-id="arrow-left-icon"
            />
          }
          variant="light"
          onPress={handleCancel}
        >
          Back to Beneficiaries
        </Button>

        <h1
          className="text-3xl font-bold"
          data-component-category="ui"
          data-component-id="page-title"
        >
          Add New Beneficiary
        </h1>
        <p
          className="text-default-600 mt-2"
          data-component-category="ui"
          data-component-id="page-description"
        >
          Add a person or organization who will inherit your assets
        </p>
      </div>

      {/* Form */}
      <div
        data-component-category="layout"
        data-component-id="beneficiary-form-container"
      >
        <BeneficiaryForm
          data-component-category="ui"
          data-component-id="beneficiary-form"
          loading={loading || createMutation.isPending}
          mode="create"
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
