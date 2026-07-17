export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  isActive?: boolean;
  role: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
}

export type ProfileResponse = AuthUser;