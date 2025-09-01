"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { BeneficiaryForm } from "@/components/beneficiaries/BeneficiaryForm";
import { useBeneficiary, useUpdateBeneficiary } from "@/hooks/useBeneficiaries";
import { BeneficiaryFormData } from "@/types/beneficiaries";

interface EditBeneficiaryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBeneficiaryPage({
  params,
}: EditBeneficiaryPageProps) {
  const router = useRouter();
  const [beneficiaryId, setBeneficiaryId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Resolve the params promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setBeneficiaryId(resolvedParams.id);
    });
  }, [params]);

  const { data: beneficiary, isLoading } = useBeneficiary(beneficiaryId);
  const updateMutation = useUpdateBeneficiary(beneficiaryId);

  const handleSubmit = async (data: BeneficiaryFormData) => {
    try {
      setLoading(true);
      await updateMutation.mutateAsync(data);
      toast.success("Beneficiary updated successfully");
      router.push("/beneficiaries");
    } catch {
      toast.error("Failed to update beneficiary");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/beneficiaries");
  };

  if (isLoading || !beneficiaryId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card>
          <CardBody className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">
              Beneficiary not found
            </h2>
            <p className="text-default-600 mb-6">
              The beneficiary you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Button
              color="primary"
              data-testid="Button-p784gndwv"
              startContent={<ArrowLeftIcon className="h-4 w-4" />}
              onPress={handleCancel}
            >
              Back to Beneficiaries
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          className="mb-4"
          data-testid="Button-kw1ratqcn"
          startContent={<ArrowLeftIcon className="h-4 w-4" />}
          variant="light"
          onPress={handleCancel}
        >
          Back to Beneficiaries
        </Button>

        <h1 className="text-3xl font-bold">Edit Beneficiary</h1>
        <p className="text-default-600 mt-2">
          Update information for {beneficiary.name}
        </p>
      </div>

      {/* Form */}
      <BeneficiaryForm
        data-testid="BeneficiaryForm-wovi8fhw7"
        initialData={{
          ...beneficiary,
          country: beneficiary.country || "Ireland",
          email: beneficiary.email || "",
          phone: beneficiary.phone || "",
          pps_number: beneficiary.pps_number || "",
          photo_url: beneficiary.photo_url || "",
          address_line_1: beneficiary.address_line_1 || "",
          address_line_2: beneficiary.address_line_2 || "",
          city: beneficiary.city || "",
          county: (beneficiary.county || "") as any,
          eircode: beneficiary.eircode || "",
          specific_assets: Array.isArray(beneficiary.specific_assets)
            ? beneficiary.specific_assets
            : [],
          conditions: beneficiary.conditions || undefined,
        }}
        loading={loading || updateMutation.isPending}
        mode="edit"
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
