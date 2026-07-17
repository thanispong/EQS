import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { QuizAttemptsService } from './quiz-attempts.service';

@Controller('quiz-attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Student)
export class QuizAttemptsController {
  constructor(
    private readonly quizAttemptsService: QuizAttemptsService,
  ) {}

  @Post('quizzes/:quizId/start')
  start(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizAttemptsService.start(
      quizId,
      request.user.userId,
    );
  }

  @Post(':attemptId/submit')
  submit(
    @Param('attemptId', ParseIntPipe)
    attemptId: number,
    @Body()
    submitQuizAttemptDto: SubmitQuizAttemptDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizAttemptsService.submit(
      attemptId,
      submitQuizAttemptDto,
      request.user.userId,
    );
  }

  @Get('my-history')
  findMyHistory(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizAttemptsService.findMyHistory(
      request.user.userId,
    );
  }

  @Get(':attemptId/result')
  findResult(
    @Param('attemptId', ParseIntPipe)
    attemptId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizAttemptsService.findResult(
      attemptId,
      request.user.userId,
    );
  }
}