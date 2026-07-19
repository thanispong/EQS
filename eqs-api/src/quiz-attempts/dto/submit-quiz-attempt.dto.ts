import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

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
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}
