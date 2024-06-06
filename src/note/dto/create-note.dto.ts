import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @IsNotEmpty()
  @IsString()
  readonly description: string;
}
