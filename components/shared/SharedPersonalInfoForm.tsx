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
  SharedPersonalInfo,
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
  } = useFormContext<SharedPersonalInfo>();

  const fieldConfig = getFormFields(mode);

  return (
    <div
      className={`space-y-6 ${className}`}
      data-component-category="input"
      data-component-id="shared-personal-info-form"
    >
      {/* Personal Information Card */}
      <Card
        className="shadow-md"
        data-component-category="ui"
        data-component-id="personal-info-card"
      >
        <CardHeader
          className="pb-3"
          data-component-category="ui"
          data-component-id="personal-info-header"
        >
          <h3 className="text-lg font-semibold">Personal Information</h3>
        </CardHeader>
        <Divider data-component-category="ui" data-component-id="divider" />
        <CardBody
          className="gap-4 p-6"
          data-component-category="input"
          data-component-id="personal-info-form-body"
        >
          {/* Relationship Type - Only for beneficiaries - MOVED TO TOP */}
          {fieldConfig.showRelationship && (
            <Controller
              control={control}
              data-component-category="ui"
              data-component-id="controller"
              name="relationship_type"
              render={({ field }) => (
                <Select
                  {...field}
                  isRequired
                  data-component-category="input"
                  data-component-id="relationship-select"
                  data-testid={`${mode}-relationship`}
                  errorMessage={errors.relationship_type?.message}
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
                      <SelectItem
                        key={value}
                        data-component-category="ui"
                        data-component-id="relationship-select-item"
                      >
                        {label}
                      </SelectItem>
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
            data-component-category="input"
            data-component-id="name-input"
            data-testid={`${mode}-name`}
            errorMessage={errors.name?.message}
            isInvalid={!!errors.name}
            label="Full Name"
            placeholder="Enter full name"
          />

          {/* Email and Phone Row - NOW REQUIRED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register("email")}
              isRequired
              data-component-category="input"
              data-component-id="email-input"
              data-testid={`${mode}-email`}
              errorMessage={errors.email?.message}
              isInvalid={!!errors.email}
              label="Email Address"
              placeholder="email@example.com"
              type="email"
            />

            <Input
              {...register("phone")}
              isRequired
              data-component-category="input"
              data-component-id="phone-input"
              data-testid={`${mode}-phone`}
              errorMessage={errors.phone?.message}
              isInvalid={!!errors.phone}
              label="Phone Number"
              placeholder="+353 1 234 5678"
            />
          </div>

          {/* PPS Number - Now included in onboarding */}
          <Input
            {...register("pps_number")}
            data-component-category="input"
            data-component-id="pps-number-input"
            data-testid={`${mode}-pps`}
            description={
              mode === "onboarding"
                ? "Required for Irish estate planning compliance"
                : undefined
            }
            errorMessage={errors.pps_number?.message}
            isInvalid={!!errors.pps_number}
            label="PPS Number"
            placeholder="1234567A"
          />
        </CardBody>
      </Card>

      {/* Address Information Card */}
      <Card
        className="shadow-md"
        data-component-category="ui"
        data-component-id="address-info-card"
      >
        <CardHeader
          className="pb-3"
          data-component-category="ui"
          data-component-id="address-info-header"
        >
          <h3 className="text-lg font-semibold">Address Information</h3>
        </CardHeader>
        <Divider data-component-category="ui" data-component-id="divider" />
        <CardBody
          className="gap-4 p-6"
          data-component-category="input"
          data-component-id="address-info-form-body"
        >
          {/* Address Lines */}
          <Input
            {...register("address_line_1")}
            isRequired
            data-component-category="input"
            data-component-id="address-line-1-input"
            data-testid={`${mode}-address1`}
            errorMessage={errors.address_line_1?.message}
            isInvalid={!!errors.address_line_1}
            label="Address Line 1"
            placeholder="Street address"
          />

          <Input
            {...register("address_line_2")}
            data-component-category="input"
            data-component-id="address-line-2-input"
            data-testid={`${mode}-address2`}
            label="Address Line 2"
            placeholder="Apartment, suite, etc."
          />

          {/* City and County Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register("city")}
              isRequired
              data-component-category="input"
              data-component-id="city-input"
              data-testid={`${mode}-city`}
              errorMessage={errors.city?.message}
              isInvalid={!!errors.city}
              label="City/Town"
              placeholder="City or town"
            />

            <Controller
              control={control}
              data-component-category="ui"
              data-component-id="controller"
              name="county"
              render={({ field }) => (
                <Select
                  {...field}
                  isRequired
                  data-component-category="input"
                  data-component-id="county-select"
                  data-testid={`${mode}-county`}
                  errorMessage={errors.county?.message}
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
                    <SelectItem
                      key={county}
                      data-component-category="ui"
                      data-component-id="county-select-item"
                    >
                      {county}
                    </SelectItem>
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
              data-component-category="input"
              data-component-id="eircode-input"
              data-testid={`${mode}-eircode`}
              errorMessage={errors.eircode?.message}
              isInvalid={!!errors.eircode}
              label="Eircode"
              placeholder="D02 XY56"
            />

            <Input
              {...register("country")}
              readOnly
              data-component-category="input"
              data-component-id="country-input"
              data-testid={`${mode}-country`}
              label="Country"
              placeholder="Ireland"
            />
          </div>
        </CardBody>
      </Card>

      {/* Photo Upload Section - Optional */}
      {showPhotoUpload && (
        <Card
          className="shadow-md"
          data-component-category="ui"
          data-component-id="photo-section-card"
        >
          <CardHeader
            className="pb-3"
            data-component-category="ui"
            data-component-id="photo-section-header"
          >
            <h3 className="text-lg font-semibold">
              Photo {mode === "beneficiary" ? "(Optional)" : ""}
            </h3>
          </CardHeader>
          <Divider data-component-category="ui" data-component-id="divider" />
          <CardBody
            className="p-6"
            data-component-category="input"
            data-component-id="photo-section-body"
          >
            <Controller
              control={control}
              data-component-category="ui"
              data-component-id="controller"
              name="photo_url"
              render={({ field }) => (
                <SharedPhotoUpload
                  data-component-category="ui"
                  data-component-id="shared-photo-upload"
                  errorMessage={errors.photo_url?.message}
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
