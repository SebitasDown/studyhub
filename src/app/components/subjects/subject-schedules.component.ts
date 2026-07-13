import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideClock, lucideTrash2, lucidePlus, lucideMapPin, lucideLoader, lucideX,
} from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { SubjectsService, Schedule } from '../../services/subjects.service';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Component({
  selector: 'app-subject-schedules',
  standalone: true,
  imports: [NgIconComponent, FormsModule],
  providers: [provideIcons({
    lucideClock, lucideTrash2, lucidePlus, lucideMapPin, lucideLoader, lucideX,
  })],
  template: `
    <div>
      <button (click)="showForm.set(!showForm())" class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style="background: #0f766e;">
        <ng-icon name="lucidePlus" size="16" />
        Nuevo horario
      </button>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="showForm.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-bold text-[#0f172a]">Nuevo horario</h3>
              <button (click)="showForm.set(false)" class="text-[#94a3b8] hover:text-[#0f172a] transition-colors bg-transparent border-none cursor-pointer p-1">
                <ng-icon name="lucideX" size="18" />
              </button>
            </div>
            <select [(ngModel)]="newDayOfWeek" class="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0f766e] bg-white">
              @for (name of dayNames; track $index) {
                <option [ngValue]="$index">{{ name }}</option>
              }
            </select>
            <div class="grid grid-cols-2 gap-3">
              <input [(ngModel)]="newStartTime" type="time" class="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0f766e]" />
              <input [(ngModel)]="newEndTime" type="time" class="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0f766e]" />
            </div>
            <input [(ngModel)]="newClassroom" type="text" placeholder="Salón (opcional)" class="border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0f766e]" />
            <div class="flex gap-2 justify-end">
              <button (click)="showForm.set(false)" [disabled]="creating()" class="px-4 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors">Cancelar</button>
              <button (click)="addSchedule()" [disabled]="creating()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50" style="background: #0f766e;">Guardar horario</button>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-10 mt-4">
          <ng-icon name="lucideLoader" size="20" class="animate-spin text-[#0f766e]" />
        </div>
      } @else {
        <div class="flex flex-col gap-3 mt-5">
          @for (schedule of schedules(); track schedule.id) {
            <div class="flex items-center gap-4 bg-white border border-[#e2e8f0] rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold" style="background: #f1f5f9; color: #0f172a;">
                {{ dayAbbr(schedule.dayOfWeek) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#0f172a]">{{ dayNames[schedule.dayOfWeek] }}</p>
                <p class="text-xs text-[#64748b] flex items-center gap-1.5 mt-0.5">
                  <ng-icon name="lucideClock" size="12" />
                  {{ schedule.startTime }} - {{ schedule.endTime }}
                  @if (schedule.classroom) {
                    <span class="flex items-center gap-1 ml-2">
                      <ng-icon name="lucideMapPin" size="12" />
                      {{ schedule.classroom }}
                    </span>
                  }
                </p>
              </div>
              <button (click)="deleteSchedule(schedule.id)" class="text-[#94a3b8] hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-0.5 flex-shrink-0">
                <ng-icon name="lucideTrash2" size="15" />
              </button>
            </div>
          }
          @if (schedules().length === 0) {
            <p class="text-sm text-[#94a3b8] text-center py-10">No hay horarios. ¡Añade el primero!</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class SubjectSchedulesComponent implements OnInit {
  private subjectsService = inject(SubjectsService);

  subjectId = input.required<number>();

  schedules = signal<Schedule[]>([]);
  loading = signal(true);

  showForm = signal(false);
  creating = signal(false);
  newDayOfWeek = 1;
  newStartTime = '08:00';
  newEndTime = '10:00';
  newClassroom = '';

  dayNames = DAY_NAMES;

  ngOnInit(): void {
    this.loadSchedules();
  }

  private loadSchedules(): void {
    this.loading.set(true);
    this.subjectsService.getSubject(this.subjectId()).subscribe({
      next: (subject) => {
        this.schedules.set(subject.schedules || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addSchedule(): void {
    if (this.creating()) return;
    this.creating.set(true);
    this.subjectsService.addSchedule(this.subjectId(), {
      dayOfWeek: this.newDayOfWeek,
      startTime: this.newStartTime,
      endTime: this.newEndTime,
      classroom: this.newClassroom.trim() || undefined,
    }).subscribe({
      next: () => {
        this.loadSchedules();
        this.showForm.set(false);
        this.newClassroom = '';
        this.creating.set(false);
      },
      error: () => this.creating.set(false),
    });
  }

  deleteSchedule(scheduleId: number): void {
    this.subjectsService.deleteSchedule(this.subjectId(), scheduleId).subscribe({
      next: () => this.loadSchedules(),
    });
  }

  dayAbbr(day: number): string {
    return DAY_NAMES[day].slice(0, 2);
  }
}
