"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Select,
  SelectItem,
  Divider,
  Progress,
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

import {
  AssetFormData,
  IrishAssetFormSchema,
  AssetCategory,
  AssetType,
  AssetCategoryDefinitions,
  IrishAssetTypeDefinitions,
  CurrencyOptions,
  CurrencyCode,
  JurisdictionCode,
  formatCurrency,
} from "@/types/assets";
import { Asset } from "@/db/schema";

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;

  const [currentStep, setCurrentStep] = useState(2); // Skip category and type selection when editing
  const [formData, setFormData] = useState<Partial<AssetFormData>>({
    currency: CurrencyCode.EUR,
    jurisdiction: JurisdictionCode.IE,
    value: 0,
    irish_fields: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Steps in the form
  const steps = [
    {
      id: "category",
      name: "Category",
      description: "What type of asset is this?",
    },
    { id: "type", name: "Asset Type", description: "Select the specific type" },
    { id: "details", name: "Details", description: "Tell us about your asset" },
    { id: "value", name: "Value", description: "How much is it worth?" },
    { id: "review", name: "Review", description: "Review and confirm" },
  ];

  // Load asset data and categories when component mounts
  useEffect(() => {
    Promise.all([fetchAsset(), fetchCategories()]);
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}`);

      if (response.ok) {
        const data = await response.json();
        const asset = data.data;

        setAsset(asset);

        // Initialize form data with asset data
        setFormData({
          name: asset.name,
          asset_type: asset.asset_type as AssetType,
          category: getCategoryFromAssetType(asset.asset_type),
          value: asset.value,
          currency: CurrencyCode.EUR, // Default for Ireland
          jurisdiction: JurisdictionCode.IE,
          description: asset.description || "",
          irish_fields: {
            iban: asset.account_number || undefined,
            irish_bank_name: (asset.bank_name as any) || undefined,
            eircode: asset.property_address
              ? asset.property_address.split(",")[0]
              : undefined,
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch asset:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/assets/categories");

      if (response.ok) {
        const data = await response.json();

        setCategories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const getCategoryFromAssetType = (assetType: string): AssetCategory => {
    // Simple mapping based on asset type naming
    if (
      assetType.includes("bank") ||
      assetType.includes("investment") ||
      assetType.includes("pension")
    ) {
      return AssetCategory.FINANCIAL;
    }
    if (assetType.includes("property") || assetType.includes("land")) {
      return AssetCategory.PROPERTY;
    }
    if (assetType.includes("business")) {
      return AssetCategory.BUSINESS;
    }
    if (assetType.includes("digital") || assetType.includes("cryptocurrency")) {
      return AssetCategory.DIGITAL;
    }

    return AssetCategory.PERSONAL;
  };

  const handleFieldChange = (field: keyof AssetFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    switch (currentStep) {
      case 2: // Details
        if (!formData.name) {
          stepErrors.name = "Asset name is required";
        }
        break;

      case 3: // Value
        if (!formData.value || formData.value <= 0) {
          stepErrors.value = "Please enter a valid value";
        }
        if (!formData.currency) {
          stepErrors.currency = "Please select a currency";
        }
        break;
    }

    setErrors(stepErrors);

    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 2, 2)); // Don't go below step 2 for edit
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      // Validate entire form
      const validationResult = IrishAssetFormSchema.safeParse(formData);

      if (!validationResult.success) {
        const fieldErrors = validationResult.error.flatten().fieldErrors;
        const errorMap: Record<string, string> = {};

        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            errorMap[field] = messages[0];
          }
        });

        setErrors(errorMap);

        return;
      }

      const response = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      });

      if (response.ok) {
        router.push("/assets");
      } else {
        const error = await response.json();

        console.error("Failed to update asset:", error);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeDefinition = (assetType: AssetType) => {
    return IrishAssetTypeDefinitions[assetType];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 2: // Asset Details
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Asset Details</h3>
            <div className="space-y-4">
              <Input
                isRequired
                errorMessage={errors.name}
                isInvalid={!!errors.name}
                label="Asset Name"
                placeholder="e.g., Main Bank Account, Family Home"
                size="lg"
                value={formData.name || ""}
                onValueChange={(value) => handleFieldChange("name", value)}
              />

              <Textarea
                errorMessage={errors.description}
                isInvalid={!!errors.description}
                label="Description"
                placeholder="Additional details about this asset (optional)"
                size="lg"
                value={formData.description || ""}
                onValueChange={(value) =>
                  handleFieldChange("description", value)
                }
              />

              {/* Type-specific fields */}
              {formData.category === AssetCategory.FINANCIAL && (
                <div className="space-y-4">
                  <Input
                    label="Bank/Institution Name"
                    placeholder="e.g., Bank of Ireland"
                    size="lg"
                    value={formData.irish_fields?.irish_bank_name || ""}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        irish_fields: {
                          ...prev.irish_fields,
                          irish_bank_name: value as any,
                        },
                      }));
                    }}
                  />
                  <Input
                    label="IBAN"
                    placeholder="IE29 AIBK 9311 5212 3456 78"
                    size="lg"
                    value={formData.irish_fields?.iban || ""}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        irish_fields: {
                          ...prev.irish_fields,
                          iban: value,
                        },
                      }));
                    }}
                  />
                </div>
              )}

              {formData.category === AssetCategory.PROPERTY && (
                <div className="space-y-4">
                  <Input
                    label="Eircode"
                    placeholder="D02 XY45"
                    size="lg"
                    value={formData.irish_fields?.eircode || ""}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        irish_fields: {
                          ...prev.irish_fields,
                          eircode: value,
                        },
                      }));
                    }}
                  />
                  <Input
                    label="Property Type"
                    placeholder="Detached House, Apartment, etc."
                    size="lg"
                    value={formData.irish_fields?.property_type || ""}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        irish_fields: {
                          ...prev.irish_fields,
                          property_type: value as any,
                        },
                      }));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Value
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Asset Value</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Select
                  className="flex-shrink-0 w-40"
                  label="Currency"
                  selectedKeys={formData.currency ? [formData.currency] : []}
                  size="lg"
                  onSelectionChange={(keys) => {
                    const currency = Array.from(keys)[0] as string;

                    handleFieldChange("currency", currency);
                  }}
                >
                  {CurrencyOptions.map((currency) => (
                    <SelectItem key={currency.value}>
                      {currency.symbol}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  isRequired
                  className="flex-1"
                  errorMessage={errors.value}
                  isInvalid={!!errors.value}
                  label="Current Value"
                  placeholder="0.00"
                  size="lg"
                  startContent={
                    <CurrencyDollarIcon className="h-5 w-5 text-default-400" />
                  }
                  type="number"
                  value={formData.value?.toString() || ""}
                  onValueChange={(value) =>
                    handleFieldChange("value", parseFloat(value) || 0)
                  }
                />
              </div>

              {formData.value && formData.value > 0 && (
                <Card className="bg-default-50 dark:bg-default-900/20">
                  <CardBody className="p-4">
                    <p className="text-default-600">
                      Formatted value:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(
                          formData.value,
                          formData.currency as CurrencyCode,
                        )}
                      </span>
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Review Asset Details</h3>

            <Card>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-default-600">Category:</span>
                    <span className="font-medium">
                      {formData.category &&
                        AssetCategoryDefinitions[formData.category]?.name}
                    </span>
                  </div>

                  <Divider />

                  <div className="flex justify-between items-center">
                    <span className="text-default-600">Type:</span>
                    <span className="font-medium">
                      {formData.asset_type &&
                        getTypeDefinition(formData.asset_type)?.name}
                    </span>
                  </div>

                  <Divider />

                  <div className="flex justify-between items-center">
                    <span className="text-default-600">Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>

                  <Divider />

                  <div className="flex justify-between items-center">
                    <span className="text-default-600">Value:</span>
                    <span className="font-medium text-success-600 text-lg">
                      {formatCurrency(
                        formData.value || 0,
                        formData.currency as CurrencyCode,
                      )}
                    </span>
                  </div>

                  {formData.description && (
                    <>
                      <Divider />
                      <div>
                        <span className="text-default-600 block mb-2">
                          Description:
                        </span>
                        <p className="text-sm bg-default-100 dark:bg-default-800/50 p-3 rounded-lg">
                          {formData.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-600">Loading asset...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Asset not found</h3>
          <p className="text-default-600 mb-6">
            The asset you're looking for doesn't exist or you don't have
            permission to edit it.
          </p>
          <Button color="primary" onPress={() => router.push("/assets")}>
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const editSteps = steps.slice(2); // Only show steps 2-4 for editing

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="light"
          onPress={() => router.push("/assets")}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Asset</h1>
          <p className="text-default-600 mt-1">
            Step {currentStep - 1} of {editSteps.length}:{" "}
            {steps[currentStep]?.name}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <Card>
        <CardBody className="p-6">
          <div className="space-y-4">
            <Progress
              className="w-full"
              color="primary"
              size="sm"
              value={((currentStep - 1) / editSteps.length) * 100}
            />
            <div className="flex items-center justify-between">
              {editSteps.map((step, index) => {
                const stepIndex = index + 2; // Adjust for skipped steps

                return (
                  <div
                    key={step.id}
                    className={`text-center ${
                      stepIndex <= currentStep
                        ? "text-primary"
                        : "text-default-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto mb-1 ${
                        stepIndex <= currentStep
                          ? "bg-primary text-white"
                          : "bg-default-200 text-default-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p className="text-xs font-medium hidden sm:block">
                      {step.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-2">
          <div>
            <h2 className="text-lg font-semibold">
              {steps[currentStep]?.name}
            </h2>
            <p className="text-sm text-default-600">
              {steps[currentStep]?.description}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardBody>
        <Divider />
        <CardBody className="py-4">
          <div className="flex justify-between">
            <Button
              isDisabled={isLoading}
              variant="bordered"
              onPress={
                currentStep === 2
                  ? () => router.push("/assets")
                  : handlePrevious
              }
            >
              {currentStep === 2 ? "Cancel" : "Previous"}
            </Button>

            <Button
              color="primary"
              isDisabled={
                (currentStep === 2 && !formData.name) ||
                (currentStep === 3 && (!formData.value || formData.value <= 0))
              }
              isLoading={isLoading}
              onPress={
                currentStep === steps.length - 1 ? handleSubmit : handleNext
              }
            >
              {currentStep === steps.length - 1 ? "Update Asset" : "Next"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
