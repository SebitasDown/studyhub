import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBookOpen,
  lucideBrain,
  lucideCheck,
  lucideClock,
  lucidePause,
  lucidePlay,
  lucidePlus,
  lucideRotateCcw,
  lucideTimer,
  lucideZap,
} from '@ng-icons/lucide';
import { RouterLink } from '@angular/router';
import { StudyTimerService } from '../../services/study-timer.service';
import { SubjectsService, SubjectSummary } from '../../services/subjects.service';
import { EventBusService } from '../../services/event-bus.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Technique {
  id: string;
  name: string;
  minutes: number;
  color: string;
  icon: string;
  description: string;
}

interface PersistedTimer {
  startedAt: number;
  elapsedBase: number;
  technique: string;
  subjectId: number | null;
}

const STORAGE_KEY = 'studyhub_study_timer';
const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  selector: 'app-study-timer',
  standalone: true,
  imports: [CommonModule, SidebarComponent, NgIconComponent, RouterLink],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideBookOpen,
      lucideBrain,
      lucideCheck,
      lucideClock,
      lucidePause,
      lucidePlay,
      lucidePlus,
      lucideRotateCcw,
      lucideTimer,
      lucideZap,
    }),
  ],
  templateUrl: './study-timer.component.html',
})
export class StudyTimerComponent implements OnInit, OnDestroy {
  private timerService = inject(StudyTimerService);
  private subjectsService = inject(SubjectsService);
  private events = inject(EventBusService);

  statsHours = signal('0.0');
  statsLoading = signal(true);
  subjects = signal<SubjectSummary[]>([]);
  subjectsLoading = signal(true);

  selectedSubject = signal<number | null>(null);
  selectedTechnique = signal('POMODORO_25_5');

  timeLeft = signal(25 * 60);
  isRunning = signal(false);
  isSaving = signal(false);

  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  readonly techniques: Technique[] = [
    { id: 'POMODORO_25_5', name: 'Pomodoro 25/5', minutes: 25, color: '#F4B960', icon: 'lucideTimer', description: '25 min de foco + 5 de descanso' },
    { id: 'POMODORO_50_10', name: 'Pomodoro 50/10', minutes: 50, color: '#0C5A60', icon: 'lucideClock', description: '50 min de foco + 10 de descanso' },
    { id: 'DEEP_BLOCK_90', name: 'Bloque profundo', minutes: 90, color: '#7C3AED', icon: 'lucideBrain', description: '90 min para tareas que exigen concentración' },
  ];

  readonly ringCircumference = RING_CIRCUMFERENCE;

  private timerInterval: any;
  private toastTimeout: any;
  private elapsedBase = 0;
  private startedAt: number | null = null;
  private totalSeconds = 25 * 60;

  ngOnInit() {
    this.restoreTimer();
    this.loadStats();
    this.loadSubjects();
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    clearTimeout(this.toastTimeout);
    // Si el timer está en curso, su estado queda persistido en localStorage:
    // la sesión no se pierde al navegar a otra sección.
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  private loadStats() {
    this.timerService.getStats().subscribe({
      next: (res) => {
        this.statsHours.set(res.totalHours);
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false),
    });
  }

  private loadSubjects() {
    this.subjectsService.getSubjects().subscribe({
      next: (res) => {
        this.subjects.set(res);
        this.subjectsLoading.set(false);
      },
      error: () => this.subjectsLoading.set(false),
    });
  }

  // ---------------------------------------------------------------------------
  // Timer state (elapsed-time based, so stats are never inflated)
  // ---------------------------------------------------------------------------

  get currentTech(): Technique {
    return this.techniques.find((t) => t.id === this.selectedTechnique())!;
  }

  get selectedSubjectName(): string {
    const id = this.selectedSubject();
    if (id === null) return '';
    return this.subjects().find((s) => s.id === id)?.nombre ?? '';
  }

  get elapsedSeconds(): number {
    const running = this.startedAt !== null ? (Date.now() - this.startedAt) / 1000 : 0;
    return Math.max(0, this.elapsedBase + running);
  }

  get formatTime(): string {
    const s = Math.max(0, Math.floor(this.timeLeft()));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  get ringProgress(): number {
    if (this.totalSeconds <= 0) return 0;
    return Math.min(1, Math.max(0, this.timeLeft() / this.totalSeconds));
  }

  get ringDashOffset(): number {
    return RING_CIRCUMFERENCE * (1 - this.ringProgress);
  }

  get canFinish(): boolean {
    return this.elapsedSeconds > 0 && !this.isSaving();
  }

  selectTechnique(techId: string) {
    if (this.isRunning() || this.isSaving()) return;
    this.selectedTechnique.set(techId);
    this.resetState();
  }

  toggleTimer() {
    if (this.isSaving()) return;
    this.isRunning() ? this.pauseTimer() : this.startTimer();
  }

  resetTimer() {
    if (this.isSaving()) return;
    clearInterval(this.timerInterval);
    this.isRunning.set(false);
    this.resetState();
  }

  private startTimer() {
    if (this.isSaving()) return;
    this.startedAt = Date.now();
    this.isRunning.set(true);
    this.persistTimer();
    this.timerInterval = setInterval(() => this.tick(), 1000);
    this.tick();
  }

  private pauseTimer() {
    if (this.startedAt !== null) {
      this.elapsedBase += (Date.now() - this.startedAt) / 1000;
    }
    this.startedAt = null;
    this.isRunning.set(false);
    clearInterval(this.timerInterval);
    this.clearPersisted();
    this.timeLeft.set(Math.max(0, Math.round(this.totalSeconds - this.elapsedSeconds)));
  }

  private tick() {
    if (this.startedAt === null) return;
    const endAt = this.startedAt + (this.totalSeconds - this.elapsedBase) * 1000;
    const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    this.timeLeft.set(remaining);
    if (remaining <= 0) {
      // Se detiene el intervalo para evitar reintentos automáticos (y spam de
      // toasts) si el guardado falla; el usuario puede reintentar manualmente.
      clearInterval(this.timerInterval);
      this.isRunning.set(false);
      this.finishSession();
    }
  }

  finishSession() {
    if (this.isSaving()) return;
    if (this.elapsedSeconds <= 0) {
      this.showToast('Aún no hay tiempo de estudio para guardar.', 'error');
      return;
    }

    // Nunca se reporta más de la duración real de la técnica: si la pestaña
    // estuvo en segundo plano o se restaura un timer viejo, la sesión no se infla.
    const durationMinutes = Math.min(
      this.currentTech.minutes,
      Math.max(1, Math.round(this.elapsedSeconds / 60))
    );
    this.isSaving.set(true);

    this.timerService
      .saveSession({
        subjectId: this.selectedSubject() ?? undefined,
        durationMinutes,
        technique: this.selectedTechnique(),
      })
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.showToast(`¡Sesión completada! Ganaste ${res.xpEarned} XP 🎉`, 'success');
          this.events.emit('gamification:updated');
          this.loadStats();
          this.resetState();
        },
        error: () => {
          this.isSaving.set(false);
          this.showToast('No se pudo guardar la sesión. Inténtalo de nuevo.', 'error');
        },
      });
  }

  private resetState() {
    clearInterval(this.timerInterval);
    this.elapsedBase = 0;
    this.startedAt = null;
    this.totalSeconds = this.currentTech.minutes * 60;
    this.timeLeft.set(this.totalSeconds);
    this.clearPersisted();
  }

  // ---------------------------------------------------------------------------
  // Persistence: the running session survives navigation
  // ---------------------------------------------------------------------------

  private persistTimer() {
    if (this.startedAt === null || typeof localStorage === 'undefined') return;
    try {
      const data: PersistedTimer = {
        startedAt: this.startedAt,
        elapsedBase: this.elapsedBase,
        technique: this.selectedTechnique(),
        subjectId: this.selectedSubject(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private clearPersisted() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  private restoreTimer() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as PersistedTimer;
      if (
        !data ||
        !Number.isFinite(data.startedAt) ||
        !Number.isFinite(data.elapsedBase) ||
        data.elapsedBase < 0
      ) {
        this.clearPersisted();
        return;
      }
      const tech = this.techniques.find((t) => t.id === data.technique);
      if (!tech) {
        this.clearPersisted();
        return;
      }
      this.selectedTechnique.set(tech.id);
      this.selectedSubject.set(data.subjectId ?? null);
      this.totalSeconds = tech.minutes * 60;
      this.elapsedBase = data.elapsedBase;
      this.startedAt = data.startedAt;
      this.isRunning.set(true);
      this.timerInterval = setInterval(() => this.tick(), 1000);
      this.tick();
    } catch {
      this.clearPersisted();
    }
  }

  // ---------------------------------------------------------------------------
  // Feedback
  // ---------------------------------------------------------------------------

  private showToast(message: string, type: 'success' | 'error') {
    clearTimeout(this.toastTimeout);
    this.toast.set({ message, type });
    this.toastTimeout = setTimeout(() => this.toast.set(null), 4000);
  }
}
