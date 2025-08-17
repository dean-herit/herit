"use client";

import { useState } from "react";
import { Button, Checkbox, Card, CardBody } from "@heroui/react";

import { Signature } from "@/types/onboarding";

interface LegalConsentStepProps {
  signature: Signature;
  initialConsents: string[];
  onChange: (consents: string[]) => void;
  onComplete: (consents: string[]) => void;
  onBack?: () => void;
  loading: boolean;
}

const REQUIRED_CONSENTS = [
  {
    id: "terms_of_service",
    title: "Terms of Service",
    description: "I agree to the Herit Terms of Service",
    required: true,
  },
  {
    id: "privacy_policy",
    title: "Privacy Policy",
    description: "I agree to the Herit Privacy Policy",
    required: true,
  },
  {
    id: "legal_disclaimer",
    title: "Legal Disclaimer",
    description:
      "I understand that this service provides tools for estate planning but does not constitute legal advice",
    required: true,
  },
  {
    id: "data_processing",
    title: "Data Processing",
    description:
      "I consent to the processing of my personal data for estate planning purposes",
    required: true,
  },
  {
    id: "electronic_signature",
    title: "Electronic Signature Agreement",
    description:
      "I agree that my electronic signature has the same legal effect as a handwritten signature",
    required: true,
  },
];

export function LegalConsentStep({
  signature,
  initialConsents,
  onChange,
  onComplete,
  onBack,
  loading,
}: LegalConsentStepProps) {
  const [consents, setConsents] = useState<string[]>(initialConsents);

  const handleConsentChange = (consentId: string, isChecked: boolean) => {
    const newConsents = isChecked
      ? [...consents, consentId]
      : consents.filter((id) => id !== consentId);

    setConsents(newConsents);
    onChange(newConsents);
  };

  const allRequiredConsentsGiven = REQUIRED_CONSENTS.filter(
    (consent) => consent.required,
  ).every((consent) => consents.includes(consent.id));

  const handleSubmit = () => {
    if (allRequiredConsentsGiven) {
      onComplete(consents);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Legal Agreements</h3>
        <p className="text-default-600">
          Please review and accept the following legal agreements to proceed.
        </p>
      </div>

      {/* Signature Confirmation */}
      <Card className="border-primary-200 bg-primary-50">
        <CardBody className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Digital Signature Ready</p>
              <p className="text-xs text-default-600">
                Your signature &quot;{signature.name}&quot; will be used for
                these agreements
              </p>
            </div>
            <div className="text-lg font-cursive text-primary">
              {signature.data}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Legal Consents */}
      <div className="space-y-4">
        {REQUIRED_CONSENTS.map((consent) => (
          <Card key={consent.id} className="hover:shadow-sm transition-shadow">
            <CardBody className="p-4">
              <Checkbox
                isSelected={consents.includes(consent.id)}
                size="sm"
                onValueChange={(isChecked) =>
                  handleConsentChange(consent.id, isChecked)
                }
              >
                <div className="ml-2">
                  <p className="font-medium text-sm">{consent.title}</p>
                  <p className="text-xs text-default-600 mt-1">
                    {consent.description}
                  </p>
                  {consent.required && (
                    <span className="text-xs text-danger-600">* Required</span>
                  )}
                </div>
              </Checkbox>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="border-default-200">
        <CardBody className="p-4">
          <div className="text-center">
            <p className="text-sm text-default-600 mb-2">
              By clicking &quot;Accept All Agreements&quot;, you are digitally
              signing these agreements with:
            </p>
            <div className="text-lg font-cursive text-primary border-b border-default-200 pb-2 inline-block">
              {signature.data}
            </div>
            <p className="text-xs text-default-500 mt-2">
              Timestamp: {new Date().toLocaleString()}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onBack ? (
          <Button isDisabled={loading} variant="bordered" onPress={onBack}>
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          color="primary"
          isDisabled={loading || !allRequiredConsentsGiven}
          isLoading={loading}
          onPress={handleSubmit}
        >
          Accept All Agreements
        </Button>
      </div>

      {!allRequiredConsentsGiven && (
        <p className="text-center text-sm text-danger-600">
          Please accept all required agreements to continue.
        </p>
      )}
    </div>
  );
}
