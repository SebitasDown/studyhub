import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { AppCache } from '../utils/cache';

const CACHE_KEY = 'gamification';

export interface GamificationProgress {
  level: number;
  xp: number;
  totalXp: number;
  xpForNextLevel: number;
  streak: number;
  bestStreak: number;
  achievements: number;
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private http = inject(HttpClient);
  private baseUrl = `${process.env['BASE_URL']}/gamification`;

  progress = signal<GamificationProgress | null>(null);

  getProgress(forceRefresh = false): Observable<GamificationProgress> {
    if (!forceRefresh) {
      const cached = AppCache.get<GamificationProgress>(CACHE_KEY);
      if (cached) {
        this.progress.set(cached);
        return of(cached);
      }
    }
    return this.http.get<GamificationProgress>(`${this.baseUrl}/progress`).pipe(
      tap(data => {
        this.progress.set(data);
        AppCache.set(CACHE_KEY, data);
      })
    );
  }

  invalidateCache(): void {
    AppCache.invalidate(CACHE_KEY);
    this.progress.set(null);
  }
}
