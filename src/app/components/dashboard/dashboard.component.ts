import { SidebarComponent } from '../sidebar/sidebar.component';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen, lucideClock, lucideCheckCircle, lucideFlame,
} from '@ng-icons/lucide';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardData } from '../../services/dashboard.service';

interface TaskItem {
  id: number;
  title: string;
  subjectId: number;
  subject: string | null;
  subjectColor: string | null;
  label: string;
  badgeClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SidebarComponent, DatePipe, NgIconComponent, RouterLink],
  providers: [provideIcons({ lucideBookOpen, lucideClock, lucideCheckCircle, lucideFlame })],
  templateUrl: './dashboard.component.html',
  styles: [`:host { display: contents; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected auth = inject(AuthService);
  private dashboard = inject(DashboardService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  data: DashboardData = {
    user: null, stats: { subjects: 0, pendingTasks: 0, completedTasks: 0, notes: 0 },
    gamification: { level: 1, xp: 0, totalXp: 0, xpForNextLevel: 500, streak: 0, achievements: 0 },
    academicRisk: null, activeGoals: [], upcomingClasses: [], upcomingTasks: [], recentNotes: [],
    completionRate: 0,
  };
  loading = true;
  errorMsg = '';
  today: Date = new Date();
  tasks: TaskItem[] = [];
  riskBarClass = 'bg-gray-200';

  ngOnInit(): void {
    this.dashboard.getSummary().subscribe({
      next: (res) => {
        this.data = res;
        this.tasks = this.buildTasks(res);
        this.riskBarClass = this.computeRiskClass(res);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al cargar el dashboard. ¿El servidor está corriendo?';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  get user() {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  private buildTasks(res: DashboardData): TaskItem[] {
    return (res.upcomingTasks || []).map((t) => {
      const label = this.daysUntil(t.dueDate);
      return {
        id: t.id,
        title: t.title,
        subjectId: t.subjectId,
        subject: t.subject,
        subjectColor: t.subjectColor,
        label,
        badgeClass: this.taskBadgeClass(label),
      };
    });
  }

  private daysUntil(dueDate: string): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return '1d';
    if (diff < 0) return 'Vencida';
    return `${diff}d`;
  }

  private taskBadgeClass(days: string): string {
    if (days === 'Hoy') return 'bg-red-100 text-red-700';
    if (days === '1d') return 'bg-pink-100 text-pink-700';
    if (days === 'Vencida') return 'bg-gray-100 text-gray-700';
    const num = parseInt(days);
    if (num <= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-500';
  }

  private computeRiskClass(res: DashboardData): string {
    const score = res.academicRisk?.score ?? 0;
    if (score < 40) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }
}
