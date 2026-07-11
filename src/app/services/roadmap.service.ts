import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export interface RoadmapStep {
  id: number;
  roadmapId: number;
  title: string;
  description?: string;
  order: number;
  skill: string;
  skillCategory?: string;
  estimatedHours?: number;
  completed: boolean;
}

export interface Roadmap {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  estimatedHours?: number;
  generatedByAi: boolean;
  steps: RoadmapStep[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRoadmapDto {
  jobId?: number;
  targetRole?: string;
  missingSkills?: string[];
}

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class RoadmapService {
  private http = inject(HttpClient);

  roadmaps = signal<Roadmap[]>([]);
  selectedRoadmap = signal<Roadmap | null>(null);
  loading = signal(false);
  generating = signal(false);

  findAll(): Observable<Roadmap[]> {
    this.loading.set(true);
    return this.http.get<Roadmap[]>(`${API}/roadmaps`).pipe(
      tap({
        next: (list) => { this.roadmaps.set(list); this.loading.set(false); },
        error: () => this.loading.set(false),
      }),
      catchError(() => of([])),
    );
  }

  findOne(id: number): Observable<Roadmap | null> {
    this.loading.set(true);
    return this.http.get<Roadmap>(`${API}/roadmaps/${id}`).pipe(
      tap({
        next: (r) => { this.selectedRoadmap.set(r); this.loading.set(false); },
        error: () => { this.selectedRoadmap.set(null); this.loading.set(false); },
      }),
      catchError(() => of(null)),
    );
  }

  generate(dto: GenerateRoadmapDto): Observable<Roadmap> {
    this.generating.set(true);
    return this.http.post<Roadmap>(`${API}/roadmaps/generate`, dto).pipe(
      tap({
        next: (r) => {
          this.roadmaps.update((list) => [r, ...list]);
          this.selectedRoadmap.set(r);
          this.generating.set(false);
        },
        error: () => this.generating.set(false),
      }),
    );
  }

  toggleStep(stepId: number, completed: boolean): Observable<void> {
    return this.http.patch<void>(`${API}/roadmaps/steps/${stepId}/complete`, {}).pipe(
      tap(() => {
        this.selectedRoadmap.update((r) => {
          if (!r) return r;
          return {
            ...r,
            steps: r.steps.map((s) => (s.id === stepId ? { ...s, completed } : s)),
          };
        });
        this.roadmaps.update((list) =>
          list.map((rm) => {
            if (rm.id !== this.selectedRoadmap()?.id) return rm;
            return { ...rm, steps: rm.steps.map((s) => (s.id === stepId ? { ...s, completed } : s)) };
          }),
        );
      }),
    );
  }

  deleteRoadmap(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/roadmaps/${id}`).pipe(
      tap(() => {
        this.roadmaps.update((list) => list.filter((r) => r.id !== id));
        this.selectedRoadmap.update((r) => (r?.id === id ? null : r));
      }),
    );
  }
}
