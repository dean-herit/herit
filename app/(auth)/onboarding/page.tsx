"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spinner, Card, CardBody } from "@heroui/react";
import {
  UserIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import { PersonalInfoStep } from "./components/PersonalInfoStep";
import { SignatureStep } from "./components/SignatureStep";
import { LegalConsentStep } from "./components/LegalConsentStep";
import { VerificationStep } from "./components/VerificationStep";

import { VerticalSteps } from "@/components/ui/VerticalSteps";
import { useAuth } from "@/hooks/useAuth";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import { PersonalInfo, Signature } from "@/types/onboarding";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    id: "personal_info",
    title: "Personal Information",
    description: "Basic details and Irish address",
    icon: UserIcon,
  },
  {
    id: "signature",
    title: "Create Signature",
    description: "Choose or create your digital signature",
    icon: PencilSquareIcon,
  },
  {
    id: "legal_consent",
    title: "Legal Consent",
    description: "Required legal agreements",
    icon: DocumentTextIcon,
  },
  {
    id: "verification",
    title: "Identity Verification",
    description: "Secure identity verification",
    icon: ShieldCheckIcon,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading, user, authError, refetchSession } =
    useAuth();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Main state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // Track initial data loading
  const [errors, setErrors] = useState<string[]>([]);

  // Step data
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    phone_number: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    county: "",
    eircode: "",
    profile_photo: null,
  });

  const [signature, setSignature] = useState<Signature | null>(null);
  const [consents, setConsents] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Check authentication
  useEffect(() => {
    console.log("Onboarding page effect:", {
      isSessionLoading,
      isAuthenticated,
      userId: user?.id,
      onboardingCompleted: user?.onboarding_completed,
    });

    // Clear any pending redirects
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    if (!isSessionLoading) {
      if (!isAuthenticated) {
        console.log("Onboarding: Not authenticated, redirecting to login");
        redirectTimeoutRef.current = setTimeout(() => {
          router.push("/login");
        }, 100); // Small delay to prevent rapid redirects

        return;
      }

      if (user && user.onboarding_completed) {
        console.log(
          "Onboarding: User onboarding completed, redirecting to dashboard",
        );
        redirectTimeoutRef.current = setTimeout(() => {
          router.push("/dashboard");
        }, 100); // Small delay to prevent rapid redirects

        return;
      }
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, isSessionLoading, user, router]);

  // Load initial data from database on component mount
  useEffect(() => {
    // Always fetch fresh data from database to determine current state
    fetchUserData(true);
  }, []);
  // Determine current step based on completion status
  const determineCurrentStep = (userData: any) => {
    console.log("Determining current step with data:", userData);
    if (!userData.personal_info_completed) return 0;
    if (!userData.signature_completed) return 1;
    if (!userData.legal_consent_completed) return 2;
    if (!userData.verification_completed) return 3;

    // All steps completed - should redirect to dashboard
    console.log("All steps completed, should redirect to dashboard");

    return 3;
  };

  // Fetch user data from session and database
  const fetchUserData = async (shouldSetStep = false) => {
    console.log("fetchUserData called, shouldSetStep:", shouldSetStep);
    setDataLoading(true); // Set loading state
    try {
      // Fetch personal information and completion status from database
      console.log("Fetching personal info...");
      const personalInfoResponse = await fetch("/api/onboarding/personal-info");

      if (personalInfoResponse.ok) {
        const personalInfoData = await personalInfoResponse.json();

        console.log("Personal info data:", personalInfoData);

        if (personalInfoData.personalInfo) {
          // Merge personal info with OAuth provider data for immutable email handling
          const personalInfoWithOAuth = {
            ...personalInfoData.personalInfo,
            auth_provider: personalInfoData.dataSource?.provider || null,
            user_id: user?.id || null
          };
          setPersonalInfo(personalInfoWithOAuth);
          console.log("Personal info set with OAuth data:", personalInfoWithOAuth);
        }

        // Set current step based on completion status if this is initial load without local progress
        if (personalInfoData.completionStatus && shouldSetStep) {
          const appropriateStep = determineCurrentStep(
            personalInfoData.completionStatus,
          );

          console.log("Setting current step to:", appropriateStep);
          setCurrentStep(appropriateStep);
        }
      } else {
        console.error(
          "Personal info fetch failed:",
          personalInfoResponse.status,
          await personalInfoResponse.text(),
        );
      }

      // Fetch existing signature from database
      console.log("Fetching signature...");
      const signatureResponse = await fetch("/api/onboarding/signature");

      if (signatureResponse.ok) {
        const signatureData = await signatureResponse.json();

        console.log("Signature data:", signatureData);

        if (signatureData.signature) {
          setSignature(signatureData.signature);
          console.log("Signature set:", signatureData.signature);
        }
      } else {
        console.error(
          "Signature fetch failed:",
          signatureResponse.status,
          await signatureResponse.text(),
        );
      }

      // Fetch existing consents from database
      console.log("Fetching consents...");
      const consentsResponse = await fetch("/api/onboarding/legal-consent");

      if (consentsResponse.ok) {
        const consentsData = await consentsResponse.json();

        console.log("Consents data:", consentsData);

        if (consentsData.consents) {
          const consentIds = Object.keys(consentsData.consents).filter(
            (id) => consentsData.consents[id]?.agreed,
          );

          setConsents(consentIds);
          console.log("Consents set:", consentIds);
        }
      } else {
        console.error(
          "Consents fetch failed:",
          consentsResponse.status,
          await consentsResponse.text(),
        );
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    } finally {
      setDataLoading(false); // Always clear loading state
    }
  };

  // Handle step completion
  const handleStepComplete = async (stepIndex: number, stepData: any) => {
    setErrors([]);
    setLoading(true);

    try {
      // Save step data to backend
      const response = await fetch("/api/onboarding/save-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: stepIndex,
          data: stepData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to save step");
      }

      const result = await response.json();

      console.log("Step saved successfully:", result);

      // Update local state based on step
      switch (stepIndex) {
        case 0:
          setPersonalInfo(stepData);
          break;
        case 1:
          setSignature(stepData);
          break;
        case 2:
          setConsents(stepData);
          break;
        case 3:
          // Verification completed - complete onboarding
          await completeOnboarding();

          return;
      }

      // Mark step as completed and move to next step
      setCompletedSteps((prev) => [
        ...prev.filter((s) => s !== stepIndex),
        stepIndex,
      ]);

      if (stepIndex < STEPS.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
    } catch (error) {
      console.error("Error completing step:", error);
      setErrors([
        error instanceof Error ? error.message : "Failed to save step",
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding and redirect to dashboard
  const completeOnboarding = async () => {
    try {
      // Call completion API to mark onboarding as complete in backend
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to complete onboarding");
      }

      const result = await response.json();

      console.log("Onboarding completed successfully:", result);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setErrors([
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding. Please try again.",
      ]);
    }
  };

  // Navigate between steps
  const goToStep = (stepIndex: number) => {
    if (stepIndex <= Math.max(...completedSteps, -1) + 1) {
      setCurrentStep(stepIndex);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    const commonProps = {
      loading,
      dataLoading, // Pass data loading state to steps
      onBack:
        currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined,
    };

    switch (currentStep) {
      case 0:
        return (
          <PersonalInfoStep
            {...commonProps}
            initialData={personalInfo}
            onChange={setPersonalInfo}
            onComplete={() => handleStepComplete(currentStep, personalInfo)}
          />
        );
      case 1:
        return (
          <SignatureStep
            {...commonProps}
            initialSignature={signature}
            personalInfo={personalInfo}
            onChange={setSignature}
            onComplete={(signature) =>
              handleStepComplete(currentStep, signature)
            }
          />
        );
      case 2:
        return signature ? (
          <LegalConsentStep
            {...commonProps}
            initialConsents={consents}
            signature={signature}
            onChange={setConsents}
            onComplete={() => handleStepComplete(currentStep, consents)}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-default-600">
              Please complete the signature step first.
            </p>
          </div>
        );
      case 3:
        return (
          <VerificationStep
            {...commonProps}
            onComplete={() => handleStepComplete(currentStep, {})}
          />
        );
      default:
        return null;
    }
  };

  // Show authentication error handler if there are JWT issues
  if (authError) {
    return <AuthErrorHandler error={authError} onRetry={refetchSession} />;
  }

  if (isSessionLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-default-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with steps */}
          <div className="lg:col-span-1">
            <div className="sticky top-16 pt-16 ">
              <VerticalSteps
                currentStep={currentStep}
                steps={STEPS}
                onStepChange={goToStep}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 mt-12 ">
            {/* Error Display */}
            {errors.length > 0 && (
              <Card className="mb-8 border-danger-200 bg-danger-50">
                <CardBody className="p-6">
                  <div className="font-medium mb-2 text-danger-600">
                    Please correct the following errors:
                  </div>
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-danger-600">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            {/* Step Content */}
            <Card className="shadow-none bg-transparent">
              <CardBody className="px-8 pb-8">{renderCurrentStep()}</CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
