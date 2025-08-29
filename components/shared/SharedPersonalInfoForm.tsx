"use client";

import { useFormContext, Controller } from "react-hook-form";
import {
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@heroui/react";

import { SharedPhotoUpload } from "./SharedPhotoUpload";

import {
  IrishCounties,
  relationshipTypeLabels,
  FormMode,
  getFormFields,
} from "@/types/shared-personal-info";

interface SharedPersonalInfoFormProps {
  mode: FormMode;
  showPhotoUpload?: boolean;
  className?: string;
}

export function SharedPersonalInfoForm({
  mode,
  showPhotoUpload = false,
  className = "",
}: SharedPersonalInfoFormProps) {
  const {
    register,
    control,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<any>(); // Use any for now to avoid complex generics

  const fieldConfig = getFormFields(mode);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Personal Information Card */}
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Personal Information</h3>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 p-6">
          {/* Relationship Type - Only for beneficiaries - MOVED TO TOP */}
          {fieldConfig.showRelationship && (
            <Controller
              control={control}
              name="relationship_type"
              render={({ field }) => (
                <Select
                  {...field}
                  isRequired
                  data-testid={`${mode}-relationship`}
                  errorMessage={errors.relationship_type?.message as string}
                  isInvalid={!!errors.relationship_type}
                  label="Relationship"
                  placeholder="Select relationship type"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0] as string;

                    field.onChange(selectedValue);
                  }}
                >
                  {Object.entries(relationshipTypeLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value}>{label}</SelectItem>
                    ),
                  )}
                </Select>
              )}
            />
          )}

          {/* Full Name */}
          <Input
            {...register("name")}
            isRequired
            data-testid={`${mode}-name`}
            errorMessage={errors.name?.message as string}
            isInvalid={!!errors.name}
            label="Full Name"
            placeholder="Enter full name"
          />

          {/* Email and Phone Row - NOW REQUIRED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register("email")}
              isRequired
              data-testid={`${mode}-email`}
              errorMessage={errors.email?.message as string}
              isInvalid={!!errors.email}
              label="Email Address"
              placeholder="email@example.com"
              type="email"
            />

            <Input
              {...register("phone")}
              isRequired
              data-testid={`${mode}-phone`}
              errorMessage={errors.phone?.message as string}
              isInvalid={!!errors.phone}
              label="Phone Number"
              placeholder="+353 1 234 5678"
            />
          </div>

          {/* PPS Number - Now included in onboarding */}
          <Input
            {...register("pps_number")}
            data-testid={`${mode}-pps`}
            description={
              mode === "onboarding"
                ? "Required for Irish estate planning compliance"
                : undefined
            }
            errorMessage={errors.pps_number?.message as string}
            isInvalid={!!errors.pps_number}
            label="PPS Number"
            placeholder="1234567A"
          />

          {/* Date of Birth - Additional field for onboarding */}
          {mode === "onboarding" && (
            <Input
              {...register("date_of_birth")}
              isRequired
              data-testid="date-of-birth-input"
              errorMessage={errors.date_of_birth?.message as string}
              isInvalid={!!errors.date_of_birth}
              label="Date of Birth"
              type="date"
            />
          )}
        </CardBody>
      </Card>

      {/* Address Information Card */}
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Address Information</h3>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 p-6">
          {/* Address Lines */}
          <Input
            {...register("address_line_1")}
            isRequired
            data-testid={`${mode}-address1`}
            errorMessage={errors.address_line_1?.message as string}
            isInvalid={!!errors.address_line_1}
            label="Address Line 1"
            placeholder="Street address"
          />

          <Input
            {...register("address_line_2")}
            data-testid={`${mode}-address2`}
            label="Address Line 2"
            placeholder="Apartment, suite, etc."
          />

          {/* City and County Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register("city")}
              isRequired
              data-testid={`${mode}-city`}
              errorMessage={errors.city?.message as string}
              isInvalid={!!errors.city}
              label="City/Town"
              placeholder="City or town"
            />

            <Controller
              control={control}
              name="county"
              render={({ field }) => (
                <Select
                  {...field}
                  isRequired
                  data-testid={`${mode}-county`}
                  errorMessage={errors.county?.message as string}
                  isInvalid={!!errors.county}
                  label="County"
                  placeholder="Select county"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0] as string;

                    field.onChange(selectedValue);
                  }}
                >
                  {IrishCounties.map((county) => (
                    <SelectItem key={county}>{county}</SelectItem>
                  ))}
                </Select>
              )}
            />
          </div>

          {/* Eircode and Country Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register("eircode")}
              isRequired
              data-testid={`${mode}-eircode`}
              errorMessage={errors.eircode?.message as string}
              isInvalid={!!errors.eircode}
              label="Eircode"
              placeholder="D02 XY56"
            />

            <Input
              {...register("country")}
              readOnly
              data-testid={`${mode}-country`}
              label="Country"
              placeholder="Ireland"
            />
          </div>
        </CardBody>
      </Card>

      {/* Photo Upload Section - Optional */}
      {showPhotoUpload && (
        <Card className="shadow-none border-none bg-transparent">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold">
              Photo {mode === "beneficiary" ? "(Optional)" : ""}
            </h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-6">
            <Controller
              control={control}
              name="photo_url"
              render={({ field }) => (
                <SharedPhotoUpload
                  errorMessage={errors.photo_url?.message as string}
                  isInvalid={!!errors.photo_url}
                  mode={mode}
                  name={watch("name") || ""}
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
