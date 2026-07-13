import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string | null;
  country: string | null;
  city: string | null;
  studentFriendly?: boolean;
  modality: string;
  seniority: string;
  contractType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  companyLogo: string | null;
  isRemote: boolean;
  requirements: string[];
  skills: string[];
  benefits?: string[];
  source: string | null;
  sourceUrl: string | null;
  externalId: string | null;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJob {
  id: number;
  userId: number;
  jobId: number;
  job: Job;
  createdAt: string;
}

export interface JobApplication {
  id: number;
  userId: number;
  jobId: number;
  job: Job;
  status: string;
  statusHistory: Array<{ status: string; date: string }>;
  notes: string | null;
  appliedAt: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface JobMatch {
  matchScore: number;
  hiringProbability: number;
  strengths: string[];
  missingSkills: string[];
  recommendations: string[];
  summary: string;
  cached: boolean;
  createdAt: string;
}

const API = process.env['BASE_URL']!;

@Injectable({ providedIn: 'root' })
export class JobsService {
  private http = inject(HttpClient);

  getJobs(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: string;
    isRemote?: boolean;
    contractType?: string;
    seniority?: string;
    modality?: string;
    skills?: string;
    search?: string;
    location?: string;
    country?: string;
    city?: string;
    studentFriendly?: boolean;
    company?: string;
  }): Observable<JobListResponse> {
    const query = params ? Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&') : '';
    return this.http.get<JobListResponse>(`${API}/jobs${query ? '?' + query : ''}`);
  }

  getJob(id: number): Observable<Job> {
    return this.http.get<Job>(`${API}/jobs/${id}`);
  }

  getSavedJobs(): Observable<SavedJob[]> {
    return this.http.get<SavedJob[]>(`${API}/jobs/saved`);
  }

  saveJob(jobId: number): Observable<any> {
    return this.http.post(`${API}/jobs/${jobId}/save`, {});
  }

  unsaveJob(jobId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/jobs/${jobId}/save`);
  }

  getApplications(): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${API}/jobs/applications`);
  }

  applyToJob(jobId: number, notes?: string): Observable<any> {
    return this.http.post(`${API}/jobs/${jobId}/apply`, { notes });
  }

  withdrawApplication(jobId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/jobs/${jobId}/apply`);
  }

  updateApplicationStatus(jobId: number, status: string): Observable<any> {
    return this.http.patch(`${API}/jobs/${jobId}/apply/status`, { status });
  }

  getJobMatch(jobId: number): Observable<JobMatch> {
    return this.http.get<JobMatch>(`${API}/jobs/${jobId}/match`);
  }

  discoverJobs(): Observable<{ found: number; saved: number }> {
    return this.http.post<{ found: number; saved: number }>(`${API}/jobs/discover`, {});
  }
}
