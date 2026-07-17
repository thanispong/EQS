import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTopicDto: CreateTopicDto, userId: number) {
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: createTopicDto.subjectId,
        isActive: true,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const name = createTopicDto.name.trim();

    const existingTopic = await this.prisma.topic.findUnique({
      where: {
        subjectId_name: {
          subjectId: createTopicDto.subjectId,
          name,
        },
      },
    });

    if (existingTopic) {
      throw new ConflictException(
        'Topic name already exists in this subject',
      );
    }

    return this.prisma.topic.create({
      data: {
        subjectId: createTopicDto.subjectId,
        name,
        description: createTopicDto.description?.trim() || null,
        sortOrder: createTopicDto.sortOrder ?? 0,
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        subjectId: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findAll(subjectId?: number) {
    return this.prisma.topic.findMany({
      where: {
        isActive: true,
        subject: {
          isActive: true,
        },
        ...(subjectId !== undefined && {
          subjectId,
        }),
      },
      orderBy: [
        {
          subjectId: 'asc',
        },
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      select: {
        id: true,
        subjectId: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const topic = await this.prisma.topic.findFirst({
      where: {
        id,
        isActive: true,
        subject: {
          isActive: true,
        },
      },
      select: {
        id: true,
        subjectId: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        quizzes: {
          where: {
            isActive: true,
          },
          orderBy: {
            title: 'asc',
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  async update(
    id: number,
    updateTopicDto: UpdateTopicDto,
    userId: number,
  ) {
    const topic = await this.prisma.topic.findUnique({
      where: {
        id,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const nextSubjectId = updateTopicDto.subjectId ?? topic.subjectId;

    if (updateTopicDto.subjectId !== undefined) {
      const subject = await this.prisma.subject.findFirst({
        where: {
          id: updateTopicDto.subjectId,
          isActive: true,
        },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    const nextName = updateTopicDto.name?.trim() ?? topic.name;

    if (
      nextSubjectId !== topic.subjectId ||
      nextName !== topic.name
    ) {
      const duplicateTopic = await this.prisma.topic.findUnique({
        where: {
          subjectId_name: {
            subjectId: nextSubjectId,
            name: nextName,
          },
        },
      });

      if (duplicateTopic && duplicateTopic.id !== id) {
        throw new ConflictException(
          'Topic name already exists in this subject',
        );
      }
    }

    return this.prisma.topic.update({
      where: {
        id,
      },
      data: {
        ...(updateTopicDto.subjectId !== undefined && {
          subjectId: updateTopicDto.subjectId,
        }),
        ...(updateTopicDto.name !== undefined && {
          name: nextName,
        }),
        ...(updateTopicDto.description !== undefined && {
          description: updateTopicDto.description.trim() || null,
        }),
        ...(updateTopicDto.sortOrder !== undefined && {
          sortOrder: updateTopicDto.sortOrder,
        }),
        ...(updateTopicDto.isActive !== undefined && {
          isActive: updateTopicDto.isActive,
        }),
        updatedBy: userId,
      },
      select: {
        id: true,
        subjectId: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: {
        id,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (!topic.isActive) {
      return {
        message: 'Topic is already inactive',
      };
    }

    await this.prisma.topic.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });

    return {
      message: 'Topic deleted successfully',
    };
  }
}
