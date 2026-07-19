import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQuestionChoiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  choiceText: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateQuestionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quizId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  questionText: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionChoiceDto)
  choices: CreateQuestionChoiceDto[];
}
