import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { QuizStatus } from '../enums/quiz-status.enum';

export class CreateQuizDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(100)
  passingPercentage: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isShowAnswer?: boolean;

  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;
}
