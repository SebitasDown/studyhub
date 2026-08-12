import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, catchError } from 'rxjs';

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
  id: string | number;
  date: string; // ISO timestamp
  durationMinutes: number;
  technique: string;
  subjectId: number | null;
  xpEarned: number;
}

interface BackendSessionRow {
  id: number;
  completedAt: string;
  durationMinutes: number;
  technique: string;
  xpEarned: number;
  subjectId: number | null;
}

/** Respuesta paginada del backend: { sessions, total, page, limit }. */
export interface StudySessionPageResponse {
  sessions: BackendSessionRow[];
  total: number;
  page: number;
  limit: number;
}

export interface StudySessionPage {
  records: StudySessionRecord[];
  total: number;
  page: number;
}

export interface StudyTechnique {
  id: string;
  name: string;
  minutes: number;
  color: string;
  icon: string;
  description: string;
}

export const STUDY_TECHNIQUES: StudyTechnique[] = [
  { id: 'POMODORO_25_5', name: 'Pomodoro 25/5', minutes: 25, color: '#F4B960', icon: 'lucideTimer', description: '25 min de foco + 5 de descanso' },
  { id: 'POMODORO_50_10', name: 'Pomodoro 50/10', minutes: 50, color: '#0C5A60', icon: 'lucideClock', description: '50 min de foco + 10 de descanso' },
  { id: 'DEEP_BLOCK_90', name: 'Bloque profundo', minutes: 90, color: '#7C3AED', icon: 'lucideBrain', description: '90 min para tareas que exigen concentración' },
];

const HISTORY_KEY = 'studyhub_study_history';
// Mismo límite que el backend (take: 100) para que la caché local y el servidor coincidan.
const HISTORY_LIMIT = 100;

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
  // Session history (backend as source of truth, localStorage as offline cache)
  // Filtrable por periodo (day/week/month/all) y paginado.
  // ---------------------------------------------------------------------------

  getSessions(period: string = 'all', page: number = 1, limit: number = 20): Observable<StudySessionPage> {
    const params: any = { period, page: String(page), limit: String(limit) };
    return this.http.get<any>(`${this.apiUrl}/sessions`, { params }).pipe(
      map((res) => this.parseSessionPage(res)),
      tap((pg) => {
        if (page === 1) this.persistLocalHistory(pg.records);
      }),
      catchError(() => of({ records: this.readLocalHistory(), total: this.readLocalHistory().length, page: 1 }))
    );
  }

  /** Acepta { sessions, total, page, limit } (nuevo) o un array plano (backend desplegado). */
  private parseSessionPage(res: any): StudySessionPage {
    const rows: BackendSessionRow[] = Array.isArray(res) ? res : res?.sessions ?? [];
    const records = rows.map((r) => ({
      id: r.id,
      date: r.completedAt,
      durationMinutes: r.durationMinutes,
      technique: r.technique,
      subjectId: r.subjectId,
      xpEarned: r.xpEarned,
    }));
    return {
      records,
      total: Array.isArray(res) ? records.length : (res?.total ?? records.length),
      page: Array.isArray(res) ? 1 : (res?.page ?? 1),
    };
  }

  addHistoryRecord(record: StudySessionRecord): StudySessionRecord[] {
    const history = this.readLocalHistory();
    history.unshift(record);
    const trimmed = history.slice(0, HISTORY_LIMIT);
    this.persistLocalHistory(trimmed);
    return trimmed;
  }

  clearHistory(): Observable<{ success: boolean; xpReverted: number }> {
    return this.http.delete<{ success: boolean; xpReverted: number }>(`${this.apiUrl}/sessions`).pipe(
      tap(() => this.persistLocalHistory([]))
    );
  }

  private readLocalHistory(): StudySessionRecord[] {
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

  private persistLocalHistory(records: StudySessionRecord[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, HISTORY_LIMIT)));
    } catch {
      /* noop */
    }
  }
}
