"use client";

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
  Switch,
  Card,
  CardBody,
  CardHeader,
  Chip,
} from "@heroui/react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";

import {
  useCreateRule,
  useValidateAllocation,
  CreateRuleData,
} from "@/app/hooks/useRules";
import { assetsQueryOptions, willQueryOptions } from "@/app/lib/query-options";

// Form validation schema
const createRuleSchema = z.object({
  name: z
    .string()
    .min(1, "Rule name is required")
    .max(255, "Rule name too long"),
  description: z.string().optional(),
  priority: z.number().min(1).max(100),
  is_active: z.boolean(),
  conditions: z
    .array(
      z.object({
        fact: z.string().min(1, "Fact is required"),
        operator: z.string().min(1, "Operator is required"),
        value: z.any(),
      }),
    )
    .min(1, "At least one condition is required"),
  allocations: z
    .array(
      z.object({
        asset_id: z.string().uuid("Invalid asset"),
        beneficiary_id: z.string().uuid("Invalid beneficiary"),
        allocation_percentage: z.number().min(0).max(100).optional(),
        allocation_amount: z.number().min(0).optional(),
      }),
    )
    .min(1, "At least one allocation is required"),
});

type CreateRuleFormData = z.infer<typeof createRuleSchema>;

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Available facts for rule conditions
const AVAILABLE_FACTS = [
  {
    key: "beneficiary-age",
    label: "Beneficiary Age",
    operators: ["greaterThan", "lessThan", "equal"],
  },
  {
    key: "education-completed",
    label: "Education Completed",
    operators: ["equal"],
  },
  {
    key: "sobriety-period",
    label: "Sobriety Period (days)",
    operators: ["greaterThan", "lessThan", "equal"],
  },
  {
    key: "employment-status",
    label: "Employment Status",
    operators: ["equal", "in"],
  },
  { key: "marriage-status", label: "Marriage Status", operators: ["equal"] },
] as const;

const OPERATORS = {
  greaterThan: "Greater than",
  lessThan: "Less than",
  equal: "Equals",
  in: "Is one of",
  contains: "Contains",
} as const;

export function CreateRuleModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateRuleModalProps) {
  const componentProps = {};
  const [currentStep, setCurrentStep] = useState(1);

  const createRuleMutation = useCreateRule();
  const validateAllocationMutation = useValidateAllocation();

  // Fetch assets and beneficiaries
  const { data: assetsData } = useQuery(assetsQueryOptions.all());
  const { data: beneficiariesData } = useQuery(
    willQueryOptions.beneficiaries(),
  );

  const form = useForm<CreateRuleFormData>({
    resolver: zodResolver(createRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: 1,
      is_active: true,
      conditions: [{ fact: "", operator: "", value: "" }],
      allocations: [
        {
          asset_id: "",
          beneficiary_id: "",
          allocation_percentage: undefined,
          allocation_amount: undefined,
        },
      ],
    },
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form;

  const watchedAllocations = watch("allocations");
  const watchedConditions = watch("conditions");

  const handleAddCondition = () => {
    const currentConditions = form.getValues("conditions");

    setValue("conditions", [
      ...currentConditions,
      { fact: "", operator: "", value: "" },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    const currentConditions = form.getValues("conditions");

    if (currentConditions.length > 1) {
      setValue(
        "conditions",
        currentConditions.filter((_, i) => i !== index),
      );
    }
  };

  const handleAddAllocation = () => {
    const currentAllocations = form.getValues("allocations");

    setValue("allocations", [
      ...currentAllocations,
      {
        asset_id: "",
        beneficiary_id: "",
        allocation_percentage: undefined,
        allocation_amount: undefined,
      },
    ]);
  };

  const handleRemoveAllocation = (index: number) => {
    const currentAllocations = form.getValues("allocations");

    if (currentAllocations.length > 1) {
      setValue(
        "allocations",
        currentAllocations.filter((_, i) => i !== index),
      );
    }
  };

  const handleValidateAllocations = async () => {
    const allocations = watchedAllocations.filter(
      (alloc) =>
        alloc.asset_id &&
        alloc.beneficiary_id &&
        (alloc.allocation_percentage || alloc.allocation_amount),
    );

    if (allocations.length > 0) {
      try {
        const result = await validateAllocationMutation.mutateAsync({
          allocations,
        });

        return result.is_valid;
      } catch (error) {
        console.error("Validation error:", error);

        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: CreateRuleFormData) => {
    try {
      // Validate allocations first
      const isValidAllocation = await handleValidateAllocations();

      if (!isValidAllocation) {
        alert(
          "Some allocations exceed 100% for their assets. Please adjust the allocations.",
        );

        return;
      }

      // Create the rule definition in json-rules-engine format
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

      const createData: CreateRuleData = {
        name: data.name,
        description: data.description,
        rule_definition: ruleDefinition,
        priority: data.priority,
        is_active: data.is_active,
        allocations: data.allocations.filter(
          (alloc) =>
            alloc.asset_id &&
            alloc.beneficiary_id &&
            (alloc.allocation_percentage || alloc.allocation_amount),
        ),
      };

      await createRuleMutation.mutateAsync(createData);
      form.reset();
      setCurrentStep(1);
      onSuccess();
    } catch (error) {
      console.error("Failed to create rule:", error);
    }
  };

  const assets = assetsData || [];
  const beneficiaries = beneficiariesData || [];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const canProceedToStep2 =
    watch("name") && watchedConditions.some((c) => c.fact && c.operator);
  const canProceedToStep3 = watchedAllocations.some(
    (a) => a.asset_id && a.beneficiary_id,
  );

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="4xl"
      onOpenChange={onClose}
      {...componentProps}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold">
                Create New Inheritance Rule
              </h3>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 4 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 4:{" "}
                {currentStep === 1
                  ? "Basic Information"
                  : currentStep === 2
                    ? "Rule Conditions"
                    : currentStep === 3
                      ? "Asset Allocations"
                      : "Review & Create"}
              </div>
            </ModalHeader>

            <ModalBody>
              <form
                data-testid="form-7re89y23r"
                onSubmit={handleSubmit(onSubmit)}
              >
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
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
                          placeholder="e.g., College Graduation Requirement"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          label="Description"
                          placeholder="Optional description of what this rule accomplishes"
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
                            className="max-w-32"
                            data-testid="Input-vjculnfb4"
                            label="Priority"
                            max={100}
                            min={1}
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
                          <Switch
                            classNames={{
                              base: "inline-flex flex-row-reverse w-full max-w-md items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent data-[selected=true]:border-primary",
                              wrapper: "p-0 h-4 overflow-visible",
                              thumb:
                                "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 rtl:group-data-[selected=true]:ml-0 rtl:group-data-[selected=true]:mr-6",
                            }}
                            isSelected={field.value}
                            onValueChange={field.onChange}
                          >
                            <div className="flex flex-col gap-1">
                              <p className="text-medium">Rule Active</p>
                              <p className="text-tiny text-default-400">
                                Inactive rules will not be evaluated
                              </p>
                            </div>
                          </Switch>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Conditions */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium">Rule Conditions</h4>
                      <Button
                        data-testid="Button-jkpndby5h"
                        size="sm"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        variant="ghost"
                        onPress={handleAddCondition}
                      >
                        Add Condition
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {watchedConditions.map((condition, index) => (
                        <Card key={index}>
                          <CardBody>
                            <div className="flex items-end gap-4">
                              <Controller
                                control={control}
                                name={`conditions.${index}.fact`}
                                render={({ field }) => (
                                  <Select
                                    {...field}
                                    className="flex-1"
                                    label="Condition Type"
                                    selectedKeys={
                                      field.value ? [field.value] : []
                                    }
                                    onSelectionChange={(keys) => {
                                      const selectedKey = Array.from(
                                        keys,
                                      )[0] as string;

                                      field.onChange(selectedKey);
                                      // Reset operator when fact changes
                                      setValue(
                                        `conditions.${index}.operator`,
                                        "",
                                      );
                                    }}
                                  >
                                    {AVAILABLE_FACTS.map((fact) => (
                                      <SelectItem key={fact.key}>
                                        {fact.label}
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
                                    className="flex-1"
                                    isDisabled={!condition.fact}
                                    label="Operator"
                                    selectedKeys={
                                      field.value ? [field.value] : []
                                    }
                                    onSelectionChange={(keys) =>
                                      field.onChange(Array.from(keys)[0])
                                    }
                                  >
                                    {(condition.fact &&
                                      AVAILABLE_FACTS.find(
                                        (f) => f.key === condition.fact,
                                      )?.operators.map((op) => (
                                        <SelectItem key={op}>
                                          {OPERATORS[op]}
                                        </SelectItem>
                                      ))) ||
                                      []}
                                  </Select>
                                )}
                              />

                              <Controller
                                control={control}
                                name={`conditions.${index}.value`}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    className="flex-1"
                                    label="Value"
                                    placeholder="Enter value"
                                  />
                                )}
                              />

                              {watchedConditions.length > 1 && (
                                <Button
                                  isIconOnly
                                  color="danger"
                                  data-testid="Button-0euckudi0"
                                  variant="light"
                                  onPress={() => handleRemoveCondition(index)}
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Allocations */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium">Asset Allocations</h4>
                      <Button
                        data-testid="Button-76mtljomm"
                        size="sm"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        variant="ghost"
                        onPress={handleAddAllocation}
                      >
                        Add Allocation
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {watchedAllocations.map((allocation, index) => (
                        <Card key={index}>
                          <CardBody>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <Controller
                                control={control}
                                name={`allocations.${index}.asset_id`}
                                render={({ field }) => (
                                  <Select
                                    {...field}
                                    label="Asset"
                                    selectedKeys={
                                      field.value ? [field.value] : []
                                    }
                                    onSelectionChange={(keys) =>
                                      field.onChange(Array.from(keys)[0])
                                    }
                                  >
                                    {assets.map((asset) => (
                                      <SelectItem key={asset.id}>
                                        {asset.name} (€
                                        {asset.value.toLocaleString()})
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
                                    label="Beneficiary"
                                    selectedKeys={
                                      field.value ? [field.value] : []
                                    }
                                    onSelectionChange={(keys) =>
                                      field.onChange(Array.from(keys)[0])
                                    }
                                  >
                                    {beneficiaries.map(
                                      (beneficiary: {
                                        id: string;
                                        name: string;
                                      }) => (
                                        <SelectItem key={beneficiary.id}>
                                          {beneficiary.name}
                                        </SelectItem>
                                      ),
                                    )}
                                  </Select>
                                )}
                              />
                            </div>

                            <div className="flex gap-4 items-end">
                              <Controller
                                control={control}
                                name={`allocations.${index}.allocation_percentage`}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    className="flex-1"
                                    data-testid="Input-guoqgsoip"
                                    label="Percentage %"
                                    max={100}
                                    min={0}
                                    type="number"
                                    value={field.value?.toString() || ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);

                                      field.onChange(
                                        isNaN(val) ? undefined : val,
                                      );
                                    }}
                                  />
                                )}
                              />

                              <p className="text-sm text-gray-500 pb-2">OR</p>

                              <Controller
                                control={control}
                                name={`allocations.${index}.allocation_amount`}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    className="flex-1"
                                    data-testid="Input-cly6dg9ag"
                                    label="Fixed Amount €"
                                    min={0}
                                    type="number"
                                    value={field.value?.toString() || ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);

                                      field.onChange(
                                        isNaN(val) ? undefined : val,
                                      );
                                    }}
                                  />
                                )}
                              />

                              {watchedAllocations.length > 1 && (
                                <Button
                                  isIconOnly
                                  color="danger"
                                  data-testid="Button-cd464sxvd"
                                  variant="light"
                                  onPress={() => handleRemoveAllocation(index)}
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium">Review Rule</h4>

                    <Card>
                      <CardHeader>
                        <h5 className="font-medium">Rule Details</h5>
                      </CardHeader>
                      <CardBody className="space-y-2">
                        <div>
                          <strong>Name:</strong> {watch("name")}
                        </div>
                        {watch("description") && (
                          <div>
                            <strong>Description:</strong> {watch("description")}
                          </div>
                        )}
                        <div>
                          <strong>Priority:</strong> {watch("priority")}
                        </div>
                        <div>
                          <strong>Status:</strong>{" "}
                          {watch("is_active") ? "Active" : "Inactive"}
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h5 className="font-medium">
                          Conditions ({watchedConditions.length})
                        </h5>
                      </CardHeader>
                      <CardBody>
                        {watchedConditions.map((condition, index) => {
                          const fact = AVAILABLE_FACTS.find(
                            (f) => f.key === condition.fact,
                          );

                          return (
                            <Chip key={index} className="mb-2 mr-2">
                              {fact?.label}{" "}
                              {
                                OPERATORS[
                                  condition.operator as keyof typeof OPERATORS
                                ]
                              }{" "}
                              {condition.value}
                            </Chip>
                          );
                        })}
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h5 className="font-medium">
                          Allocations (
                          {
                            watchedAllocations.filter(
                              (a) => a.asset_id && a.beneficiary_id,
                            ).length
                          }
                          )
                        </h5>
                      </CardHeader>
                      <CardBody>
                        {watchedAllocations
                          .filter(
                            (allocation) =>
                              allocation.asset_id && allocation.beneficiary_id,
                          )
                          .map((allocation, index) => {
                            const asset = assets.find(
                              (a) => a.id === allocation.asset_id,
                            );
                            const beneficiary = beneficiaries.find(
                              (b: any) => b.id === allocation.beneficiary_id,
                            );

                            return (
                              <div
                                key={index}
                                className="mb-2 p-2 border rounded"
                              >
                                <div className="font-medium">
                                  {asset?.name} → {beneficiary?.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {allocation.allocation_percentage &&
                                    `${allocation.allocation_percentage}%`}
                                  {allocation.allocation_amount &&
                                    `€${allocation.allocation_amount.toLocaleString()}`}
                                </div>
                              </div>
                            );
                          })}
                      </CardBody>
                    </Card>
                  </div>
                )}
              </form>
            </ModalBody>

            <ModalFooter>
              <Button
                data-testid="Button-amt2tcvv0"
                variant="light"
                onPress={onClose}
              >
                Cancel
              </Button>

              {currentStep > 1 && (
                <Button
                  data-testid="Button-wynb5cknc"
                  variant="ghost"
                  onPress={prevStep}
                >
                  Previous
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  color="primary"
                  data-testid="Button-cc202x55k"
                  isDisabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep2) ||
                    (currentStep === 3 && !canProceedToStep3)
                  }
                  onPress={nextStep}
                >
                  Next
                </Button>
              ) : (
                <Button
                  color="primary"
                  data-testid="Button-r5k785ct0"
                  isDisabled={!isValid}
                  isLoading={createRuleMutation.isPending}
                  onPress={() => handleSubmit(onSubmit)()}
                >
                  Create Rule
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
