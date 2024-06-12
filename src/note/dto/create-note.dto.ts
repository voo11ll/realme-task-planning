// import { IsNotEmpty, IsString } from 'class-validator';

// export class CreateNoteDto {
//   @IsNotEmpty()
//   @IsString()
//   readonly title: string;

//   @IsNotEmpty()
//   @IsString()
//   readonly description: string;
// }


import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTodoDto } from './create-todo.dto';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTodoDto)
  readonly todos?: CreateTodoDto[];
}
