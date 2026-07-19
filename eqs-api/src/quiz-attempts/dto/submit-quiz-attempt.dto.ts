import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmitAnswerDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  selectedChoiceId: number;
}

export class SubmitQuizAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}
