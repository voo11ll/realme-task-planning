import { IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateTodoDto } from './update-todo.dto';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateTodoDto)
  readonly todos?: UpdateTodoDto[];
}