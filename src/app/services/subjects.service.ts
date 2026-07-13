import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubjectSummary {
  id: number;
  nombre: string;
  codigo?: string;
  profesor?: string;
  salon?: string;
  creditos?: number;
  color: string;
  descripcion?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number; notes: number; schedules: number };
}

export interface SubjectDetail {
  id: number;
  nombre: string;
  codigo?: string;
  profesor?: string;
  salon?: string;
  creditos?: number;
  color: string;
  descripcion?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  schedules: Schedule[];
  tasks: Task[];
  notes: Note[];
}

export interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classroom?: string;
  subjectId: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'COMPLETED';
  dueDate: string;
  completedAt?: string | null;
  subjectId: number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  subjectId: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private http = inject(HttpClient);
  private baseUrl = `${process.env['BASE_URL']}/subjects`;

  getSubjects(): Observable<SubjectSummary[]> {
    return this.http.get<SubjectSummary[]>(this.baseUrl);
  }

  getSubject(id: number): Observable<SubjectDetail> {
    return this.http.get<SubjectDetail>(`${this.baseUrl}/${id}`);
  }

  createSubject(dto: {
    nombre: string;
    codigo?: string;
    profesor?: string;
    salon?: string;
    creditos?: number;
    color: string;
    descripcion?: string;
  }): Observable<SubjectDetail> {
    return this.http.post<SubjectDetail>(this.baseUrl, dto);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addTask(subjectId: number, dto: {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string;
  }): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${subjectId}/tasks`, dto);
  }

  toggleTask(subjectId: number, taskId: number): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${subjectId}/tasks/${taskId}/toggle`, {});
  }

  deleteTask(subjectId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${subjectId}/tasks/${taskId}`);
  }

  addNote(subjectId: number, dto: { title: string; content: string }): Observable<Note> {
    return this.http.post<Note>(`${this.baseUrl}/${subjectId}/notes`, dto);
  }

  togglePinNote(subjectId: number, noteId: number): Observable<Note> {
    return this.http.post<Note>(`${this.baseUrl}/${subjectId}/notes/${noteId}/pin`, {});
  }

  deleteNote(subjectId: number, noteId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${subjectId}/notes/${noteId}`);
  }

  addSchedule(subjectId: number, dto: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    classroom?: string;
  }): Observable<Schedule> {
    return this.http.post<Schedule>(`${this.baseUrl}/${subjectId}/schedules`, dto);
  }

  deleteSchedule(subjectId: number, scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${subjectId}/schedules/${scheduleId}`);
  }
}
