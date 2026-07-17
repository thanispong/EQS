import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: {
        name,
      },
    });
  }

  createStudent(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    roleId: number;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        roleId: data.roleId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}