'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Select, SelectItem } from '@heroui/react'
import { PersonalInfo } from '@/types/onboarding'
import { cn } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'

interface PersonalInfoStepProps {
  initialData: PersonalInfo
  onChange: (data: PersonalInfo) => void
  onComplete: () => void
  onBack?: () => void
  loading?: boolean
}

const IRISH_COUNTIES = [
  // Republic of Ireland (26 counties)
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry',
  'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth',
  'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
  // Northern Ireland (6 counties)
  'Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone'
];

export function PersonalInfoStep({ 
  initialData, 
  onChange, 
  onComplete, 
  onBack, 
  loading 
}: PersonalInfoStepProps) {
  const [formData, setFormData] = useState<PersonalInfo>(initialData)
  const [errors, setErrors] = useState<Partial<PersonalInfo>>({})

  // API mutation for saving personal info
  const savePersonalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfo) => {
      const response = await fetch('/api/onboarding/personal-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: data.phone_number,
          dateOfBirth: data.date_of_birth,
          addressLine1: data.address_line_1,
          addressLine2: data.address_line_2,
          city: data.city,
          county: data.county,
          eircode: data.eircode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save personal information')
      }

      return response.json()
    },
    onSuccess: () => {
      onComplete()
    },
  })

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonalInfo> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }

    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.county.trim()) {
      newErrors.county = 'County is required';
    }

    if (!formData.eircode.trim()) {
      newErrors.eircode = 'Eircode is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      savePersonalInfoMutation.mutate(formData)
    }
  }

  const isLoading = loading || savePersonalInfoMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Details */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="Enter your first name"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            isInvalid={!!errors.first_name}
            errorMessage={errors.first_name}
            variant="bordered"
            isRequired
          />

          <Input
            label="Last Name"
            placeholder="Enter your last name"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            isInvalid={!!errors.last_name}
            errorMessage={errors.last_name}
            variant="bordered"
            isRequired
          />


          <Input
            type="date"
            label="Date of Birth"
            value={formData.date_of_birth}
            onChange={(e) => handleChange('date_of_birth', e.target.value)}
            isInvalid={!!errors.date_of_birth}
            errorMessage={errors.date_of_birth}
            variant="bordered"
            isRequired
          />

          <Input
            type="tel"
            label="Phone Number"
            placeholder="Enter your phone number"
            value={formData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
            isInvalid={!!errors.phone_number}
            errorMessage={errors.phone_number}
            variant="bordered"
            isRequired
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Irish Address</h3>
        <div className="space-y-4">
          <Input
            label="Address Line 1"
            placeholder="Enter your street address"
            value={formData.address_line_1}
            onChange={(e) => handleChange('address_line_1', e.target.value)}
            isInvalid={!!errors.address_line_1}
            errorMessage={errors.address_line_1}
            variant="bordered"
            isRequired
          />

          <Input
            label="Address Line 2"
            placeholder="Apartment, suite, etc. (optional)"
            value={formData.address_line_2 || ''}
            onChange={(e) => handleChange('address_line_2', e.target.value)}
            variant="bordered"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City/Town"
              placeholder="Enter city or town"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              isInvalid={!!errors.city}
              errorMessage={errors.city}
              variant="bordered"
              isRequired
            />

            <Select
              label="County"
              placeholder="Select county"
              selectedKeys={formData.county ? [formData.county] : []}
              onSelectionChange={(keys) => {
                const county = Array.from(keys)[0] as string;
                handleChange('county', county || '');
              }}
              isInvalid={!!errors.county}
              errorMessage={errors.county}
              variant="bordered"
              isRequired
            >
              {IRISH_COUNTIES.map((county) => (
                <SelectItem key={county}>
                  {county}
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Eircode"
              placeholder="Enter eircode"
              value={formData.eircode}
              onChange={(e) => handleChange('eircode', e.target.value.toUpperCase())}
              isInvalid={!!errors.eircode}
              errorMessage={errors.eircode}
              variant="bordered"
              isRequired
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onBack ? (
          <Button
            variant="bordered"
            onPress={onBack}
            isDisabled={isLoading}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          Continue
        </Button>
      </div>

      {/* Error Display */}
      {savePersonalInfoMutation.error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {savePersonalInfoMutation.error.message}
        </div>
      )}
    </form>
  )
}