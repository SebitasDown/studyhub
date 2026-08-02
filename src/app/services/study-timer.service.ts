import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}
