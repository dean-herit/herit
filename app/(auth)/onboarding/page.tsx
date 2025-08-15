'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner, Card, CardBody } from '@heroui/react';
import { UserIcon, PencilSquareIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { VerticalSteps } from '@/components/ui/VerticalSteps';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { SignatureStep } from './components/SignatureStep';
import { LegalConsentStep } from './components/LegalConsentStep';
import { VerificationStep } from './components/VerificationStep';
import { PersonalInfo, Signature, OnboardingProgress } from '@/types/onboarding';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    id: 'personal_info',
    title: 'Personal Information',
    description: 'Basic details and Irish address',
    icon: UserIcon,
  },
  {
    id: 'signature',
    title: 'Create Signature',
    description: 'Choose or create your digital signature',
    icon: PencilSquareIcon,
  },
  {
    id: 'legal_consent',
    title: 'Legal Consent',
    description: 'Required legal agreements',
    icon: DocumentTextIcon,
  },
  {
    id: 'verification',
    title: 'Identity Verification',
    description: 'Secure identity verification',
    icon: ShieldCheckIcon,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading, user } = useAuth();
  
  // Main state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Step data
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: '',
    eircode: '',
    profile_photo: null,
  });
  
  const [signature, setSignature] = useState<Signature | null>(null);
  const [consents, setConsents] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Check authentication
  useEffect(() => {
    if (!isSessionLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user && user.onboarding_completed) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding-progress');
    if (savedProgress) {
      try {
        const progress: OnboardingProgress = JSON.parse(savedProgress);
        setCurrentStep(progress.currentStep || 0);
        setPersonalInfo(progress.personalInfo || personalInfo);
        setSignature(progress.signature || null);
        setConsents(progress.consents || []);
        setCompletedSteps(progress.completedSteps || []);
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
      }
    }
    
    // Try to populate from user session
    fetchUserData();
  }, []);
  
  // Save progress to localStorage whenever state changes
  useEffect(() => {
    const progress: OnboardingProgress = {
      currentStep,
      personalInfo,
      signature,
      consents,
      completedSteps,
    };
    localStorage.setItem('onboarding-progress', JSON.stringify(progress));
  }, [currentStep, personalInfo, signature, consents, completedSteps]);
  
  // Fetch user data from session
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setPersonalInfo(prev => ({
            ...prev,
            first_name: data.user.given_name || prev.first_name,
            last_name: data.user.family_name || prev.last_name,
            email: data.user.email || prev.email,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };
  
  // Handle step completion
  const handleStepComplete = async (stepIndex: number, stepData: any) => {
    setErrors([]);
    setLoading(true);
    
    try {
      // Save step data to backend (placeholder for now)
      // const response = await fetch('/api/onboarding/save-step', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     step: stepIndex,
      //     data: stepData,
      //   }),
      // });
      
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
          // Verification completed - redirect to dashboard
          completeOnboarding();
          return;
      }
      
      // Mark step as completed and move to next step
      setCompletedSteps(prev => [...prev.filter(s => s !== stepIndex), stepIndex]);
      
      if (stepIndex < STEPS.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
      
    } catch (error) {
      console.error('Error completing step:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to save step']);
    } finally {
      setLoading(false);
    }
  };
  
  // Complete onboarding and redirect to dashboard
  const completeOnboarding = async () => {
    try {
      // Clear onboarding progress
      localStorage.removeItem('onboarding-progress');
      
      // Redirect to dashboard (placeholder - would normally mark completion in backend)
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setErrors(['Failed to complete onboarding. Please try again.']);
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
      onBack: currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined,
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
            personalInfo={personalInfo}
            initialSignature={signature}
            onChange={setSignature}
            onComplete={() => handleStepComplete(currentStep, signature)}
          />
        );
      case 2:
        return signature ? (
          <LegalConsentStep
            {...commonProps}
            signature={signature}
            initialConsents={consents}
            onChange={setConsents}
            onComplete={() => handleStepComplete(currentStep, consents)}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-default-600">Please complete the signature step first.</p>
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

  if (isSessionLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar with steps */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <VerticalSteps
                  steps={STEPS}
                  currentStep={currentStep}
                  onStepChange={goToStep}
                />
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-3">
              {/* Error Display */}
              {errors.length > 0 && (
                <Card className="mb-8 border-danger-200 bg-danger-50">
                  <CardBody className="p-6">
                    <div className="font-medium mb-2 text-danger-600">Please correct the following errors:</div>
                    <ul className="space-y-1">
                      {errors.map((error, index) => (
                        <li key={index} className="text-sm text-danger-600">• {error}</li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              )}
              
              {/* Step Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold">
                        {currentStep + 1}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                      {STEPS[currentStep].title}
                    </h1>
                    <p className="text-sm text-default-600 mt-1">
                      {STEPS[currentStep].description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Step Content */}
              <Card>
                <CardBody className="p-8">
                  {renderCurrentStep()}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}