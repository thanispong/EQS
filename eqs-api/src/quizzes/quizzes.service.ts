import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizStatus } from './enums/quiz-status.enum';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createQuizDto: CreateQuizDto, userId: number) {
    const topic = await this.prisma.topic.findFirst({
      where: {
        id: createQuizDto.topicId,
        isActive: true,
        subject: {
          isActive: true,
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const title = createQuizDto.title.trim();

    const duplicateQuiz = await this.prisma.quiz.findFirst({
      where: {
        topicId: createQuizDto.topicId,
        title,
      },
    });

    if (duplicateQuiz) {
      throw new ConflictException('Quiz title already exists in this topic');
    }

    return this.prisma.quiz.create({
      data: {
        topicId: createQuizDto.topicId,
        title,
        description: createQuizDto.description?.trim() || null,
        passingPercentage: createQuizDto.passingPercentage,
        timeLimitMinutes: createQuizDto.timeLimitMinutes ?? null,
        isShowAnswer: createQuizDto.isShowAnswer ?? false,
        status: createQuizDto.status ?? QuizStatus.Draft,
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        topicId: true,
        title: true,
        description: true,
        passingPercentage: true,
        timeLimitMinutes: true,
        isShowAnswer: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  findAll(topicId?: number) {
    return this.prisma.quiz.findMany({
      where: {
        isActive: true,
        topic: {
          isActive: true,
          subject: {
            isActive: true,
          },
        },
        ...(topicId !== undefined && {
          topicId,
        }),
      },
      orderBy: [
        {
          topicId: 'asc',
        },
        {
          title: 'asc',
        },
      ],
      select: {
        id: true,
        topicId: true,
        title: true,
        description: true,
        passingPercentage: true,
        timeLimitMinutes: true,
        isShowAnswer: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
            quizAttempts: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id,
        isActive: true,
        topic: {
          isActive: true,
          subject: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        topicId: true,
        title: true,
        description: true,
        passingPercentage: true,
        timeLimitMinutes: true,
        isShowAnswer: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        questions: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            questionText: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async update(id: number, updateQuizDto: UpdateQuizDto, userId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const nextTopicId = updateQuizDto.topicId ?? quiz.topicId;
    const nextTitle = updateQuizDto.title?.trim() ?? quiz.title;

    if (updateQuizDto.topicId !== undefined) {
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: updateQuizDto.topicId,
          isActive: true,
          subject: {
            isActive: true,
          },
        },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found');
      }
    }

    if (nextTopicId !== quiz.topicId || nextTitle !== quiz.title) {
      const duplicateQuiz = await this.prisma.quiz.findFirst({
        where: {
          topicId: nextTopicId,
          title: nextTitle,
          id: {
            not: id,
          },
        },
      });

      if (duplicateQuiz) {
        throw new ConflictException('Quiz title already exists in this topic');
      }
    }

    return this.prisma.quiz.update({
      where: {
        id,
      },
      data: {
        ...(updateQuizDto.topicId !== undefined && {
          topicId: updateQuizDto.topicId,
        }),
        ...(updateQuizDto.title !== undefined && {
          title: nextTitle,
        }),
        ...(updateQuizDto.description !== undefined && {
          description: updateQuizDto.description.trim() || null,
        }),
        ...(updateQuizDto.passingPercentage !== undefined && {
          passingPercentage: updateQuizDto.passingPercentage,
        }),
        ...(updateQuizDto.timeLimitMinutes !== undefined && {
          timeLimitMinutes: updateQuizDto.timeLimitMinutes,
        }),
        ...(updateQuizDto.isShowAnswer !== undefined && {
          isShowAnswer: updateQuizDto.isShowAnswer,
        }),
        ...(updateQuizDto.status !== undefined && {
          status: updateQuizDto.status,
        }),
        ...(updateQuizDto.isActive !== undefined && {
          isActive: updateQuizDto.isActive,
        }),
        updatedBy: userId,
      },
      select: {
        id: true,
        topicId: true,
        title: true,
        description: true,
        passingPercentage: true,
        timeLimitMinutes: true,
        isShowAnswer: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (!quiz.isActive) {
      return {
        message: 'Quiz is already inactive',
      };
    }

    await this.prisma.quiz.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });

    return {
      message: 'Quiz deleted successfully',
    };
  }
}
