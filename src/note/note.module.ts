import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { Note, NoteSchema } from './note.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }]),
    AuthModule, // Подключаем AuthModule для доступа к AuthService
  ],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule {}
