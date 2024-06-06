import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsBoolean()
  readonly isCompleted?: boolean;
}
