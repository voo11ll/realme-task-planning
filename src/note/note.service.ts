import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note } from './note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class NoteService {
  constructor(
    @InjectModel(Note.name)
    private noteModel: Model<Note>,
  ) {}

  // async createNote(userId: string, createNoteDto: CreateNoteDto): Promise<Note> {
  //   const newNote = new this.noteModel({
  //     userId,
  //     ...createNoteDto,
  //     isCompleted: false,
  //     todos: [],
  //   });
  //   return newNote.save();
  // }

  async createNote(userId: string, createNoteDto: CreateNoteDto): Promise<Note> {
    const { todos, ...noteDetails } = createNoteDto;
    const newNote = new this.noteModel({
      userId,
      ...noteDetails,
      isCompleted: false,
      todos: todos || [],
    });
    return newNote.save();
  }

  // async updateNote(noteId: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
  //   const existingNote = await this.noteModel.findById(noteId);

  //   if (!existingNote) {
  //     throw new NotFoundException('Note not found');
  //   }

  //   if (updateNoteDto.title) {
  //     existingNote.title = updateNoteDto.title;
  //   }
  //   if (updateNoteDto.description) {
  //     existingNote.description = updateNoteDto.description;
  //   }

  //   return existingNote.save();
  // }

  async updateNote(noteId: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const existingNote = await this.noteModel.findById(noteId);

    if (!existingNote) {
      throw new NotFoundException('Note not found');
    }

    if (updateNoteDto.title) {
      existingNote.title = updateNoteDto.title;
    }
    if (updateNoteDto.description) {
      existingNote.description = updateNoteDto.description;
    }

    if (updateNoteDto.todos) {
      updateNoteDto.todos.forEach((updatedTodo) => {
        const todo = existingNote.todos.id(updatedTodo._id);
        if (todo) {
          if (updatedTodo.title) {
            todo.title = updatedTodo.title;
          }
          if (updatedTodo.description) {
            todo.description = updatedTodo.description;
          }
          if (updatedTodo.isCompleted !== undefined) {
            todo.isCompleted = updatedTodo.isCompleted;
          }
        } else {
          existingNote.todos.push(updatedTodo);
        }
      });
    }

    return existingNote.save();
  }

  async getAllNotes(userId: string): Promise<Note[]> {
    return this.noteModel.find({ userId }).exec();
  }

  async deleteNote(noteId: string): Promise<Note> {
    const note = await this.noteModel.findByIdAndDelete(noteId);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  // Методы для работы с todo
  async createTodo(noteId: string, createTodoDto: CreateTodoDto): Promise<Note> {
    const note = await this.noteModel.findById(noteId);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    note.todos.push({
      ...createTodoDto,
      isCompleted: false,
    });

    return note.save();
  }

  async updateTodo(noteId: string, todoId: string, updateTodoDto: UpdateTodoDto): Promise<Note> {
    const note = await this.noteModel.findById(noteId);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const todo = note.todos.id(todoId);
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    if (updateTodoDto.title) {
      todo.title = updateTodoDto.title;
    }
    if (updateTodoDto.description) {
      todo.description = updateTodoDto.description;
    }
    if (updateTodoDto.isCompleted !== undefined) {
      todo.isCompleted = updateTodoDto.isCompleted;
    }

    return note.save();
  }

  async deleteTodo(noteId: string, todoId: string): Promise<Note> {
    const note = await this.noteModel.findById(noteId);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const todo = note.todos.id(todoId);
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    todo.remove();

    return note.save();
  }
}
