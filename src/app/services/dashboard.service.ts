import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  user: { nombre: string; apellido: string } | null;
  stats: {
    subjects: number;
    pendingTasks: number;
    completedTasks: number;
    notes: number;
  };
  gamification: {
    level: number;
    xp: number;
    totalXp: number;
    xpForNextLevel: number;
    streak: number;
    achievements: number;
  };
  academicRisk: {
    id: number;
    score: number;
    level: string;
    reasons: Record<string, unknown>;
    createdAt: string;
  } | null;
  activeGoals: {
    title: string;
    description: string | null;
    progress: number;
    status: string;
  }[];
  upcomingClasses: {
    subjectId: number;
    subject: string;
    profesor: string | null;
    startTime: string;
    endTime: string;
    classroom: string | null;
    color: string | null;
  }[];
  upcomingTasks: {
    id: number;
    title: string;
    dueDate: string;
    priority: string;
    subjectId: number;
    subject: string | null;
    subjectColor: string | null;
  }[];
  recentNotes: {
    id: number;
    title: string;
    content: string;
    isPinned: boolean;
    updatedAt: string;
    subject: string | null;
    subjectColor: string | null;
  }[];
  completionRate: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getSummary(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${process.env['BASE_URL']}/dashboard/summary`);
  }
}
