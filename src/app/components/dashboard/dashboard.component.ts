import { SidebarComponent } from '../sidebar/sidebar.component';
import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen, lucideClock, lucideCheckCircle, lucideFlame,
} from '@ng-icons/lucide';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardData } from '../../services/dashboard.service';
import { EventBusService } from '../../services/event-bus.service';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';
import { NotificationsService } from '../../services/notifications.service';

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
export class DashboardComponent implements OnInit, OnDestroy {
  protected auth = inject(AuthService);
  protected notifService = inject(NotificationsService);
  private dashboard = inject(DashboardService);
  private events = inject(EventBusService);
  private calendar = inject(CalendarService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private unsubscribers: (() => void)[] = [];

  // Notificaciones (panel flotante)
  notifPanelOpen = false;
  notifPanelPos = { top: 0, left: 0 };
  @ViewChild('notifPanel') notifPanelEl?: ElementRef<HTMLElement>;

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
  upcomingExams: CalendarEvent[] = [];

  ngOnInit(): void {
    this.loadData();

    if (isPlatformBrowser(this.platformId)) {
      this.notifService.getAll().subscribe();
      this.notifService.getUnreadCount().subscribe();
      this.notifService.startLive();
    }

    // Escuchar eventos de cambios y recargar
    const eventTypes = [
      'subject:created', 'subject:deleted',
      'task:created', 'task:toggled', 'task:deleted',
      'note:created', 'note:deleted',
      'event:created', 'event:updated', 'event:deleted',
      'gamification:updated',
      'profile:updated',
      'goal:created', 'goal:updated', 'goal:deleted',
    ] as const;

    for (const type of eventTypes) {
      this.unsubscribers.push(
        this.events.on(type, () => this.loadData(true))
      );
    }
  }

  ngOnDestroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.closeNotifPanel();
    this.notifService.stopLive();
  }

  private loadData(forceRefresh = false): void {
    this.dashboard.getSummary(forceRefresh).subscribe({
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

    if (isPlatformBrowser(this.platformId)) {
      this.calendar.getUpcomingExams().subscribe({
        next: (exams) => {
          this.upcomingExams = exams;
          this.cdr.markForCheck();
        },
      });
    }
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

  examDaysUntil(date: string): string {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff < 0) return 'Vencido';
    return `En ${diff} días`;
  }

  examBadgeClass(days: string): string {
    if (days === 'Hoy') return 'bg-red-100 text-red-700';
    if (days === 'Mañana') return 'bg-pink-100 text-pink-700';
    if (days === 'Vencido') return 'bg-gray-100 text-gray-500';
    const num = parseInt(days.replace('En ', '').replace(' días', ''));
    if (num <= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-600';
  }

  // ---------- Notificaciones (panel flotante) ----------

  toggleNotifPanel(btn: HTMLElement): void {
    if (this.notifPanelOpen) {
      this.closeNotifPanel();
    } else {
      this.openNotifPanel(btn);
    }
  }

  private openNotifPanel(btn: HTMLElement): void {
    if (typeof window === 'undefined') return;
    const rect = btn.getBoundingClientRect();
    const panelW = Math.min(380, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.right - panelW, window.innerWidth - panelW - 8));
    this.notifPanelPos = { top: rect.bottom + 10, left };
    this.notifPanelOpen = true;
    window.addEventListener('scroll', this.onWindowScroll, true);
    window.addEventListener('keydown', this.onKeydown);
  }

  closeNotifPanel(): void {
    if (!this.notifPanelOpen) return;
    this.notifPanelOpen = false;
    window.removeEventListener('scroll', this.onWindowScroll, true);
    window.removeEventListener('keydown', this.onKeydown);
  }

  markOneNotif(id: number): void {
    this.notifService.markAsRead(id).subscribe();
  }

  markAllNotifs(): void {
    this.notifService.markAllAsRead().subscribe();
  }

  private onWindowScroll = (e: Event): void => {
    // Ignorar scroll dentro del propio panel (lista de notificaciones)
    if (this.notifPanelEl?.nativeElement.contains(e.target as Node)) return;
    this.closeNotifPanel();
  };

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.closeNotifPanel();
  };
}
