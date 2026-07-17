import type { Request } from 'express';

export interface AuthenticatedUser {
  userId: number;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
