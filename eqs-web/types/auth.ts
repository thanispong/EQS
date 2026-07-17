export interface UserRole {
  id: number;
  name: string;
}

export interface LoginUser {
  id: number;
  email: string;
  displayName: string;
  isActive?: boolean;
  role: string;
}

export interface ProfileUser {
  id: number;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt?: string;
  role: UserRole;
}

export interface LoginResponse {
  message: string;
  user: LoginUser;
}

export type ProfileResponse = ProfileUser;