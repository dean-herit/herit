"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
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
  // OAuth security enhancement
  isFromOAuth?: boolean;
  oauthProvider?: string;
}

export function SharedPersonalInfoForm({
  mode,
  showPhotoUpload = false,
  className = "",
  isFromOAuth = false,
  oauthProvider,
}: SharedPersonalInfoFormProps) {
  // Debug OAuth props
  console.log("SharedPersonalInfoForm OAuth props:", { isFromOAuth, oauthProvider, mode });
  const {
    register,
    control,
    watch,
    formState: { errors, touchedFields },
    setValue,
    getValues,
  } = useFormContext<any>(); // Use any for now to avoid complex generics

  const fieldConfig = getFormFields(mode);

  // Security: Monitor and prevent OAuth email tampering
  const originalEmail = watch("email");
  React.useEffect(() => {
    if (isFromOAuth && oauthProvider && originalEmail) {
      const currentEmail = getValues("email");
      if (currentEmail !== originalEmail) {
        // Log potential tampering attempt
        fetch('/api/audit/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'security_violation',
            event_action: 'oauth_email_tampering_attempt',
            resource_type: 'form_security',
            event_data: {
              provider: oauthProvider,
              mode: mode,
              tampering_detected: true,
              original_email_hash: btoa(originalEmail).slice(0, 10), // Partial hash for audit
              attempted_change: true
            }
          })
        }).catch(err => console.warn('Failed to log security event:', err));

        // Reset to original OAuth email
        setValue("email", originalEmail, { shouldValidate: true });
      }
    }
  }, [isFromOAuth, oauthProvider, originalEmail, getValues, setValue, mode]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Unified Form - No Section Headers */}
      <div className="space-y-6">
        {/* Relationship Type - Only for beneficiaries */}
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
                {Object.entries(relationshipTypeLabels || {}).map(
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

        {/* Email and Phone Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <Input
              {...register("email")}
              isRequired
              data-testid={`${mode}-email`}
              errorMessage={errors.email?.message as string}
              isInvalid={!!errors.email}
              label="Email Address"
              placeholder="email@example.com"
              type="email"
              isReadOnly={isFromOAuth}
              classNames={{
                input: isFromOAuth ? "bg-default-100 text-default-500 cursor-not-allowed" : "",
                inputWrapper: isFromOAuth ? "bg-default-100" : "",
              }}
              endContent={
                isFromOAuth && oauthProvider && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-default-500">
                      {oauthProvider === 'google' && '🔒'}
                      {oauthProvider === 'apple' && '🔒'}
                    </span>
                  </div>
                )
              }
            />
            {isFromOAuth && (
              <div className="flex items-center mt-1 text-xs text-default-500">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>
                  Email verified by {oauthProvider === 'google' ? 'Google' : oauthProvider} - cannot be changed
                </span>
              </div>
            )}
          </div>

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

        {/* PPS Number and Date of Birth Row */}
        {mode === "onboarding" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register("pps_number")}
              data-testid={`${mode}-pps`}
              description="Required for Irish estate planning compliance"
              errorMessage={errors.pps_number?.message as string}
              isInvalid={!!errors.pps_number}
              label="PPS Number"
              placeholder="1234567A"
            />

            <Input
              {...register("date_of_birth")}
              isRequired
              data-testid="date-of-birth-input"
              errorMessage={errors.date_of_birth?.message as string}
              isInvalid={!!errors.date_of_birth}
              label="Date of Birth"
              type="date"
            />
          </div>
        ) : (
          <Input
            {...register("pps_number")}
            data-testid={`${mode}-pps`}
            errorMessage={errors.pps_number?.message as string}
            isInvalid={!!errors.pps_number}
            label="PPS Number"
            placeholder="1234567A"
          />
        )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {/* Photo Upload Section - Optional */}
      {showPhotoUpload && (
        <Card className="shadow-none border-none bg-transparent">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold">
              Photo {mode === "beneficiary" ? "(Optional)" : ""}
            </h3>
          </CardHeader>
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
