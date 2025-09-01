// Import database type
import type { User as DBUser } from "@/db/schema";

// Use database type as the source of truth for User
export type User = DBUser;

export interface Session {
  user: User | null;
  token?: string;
  expires?: string;
  error?:
    | "token_invalid"
    | "token_expired"
    | "token_missing"
    | "user_not_found"
    | null;
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
