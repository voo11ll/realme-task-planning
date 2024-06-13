// import { IsString, IsOptional, IsBoolean } from 'class-validator';

// export class UpdateTodoDto {
//   @IsOptional()
//   @IsString()
//   readonly title?: string;

//   @IsOptional()
//   @IsString()
//   readonly description?: string;

//   @IsOptional()
//   @IsBoolean()
//   readonly isCompleted?: boolean;
// }


// update-todo.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  readonly _id?: string;

  @IsString()
  @IsOptional()
  readonly title?: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsBoolean()
  @IsOptional()
  readonly isCompleted?: boolean;
}
