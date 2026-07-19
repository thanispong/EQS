import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateCorrectChoice(
    choices: {
      isCorrect: boolean;
    }[],
  ) {
    const correctChoiceCount = choices.filter(
      (choice) => choice.isCorrect,
    ).length;

    if (correctChoiceCount !== 1) {
      throw new BadRequestException(
        'Question must have exactly one correct choice',
      );
    }
  }

  async create(createQuestionDto: CreateQuestionDto, userId: number) {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: createQuestionDto.quizId,
        isActive: true,
        topic: {
          isActive: true,
          subject: {
            isActive: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    this.validateCorrectChoice(createQuestionDto.choices);

    const sortOrder = createQuestionDto.sortOrder ?? 0;

    const duplicateSortOrder = await this.prisma.question.findUnique({
      where: {
        quizId_sortOrder: {
          quizId: createQuestionDto.quizId,
          sortOrder,
        },
      },
    });

    if (duplicateSortOrder) {
      throw new ConflictException(
        'Question sort order already exists in this quiz',
      );
    }

    return this.prisma.question.create({
      data: {
        quizId: createQuestionDto.quizId,
        questionText: createQuestionDto.questionText.trim(),
        explanation: createQuestionDto.explanation?.trim() || null,
        score: createQuestionDto.score ?? 1,
        sortOrder,
        createdBy: userId,
        updatedBy: userId,

        choices: {
          create: createQuestionDto.choices.map((choice, index) => ({
            choiceText: choice.choiceText.trim(),
            isCorrect: choice.isCorrect,
            sortOrder: choice.sortOrder ?? index + 1,
            createdBy: userId,
            updatedBy: userId,
          })),
        },
      },
      select: {
        id: true,
        quizId: true,
        questionText: true,
        explanation: true,
        score: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        choices: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            choiceText: true,
            isCorrect: true,
            sortOrder: true,
            isActive: true,
          },
        },

        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  findAll(quizId?: number) {
    return this.prisma.question.findMany({
      where: {
        isActive: true,

        quiz: {
          isActive: true,
          topic: {
            isActive: true,
            subject: {
              isActive: true,
            },
          },
        },

        ...(quizId !== undefined && {
          quizId,
        }),
      },

      orderBy: [
        {
          quizId: 'asc',
        },
        {
          sortOrder: 'asc',
        },
        {
          id: 'asc',
        },
      ],

      select: {
        id: true,
        quizId: true,
        questionText: true,
        explanation: true,
        score: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        quiz: {
          select: {
            id: true,
            title: true,
          },
        },

        choices: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            choiceText: true,
            isCorrect: true,
            sortOrder: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        isActive: true,

        quiz: {
          isActive: true,
          topic: {
            isActive: true,
            subject: {
              isActive: true,
            },
          },
        },
      },

      select: {
        id: true,
        quizId: true,
        questionText: true,
        explanation: true,
        score: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        quiz: {
          select: {
            id: true,
            title: true,
          },
        },

        choices: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            choiceText: true,
            isCorrect: true,
            sortOrder: true,
            isActive: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    userId: number,
  ) {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (updateQuestionDto.quizId !== undefined) {
      const quiz = await this.prisma.quiz.findFirst({
        where: {
          id: updateQuestionDto.quizId,
          isActive: true,
          topic: {
            isActive: true,
            subject: {
              isActive: true,
            },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }
    }

    const nextQuizId = updateQuestionDto.quizId ?? question.quizId;

    const nextSortOrder = updateQuestionDto.sortOrder ?? question.sortOrder;

    if (
      nextQuizId !== question.quizId ||
      nextSortOrder !== question.sortOrder
    ) {
      const duplicateSortOrder = await this.prisma.question.findUnique({
        where: {
          quizId_sortOrder: {
            quizId: nextQuizId,
            sortOrder: nextSortOrder,
          },
        },
      });

      if (duplicateSortOrder && duplicateSortOrder.id !== id) {
        throw new ConflictException(
          'Question sort order already exists in this quiz',
        );
      }
    }

    if (updateQuestionDto.choices !== undefined) {
      this.validateCorrectChoice(updateQuestionDto.choices);

      if (updateQuestionDto.choices.length < 2) {
        throw new BadRequestException(
          'Question must have at least two choices',
        );
      }
    }

    return this.prisma.$transaction(async (transaction) => {
      if (updateQuestionDto.choices !== undefined) {
        await transaction.questionChoice.deleteMany({
          where: {
            questionId: id,
          },
        });
      }

      return transaction.question.update({
        where: {
          id,
        },

        data: {
          ...(updateQuestionDto.quizId !== undefined && {
            quizId: updateQuestionDto.quizId,
          }),

          ...(updateQuestionDto.questionText !== undefined && {
            questionText: updateQuestionDto.questionText.trim(),
          }),

          ...(updateQuestionDto.explanation !== undefined && {
            explanation: updateQuestionDto.explanation.trim() || null,
          }),

          ...(updateQuestionDto.score !== undefined && {
            score: updateQuestionDto.score,
          }),

          ...(updateQuestionDto.sortOrder !== undefined && {
            sortOrder: updateQuestionDto.sortOrder,
          }),

          ...(updateQuestionDto.isActive !== undefined && {
            isActive: updateQuestionDto.isActive,
          }),

          updatedBy: userId,

          ...(updateQuestionDto.choices !== undefined && {
            choices: {
              create: updateQuestionDto.choices.map((choice, index) => ({
                choiceText: choice.choiceText.trim(),
                isCorrect: choice.isCorrect,
                sortOrder: choice.sortOrder ?? index + 1,
                createdBy: userId,
                updatedBy: userId,
              })),
            },
          }),
        },

        select: {
          id: true,
          quizId: true,
          questionText: true,
          explanation: true,
          score: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,

          choices: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
            select: {
              id: true,
              choiceText: true,
              isCorrect: true,
              sortOrder: true,
              isActive: true,
            },
          },
        },
      });
    });
  }

  async remove(id: number, userId: number) {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (!question.isActive) {
      return {
        message: 'Question is already inactive',
      };
    }

    await this.prisma.$transaction([
      this.prisma.question.update({
        where: {
          id,
        },
        data: {
          isActive: false,
          updatedBy: userId,
        },
      }),

      this.prisma.questionChoice.updateMany({
        where: {
          questionId: id,
        },
        data: {
          isActive: false,
          updatedBy: userId,
        },
      }),
    ]);

    return {
      message: 'Question deleted successfully',
    };
  }
}
