import { Controller, Get, UseGuards, Request, Body, Patch, Delete, Post, Param } from '@nestjs/common';
import { NoteService } from './note.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @UseGuards(AuthGuard())
  @Post()
  async createNote(
    @Request() req: any,
    @Body() createNoteDto: CreateNoteDto
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.noteService.createNote(userId, createNoteDto);
    return { message: 'Note created successfully' };
  }

  @UseGuards(AuthGuard())
  @Patch(':id')
  async updateNote(
    @Param('id') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto
  ): Promise<{ message: string }> {
    await this.noteService.updateNote(noteId, updateNoteDto);
    return { message: 'Note updated successfully' };
  }

  @UseGuards(AuthGuard())
  @Get()
  async getAllNotes(@Request() req: any): Promise<{ id: string; title: string; description: string; todos: { title: string; description: string; isCompleted: boolean }[] }[]> {
    const userId = req.user.id;
    const notes = await this.noteService.getAllNotes(userId);
    return notes.map(note => ({
      id: note._id,
      title: note.title,
      description: note.description,
      todos: note.todos.map(todo => ({
        title: todo.title,
        description: todo.description,
        isCompleted: todo.isCompleted,
      })),
    }));
  }

  @UseGuards(AuthGuard())
  @Delete(':id')
  async deleteNote(
    @Param('id') noteId: string
  ): Promise<{ message: string }> {
    await this.noteService.deleteNote(noteId);
    return { message: 'Note deleted successfully' };
  }

  // Методы для работы с todo
  @UseGuards(AuthGuard())
  @Post(':noteId/todo')
  async createTodo(
    @Param('noteId') noteId: string,
    @Body() createTodoDto: CreateTodoDto
  ): Promise<{ message: string }> {
    await this.noteService.createTodo(noteId, createTodoDto);
    return { message: 'Todo created successfully' };
  }

  @UseGuards(AuthGuard())
  @Patch(':noteId/todo/:todoId')
  async updateTodo(
    @Param('noteId') noteId: string,
    @Param('todoId') todoId: string,
    @Body() updateTodoDto: UpdateTodoDto
  ): Promise<{ message: string }> {
    await this.noteService.updateTodo(noteId, todoId, updateTodoDto);
    return { message: 'Todo updated successfully' };
  }

  @UseGuards(AuthGuard())
  @Delete(':noteId/todo/:todoId')
  async deleteTodo(
    @Param('noteId') noteId: string,
    @Param('todoId') todoId: string
  ): Promise<{ message: string }> {
    await this.noteService.deleteTodo(noteId, todoId);
    return { message: 'Todo deleted successfully' };
  }
}
