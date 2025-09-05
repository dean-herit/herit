"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { useUpdateRule, useValidateAllocation } from "@/app/hooks/useRules";
import { InheritanceRule, RuleAllocation } from "@/db/schema";
import { willQueryOptions, assetsQueryOptions } from "@/app/lib/query-options";

// Validation schema
const editRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required").max(255),
  description: z.string().optional(),
  priority: z.number().min(1).max(100),
  is_active: z.boolean(),
  conditions: z
    .array(
      z.object({
        fact: z.string().min(1, "Fact is required"),
        operator: z.string().min(1, "Operator is required"),
        value: z.union([z.string(), z.number(), z.boolean()]),
      }),
    )
    .min(1, "At least one condition is required"),
  allocations: z
    .array(
      z.object({
        asset_id: z.string().uuid("Invalid asset ID"),
        beneficiary_id: z.string().uuid("Invalid beneficiary ID"),
        allocation_percentage: z.number().min(0).max(100).optional(),
        allocation_amount: z.number().min(0).optional(),
      }),
    )
    .min(1, "At least one allocation is required"),
});

type EditRuleFormData = z.infer<typeof editRuleSchema>;

interface EditRuleModalProps {
  isOpen: boolean;
  rule: InheritanceRule & { allocations: RuleAllocation[] };
  onClose: () => void;
  onSuccess: () => void;
}

const FACT_OPTIONS = [
  { key: "beneficiary-age", label: "Beneficiary Age" },
  { key: "beneficiary-relationship", label: "Relationship to Deceased" },
  { key: "education-completed", label: "Education Completed" },
  { key: "employment-status", label: "Employment Status" },
  { key: "sobriety-period", label: "Sobriety Period (Days)" },
  { key: "marriage-status", label: "Marriage Status" },
  { key: "children-count", label: "Number of Children" },
  { key: "asset-type", label: "Asset Type" },
  { key: "asset-value", label: "Asset Value" },
];

const OPERATOR_OPTIONS = [
  { key: "equal", label: "Equals" },
  { key: "notEqual", label: "Not Equal" },
  { key: "greaterThan", label: "Greater Than" },
  { key: "greaterThanInclusive", label: "Greater Than or Equal" },
  { key: "lessThan", label: "Less Than" },
  { key: "lessThanInclusive", label: "Less Than or Equal" },
  { key: "in", label: "Is One Of" },
  { key: "notIn", label: "Is Not One Of" },
  { key: "contains", label: "Contains" },
];

export function EditRuleModal({
  isOpen,
  rule,
  onClose,
  onSuccess,
}: EditRuleModalProps) {
  const componentProps = {};
  const [currentStep, setCurrentStep] = useState(0);
  const [validationResult, setValidationResult] = useState<any>(null);

  const updateRuleMutation = useUpdateRule();
  const validateAllocationMutation = useValidateAllocation();

  // Fetch required data
  const { data: beneficiariesData } = useQuery(
    willQueryOptions.beneficiaries(),
  );
  const { data: assetsData } = useQuery(assetsQueryOptions.all());

  const beneficiaries = beneficiariesData || [];
  const assets = assetsData || [];

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditRuleFormData>({
    resolver: zodResolver(editRuleSchema),
    defaultValues: {
      name: rule.name,
      description: rule.description || "",
      priority: rule.priority ?? 1,
      is_active: rule.is_active ?? true,
      conditions: (rule.rule_definition as any)?.conditions?.all?.map(
        (cond: any) => ({
          fact: cond.fact,
          operator: cond.operator,
          value: cond.value,
        }),
      ) || [{ fact: "", operator: "equal", value: "" }],
      allocations: rule.allocations.map((alloc) => ({
        asset_id: alloc.asset_id,
        beneficiary_id: alloc.beneficiary_id,
        allocation_percentage: alloc.allocation_percentage || undefined,
        allocation_amount: alloc.allocation_amount || undefined,
      })) || [{ asset_id: "", beneficiary_id: "", allocation_percentage: 0 }],
    },
  });

  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({
    control,
    name: "conditions",
  });

  const {
    fields: allocationFields,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({
    control,
    name: "allocations",
  });

  // Watch allocations for validation
  const watchedAllocations = watch("allocations");

  // Validate allocations in real-time
  useEffect(() => {
    if (watchedAllocations && watchedAllocations.length > 0) {
      const validAllocations = watchedAllocations.filter(
        (alloc) => alloc.asset_id && alloc.beneficiary_id,
      );

      if (validAllocations.length > 0) {
        validateAllocationMutation.mutate(
          {
            allocations: validAllocations,
            exclude_rule_id: rule.id, // Exclude current rule when editing
          },
          {
            onSuccess: (result) => {
              setValidationResult(result);
            },
          },
        );
      }
    }
  }, [watchedAllocations, validateAllocationMutation, rule.id]);

  const onSubmit = async (data: EditRuleFormData) => {
    try {
      // Create rule definition in json-rules-engine format
      const ruleDefinition = {
        conditions: data.conditions.map((condition) => ({
          fact: condition.fact,
          operator: condition.operator,
          value: condition.value,
        })),
        event: {
          type: "inheritance-rule-triggered",
          params: {
            rule_name: data.name,
            allocations: data.allocations,
          },
        },
      };

      await updateRuleMutation.mutateAsync({
        id: rule.id,
        name: data.name,
        description: data.description,
        rule_definition: ruleDefinition,
        priority: data.priority,
        is_active: data.is_active,
        allocations: data.allocations,
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to update rule:", error);
    }
  };

  const steps = [
    { title: "Basic Information", description: "Rule name and description" },
    { title: "Conditions", description: "When this rule should apply" },
    { title: "Allocations", description: "How assets should be distributed" },
    { title: "Review", description: "Review and save changes" },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Reset form when rule changes
  useEffect(() => {
    if (rule) {
      reset({
        name: rule.name,
        description: rule.description || "",
        priority: rule.priority ?? 1,
        is_active: rule.is_active ?? true,
        conditions: (rule.rule_definition as any)?.conditions?.all?.map(
          (cond: any) => ({
            fact: cond.fact,
            operator: cond.operator,
            value: cond.value,
          }),
        ) || [{ fact: "", operator: "equal", value: "" }],
        allocations: rule.allocations.map((alloc) => ({
          asset_id: alloc.asset_id,
          beneficiary_id: alloc.beneficiary_id,
          allocation_percentage: alloc.allocation_percentage || undefined,
          allocation_amount: alloc.allocation_amount || undefined,
        })) || [{ asset_id: "", beneficiary_id: "", allocation_percentage: 0 }],
      });
      setCurrentStep(0);
      setValidationResult(null);
    }
  }, [rule, reset]);

  return (
    <Modal
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="4xl"
      onClose={onClose}
    >
      <ModalContent {...componentProps}>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Edit Inheritance Rule</h2>
          <p className="text-sm text-gray-600">
            Modify the conditions and allocations for this rule
          </p>
        </ModalHeader>

        <ModalBody>
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-px bg-gray-200 flex-1 mt-4 ${
                      index < currentStep ? "bg-primary" : ""
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form
            data-testid="rule-button-edit"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      errorMessage={errors.name?.message}
                      isInvalid={!!errors.name}
                      label="Rule Name"
                      placeholder="Enter a descriptive name for this rule"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      errorMessage={errors.description?.message}
                      isInvalid={!!errors.description}
                      label="Description"
                      minRows={3}
                      placeholder="Describe when and how this rule should apply"
                    />
                  )}
                />

                <div className="flex gap-4">
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <Input
                        {...field}
                        className="flex-1"
                        data-testid="rule-input-edit"
                        errorMessage={errors.priority?.message}
                        isInvalid={!!errors.priority}
                        label="Priority"
                        max={100}
                        min={1}
                        placeholder="1"
                        type="number"
                        value={field.value?.toString()}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="is_active"
                    render={({ field }) => (
                      <div className="flex items-center mt-6">
                        <Checkbox
                          isSelected={field.value}
                          onValueChange={field.onChange}
                        >
                          Active Rule
                        </Checkbox>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Conditions */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Rule Conditions</h3>
                  <Button
                    color="primary"
                    data-testid="rule-button-edit"
                    size="sm"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    variant="flat"
                    onPress={() =>
                      appendCondition({
                        fact: "",
                        operator: "equal",
                        value: "",
                      })
                    }
                  >
                    Add Condition
                  </Button>
                </div>

                <p className="text-sm text-gray-600">
                  Define the conditions that must be met for this rule to apply.
                  All conditions must be true.
                </p>

                {conditionFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex gap-4 items-start">
                      <Controller
                        control={control}
                        name={`conditions.${index}.fact`}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isRequired
                            className="flex-1"
                            errorMessage={
                              errors.conditions?.[index]?.fact?.message
                            }
                            isInvalid={!!errors.conditions?.[index]?.fact}
                            label="Fact"
                            placeholder="Select a fact"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const value = Array.from(keys)[0] as string;

                              field.onChange(value);
                            }}
                          >
                            {FACT_OPTIONS.map((option) => (
                              <SelectItem key={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`conditions.${index}.operator`}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isRequired
                            className="flex-1"
                            errorMessage={
                              errors.conditions?.[index]?.operator?.message
                            }
                            isInvalid={!!errors.conditions?.[index]?.operator}
                            label="Operator"
                            placeholder="Select operator"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const value = Array.from(keys)[0] as string;

                              field.onChange(value);
                            }}
                          >
                            {OPERATOR_OPTIONS.map((option) => (
                              <SelectItem key={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`conditions.${index}.value`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            isRequired
                            className="flex-1"
                            data-testid="rule-input-edit"
                            errorMessage={
                              errors.conditions?.[index]?.value?.message
                            }
                            isInvalid={!!errors.conditions?.[index]?.value}
                            label="Value"
                            placeholder="Enter value"
                            value={field.value?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Try to parse as number first
                              const numValue = parseFloat(value);

                              if (!isNaN(numValue) && isFinite(numValue)) {
                                field.onChange(numValue);
                              } else if (value === "true") {
                                field.onChange(true);
                              } else if (value === "false") {
                                field.onChange(false);
                              } else {
                                field.onChange(value);
                              }
                            }}
                          />
                        )}
                      />

                      <Button
                        isIconOnly
                        className="mt-6"
                        color="danger"
                        data-testid="rule-button-edit"
                        isDisabled={conditionFields.length <= 1}
                        size="sm"
                        variant="light"
                        onPress={() => removeCondition(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 3: Allocations */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Asset Allocations</h3>
                  <Button
                    color="primary"
                    data-testid="rule-button-edit"
                    size="sm"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    variant="flat"
                    onPress={() =>
                      appendAllocation({
                        asset_id: "",
                        beneficiary_id: "",
                        allocation_percentage: 0,
                      })
                    }
                  >
                    Add Allocation
                  </Button>
                </div>

                <p className="text-sm text-gray-600">
                  Define how assets should be distributed when this rule is
                  triggered.
                </p>

                {/* Validation Results */}
                {validationResult && !validationResult.is_valid && (
                  <Card className="bg-danger-50 border-danger-200">
                    <CardBody>
                      <p className="text-danger font-medium mb-2">
                        ⚠️ Allocation Conflicts Detected
                      </p>
                      <p className="text-sm text-danger mb-3">
                        The following assets are over-allocated:
                      </p>
                      <div className="space-y-2">
                        {validationResult.asset_allocation_details
                          .filter((asset: any) => asset.is_over_allocated)
                          .map((asset: any) => (
                            <div key={asset.asset_id} className="text-sm">
                              <p className="font-medium">{asset.asset_name}</p>
                              <p className="text-xs">
                                Total allocated:{" "}
                                {asset.total_percentage_allocated}% (€
                                {asset.total_amount_allocated.toLocaleString()})
                              </p>
                              {asset.conflicting_rules.length > 0 && (
                                <p className="text-xs text-danger-600">
                                  Conflicts with:{" "}
                                  {asset.conflicting_rules
                                    .map((r: any) => r.rule_name)
                                    .join(", ")}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {allocationFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex gap-4 items-start">
                      <Controller
                        control={control}
                        name={`allocations.${index}.asset_id`}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isRequired
                            className="flex-1"
                            errorMessage={
                              errors.allocations?.[index]?.asset_id?.message
                            }
                            isInvalid={!!errors.allocations?.[index]?.asset_id}
                            label="Asset"
                            placeholder="Select an asset"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const value = Array.from(keys)[0] as string;

                              field.onChange(value);
                            }}
                          >
                            {assets.map((asset) => (
                              <SelectItem key={asset.id}>
                                {asset.name} (€{asset.value.toLocaleString()})
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`allocations.${index}.beneficiary_id`}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isRequired
                            className="flex-1"
                            errorMessage={
                              errors.allocations?.[index]?.beneficiary_id
                                ?.message
                            }
                            isInvalid={
                              !!errors.allocations?.[index]?.beneficiary_id
                            }
                            label="Beneficiary"
                            placeholder="Select a beneficiary"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const value = Array.from(keys)[0] as string;

                              field.onChange(value);
                            }}
                          >
                            {beneficiaries.map((beneficiary: any) => (
                              <SelectItem key={beneficiary.id}>
                                {beneficiary.name}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`allocations.${index}.allocation_percentage`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="w-32"
                            data-testid="rule-input-edit"
                            endContent="%"
                            errorMessage={
                              errors.allocations?.[index]?.allocation_percentage
                                ?.message
                            }
                            isInvalid={
                              !!errors.allocations?.[index]
                                ?.allocation_percentage
                            }
                            label="Percentage"
                            max={100}
                            min={0}
                            placeholder="50"
                            step={0.01}
                            type="number"
                            value={field.value?.toString() || ""}
                            onChange={(e) =>
                              field.onChange(
                                parseFloat(e.target.value) || undefined,
                              )
                            }
                          />
                        )}
                      />

                      <Button
                        isIconOnly
                        className="mt-6"
                        color="danger"
                        data-testid="rule-button-edit"
                        isDisabled={allocationFields.length <= 1}
                        size="sm"
                        variant="light"
                        onPress={() => removeAllocation(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Review Changes</h3>

                <Card>
                  <CardHeader>
                    <h4 className="font-medium">Rule Information</h4>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{watch("name")}</span>
                    </div>
                    {watch("description") && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium">
                          {watch("description")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className="font-medium">{watch("priority")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Chip
                        color={watch("is_active") ? "success" : "warning"}
                        size="sm"
                        variant="flat"
                      >
                        {watch("is_active") ? "Active" : "Inactive"}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-medium">
                      Conditions ({watch("conditions")?.length || 0})
                    </h4>
                  </CardHeader>
                  <CardBody>
                    {watch("conditions")?.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 py-1">
                        <Chip color="primary" size="sm" variant="flat">
                          {FACT_OPTIONS.find((f) => f.key === condition.fact)
                            ?.label || condition.fact}
                        </Chip>
                        <span className="text-sm text-gray-600">
                          {OPERATOR_OPTIONS.find(
                            (o) => o.key === condition.operator,
                          )?.label || condition.operator}
                        </span>
                        <Chip color="secondary" size="sm" variant="flat">
                          {condition.value?.toString()}
                        </Chip>
                      </div>
                    ))}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-medium">
                      Allocations ({watch("allocations")?.length || 0})
                    </h4>
                  </CardHeader>
                  <CardBody>
                    {watch("allocations")?.map((allocation, index) => {
                      const asset = assets.find(
                        (a) => a.id === allocation.asset_id,
                      );
                      const beneficiary = beneficiaries.find(
                        (b: any) => b.id === allocation.beneficiary_id,
                      );

                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b last:border-b-0"
                        >
                          <div>
                            <p className="font-medium">
                              {asset?.name || "Unknown Asset"}
                            </p>
                            <p className="text-sm text-gray-600">
                              to{" "}
                              {beneficiary
                                ? beneficiary.name
                                : "Unknown Beneficiary"}
                            </p>
                          </div>
                          <div className="text-right">
                            {allocation.allocation_percentage && (
                              <p className="font-medium">
                                {allocation.allocation_percentage}%
                              </p>
                            )}
                            {allocation.allocation_amount && (
                              <p className="text-sm text-gray-600">
                                €{allocation.allocation_amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>

                {validationResult && (
                  <Card
                    className={
                      validationResult.is_valid
                        ? "bg-success-50 border-success-200"
                        : "bg-danger-50 border-danger-200"
                    }
                  >
                    <CardBody>
                      <p
                        className={`font-medium ${validationResult.is_valid ? "text-success" : "text-danger"}`}
                      >
                        {validationResult.is_valid
                          ? "✅ All allocations are valid"
                          : "⚠️ Allocation conflicts detected"}
                      </p>
                      <div className="mt-2 text-sm space-y-1">
                        <p>
                          Assets checked:{" "}
                          {validationResult.summary.total_assets_checked}
                        </p>
                        <p>
                          Valid allocations:{" "}
                          {validationResult.summary.valid_allocations_count}
                        </p>
                        {validationResult.summary.over_allocated_count > 0 && (
                          <p className="text-danger">
                            Over-allocated assets:{" "}
                            {validationResult.summary.over_allocated_count}
                          </p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </form>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-between items-center w-full">
            <Button
              data-testid="rule-button-edit"
              startContent={<XMarkIcon className="w-4 h-4" />}
              variant="light"
              onPress={onClose}
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  data-testid="rule-button-edit"
                  variant="flat"
                  onPress={prevStep}
                >
                  Previous
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  color="primary"
                  data-testid="rule-button-edit"
                  onPress={nextStep}
                >
                  Next
                </Button>
              ) : (
                <Button
                  color="primary"
                  data-testid="rule-button-edit"
                  isDisabled={validationResult && !validationResult.is_valid}
                  isLoading={isSubmitting || updateRuleMutation.isPending}
                  onPress={() => handleSubmit(onSubmit)()}
                >
                  Update Rule
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
