import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto, userId: number) {
    const name = createSubjectDto.name.trim();

    const existingSubject = await this.prisma.subject.findUnique({
      where: {
        name,
      },
    });

    if (existingSubject) {
      throw new ConflictException('Subject name already exists');
    }

    return this.prisma.subject.create({
      data: {
        name,
        description: createSubjectDto.description?.trim() || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  findAll() {
    return this.prisma.subject.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const subject = await this.prisma.subject.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        topics: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  async update(
    id: number,
    updateSubjectDto: UpdateSubjectDto,
    userId: number,
  ) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const name = updateSubjectDto.name?.trim();

    if (name && name !== subject.name) {
      const duplicateSubject = await this.prisma.subject.findUnique({
        where: {
          name,
        },
      });

      if (duplicateSubject) {
        throw new ConflictException('Subject name already exists');
      }
    }

    return this.prisma.subject.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && {
          name,
        }),
        ...(updateSubjectDto.description !== undefined && {
          description: updateSubjectDto.description.trim() || null,
        }),
        ...(updateSubjectDto.isActive !== undefined && {
          isActive: updateSubjectDto.isActive,
        }),
        updatedBy: userId,
      },
    });
  }

  async remove(id: number, userId: number) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (!subject.isActive) {
      return {
        message: 'Subject is already inactive',
      };
    }

    await this.prisma.subject.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });

    return {
      message: 'Subject deleted successfully',
    };
  }
}
