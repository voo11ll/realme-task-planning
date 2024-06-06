import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;
}
