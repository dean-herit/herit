"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { motion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import Image from "next/image";

import { SignatureStamp } from "./SignatureStamp";

import { Signature, SignedConsent } from "@/types/onboarding";

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
    content:
      "By signing this document, you acknowledge that you have read, understood, and agree to be bound by the Herit Terms of Service. These terms govern your use of our estate planning platform and services.",
    required: true,
  },
  {
    id: "privacy_policy",
    title: "Privacy Policy",
    description: "I agree to the Herit Privacy Policy",
    content:
      "By signing this document, you consent to the collection, use, and protection of your personal data as outlined in our Privacy Policy. We are committed to protecting your privacy and securing your information.",
    required: true,
  },
  {
    id: "legal_disclaimer",
    title: "Legal Disclaimer",
    description: "I understand the nature of this service",
    content:
      "By signing this document, you acknowledge that Herit provides tools for estate planning but does not constitute legal advice. We recommend consulting with a qualified attorney for complex estate matters.",
    required: true,
  },
  {
    id: "data_processing",
    title: "Data Processing Agreement",
    description: "I consent to data processing for estate planning",
    content:
      "By signing this document, you authorize Herit to process your personal data for the purpose of providing estate planning services, including the creation and management of your will and related documents.",
    required: true,
  },
  {
    id: "electronic_signature",
    title: "Electronic Signature Agreement",
    description: "I agree to use electronic signatures",
    content:
      "By signing this document, you agree that your electronic signature has the same legal validity and enforceability as a handwritten signature under applicable laws.",
    required: true,
  },
];

export function LegalConsentStep({
  signature,
  initialConsents: _initialConsents,
  onChange,
  onComplete,
  onBack,
  loading,
}: LegalConsentStepProps) {
  const [signedConsents, setSignedConsents] = useState<SignedConsent[]>([]);
  const [signingConsent, setSigningConsent] = useState<string | null>(null);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Store signature snapshots for each signed consent
  const [signatureSnapshots, setSignatureSnapshots] = useState<
    Record<string, Signature>
  >({});

  // Load existing signed consents when component mounts
  useEffect(() => {
    const loadExistingConsents = async () => {
      try {
        const response = await fetch("/api/onboarding/legal-consent");

        if (response.ok) {
          const data = await response.json();

          // Convert the consents data to SignedConsent format
          const existingConsents: SignedConsent[] = [];
          const snapshots: Record<string, Signature> = {};

          if (data.consents) {
            Object.entries(data.consents).forEach(
              ([consentId, consentData]: [string, any]) => {
                if (consentData && consentData.agreed) {
                  existingConsents.push({
                    id: consentId,
                    timestamp: consentData.timestamp,
                    signatureId: consentData.signatureId,
                  });

                  // Load stored signature snapshot if available
                  if (consentData.signatureSnapshot) {
                    snapshots[consentId] = consentData.signatureSnapshot;
                  } else {
                  }
                }
              },
            );
          }

          setSignedConsents(existingConsents);
          setSignatureSnapshots(snapshots);

          // Update the consents array for backward compatibility
          const consentIds = existingConsents.map((sc) => sc.id);

          onChange(consentIds);
        }
      } catch {
        // Error loading existing consents
      } finally {
        setLoadingConsents(false);
      }
    };

    loadExistingConsents();
  }, [onChange]);

  const handleSignConsent = async (consentId: string) => {
    if (signingConsent) return; // Prevent multiple clicks

    setSigningConsent(consentId);

    try {
      const response = await fetch("/api/onboarding/consent-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consentId,
          signatureId: signature.id,
          // Send complete signature data for immutable storage
          signatureData: {
            id: signature.id,
            name: signature.name,
            data: signature.data,
            type: signature.type,
            font: signature.font,
            className: signature.className,
            createdAt: signature.createdAt,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Failed to save consent signature: ${response.status} ${errorText}`,
        );
      }

      const result = await response.json();

      const newSignedConsent: SignedConsent = {
        id: consentId,
        timestamp: result.timestamp,
        signatureId: signature.id,
      };

      const updatedSignedConsents = [...signedConsents, newSignedConsent];

      setSignedConsents(updatedSignedConsents);

      // Store the signature snapshot for this consent
      setSignatureSnapshots((prev) => ({
        ...prev,
        [consentId]: signature,
      }));

      // Update the consents array for backward compatibility
      const consentIds = updatedSignedConsents.map((sc) => sc.id);

      onChange(consentIds);
    } catch {
      // Error handling consent signature
    } finally {
      setSigningConsent(null);
    }
  };

  const isConsentSigned = (consentId: string) => {
    return signedConsents.some((sc) => sc.id === consentId);
  };

  const getConsentTimestamp = (consentId: string) => {
    const consent = signedConsents.find((sc) => sc.id === consentId);

    return consent?.timestamp;
  };

  const allRequiredConsentsGiven = REQUIRED_CONSENTS.filter(
    (consent) => consent.required,
  ).every((consent) => isConsentSigned(consent.id));

  const handleSubmit = async () => {
    if (allRequiredConsentsGiven && !submitting) {
      setSubmitting(true);
      const consentIds = signedConsents.map((sc) => sc.id);

      try {
        // Save completion status to database
        const consentsData = signedConsents.reduce(
          (acc, consent) => {
            acc[consent.id] = {
              agreed: true,
              timestamp: consent.timestamp,
              signatureId: consent.signatureId,
            };

            return acc;
          },
          {} as Record<string, any>,
        );

        const response = await fetch("/api/onboarding/legal-consent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            consents: consentsData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(
            errorData.error || "Failed to save legal consent completion",
          );
        }

        // Call the parent completion handler
        onComplete(consentIds);
      } catch {
        // Still call onComplete to allow UI progression
        onComplete(consentIds);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const signedCount = signedConsents.length;
  const totalRequired = REQUIRED_CONSENTS.filter((c) => c.required).length;

  if (loadingConsents) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Legal Agreements</h3>
          <p className="text-default-600">
            Loading your existing agreements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      data-component-category="authentication"
      data-component-id="components-legal-consent-step"
      data-testid="legal-consent-step"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Legal Agreements</h3>
        <p className="text-default-600">
          Please review and sign each legal agreement by stamping your
          signature.
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="border-primary-200 bg-primary-50">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {signedCount}/{totalRequired}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Signing Progress</p>
                <p className="text-xs text-default-600">
                  {signedCount === totalRequired
                    ? "All agreements signed"
                    : `${totalRequired - signedCount} agreements remaining`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-default-600 mb-1">Your signature:</p>
              <div
                className={signature.className || "font-cursive"}
                style={signature.font ? { fontFamily: signature.font } : {}}
              >
                {signature.type === "uploaded" ? (
                  <Image
                    alt="Your signature"
                    className="h-8 inline-block"
                    height={32}
                    src={signature.data}
                    width={100}
                  />
                ) : (
                  <span className="text-lg text-primary">{signature.data}</span>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Legal Agreement Documents */}
      <div className="space-y-4">
        {REQUIRED_CONSENTS.map((consent, index) => {
          const isSigned = isConsentSigned(consent.id);
          const timestamp = getConsentTimestamp(consent.id);

          return (
            <motion.div
              key={consent.id}
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`
                  transition-all duration-300
                  ${
                    isSigned
                      ? "border-success shadow-sm"
                      : "hover:shadow-md border-default-200"
                  }
                `}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                        ${isSigned ? "bg-success text-white" : "bg-default-100"}
                      `}
                      >
                        {isSigned ? (
                          <Check
                            className="w-4 h-4"
                            data-component-category="ui"
                            data-component-id="check"
                          />
                        ) : (
                          <FileText
                            className="w-4 h-4 text-default-500"
                            data-component-category="ui"
                            data-component-id="file-text"
                          />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">
                          {consent.title}
                        </h4>
                        {consent.required && !isSigned && (
                          <span className="text-xs text-danger-600">
                            * Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="pt-0">
                  {/* Single Document Card */}
                  <div className="bg-white dark:bg-gray-800 border border-default-200 dark:border-gray-600 rounded-lg p-6 shadow-inner">
                    {/* Document Content */}
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                      {consent.content}
                    </p>

                    {/* Agreement Statement */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic mb-8 border-t border-default-100 dark:border-gray-600 pt-4">
                      By signing below, I acknowledge that I have read,
                      understood, and agree to the above terms.
                    </p>

                    {/* Signature Area */}
                    <div className="flex justify-center">
                      <SignatureStamp
                        data-testid={`signature-stamp-${consent.id}`}
                        disabled={
                          isSigned || loading || signingConsent === consent.id
                        }
                        isLoading={signingConsent === consent.id}
                        timestamp={timestamp}
                        userName={
                          isSigned && signatureSnapshots[consent.id]
                            ? signatureSnapshots[consent.id].name
                            : signature.name
                        }
                        onClick={() => handleSignConsent(consent.id)}
                        isSigned={isSigned}
                        // Use stored signature snapshot if signed, otherwise current signature
                        signature={(() => {
                          const snapSig =
                            isSigned && signatureSnapshots[consent.id];

                          if (snapSig) {
                            return snapSig;
                          } else {
                            return signature;
                          }
                        })()}
                      />
                    </div>

                    {/* Date (shown after signing) */}
                    {isSigned && timestamp && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                        Signed on: {new Date(timestamp).toLocaleDateString()} at{" "}
                        {new Date(timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Card */}
      {allRequiredConsentsGiven && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-success bg-success-50/50">
            <CardBody className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check
                    className="w-6 h-6 text-white"
                    data-component-category="ui"
                    data-component-id="check"
                  />
                </div>
                <p className="text-sm font-medium text-success-700">
                  All agreements have been signed
                </p>
                <p className="text-xs text-default-600 mt-1">
                  You have successfully signed all required legal agreements
                  with your digital signature.
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

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
          data-testid="legal-consent-continue-button"
          isDisabled={loading || !allRequiredConsentsGiven || submitting}
          isLoading={loading || submitting}
          onPress={handleSubmit}
        >
          Continue to Verification
        </Button>
      </div>

      {!allRequiredConsentsGiven && (
        <p className="text-center text-sm text-danger-600">
          Please sign all required agreements to continue.
        </p>
      )}
    </div>
  );
}
