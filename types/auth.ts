export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  onboardingStatus?: string | null;
  onboardingCurrentStep?: string | null;
  onboarding_completed?: boolean;
}

export interface Session {
  user: User | null;
  token?: string;
  expires?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}