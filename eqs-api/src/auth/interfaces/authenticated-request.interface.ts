import type { Request } from 'express';

export interface AuthenticatedUser {
  userId: number;
  roleId: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
