/**
 * Authentication-related type definitions
 */

export class AuthError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

export interface User {
  id: string;
  email: string;
  requiresMFA?: boolean;
  // Add other user properties as needed
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginOptions {
  captchaToken?: string;
  csrf?: string;
}