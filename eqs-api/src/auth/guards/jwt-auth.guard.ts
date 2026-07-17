import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: {
          userId: number;
          roleId: number;
        };
      }
    >();

    const token = request.cookies?.access_token as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = {
        userId: payload.sub,
        roleId: payload.roleId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}