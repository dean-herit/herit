export interface User {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
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
  given_name: string;
  family_name: string;
}