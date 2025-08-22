"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Progress } from "@heroui/react";
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
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          className="mb-4"
          startContent={<ArrowLeftIcon className="h-4 w-4" />}
          variant="light"
          onPress={handleCancel}
        >
          Back to Beneficiaries
        </Button>

        <h1 className="text-3xl font-bold">Add New Beneficiary</h1>
        <p className="text-default-600 mt-2">
          Add a person or organization who will inherit your assets
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Form Progress</span>
            <span className="text-sm text-default-500">Step 1 of 2</span>
          </div>
          <Progress className="mb-2" color="primary" size="sm" value={50} />
          <div className="flex justify-between text-xs text-default-500">
            <span>Personal Information</span>
            <span>Address Information</span>
          </div>
        </CardBody>
      </Card>

      {/* Form */}
      <BeneficiaryForm
        loading={loading || createMutation.isPending}
        mode="create"
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
