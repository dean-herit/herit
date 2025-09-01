"use client";

import { useState } from "react";
import { toast } from "sonner";

import { SharedPersonalInfoFormProvider } from "@/components/shared/SharedPersonalInfoFormProvider";
import { SharedPersonalInfo } from "@/types/shared-personal-info";

export default function TestSharedFormPage() {
  const [mode, setMode] = useState<"onboarding" | "beneficiary">("onboarding");

  const handleSubmit = async (data: SharedPersonalInfo) => {
    console.log("Form submitted:", data);
    toast.success("Form submitted successfully!");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleCancel = () => {
    toast.info("Form cancelled");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Shared Personal Info Form Test
          </h1>
          <p className="text-default-600 mb-6">
            Testing our consolidated React Hook Form component with visual dev
            tools
          </p>

          {/* Mode Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              className={`px-4 py-2 rounded ${
                mode === "onboarding"
                  ? "bg-primary text-white"
                  : "bg-default-100 text-default-600"
              }`}
              data-testid="button-cf6hfd2bq"
              onClick={() => setMode("onboarding")}
            >
              Onboarding Mode
            </button>
            <button
              className={`px-4 py-2 rounded ${
                mode === "beneficiary"
                  ? "bg-primary text-white"
                  : "bg-default-100 text-default-600"
              }`}
              data-testid="button-9cd6u2k56"
              onClick={() => setMode("beneficiary")}
            >
              Beneficiary Mode
            </button>
          </div>
        </div>

        {/* Form Component */}
        <SharedPersonalInfoFormProvider
          key={mode} // Force re-mount when mode changes
          data-testid="SharedPersonalInfoFormProvider-3atnhxx8d"
          mode={mode}
          showPhotoUpload={true}
          submitLabel={
            mode === "onboarding" ? "Continue to Next Step" : "Add Beneficiary"
          }
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
