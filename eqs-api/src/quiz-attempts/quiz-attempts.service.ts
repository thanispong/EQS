import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

@Injectable()
export class QuizAttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(quizId: number, userId: number) {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        isActive: true,
        status: 'published',
        topic: {
          isActive: true,
          subject: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        passingPercentage: true,
        timeLimitMinutes: true,
        isShowAnswer: true,
        questions: {
          where: {
            isActive: true,
          },
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              id: 'asc',
            },
          ],
          select: {
            id: true,
            questionText: true,
            score: true,
            sortOrder: true,
            choices: {
              where: {
                isActive: true,
              },
              orderBy: [
                {
                  sortOrder: 'asc',
                },
                {
                  id: 'asc',
                },
              ],
              select: {
                id: true,
                choiceText: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        'Published quiz not found',
      );
    }

    if (quiz.questions.length === 0) {
      throw new BadRequestException(
        'Quiz does not contain any questions',
      );
    }

    const invalidQuestion = quiz.questions.find(
      (question) => question.choices.length < 2,
    );

    if (invalidQuestion) {
      throw new BadRequestException(
        'Quiz contains a question with insufficient choices',
      );
    }

    const existingAttempt =
      await this.prisma.quizAttempt.findFirst({
        where: {
          quizId,
          userId,
          status: 'in_progress',
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

    if (existingAttempt) {
      throw new ConflictException(
        'You already have an active attempt for this quiz',
      );
    }

    const totalScore = quiz.questions.reduce(
      (total, question) =>
        total + Number(question.score),
      0,
    );

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        totalScore,
        status: 'in_progress',
      },
      select: {
        id: true,
        quizId: true,
        startedAt: true,
        status: true,
      },
    });

    return {
      attempt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimitMinutes: quiz.timeLimitMinutes,
        totalScore,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          questionText: question.questionText,
          score: question.score,
          sortOrder: question.sortOrder,
          choices: question.choices,
        })),
      },
    };
  }

  async submit(
    attemptId: number,
    submitQuizAttemptDto: SubmitQuizAttemptDto,
    userId: number,
  ) {
    const duplicateQuestionIds =
      submitQuizAttemptDto.answers
        .map((answer) => answer.questionId)
        .filter(
          (questionId, index, array) =>
            array.indexOf(questionId) !== index,
        );

    if (duplicateQuestionIds.length > 0) {
      throw new BadRequestException(
        'Each question can only be answered once',
      );
    }

    const attempt =
      await this.prisma.quizAttempt.findUnique({
        where: {
          id: attemptId,
        },
        select: {
          id: true,
          quizId: true,
          userId: true,
          startedAt: true,
          submittedAt: true,
          status: true,
          quiz: {
            select: {
              id: true,
              title: true,
              passingPercentage: true,
              timeLimitMinutes: true,
              isShowAnswer: true,
              isActive: true,
              questions: {
                where: {
                  isActive: true,
                },
                orderBy: [
                  {
                    sortOrder: 'asc',
                  },
                  {
                    id: 'asc',
                  },
                ],
                select: {
                  id: true,
                  questionText: true,
                  explanation: true,
                  score: true,
                  choices: {
                    where: {
                      isActive: true,
                    },
                    orderBy: [
                      {
                        sortOrder: 'asc',
                      },
                      {
                        id: 'asc',
                      },
                    ],
                    select: {
                      id: true,
                      choiceText: true,
                      isCorrect: true,
                      sortOrder: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!attempt) {
      throw new NotFoundException(
        'Quiz attempt not found',
      );
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException(
        'You cannot submit another user attempt',
      );
    }

    if (attempt.status !== 'in_progress') {
      throw new ConflictException(
        'Quiz attempt has already been submitted',
      );
    }

    if (!attempt.quiz.isActive) {
      throw new BadRequestException(
        'Quiz is no longer active',
      );
    }

    if (attempt.quiz.timeLimitMinutes !== null) {
      const expiredAt = new Date(
        attempt.startedAt.getTime() +
          attempt.quiz.timeLimitMinutes * 60 * 1000,
      );

      if (new Date() > expiredAt) {
        throw new BadRequestException(
          'Quiz time limit has expired',
        );
      }
    }

    const questions = attempt.quiz.questions;

    if (questions.length === 0) {
      throw new BadRequestException(
        'Quiz does not contain any questions',
      );
    }

    const answerMap = new Map(
      submitQuizAttemptDto.answers.map((answer) => [
        answer.questionId,
        answer.selectedChoiceId,
      ]),
    );

    for (const answer of submitQuizAttemptDto.answers) {
      const question = questions.find(
        (item) => item.id === answer.questionId,
      );

      if (!question) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to this quiz`,
        );
      }

      const selectedChoice = question.choices.find(
        (choice) =>
          choice.id === answer.selectedChoiceId,
      );

      if (!selectedChoice) {
        throw new BadRequestException(
          `Selected choice does not belong to question ${answer.questionId}`,
        );
      }
    }

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const totalScore = questions.reduce(
      (total, question) =>
        total + Number(question.score),
      0,
    );

    const answerRecords = questions.map((question) => {
      const selectedChoiceId =
        answerMap.get(question.id) ?? null;

      const selectedChoice =
        selectedChoiceId === null
          ? null
          : question.choices.find(
              (choice) =>
                choice.id === selectedChoiceId,
            );

      const isCorrect =
        selectedChoice?.isCorrect ?? false;

      const scoreReceived = isCorrect
        ? Number(question.score)
        : 0;

      if (isCorrect) {
        correctCount += 1;
        score += scoreReceived;
      } else {
        wrongCount += 1;
      }

      return {
        quizAttemptId: attempt.id,
        questionId: question.id,
        selectedChoiceId,
        isCorrect,
        scoreReceived,
        answeredAt:
          selectedChoiceId === null ? null : new Date(),
      };
    });

    const percentage =
      totalScore > 0
        ? Number(
            ((score / totalScore) * 100).toFixed(2),
          )
        : 0;

    const passingPercentage = Number(
      attempt.quiz.passingPercentage,
    );

    const isPassed =
      percentage >= passingPercentage;

    const submittedAt = new Date();

    await this.prisma.$transaction(async (transaction) => {
      await transaction.userAnswer.createMany({
        data: answerRecords,
      });

      await transaction.quizAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          submittedAt,
          score,
          totalScore,
          correctCount,
          wrongCount,
          percentage,
          isPassed,
          status: 'submitted',
        },
      });
    });

    const response: {
      attemptId: number;
      quizId: number;
      quizTitle: string;
      score: number;
      totalScore: number;
      correctCount: number;
      wrongCount: number;
      percentage: number;
      passingPercentage: number;
      isPassed: boolean;
      submittedAt: Date;
      review?: unknown[];
    } = {
      attemptId: attempt.id,
      quizId: attempt.quiz.id,
      quizTitle: attempt.quiz.title,
      score,
      totalScore,
      correctCount,
      wrongCount,
      percentage,
      passingPercentage,
      isPassed,
      submittedAt,
    };

    if (attempt.quiz.isShowAnswer) {
      response.review = questions.map((question) => {
        const selectedChoiceId =
          answerMap.get(question.id) ?? null;

        const correctChoice =
          question.choices.find(
            (choice) => choice.isCorrect,
          );

        return {
          questionId: question.id,
          questionText: question.questionText,
          selectedChoiceId,
          correctChoiceId:
            correctChoice?.id ?? null,
          isCorrect:
            selectedChoiceId ===
            correctChoice?.id,
          explanation: question.explanation,
          choices: question.choices.map((choice) => ({
            id: choice.id,
            choiceText: choice.choiceText,
            sortOrder: choice.sortOrder,
          })),
        };
      });
    }

    return response;
  }

  findMyHistory(userId: number) {
    return this.prisma.quizAttempt.findMany({
      where: {
        userId,
      },
      orderBy: {
        startedAt: 'desc',
      },
      select: {
        id: true,
        quizId: true,
        startedAt: true,
        submittedAt: true,
        score: true,
        totalScore: true,
        correctCount: true,
        wrongCount: true,
        percentage: true,
        isPassed: true,
        status: true,
        quiz: {
          select: {
            id: true,
            title: true,
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
        },
      },
    });
  }

  async findResult(
    attemptId: number,
    userId: number,
  ) {
    const attempt =
      await this.prisma.quizAttempt.findUnique({
        where: {
          id: attemptId,
        },
        select: {
          id: true,
          userId: true,
          startedAt: true,
          submittedAt: true,
          score: true,
          totalScore: true,
          correctCount: true,
          wrongCount: true,
          percentage: true,
          isPassed: true,
          status: true,
          quiz: {
            select: {
              id: true,
              title: true,
              passingPercentage: true,
            },
          },
        },
      });

    if (!attempt) {
      throw new NotFoundException(
        'Quiz attempt not found',
      );
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException(
        'You cannot view another user attempt',
      );
    }

    return {
      id: attempt.id,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      totalScore: attempt.totalScore,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      percentage: attempt.percentage,
      passingPercentage: attempt.quiz.passingPercentage,
      isPassed: attempt.isPassed,
      status: attempt.status,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
      },
    };
  }

  async findActiveAttempt(
    attemptId: number,
    userId: number,
  ) {
    const attempt =
      await this.prisma.quizAttempt.findUnique({
        where: {
          id: attemptId,
        },
        select: {
          id: true,
          quizId: true,
          userId: true,
          startedAt: true,
          status: true,
          quiz: {
            select: {
              id: true,
              title: true,
              description: true,
              timeLimitMinutes: true,
              isActive: true,
              questions: {
                where: {
                  isActive: true,
                },
                orderBy: [
                  {
                    sortOrder: 'asc',
                  },
                  {
                    id: 'asc',
                  },
                ],
                select: {
                  id: true,
                  questionText: true,
                  score: true,
                  sortOrder: true,
                  choices: {
                    where: {
                      isActive: true,
                    },
                    orderBy: [
                      {
                        sortOrder: 'asc',
                      },
                      {
                        id: 'asc',
                      },
                    ],
                    select: {
                      id: true,
                      choiceText: true,
                      sortOrder: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!attempt) {
      throw new NotFoundException(
        'Quiz attempt not found',
      );
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException(
        'You cannot access another user attempt',
      );
    }

    if (attempt.status !== 'in_progress') {
      throw new ConflictException(
        'Quiz attempt is no longer active',
      );
    }

    if (!attempt.quiz.isActive) {
      throw new BadRequestException(
        'Quiz is no longer active',
      );
    }

    const totalScore =
      attempt.quiz.questions.reduce(
        (total, question) =>
          total + Number(question.score),
        0,
      );

    return {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        startedAt: attempt.startedAt,
        status: attempt.status,
      },
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        timeLimitMinutes:
          attempt.quiz.timeLimitMinutes,
        totalScore,
        questions: attempt.quiz.questions,
      },
    };
  }
}
