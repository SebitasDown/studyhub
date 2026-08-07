import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API = 'https://study-hub-backend-sigma.vercel.app'!;

@Injectable({ providedIn: 'root' })
export class AcademicRiskService {
  private http = inject(HttpClient);
  latest = signal<any>(null);
  history = signal<any[]>([]);
  subjects = signal<any[]>([]);
  loading = signal(false);
  loadingSubjects = signal(false);
  recalculating = signal(false);

  getLatest(): Observable<any> {
    this.loading.set(true);
    return this.http.get<any>(`${API}/risk`).pipe(
      tap({ next: r => { this.latest.set(r); this.loading.set(false); }, error: () => this.loading.set(false) })
    );
  }

  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/risk/history`).pipe(
      tap(h => this.history.set(h))
    );
  }

  recalculate(): Observable<any> {
    this.recalculating.set(true);
    return this.http.post<any>(`${API}/risk/recalculate`, {}).pipe(
      tap({ next: r => { this.latest.set(r); this.recalculating.set(false); this.getHistory().subscribe(); }, error: () => this.recalculating.set(false) })
    );
  }

  getSubjectsRisk(): Observable<any[]> {
    this.loadingSubjects.set(true);
    return this.http.get<any[]>(`${API}/risk/subjects`).pipe(
      tap({ next: s => { this.subjects.set(s || []); this.loadingSubjects.set(false); }, error: () => this.loadingSubjects.set(false) })
    );
  }
}
