export interface UserRole {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt?: string;
  role: UserRole;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
}

export type ProfileResponse = AuthUser;