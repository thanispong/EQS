import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getRoles() {
    return this.prisma.role.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }
}
