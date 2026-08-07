import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudySessionRequest {
  subjectId?: number;
  durationMinutes: number;
  technique: string;
}

export interface StudySessionResponse {
  success: boolean;
  xpEarned: number;
}

export interface StudyStatsResponse {
  totalHours: string;
}

export interface StudySessionRecord {
  id: string;
  date: string; // ISO timestamp
  durationMinutes: number;
  technique: string;
  subjectId: number | null;
  xpEarned: number;
}

const HISTORY_KEY = 'studyhub_study_history';
const HISTORY_LIMIT = 200;

@Injectable({
  providedIn: 'root'
})
export class StudyTimerService {
  private http = inject(HttpClient);
  // Using the hardcoded URL as done previously for Vercel, or env
  private apiUrl = `https://study-hub-backend-sigma.vercel.app/study-timer`;

  saveSession(data: StudySessionRequest): Observable<StudySessionResponse> {
    return this.http.post<StudySessionResponse>(`${this.apiUrl}/session`, data);
  }

  getStats(): Observable<StudyStatsResponse> {
    return this.http.get<StudyStatsResponse>(`${this.apiUrl}/stats`);
  }

  // ---------------------------------------------------------------------------
  // Local history (the backend has no endpoint for past sessions)
  // ---------------------------------------------------------------------------

  getHistory(): StudySessionRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Se descartan registros corruptos o de versiones anteriores.
      return (parsed as StudySessionRecord[]).filter(
        (r) =>
          r &&
          typeof r.date === 'string' &&
          typeof r.durationMinutes === 'number' &&
          typeof r.technique === 'string' &&
          typeof r.xpEarned === 'number'
      );
    } catch {
      return [];
    }
  }

  addHistoryRecord(record: StudySessionRecord): StudySessionRecord[] {
    if (typeof localStorage === 'undefined') return this.getHistory();
    try {
      const history = this.getHistory();
      history.unshift(record);
      const trimmed = history.slice(0, HISTORY_LIMIT);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      return trimmed;
    } catch {
      return this.getHistory();
    }
  }

  clearHistory(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* noop */
    }
  }
}
