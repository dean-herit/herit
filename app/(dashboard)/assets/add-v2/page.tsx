"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  ArrowLeftIcon,
  CheckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

// Import the new type-specific schemas
import {
  AssetFormSchema,
  AssetCategory,
  AssetCategoryDefinitions,
  getAssetTypesByCategory,
  getAssetTypeDefinition,
  CurrencyOptions,
  CurrencyCode,
  JurisdictionCode,
  formatCurrency,
  // Import specific asset types
  FinancialAssetType,
  PropertyAssetType,
  DigitalAssetType,
  // Import specific enums
  IrishBankName,
  IrishAccountType,
  IrishStockbroker,
  IrishPropertyType,
  CryptocurrencyType,
  CryptoWalletType,
} from "@/types/assets-v2";

// Create a more flexible form state type
type FormState = {
  name?: string;
  asset_type?: any;
  category?: AssetCategory;
  jurisdiction?: JurisdictionCode;
  value?: number;
  currency?: CurrencyCode;
  description?: string;
  specific_fields?: Record<string, any>;
  notes?: string;
};

export default function AddAssetV2Page() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormState>({
    jurisdiction: JurisdictionCode.IE,
    currency: CurrencyCode.EUR,
    value: 0,
    specific_fields: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

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

  const handleFieldChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Auto-advance for category selection
    if (field === "category" && currentStep === 0) {
      // Reset asset_type when category changes
      setFormData((prev) => ({ ...prev, asset_type: undefined }));
      // Auto-advance to next step after a brief delay
      setTimeout(() => {
        setCurrentStep(1);
      }, 300);
    }
  };

  const handleSpecificFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      specific_fields: {
        ...prev.specific_fields,
        [field]: value,
      },
    }));
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // Category
        if (!formData.category) {
          stepErrors.category = "Please select a category";
        }
        break;

      case 1: // Asset Type
        if (!formData.asset_type) {
          stepErrors.asset_type = "Please select an asset type";
        }
        break;

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
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validate using the discriminated union schema
      const validationResult = AssetFormSchema.safeParse(formData);

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

      console.log("Validated form data:", validationResult.data);

      // Send to API endpoint
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      });

      if (response.ok) {
        const result = await response.json();

        console.log("Asset created successfully:", result);
        router.push("/assets");
      } else {
        const error = await response.json();

        console.error("Failed to create asset:", error);

        // Extract validation errors if present
        if (error.details) {
          const errorMap: Record<string, string> = {};

          // Check both V2 and V1 error details
          const errorDetails = error.details.v2_errors || error.details;

          Object.entries(errorDetails).forEach(([field, messages]) => {
            if (messages && Array.isArray(messages) && messages.length > 0) {
              errorMap[field] = messages[0];
            }
          });

          setErrors(errorMap);
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    if (!formData.asset_type) return null;

    const specificFields = formData.specific_fields || {};

    switch (formData.asset_type) {
      case FinancialAssetType.IRISH_BANK_ACCOUNT:
        return (
          <div className="space-y-4">
            <Select
              isRequired
              label="Bank Name"
              selectedKeys={
                specificFields.irish_bank_name
                  ? [specificFields.irish_bank_name]
                  : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                handleSpecificFieldChange("irish_bank_name", value);
              }}
            >
              {Object.entries(IrishBankName).map(([key, value]) => (
                <SelectItem key={value}>{value}</SelectItem>
              ))}
            </Select>

            <Input
              isRequired
              label="IBAN"
              placeholder="IE29 AIBK 9311 5212 3456 78"
              value={specificFields.iban || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("iban", value)
              }
            />

            <Select
              label="Account Type"
              selectedKeys={
                specificFields.irish_account_type
                  ? [specificFields.irish_account_type]
                  : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                handleSpecificFieldChange("irish_account_type", value);
              }}
            >
              {Object.entries(IrishAccountType).map(([key, value]) => (
                <SelectItem key={value}>{value}</SelectItem>
              ))}
            </Select>
          </div>
        );

      case FinancialAssetType.INDIVIDUAL_STOCK_HOLDING:
        return (
          <div className="space-y-4">
            <Input
              isRequired
              label="Company Name"
              placeholder="e.g., Apple Inc."
              value={specificFields.company_name || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("company_name", value)
              }
            />

            <Input
              isRequired
              label="Ticker Symbol"
              placeholder="e.g., AAPL"
              value={specificFields.ticker_symbol || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("ticker_symbol", value)
              }
            />

            <Input
              isRequired
              label="Number of Shares"
              type="number"
              value={specificFields.number_of_shares?.toString() || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange(
                  "number_of_shares",
                  parseInt(value) || 0,
                )
              }
            />

            <Select
              isRequired
              label="Stockbroker"
              selectedKeys={
                specificFields.stockbroker ? [specificFields.stockbroker] : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                handleSpecificFieldChange("stockbroker", value);
              }}
            >
              {Object.entries(IrishStockbroker).map(([key, value]) => (
                <SelectItem key={value}>{value}</SelectItem>
              ))}
            </Select>

            <Input
              label="ISIN Code (Optional)"
              placeholder="IE00XXXXXXXXX"
              value={specificFields.isin_code || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("isin_code", value)
              }
            />
          </div>
        );

      case PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY:
        return (
          <div className="space-y-4">
            <Input
              isRequired
              label="Eircode"
              placeholder="D02 XY45"
              value={specificFields.eircode || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("eircode", value)
              }
            />

            <Input
              isRequired
              label="Folio Number"
              placeholder="Property folio number"
              value={specificFields.folio_number || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("folio_number", value)
              }
            />

            <Select
              isRequired
              label="Property Type"
              selectedKeys={
                specificFields.property_type
                  ? [specificFields.property_type]
                  : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                handleSpecificFieldChange("property_type", value);
              }}
            >
              {Object.entries(IrishPropertyType).map(([key, value]) => (
                <SelectItem key={value}>{value}</SelectItem>
              ))}
            </Select>

            <Input
              label="LPT Valuation (Optional)"
              type="number"
              value={specificFields.lpt_valuation?.toString() || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange(
                  "lpt_valuation",
                  parseFloat(value) || 0,
                )
              }
            />
          </div>
        );

      case DigitalAssetType.CRYPTOCURRENCY:
        return (
          <div className="space-y-4">
            <Select
              isRequired
              label="Cryptocurrency Type"
              selectedKeys={
                specificFields.cryptocurrency_type
                  ? [specificFields.cryptocurrency_type]
                  : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                handleSpecificFieldChange("cryptocurrency_type", value);
              }}
            >
              {Object.entries(CryptocurrencyType).map(([key, value]) => (
                <SelectItem key={value}>{value}</SelectItem>
              ))}
            </Select>

            <Select
              isRequired
              label="Wallet Type"
              selectedKeys={
                specificFields.wallet_type ? [specificFields.wallet_type] : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                handleSpecificFieldChange("wallet_type", value);
              }}
            >
              {Object.entries(CryptoWalletType).map(([key, value]) => (
                <SelectItem key={value}>{value}</SelectItem>
              ))}
            </Select>

            <Input
              label="Wallet Address (Optional)"
              placeholder="Wallet address or identifier"
              value={specificFields.wallet_address || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("wallet_address", value)
              }
            />

            <Input
              label="Amount Held (Optional)"
              step="0.00000001"
              type="number"
              value={specificFields.amount_held?.toString() || ""}
              onValueChange={(value) =>
                handleSpecificFieldChange("amount_held", parseFloat(value) || 0)
              }
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-6 text-default-600">
            <p>Specific fields for {formData.asset_type} will be shown here.</p>
            <p className="text-sm mt-2">
              This asset type schema is not yet implemented in the UI.
            </p>
          </div>
        );
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Category Selection
        return (
          <div className="space-y-6">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(AssetCategoryDefinitions).map(
                  ([key, category]) => (
                    <Card
                      key={key}
                      isPressable
                      className={`cursor-pointer transition-all ${
                        formData.category === key
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "hover:border-default-400"
                      }`}
                      onPress={() =>
                        handleFieldChange("category", key as AssetCategory)
                      }
                    >
                      <CardBody className="p-6">
                        <div className="flex items-start gap-4">
                          <span className="text-2xl mt-1">{category.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-lg">
                              {category.name}
                            </h4>
                            <p className="text-sm text-default-600 mt-2">
                              {category.description}
                            </p>
                          </div>
                          {formData.category === key && (
                            <CheckIcon className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ),
                )}
              </div>
              {errors.category && (
                <p className="text-danger text-sm mt-4">{errors.category}</p>
              )}
            </div>
          </div>
        );

      case 1: // Asset Type Selection
        const availableTypes = formData.category
          ? getAssetTypesByCategory(formData.category)
          : [];

        return (
          <div className="space-y-6">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTypes
                  .filter((assetType) => {
                    // Only show asset types that have complete definitions
                    const typeDef = getAssetTypeDefinition(assetType);
                    return typeDef && typeDef.name && typeDef.description;
                  })
                  .map((assetType) => {
                    const typeDef = getAssetTypeDefinition(assetType);

                    return (
                      <Card
                        key={assetType}
                        isPressable
                        className={`cursor-pointer transition-all ${
                          formData.asset_type === assetType
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "hover:border-default-400"
                        }`}
                        onPress={() => {
                          handleFieldChange("asset_type", assetType);
                          handleFieldChange(
                            "category",
                            typeDef?.category || AssetCategory.PERSONAL,
                          );
                        }}
                      >
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{typeDef?.icon}</span>
                            <span className="font-medium text-base">
                              {typeDef?.name}
                            </span>
                          </div>
                          {formData.asset_type === assetType && (
                            <CheckIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        {typeDef?.description && (
                          <p className="text-xs text-default-600 mt-2">
                            {typeDef.description}
                          </p>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
              {errors.asset_type && (
                <p className="text-danger text-sm mt-4">{errors.asset_type}</p>
              )}
            </div>
          </div>
        );

      case 2: // Asset Details
        return (
          <div className="space-y-6">
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

              {/* Type-specific fields based on selected asset type */}
              {renderTypeSpecificFields()}
            </div>
          </div>
        );

      case 3: // Value
        return (
          <div className="space-y-6">
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
        const typeDef = formData.asset_type
          ? getAssetTypeDefinition(formData.asset_type)
          : null;

        return (
          <div className="space-y-6">
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
                    <span className="font-medium">{typeDef?.name}</span>
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

                  {formData.specific_fields &&
                    Object.keys(formData.specific_fields).length > 0 && (
                      <>
                        <Divider />
                        <div>
                          <span className="text-default-600 block mb-2">
                            Specific Details:
                          </span>
                          <div className="text-sm bg-default-100 dark:bg-default-800/50 p-3 rounded-lg space-y-1">
                            {Object.entries(formData.specific_fields).map(
                              ([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="capitalize">
                                    {key.replace(/_/g, " ")}:
                                  </span>
                                  <span>{value?.toString()}</span>
                                </div>
                              ),
                            )}
                          </div>
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

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="light" onPress={() => router.back()}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Add New Asset
          </h1>
          <p className="text-default-600 mt-1">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.name}
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
              value={progressPercentage}
            />
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`text-center ${
                    index <= currentStep ? "text-primary" : "text-default-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto mb-1 ${
                      index <= currentStep
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
              ))}
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
              onPress={currentStep === 0 ? () => router.back() : handlePrevious}
            >
              {currentStep === 0 ? "Cancel" : "Previous"}
            </Button>

            <Button
              color="primary"
              isDisabled={
                (currentStep === 0 && !formData.category) ||
                (currentStep === 1 && !formData.asset_type) ||
                (currentStep === 2 && !formData.name) ||
                (currentStep === 3 && (!formData.value || formData.value <= 0))
              }
              isLoading={isLoading}
              onPress={
                currentStep === steps.length - 1 ? handleSubmit : handleNext
              }
            >
              {currentStep === steps.length - 1 ? "Create Asset" : "Next"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
