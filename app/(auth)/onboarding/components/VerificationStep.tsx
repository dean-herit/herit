"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface VerificationStepProps {
  onComplete: (data?: any) => void;
  onBack?: () => void;
  loading: boolean;
}

interface VerificationData {
  sessionId?: string;
  status?: string;
  completed?: boolean;
  completedAt?: string;
  stripeStatus?: {
    id: string;
    status: string;
    url?: string;
    lastError?: any;
  };
}

export function VerificationStep({
  onComplete,
  onBack,
  loading,
}: VerificationStepProps) {
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Load existing verification status on mount
  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  // Check for verification completion from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("verification") === "complete") {
      // Verification was completed, refresh status
      setTimeout(() => {
        fetchVerificationStatus();
      }, 2000);
    }
  }, []);

  const fetchVerificationStatus = async () => {
    console.log("VerificationStep.fetchVerificationStatus - Fetching status");
    setCheckingStatus(true);

    try {
      const response = await fetch("/api/onboarding/verification");

      if (response.ok) {
        const data = await response.json();

        console.log(
          "VerificationStep.fetchVerificationStatus - Status fetched",
          {
            verification: data.verification,
            completed: data.verification?.completed,
            status: data.verification?.status,
            stripeStatus: data.verification?.stripeStatus?.status,
          },
        );

        setVerificationData(data.verification);
      } else {
        const errorData = await response.json();

        console.error(
          "VerificationStep.fetchVerificationStatus - API error",
          errorData,
        );
      }
    } catch (error) {
      console.error(
        "VerificationStep.fetchVerificationStatus - Network error",
        error,
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  const startStripeVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationMethod: "stripe_identity",
          returnUrl: `${window.location.origin}/onboarding?step=3&verification=complete`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to start verification");
      }

      const data = await response.json();

      if (data.verificationUrl) {
        // Redirect to Stripe Identity verification
        window.location.href = data.verificationUrl;
      } else {
        throw new Error("No verification URL received");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to start verification",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    console.log(
      "VerificationStep.handleComplete - Starting completion process",
    );

    try {
      // Call the completion endpoint which now handles syncing internally
      const completionResponse = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (completionResponse.ok) {
        const data = await completionResponse.json();

        console.log(
          "VerificationStep.handleComplete - Completion successful",
          data,
        );

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        const errorData = await completionResponse.json();

        console.error(
          "VerificationStep.handleComplete - Completion failed",
          errorData,
        );

        // Show error to user
        setError(
          errorData.error || "Failed to complete onboarding. Please try again.",
        );

        // If the error indicates missing steps, still call the parent callback
        // to allow the user to potentially go back and complete them
        if (errorData.completionStatus) {
          onComplete({
            verificationCompleted: true,
            missingSteps: errorData.completionStatus,
          });
        }
      }
    } catch (error) {
      console.error(
        "VerificationStep.handleComplete - Error during completion",
        error,
      );
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const getVerificationStatus = () => {
    if (verificationData?.completed) return "completed";
    if (verificationData?.stripeStatus?.status === "verified")
      return "completed";
    if (verificationData?.stripeStatus?.status === "requires_input")
      return "requires_input";
    if (verificationData?.sessionId) return "in_progress";

    return "pending";
  };

  const status = getVerificationStatus();

  if (checkingStatus) {
    return (
      <div className="space-y-6">
        <div className="text-left">
          <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
            Identity Verification
          </h3>
          <p className="text-black dark:text-white">
            Loading verification status...
          </p>
        </div>
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="verification-step">
      <div className="text-left">
        <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
          Identity Verification
        </h3>
        <p className="text-black dark:text-white">
          For your security, we need to verify your identity before completing
          your onboarding.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === "pending" && (
          <motion.div
            key="pending"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardBody className="p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary text-2xl">🛡️</span>
                </div>
                <h4 className="font-semibold mb-2 text-black dark:text-white">
                  Secure Identity Verification
                </h4>
                <p className="text-sm text-black dark:text-white mb-4">
                  We use Stripe Identity to securely verify your identity.
                  You&apos;ll need a government-issued ID and will be asked to
                  take a selfie.
                </p>
                {error && (
                  <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-sm text-danger-600">{error}</p>
                  </div>
                )}
                <Button
                  color="primary"
                  data-testid="start-identity-verification-button"
                  isDisabled={isLoading}
                  isLoading={isLoading}
                  size="lg"
                  onPress={startStripeVerification}
                >
                  {isLoading
                    ? "Starting Verification..."
                    : "Start Identity Verification"}
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {status === "in_progress" && (
          <motion.div
            key="in_progress"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardBody className="p-6 text-center">
                <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-warning-600" />
                </div>
                <h4 className="font-semibold mb-2 text-black dark:text-white">
                  Verification In Progress
                </h4>
                <p className="text-sm text-black dark:text-white mb-4">
                  Your identity verification is currently being processed. This
                  may take a few minutes.
                </p>
                <div className="bg-default-100 dark:bg-default-800/50 border border-default-200 dark:border-default-700 rounded-lg p-4 mb-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-black/70 dark:text-white/70">
                        Session ID:
                      </span>
                      <span className="font-mono text-xs text-black dark:text-white">
                        {verificationData?.sessionId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/70 dark:text-white/70">
                        Status:
                      </span>
                      <span className="capitalize text-black dark:text-white">
                        {verificationData?.status || "Processing"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  data-testid="refresh-status-button"
                  isLoading={checkingStatus}
                  size="sm"
                  variant="flat"
                  onPress={fetchVerificationStatus}
                >
                  Refresh Status
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {status === "requires_input" && (
          <motion.div
            key="requires_input"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <Card className="border-warning-200 bg-warning-50">
              <CardBody className="p-6 text-center">
                <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-warning-600" />
                </div>
                <h4 className="font-semibold text-warning-700 mb-2">
                  Additional Input Required
                </h4>
                <p className="text-sm text-warning-600 mb-4">
                  There was an issue with your verification. Please try again or
                  contact support.
                </p>
                {verificationData?.stripeStatus?.lastError && (
                  <div className="bg-warning-100/50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3 mb-4">
                    <p className="text-xs text-warning-700 dark:text-warning-300">
                      Error:{" "}
                      {verificationData.stripeStatus.lastError.reason ||
                        "Unknown error"}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 justify-center">
                  <Button
                    data-testid="try-again-button"
                    isLoading={isLoading}
                    variant="flat"
                    onPress={startStripeVerification}
                  >
                    Try Again
                  </Button>
                  <Button
                    data-testid="check-status-button"
                    isLoading={checkingStatus}
                    variant="bordered"
                    onPress={fetchVerificationStatus}
                  >
                    Check Status
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {status === "completed" && (
          <motion.div
            key="completed"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardBody className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-black dark:text-white" />
                </div>
                <h4 className="font-semibold text-black dark:text-white mb-2">
                  Identity Verified Successfully!
                </h4>
                <p className="text-sm text-black dark:text-white mb-4">
                  Your identity has been verified using Stripe Identity. You can
                  now access all features of Herit.
                </p>

                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-black/70 dark:text-white/70">
                        Verification Method
                      </p>
                      <p className="font-medium text-black dark:text-white">
                        Stripe Identity
                      </p>
                    </div>
                    <div>
                      <p className="text-black/70 dark:text-white/70">Status</p>
                      <p className="font-medium text-black dark:text-white">
                        Verified
                      </p>
                    </div>
                    <div>
                      <p className="text-black/70 dark:text-white/70">
                        Completed At
                      </p>
                      <p className="font-medium text-black dark:text-white">
                        {verificationData?.completedAt
                          ? new Date(
                              verificationData.completedAt,
                            ).toLocaleString()
                          : "Just now"}
                      </p>
                    </div>
                    <div>
                      <p className="text-black/70 dark:text-white/70">
                        Session ID
                      </p>
                      <p className="font-mono text-xs text-black dark:text-white">
                        {verificationData?.sessionId}
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onBack ? (
          <Button
            data-testid="Button-k3y61g9wd"
            isDisabled={loading || isLoading}
            variant="bordered"
            onPress={onBack}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          color="primary"
          data-testid="complete-onboarding-button"
          isDisabled={loading || status !== "completed"}
          isLoading={loading}
          size="lg"
          onPress={handleComplete}
        >
          Complete Onboarding
        </Button>
      </div>
    </div>
  );
}
