import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyTimerService } from '../../services/study-timer.service';
import { SubjectsService, SubjectSummary } from '../../services/subjects.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Technique {
  id: string;
  name: string;
  minutes: number;
}

@Component({
  selector: 'app-study-timer',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './study-timer.component.html'
})
export class StudyTimerComponent implements OnInit, OnDestroy {
  private timerService = inject(StudyTimerService);
  private subjectsService = inject(SubjectsService);

  statsHours = signal('0.0');
  subjects = signal<SubjectSummary[]>([]);

  selectedSubject = signal<number | null>(null);
  selectedTechnique = signal('POMODORO_25_5');

  timeLeft = signal(25 * 60);
  isRunning = signal(false);
  private timerInterval: any;

  readonly techniques: Technique[] = [
    { id: 'POMODORO_25_5',  name: 'Pomodoro 25/5',  minutes: 25 },
    { id: 'POMODORO_50_10', name: 'Pomodoro 50/10', minutes: 50 },
    { id: 'DEEP_BLOCK_90',  name: 'Bloque profundo', minutes: 90 },
  ];

  ngOnInit() {
    this.loadStats();
    this.loadSubjects();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private loadStats() {
    this.timerService.getStats().subscribe({
      next: (res) => this.statsHours.set(res.totalHours),
      error: () => {}
    });
  }

  private loadSubjects() {
    this.subjectsService.getSubjects().subscribe({
      next: (res) => this.subjects.set(res),
      error: () => {}
    });
  }

  selectTechnique(techId: string) {
    if (this.isRunning()) return;
    this.selectedTechnique.set(techId);
    const tech = this.techniques.find(t => t.id === techId)!;
    this.timeLeft.set(tech.minutes * 60);
  }

  toggleTimer() {
    this.isRunning() ? this.stopTimer() : this.startTimer();
  }

  private startTimer() {
    this.isRunning.set(true);
    this.timerInterval = setInterval(() => {
      const t = this.timeLeft();
      if (t > 0) {
        this.timeLeft.set(t - 1);
      } else {
        this.finishSession();
      }
    }, 1000);
  }

  private stopTimer() {
    this.isRunning.set(false);
    clearInterval(this.timerInterval);
  }

  resetTimer() {
    this.stopTimer();
    const tech = this.techniques.find(t => t.id === this.selectedTechnique())!;
    this.timeLeft.set(tech.minutes * 60);
  }

  finishSession() {
    this.stopTimer();
    const tech = this.techniques.find(t => t.id === this.selectedTechnique());
    if (!tech) return;

    this.timerService.saveSession({
      subjectId: this.selectedSubject() ?? undefined,
      durationMinutes: tech.minutes,
      technique: this.selectedTechnique(),
    }).subscribe({
      next: (res) => {
        alert(`¡Sesión completada! Ganaste ${res.xpEarned} XP 🎉`);
        this.loadStats();
        this.resetTimer();
      },
      error: () => alert('No se pudo guardar la sesión.')
    });
  }

  get formatTime(): string {
    const s = this.timeLeft();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}
