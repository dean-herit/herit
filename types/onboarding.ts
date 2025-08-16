export interface PersonalInfo {
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  county: string;
  eircode: string;
  profile_photo?: string | null;
}

export interface Signature {
  id: string;
  name: string;
  data: string;
  type: 'drawn' | 'uploaded' | 'template';
  font?: string; // Font family name for template signatures
  className?: string; // CSS class for the font
  createdAt: string;
}

export interface OnboardingProgress {
  currentStep: number;
  personalInfo: PersonalInfo | null;
  signature: Signature | null;
  consents: string[];
  completedSteps: number[];
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}