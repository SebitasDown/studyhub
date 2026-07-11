import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface ResumeExperience {
  id?: number;
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface ResumeEducation {
  id?: number;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface ResumeProject {
  id?: number;
  title: string;
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  technologies: string[];
}

export interface ResumeCertificate {
  id?: number;
  title: string;
  issuer: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface ResumeLanguage {
  id?: number;
  name: string;
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE';
}

export interface Resume {
  id: number;
  userId: number;
  titulo: string | null;
  resumen: string | null;
  slug: string | null;
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  projects: ResumeProject[];
  certificates: ResumeCertificate[];
  languages: ResumeLanguage[];
}

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private http = inject(HttpClient);

  resume = signal<Resume | null>(null);
  loading = signal(false);
  error = signal('');

  getMyResume(): Observable<Resume> {
    this.loading.set(true);
    this.error.set('');
    return this.http.get<Resume>(`${API}/resume/me`).pipe(
      tap({
        next: (r) => { this.resume.set(r); this.loading.set(false); },
        error: () => this.loading.set(false),
      }),
    );
  }

  createResume(dto: Partial<Resume>): Observable<Resume> {
    return this.http.post<Resume>(`${API}/resume`, dto).pipe(
      tap((r) => this.resume.set(r)),
    );
  }

  updateResume(dto: Partial<Resume>): Observable<Resume> {
    return this.http.put<Resume>(`${API}/resume/me`, dto).pipe(
      tap((r) => this.resume.set(r)),
    );
  }

  downloadPdf(userId: number): Observable<Blob> {
    return this.http.get(`${API}/resume/${userId}/pdf`, { responseType: 'blob' });
  }
}
