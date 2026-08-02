import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string;
  type: 'EVENT' | 'EXAM';
  subjectId?: number;
  googleEventId?: string;
  subject?: { id: number; nombre: string; color: string };
}

export interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string;
  type: 'TASK';
  subject?: { id: number; nombre: string; color: string };
  taskStatus?: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  tasks: CalendarTask[];
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: string;
  type?: 'EVENT' | 'EXAM';
  subjectId?: number;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'https://study-hub-backend-gablfori5-sebitasdowns-projects.vercel.app/calendar';

  private get headers() {
    return { Authorization: `Bearer ${this.auth.getToken()}` };
  }

  getEvents(start: string, end: string): Observable<CalendarResponse> {
    return this.http.get<CalendarResponse>(`${this.apiUrl}/events`, {
      headers: this.headers,
      params: { start, end },
    });
  }

  getUpcomingExams(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.apiUrl}/exams/upcoming`, {
      headers: this.headers,
    });
  }

  createEvent(payload: CreateEventPayload): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${this.apiUrl}/events`, payload, {
      headers: this.headers,
    });
  }

  updateEvent(id: number, payload: Partial<CreateEventPayload>): Observable<CalendarEvent> {
    return this.http.patch<CalendarEvent>(`${this.apiUrl}/events/${id}`, payload, {
      headers: this.headers,
    });
  }

  deleteEvent(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/events/${id}`, {
      headers: this.headers,
    });
  }

  getGoogleConnectUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/google/connect`, {
      headers: this.headers,
    });
  }

  syncFromGoogle(): Observable<{ message: string; synced: number }> {
    return this.http.post<{ message: string; synced: number }>(`${this.apiUrl}/google/sync`, {}, {
      headers: this.headers,
    });
  }

  disconnectGoogle(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/google/disconnect`, {
      headers: this.headers,
    });
  }

  getGoogleStatus(): Observable<{ connected: boolean }> {
    return this.http.get<{ connected: boolean }>(`${this.apiUrl}/google/status`, {
      headers: this.headers,
    });
  }
}
