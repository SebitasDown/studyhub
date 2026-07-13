import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface StudyGroupCreator {
  id: number;
  nombre: string;
  apellido: string;
}

export interface StudyGroupSubject {
  id: number;
  nombre: string;
}

export interface StudyGroupCount {
  members: number;
  sessions?: number;
}

export interface StudyGroup {
  id: number;
  name: string;
  description: string;
  maxMembers: number;
  isPublic: boolean;
  subjectName?: string;
  creator: StudyGroupCreator;
  subject?: StudyGroupSubject;
  _count: StudyGroupCount;
  score?: number;
  reasons?: string[];
  members?: Array<{ user: StudyGroupCreator }>;
}

export interface PaginatedGroups {
  groups: StudyGroup[];
  total: number;
  page: number;
  limit: number;
}

const API = process.env['BASE_URL']!;

@Injectable({ providedIn: 'root' })
export class StudyGroupService {
  private http = inject(HttpClient);

  allGroups = signal<StudyGroup[]>([]);
  myGroups = signal<StudyGroup[]>([]);
  recommendedGroups = signal<StudyGroup[]>([]);
  loading = signal(false);

  getAllGroups(page = 1, limit = 20): Observable<PaginatedGroups> {
    this.loading.set(true);
    return this.http.get<PaginatedGroups>(`${API}/groups?page=${page}&limit=${limit}`).pipe(
      tap({
        next: (res) => {
          this.allGroups.set(res.groups);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  getMyGroups(): Observable<StudyGroup[]> {
    this.loading.set(true);
    return this.http.get<StudyGroup[]>(`${API}/groups/my`).pipe(
      tap({
        next: (groups) => {
          this.myGroups.set(groups);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  getRecommendedGroups(): Observable<StudyGroup[]> {
    this.loading.set(true);
    return this.http.get<StudyGroup[]>(`${API}/groups/recommended`).pipe(
      tap({
        next: (groups) => {
          this.recommendedGroups.set(groups);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  joinGroup(groupId: number, password?: string): Observable<any> {
    return this.http.post(`${API}/groups/${groupId}/join`, password ? { password } : {}).pipe(
      tap(() => {
        this.getMyGroups().subscribe();
      })
    );
  }

  createGroup(dto: any): Observable<StudyGroup> {
    return this.http.post<StudyGroup>(`${API}/groups`, dto).pipe(
      tap(() => {
        this.getAllGroups().subscribe();
        this.getMyGroups().subscribe();
      })
    );
  }

  getSubjects(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/subjects`);
  }
}
