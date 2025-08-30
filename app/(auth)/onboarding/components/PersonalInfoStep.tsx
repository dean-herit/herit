"use client";

import { useMutation } from "@tanstack/react-query";
import { SubmitHandler } from "react-hook-form";
import { useEffect, useState, useRef } from "react";

import { SharedPersonalInfoFormProvider } from "@/components/shared/SharedPersonalInfoFormProvider";
import { OnboardingPersonalInfo } from "@/types/shared-personal-info";
import { PersonalInfo } from "@/types/onboarding";

interface PersonalInfoStepProps {
  initialData: PersonalInfo & { 
    auth_provider?: string | null;
    user_id?: string;
  };
  onChange: (data: PersonalInfo) => void;
  onComplete: () => void;
  onBack?: () => void;
  loading?: boolean;
  dataLoading?: boolean;
}

// Helper functions to convert between onboarding and shared formats
const convertToSharedFormat = (
  data: PersonalInfo,
): Partial<OnboardingPersonalInfo> => ({
  name: `${data.first_name} ${data.last_name}`.trim(),
  email: data.email,
  phone: data.phone_number,
  pps_number: data.pps_number || "",
  address_line_1: data.address_line_1,
  address_line_2: data.address_line_2 || "",
  city: data.city,
  county: data.county as any, // Type compatibility - handled by validation
  eircode: data.eircode,
  country: "Ireland",
  photo_url: data.profile_photo || "",
  date_of_birth: data.date_of_birth || "",
});

const convertFromSharedFormat = (
  sharedData: OnboardingPersonalInfo,
): PersonalInfo => {
  const [firstName, ...lastNameParts] = sharedData.name.split(" ");

  return {
    first_name: firstName || "",
    last_name: lastNameParts.join(" ") || "",
    email: sharedData.email || "",
    date_of_birth: sharedData.date_of_birth || "",
    phone_number: sharedData.phone || "",
    pps_number: sharedData.pps_number || "",
    address_line_1: sharedData.address_line_1,
    address_line_2: sharedData.address_line_2 || "",
    city: sharedData.city,
    county: sharedData.county || "",
    eircode: sharedData.eircode || "",
    profile_photo: sharedData.photo_url || null,
  };
};

export function PersonalInfoStep({
  initialData,
  onChange,
  onComplete,
  onBack,
  loading,
  dataLoading = false,
}: PersonalInfoStepProps) {
  // Performance tracking state
  const [formLoadStartTime] = useState(() => Date.now());
  const [formVisible, setFormVisible] = useState(false);
  const [prePopulationLogged, setPrePopulationLogged] = useState(false);
  const performanceLoggedRef = useRef(false);

  // Enhanced data validation
  const hasInitialData = initialData.first_name || initialData.last_name || initialData.email;
  const hasGoogleData = hasInitialData && initialData.auth_provider === 'google';
  const isFromOAuth = initialData.auth_provider === 'google';

  // Log performance when form becomes visible
  useEffect(() => {
    if (!dataLoading && hasInitialData && !performanceLoggedRef.current) {
      performanceLoggedRef.current = true;
      setFormVisible(true);

      // Log form loading performance
      const loadingDuration = Date.now() - formLoadStartTime;
      
      // Track OAuth pre-population success
      if (isFromOAuth && !prePopulationLogged) {
        setPrePopulationLogged(true);
        
        // Log OAuth pre-population metrics
        fetch('/api/audit/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'oauth_form_prepopulation',
            event_action: 'form_prepopulation_success',
            resource_type: 'onboarding_form',
            event_data: {
              provider: 'google',
              fields_populated: [
                initialData.first_name && 'first_name',
                initialData.last_name && 'last_name', 
                initialData.email && 'email',
                initialData.profile_photo && 'profile_photo'
              ].filter(Boolean),
              data_source: 'oauth_callback',
              pre_population_success: true,
              form_step: 'personal_info',
              loading_duration_ms: loadingDuration,
              user_experience_optimal: loadingDuration < 2000
            }
          })
        }).catch(err => console.warn('Failed to log OAuth prepopulation:', err));
      }

      // Log form loading performance
      fetch('/api/audit/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'form_performance',
          event_action: 'personal_info_form_loaded',
          resource_type: 'onboarding_form',
          event_data: {
            has_prepopulated_data: hasInitialData,
            from_google_oauth: isFromOAuth,
            loading_duration_ms: loadingDuration,
            performance_target_met: loadingDuration < 2000,
            network_type: (navigator as any).connection?.effectiveType || 'unknown',
            user_agent: navigator.userAgent.substring(0, 100) // Truncated for privacy
          }
        })
      }).catch(err => console.warn('Failed to log performance:', err));
    }
  }, [dataLoading, hasInitialData, isFromOAuth, formLoadStartTime, prePopulationLogged]);

  // Log form abandonment if user leaves without completing
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formVisible && !loading) {
        navigator.sendBeacon('/api/audit/log-event', JSON.stringify({
          event_type: 'form_abandonment',
          event_action: 'personal_info_form_abandoned',
          resource_type: 'onboarding_form',
          event_data: {
            time_on_form_ms: Date.now() - formLoadStartTime,
            from_oauth_prepopulation: isFromOAuth,
            had_prepopulated_data: hasInitialData
          }
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formVisible, loading, formLoadStartTime, isFromOAuth, hasInitialData]);

  // API mutation for saving personal info with performance tracking
  const savePersonalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfo) => {
      const saveStartTime = Date.now();
      
      const response = await fetch("/api/onboarding/personal-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: data.phone_number,
          dateOfBirth: data.date_of_birth,
          ppsNumber: data.pps_number,
          addressLine1: data.address_line_1,
          addressLine2: data.address_line_2,
          city: data.city,
          county: data.county,
          eircode: data.eircode,
        }),
      });

      const saveDuration = Date.now() - saveStartTime;

      if (!response.ok) {
        const error = await response.json();

        // Log save failure with performance data
        fetch('/api/audit/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'form_save_failed',
            event_action: 'personal_info_save_error',
            resource_type: 'onboarding_form',
            event_data: {
              error_message: error.error || "Unknown error",
              save_duration_ms: saveDuration,
              from_oauth_prepopulation: isFromOAuth,
              status_code: response.status,
              form_completion_time_ms: Date.now() - formLoadStartTime
            }
          })
        }).catch(err => console.warn('Failed to log save error:', err));

        throw new Error(error.error || "Failed to save personal information");
      }

      // Log successful save with performance metrics
      fetch('/api/audit/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'form_save_success',
          event_action: 'personal_info_saved',
          resource_type: 'onboarding_form',
          event_data: {
            save_duration_ms: saveDuration,
            total_form_time_ms: Date.now() - formLoadStartTime,
            from_oauth_prepopulation: isFromOAuth,
            fields_modified: (Object.keys(data) as (keyof PersonalInfo)[]).filter((key) => 
              // Track which fields were actually changed from OAuth data
              !isFromOAuth || initialData[key] !== data[key]
            ),
            save_performance_good: saveDuration < 1000,
            user_experience_optimal: (Date.now() - formLoadStartTime) < 30000 // 30 seconds
          }
        })
      }).catch(err => console.warn('Failed to log save success:', err));

      return response.json();
    },
    onSuccess: () => {
      // Log successful form completion
      fetch('/api/audit/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'onboarding_step_completed',
          event_action: 'personal_info_step_completed',
          resource_type: 'onboarding_progress',
          event_data: {
            step_name: 'personal_info',
            next_step: 'signature',
            total_time_on_step_ms: Date.now() - formLoadStartTime,
            oauth_prepopulation_used: isFromOAuth,
            completion_successful: true
          }
        })
      }).catch(err => console.warn('Failed to log completion:', err));

      onComplete();
    },
    onError: (error) => {
      console.error("Personal info save error:", error);
      
      // Log form completion failure
      fetch('/api/audit/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'onboarding_step_failed',
          event_action: 'personal_info_step_failed',
          resource_type: 'onboarding_progress',
          event_data: {
            step_name: 'personal_info',
            error_message: error.message,
            total_time_on_step_ms: Date.now() - formLoadStartTime,
            oauth_prepopulation_used: isFromOAuth,
            completion_failed: true
          }
        })
      }).catch(err => console.warn('Failed to log failure:', err));
    },
  });

  const handleSharedFormSubmit: SubmitHandler<OnboardingPersonalInfo> = async (
    sharedData,
  ) => {
    // Convert back to onboarding format
    const personalInfoData = convertFromSharedFormat(sharedData);

    // Update parent state
    onChange(personalInfoData);

    // Save via API
    savePersonalInfoMutation.mutate(personalInfoData);
  };

  const isLoading = loading || savePersonalInfoMutation.isPending;

  // Enhanced loading message based on data source and context
  const getLoadingMessage = () => {
    if (hasGoogleData) {
      return {
        primary: "Loading your Google profile information...",
        secondary: "Pre-filling with your Google account details"
      };
    } else if (hasInitialData) {
      return {
        primary: "Loading your information...",
        secondary: "Retrieving your saved details"
      };
    } else {
      return {
        primary: "Loading your information...",
        secondary: "Preparing your personal information form"
      };
    }
  };

  const loadingMessage = getLoadingMessage();
  
  return (
    <div className="space-y-6" data-testid="personal-info-form">
      {/* Enhanced loading state with contextual messaging */}
      {dataLoading || (!hasInitialData && !isLoading) ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-default-600 text-sm">{loadingMessage.primary}</p>
            {loadingMessage.secondary && (
              <p className="text-default-500 text-xs mt-1">
                {loadingMessage.secondary}
              </p>
            )}
            {/* Performance indicator for slow loading */}
            {dataLoading && (Date.now() - formLoadStartTime) > 3000 && (
              <p className="text-warning-500 text-xs mt-2">
                This is taking longer than usual. Please wait...
              </p>
            )}
          </div>
        </div>
      ) : (
        <>

          {/* Shared Personal Information Form */}
          <SharedPersonalInfoFormProvider
            initialData={convertToSharedFormat(initialData)}
            loading={isLoading}
            mode="onboarding"
            showCancelButton={!!onBack}
            showPhotoUpload={false}
            submitLabel="Continue"
            onCancel={onBack}
            onSubmit={handleSharedFormSubmit}
            isFromOAuth={isFromOAuth}
            oauthProvider={initialData.auth_provider || undefined}
          />

          {/* Error Display */}
          {savePersonalInfoMutation.error && (
            <div className="mt-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-sm">Failed to save personal information</p>
                  <p className="text-sm mt-1">{savePersonalInfoMutation.error.message}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
