"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Avatar,
} from "@heroui/react";
import { z } from "zod";

import {
  BeneficiaryFormData,
  RelationshipTypes,
  relationshipTypeLabels,
  IrishCounties,
  beneficiaryFormSchema,
} from "@/types/beneficiaries";

interface BeneficiaryFormProps {
  initialData?: Partial<BeneficiaryFormData>;
  onSubmit: (data: BeneficiaryFormData) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  mode?: "create" | "edit";
}

export function BeneficiaryForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = "create",
}: BeneficiaryFormProps) {
  const [formData, setFormData] = useState<Partial<BeneficiaryFormData>>({
    name: "",
    relationship_type: RelationshipTypes.FRIEND,
    email: "",
    phone: "",
    pps_number: "",
    photo_url: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    county: "",
    eircode: "",
    country: "Ireland",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: any) => {
    try {
      const fieldSchema =
        beneficiaryFormSchema.shape[field as keyof BeneficiaryFormData];

      if (fieldSchema) {
        (fieldSchema as any).parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };

          delete newErrors[field];

          return newErrors;
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.issues[0].message,
        }));
      }
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof BeneficiaryFormData]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = beneficiaryFormSchema.parse(formData);

      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};

        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);

        const allTouched: Record<string, boolean> = {};

        Object.keys(beneficiaryFormSchema.shape).forEach((key) => {
          allTouched[key] = true;
        });
        setTouched(allTouched);
      }
    }
  };

  return (
    <form
      className="space-y-6 max-w-6xl mx-auto"
      data-component-id="beneficiary-form"
      onSubmit={handleSubmit}
    >
      {/* Responsive grid layout for better space utilization */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold">Personal Information</h3>
          </CardHeader>
          <Divider />
          <CardBody className="gap-4 p-6">
            {formData.photo_url && (
              <div className="flex justify-center mb-4">
                <Avatar
                  className="w-24 h-24"
                  name={formData.name}
                  src={formData.photo_url}
                />
              </div>
            )}

            <Input
              isRequired
              data-testid="beneficiary-name"
              errorMessage={errors.name}
              isInvalid={!!errors.name}
              label="Full Name"
              placeholder="Enter beneficiary's full name"
              value={formData.name || ""}
              onBlur={() => handleFieldBlur("name")}
              onChange={(e) => handleFieldChange("name", e.target.value)}
            />

            <Select
              isRequired
              data-testid="beneficiary-relationship"
              errorMessage={errors.relationship_type}
              isInvalid={!!errors.relationship_type}
              label="Relationship"
              placeholder="Select relationship type"
              selectedKeys={
                formData.relationship_type ? [formData.relationship_type] : []
              }
              onBlur={() => handleFieldBlur("relationship_type")}
              onChange={(e) =>
                handleFieldChange("relationship_type", e.target.value)
              }
            >
              {Object.entries(relationshipTypeLabels).map(([value, label]) => (
                <SelectItem key={value}>{label}</SelectItem>
              ))}
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                data-testid="beneficiary-email"
                errorMessage={errors.email}
                isInvalid={!!errors.email}
                label="Email Address"
                placeholder="email@example.com"
                type="email"
                value={formData.email || ""}
                onBlur={() => handleFieldBlur("email")}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />

              <Input
                data-testid="beneficiary-phone"
                errorMessage={errors.phone}
                isInvalid={!!errors.phone}
                label="Phone Number"
                placeholder="+353 XX XXX XXXX"
                value={formData.phone || ""}
                onBlur={() => handleFieldBlur("phone")}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
              />
            </div>

            <Input
              data-testid="beneficiary-pps"
              errorMessage={errors.pps_number}
              isInvalid={!!errors.pps_number}
              label="PPS Number"
              placeholder="1234567A"
              value={formData.pps_number || ""}
              onBlur={() => handleFieldBlur("pps_number")}
              onChange={(e) =>
                handleFieldChange("pps_number", e.target.value.toUpperCase())
              }
            />

            <Input
              data-testid="beneficiary-photo"
              errorMessage={errors.photo_url}
              isInvalid={!!errors.photo_url}
              label="Photo URL"
              placeholder="https://example.com/photo.jpg"
              type="url"
              value={formData.photo_url || ""}
              onBlur={() => handleFieldBlur("photo_url")}
              onChange={(e) => handleFieldChange("photo_url", e.target.value)}
            />
          </CardBody>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold">Address Information</h3>
          </CardHeader>
          <Divider />
          <CardBody className="gap-4 p-6">
            <Input
              data-testid="beneficiary-address1"
              errorMessage={errors.address_line_1}
              isInvalid={!!errors.address_line_1}
              label="Address Line 1"
              placeholder="Street address"
              value={formData.address_line_1 || ""}
              onBlur={() => handleFieldBlur("address_line_1")}
              onChange={(e) =>
                handleFieldChange("address_line_1", e.target.value)
              }
            />

            <Input
              data-testid="beneficiary-address2"
              label="Address Line 2"
              placeholder="Apartment, suite, etc."
              value={formData.address_line_2 || ""}
              onBlur={() => handleFieldBlur("address_line_2")}
              onChange={(e) =>
                handleFieldChange("address_line_2", e.target.value)
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                data-testid="beneficiary-city"
                errorMessage={errors.city}
                isInvalid={!!errors.city}
                label="City/Town"
                placeholder="City or town"
                value={formData.city || ""}
                onBlur={() => handleFieldBlur("city")}
                onChange={(e) => handleFieldChange("city", e.target.value)}
              />

              <Select
                data-testid="beneficiary-county"
                errorMessage={errors.county}
                isInvalid={!!errors.county}
                label="County"
                placeholder="Select county"
                selectedKeys={formData.county ? [formData.county] : []}
                onBlur={() => handleFieldBlur("county")}
                onChange={(e) => handleFieldChange("county", e.target.value)}
              >
                {IrishCounties.map((county) => (
                  <SelectItem key={county}>{county}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                data-testid="beneficiary-eircode"
                errorMessage={errors.eircode}
                isInvalid={!!errors.eircode}
                label="Eircode"
                placeholder="D02 XY56"
                value={formData.eircode || ""}
                onBlur={() => handleFieldBlur("eircode")}
                onChange={(e) =>
                  handleFieldChange("eircode", e.target.value.toUpperCase())
                }
              />

              <Input
                data-testid="beneficiary-country"
                label="Country"
                value={formData.country || "Ireland"}
                onBlur={() => handleFieldBlur("country")}
                onChange={(e) => handleFieldChange("country", e.target.value)}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            data-testid="beneficiary-cancel"
            isDisabled={loading}
            variant="flat"
            onPress={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          color="primary"
          data-testid="beneficiary-submit"
          isLoading={loading}
          type="submit"
        >
          {mode === "create" ? "Add Beneficiary" : "Update Beneficiary"}
        </Button>
      </div>
    </form>
  );
}
