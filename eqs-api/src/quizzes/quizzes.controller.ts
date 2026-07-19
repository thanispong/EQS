import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query(
      'topicId',
      new ParseIntPipe({
        optional: true,
      }),
    )
    topicId?: number,
  ) {
    return this.quizzesService.findAll(topicId, request.user.role as Role);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizzesService.findOne(id, request.user.role as Role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  create(
    @Body() createQuizDto: CreateQuizDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizzesService.create(createQuizDto, request.user.userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuizDto: UpdateQuizDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizzesService.update(id, updateQuizDto, request.user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.quizzesService.remove(id, request.user.userId);
  }
}
