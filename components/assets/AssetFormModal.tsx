"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  Divider,
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  CheckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

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
  getAssetTypesByCategory,
} from "@/types/assets";
import { Asset } from "@/db/schema";

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssetFormData) => Promise<void>;
  editingAsset?: Asset | null;
  isLoading?: boolean;
}

export function AssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingAsset,
  isLoading = false,
}: AssetFormModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<AssetFormData>>({
    currency: CurrencyCode.EUR,
    jurisdiction: JurisdictionCode.IE,
    value: 0,
    irish_fields: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any>(null);

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

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen && !categories) {
      fetchCategories();
    }
  }, [isOpen, categories]);

  // Initialize form data when editing
  useEffect(() => {
    if (editingAsset) {
      setFormData({
        name: editingAsset.name,
        asset_type: editingAsset.asset_type as AssetType,
        category: getCategoryFromAssetType(editingAsset.asset_type),
        value: editingAsset.value,
        currency: CurrencyCode.EUR, // Default for Ireland
        jurisdiction: JurisdictionCode.IE,
        description: editingAsset.description || "",
        irish_fields: {
          iban: editingAsset.account_number || undefined,
          irish_bank_name: (editingAsset.bank_name as any) || undefined,
          eircode: editingAsset.property_address
            ? editingAsset.property_address.split(",")[0]
            : undefined,
        },
      });
      setCurrentStep(2); // Skip category and type selection when editing
    } else {
      // Reset form for new asset
      setFormData({
        currency: CurrencyCode.EUR,
        jurisdiction: JurisdictionCode.IE,
        value: 0,
        irish_fields: {},
      });
      setCurrentStep(0);
    }
    setErrors({});
  }, [editingAsset, isOpen]);

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

    // Auto-advance for category selection (optional - can be removed if not desired)
    if (field === "category" && currentStep === 0) {
      // Reset asset_type when category changes
      setFormData((prev) => ({ ...prev, asset_type: undefined }));
      // Auto-advance to next step after a brief delay
      setTimeout(() => {
        setCurrentStep(1);
      }, 300);
    }
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

      await onSubmit(validationResult.data);
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const getAvailableTypes = () => {
    if (!formData.category) return [];

    return getAssetTypesByCategory(formData.category);
  };

  const getTypeDefinition = (assetType: AssetType) => {
    return IrishAssetTypeDefinitions[assetType];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Category Selection
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Select Asset Category
              </h3>
              <div className="grid grid-cols-1 gap-3">
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
                      <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h4 className="font-semibold">{category.name}</h4>
                            <p className="text-sm text-default-600">
                              {category.description}
                            </p>
                          </div>
                          {formData.category === key && (
                            <CheckIcon className="h-5 w-5 text-primary ml-auto" />
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ),
                )}
              </div>
              {errors.category && (
                <p className="text-danger text-sm mt-2">{errors.category}</p>
              )}
            </div>
          </div>
        );

      case 1: // Asset Type Selection
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Select{" "}
                {formData.category &&
                  AssetCategoryDefinitions[formData.category]?.name}{" "}
                Type
              </h3>
              <p className="text-sm text-default-600 mb-4">
                Choose the specific type of{" "}
                {formData.category &&
                  AssetCategoryDefinitions[
                    formData.category
                  ]?.name.toLowerCase()}{" "}
                you want to add.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {getAvailableTypes().map((assetType) => {
                  const typeDef = getTypeDefinition(assetType);

                  return (
                    <Card
                      key={assetType}
                      isPressable
                      className={`cursor-pointer transition-all ${
                        formData.asset_type === assetType
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "hover:border-default-400"
                      }`}
                      onPress={() => handleFieldChange("asset_type", assetType)}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-base">
                            {typeDef?.name ||
                              assetType
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                                )
                                .join(" ")}
                          </span>
                          {formData.asset_type === assetType && (
                            <CheckIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
              {errors.asset_type && (
                <p className="text-danger text-sm mt-2">{errors.asset_type}</p>
              )}
            </div>
          </div>
        );

      case 2: // Asset Details
        return (
          <div className="space-y-4">
            <Input
              isRequired
              errorMessage={errors.name}
              isInvalid={!!errors.name}
              label="Asset Name"
              placeholder="e.g., Main Bank Account, Family Home"
              value={formData.name || ""}
              onValueChange={(value) => handleFieldChange("name", value)}
            />

            <Textarea
              errorMessage={errors.description}
              isInvalid={!!errors.description}
              label="Description"
              placeholder="Additional details about this asset (optional)"
              value={formData.description || ""}
              onValueChange={(value) => handleFieldChange("description", value)}
            />

            {/* Type-specific fields - TODO: Implement Irish-specific fields */}
            {formData.category === AssetCategory.FINANCIAL && (
              <>
                <Input
                  label="Bank/Institution Name"
                  placeholder="e.g., Bank of Ireland"
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
              </>
            )}

            {formData.category === AssetCategory.PROPERTY && (
              <>
                <Input
                  label="Eircode"
                  placeholder="D02 XY45"
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
              </>
            )}
          </div>
        );

      case 3: // Value
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Select
                className="flex-shrink-0 w-32"
                label="Currency"
                selectedKeys={formData.currency ? [formData.currency] : []}
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
                startContent={
                  <CurrencyDollarIcon className="h-4 w-4 text-default-400" />
                }
                type="number"
                value={formData.value?.toString() || ""}
                onValueChange={(value) =>
                  handleFieldChange("value", parseFloat(value) || 0)
                }
              />
            </div>

            {formData.value && formData.value > 0 && (
              <div className="bg-default-100 dark:bg-default-800/50 rounded-lg p-3">
                <p className="text-sm text-default-600">
                  Formatted value:{" "}
                  <span className="font-semibold">
                    {formatCurrency(
                      formData.value,
                      formData.currency as CurrencyCode,
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Asset Details</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-default-600">Category:</span>
                <span className="font-medium">
                  {formData.category &&
                    AssetCategoryDefinitions[formData.category]?.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-default-600">Type:</span>
                <span className="font-medium">
                  {formData.asset_type &&
                    getTypeDefinition(formData.asset_type)?.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-default-600">Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-default-600">Value:</span>
                <span className="font-medium text-success-600">
                  {formatCurrency(
                    formData.value || 0,
                    formData.currency as CurrencyCode,
                  )}
                </span>
              </div>

              {formData.description && (
                <div>
                  <span className="text-default-600">Description:</span>
                  <p className="mt-1 text-sm">{formData.description}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      classNames={{
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold">
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </h2>
            <Button isIconOnly variant="light" onPress={onClose}>
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    index <= currentStep
                      ? "bg-primary text-white"
                      : "bg-default-200 text-default-600"
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      index < currentStep ? "bg-primary" : "bg-default-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-2">
            <h3 className="font-medium">{steps[currentStep]?.name}</h3>
            <p className="text-sm text-default-600">
              {steps[currentStep]?.description}
            </p>
          </div>
        </ModalHeader>

        <Divider />

        <ModalBody className="py-6">
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
        </ModalBody>

        <Divider />

        <ModalFooter>
          <div className="flex justify-between w-full">
            <Button
              isDisabled={isLoading}
              variant="bordered"
              onPress={currentStep === 0 ? onClose : handlePrevious}
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
              {currentStep === steps.length - 1
                ? editingAsset
                  ? "Update Asset"
                  : "Create Asset"
                : "Next"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
