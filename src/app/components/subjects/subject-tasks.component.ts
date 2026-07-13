import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCheckCircle, lucideCircle, lucideTrash2, lucidePlus,
  lucideCalendar, lucideLoader, lucideX,
} from '@ng-icons/lucide';
import { SubjectsService, Task } from '../../services/subjects.service';

@Component({
  selector: 'app-subject-tasks',
  standalone: true,
  imports: [NgIconComponent, FormsModule, DatePipe],
  providers: [provideIcons({
    lucideCheckCircle, lucideCircle, lucideTrash2, lucidePlus,
    lucideCalendar, lucideLoader, lucideX,
  })],
  template: `
    <div>
      <button (click)="showForm.set(!showForm())" class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style="background: #0f766e;">
        <ng-icon name="lucidePlus" size="16" />
        Nueva tarea
      </button>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="showForm.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-bold text-[#0f172a]">Nueva tarea</h3>
              <button (click)="showForm.set(false)" class="text-[#94a3b8] hover:text-[#0f172a] transition-colors bg-transparent border-none cursor-pointer p-1">
                <ng-icon name="lucideX" size="18" />
              </button>
            </div>
            <input [(ngModel)]="newTitle" type="text" placeholder="Título de la tarea *" class="border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0f766e]" />
            <input [(ngModel)]="newDescription" type="text" placeholder="Descripción (opcional)" class="border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0f766e]" />
            <div class="grid grid-cols-2 gap-3">
              <select [(ngModel)]="newPriority" class="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0f766e] bg-white">
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
              <input [(ngModel)]="newDueDate" type="date" class="border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0f766e]" />
            </div>
            <div class="flex gap-2 justify-end">
              <button (click)="showForm.set(false)" [disabled]="creating()" class="px-4 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors">Cancelar</button>
              <button (click)="addTask()" [disabled]="creating()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50" style="background: #0f766e;">Guardar tarea</button>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-10 mt-4">
          <ng-icon name="lucideLoader" size="20" class="animate-spin text-[#0f766e]" />
        </div>
      } @else {
        <div class="flex flex-col gap-2 mt-5">
          @for (task of tasks(); track task.id) {
            <div class="flex items-center gap-3 bg-white border border-[#e2e8f0] rounded-xl px-5 py-3.5 shadow-sm transition-all hover:shadow-md">
              <button (click)="toggleTask(task.id)" class="flex-shrink-0 text-[#94a3b8] hover:text-[#0f766e] transition-colors bg-transparent border-none cursor-pointer p-0.5">
                @if (task.status === 'COMPLETED') {
                  <ng-icon name="lucideCheckCircle" size="20" color="#22c55e" />
                } @else {
                  <ng-icon name="lucideCircle" size="20" />
                }
              </button>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium" [class]="task.status === 'COMPLETED' ? 'text-[#94a3b8] line-through' : 'text-[#0f172a]'">{{ task.title }}</p>
                <div class="flex items-center gap-3 mt-0.5">
                  @if (task.description) {
                    <span class="text-xs text-[#94a3b8] truncate max-w-[200px]">{{ task.description }}</span>
                  }
                  <span class="text-xs text-[#94a3b8] flex items-center gap-1">
                    <ng-icon name="lucideCalendar" size="11" />
                    {{ task.dueDate | date:'d MMM' }}
                  </span>
                </div>
              </div>

              <span class="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                [style.background]="priorityBg(task.priority)"
                [style.color]="priorityColor(task.priority)">
                {{ priorityLabel(task.priority) }}
              </span>

              <button (click)="deleteTask(task.id)" class="text-[#94a3b8] hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-0.5 flex-shrink-0">
                <ng-icon name="lucideTrash2" size="15" />
              </button>
            </div>
          }
          @if (tasks().length === 0) {
            <p class="text-sm text-[#94a3b8] text-center py-10">No hay tareas. ¡Crea la primera!</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class SubjectTasksComponent implements OnInit {
  private subjectsService = inject(SubjectsService);

  subjectId = input.required<number>();

  tasks = signal<Task[]>([]);
  loading = signal(true);

  showForm = signal(false);
  creating = signal(false);
  newTitle = '';
  newDescription = '';
  newPriority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  newDueDate = '';

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    this.loading.set(true);
    this.subjectsService.getSubject(this.subjectId()).subscribe({
      next: (subject) => {
        this.tasks.set(subject.tasks || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addTask(): void {
    if (!this.newTitle.trim() || this.creating()) return;
    this.creating.set(true);
    this.subjectsService.addTask(this.subjectId(), {
      title: this.newTitle.trim(),
      description: this.newDescription.trim() || undefined,
      priority: this.newPriority,
      dueDate: this.newDueDate ? new Date(this.newDueDate).toISOString() : new Date().toISOString(),
    }).subscribe({
      next: () => {
        this.loadTasks();
        this.showForm.set(false);
        this.newTitle = '';
        this.newDescription = '';
        this.newPriority = 'MEDIUM';
        this.newDueDate = '';
        this.creating.set(false);
      },
      error: () => this.creating.set(false),
    });
  }

  toggleTask(taskId: number): void {
    this.subjectsService.toggleTask(this.subjectId(), taskId).subscribe({
      next: () => this.loadTasks(),
    });
  }

  deleteTask(taskId: number): void {
    this.subjectsService.deleteTask(this.subjectId(), taskId).subscribe({
      next: () => this.loadTasks(),
    });
  }

  priorityLabel(p: string): string {
    return p === 'HIGH' ? 'Alta' : p === 'MEDIUM' ? 'Media' : 'Baja';
  }

  priorityBg(p: string): string {
    return p === 'HIGH' ? '#fef2f2' : p === 'MEDIUM' ? '#fffbeb' : '#f1f5f9';
  }

  priorityColor(p: string): string {
    return p === 'HIGH' ? '#dc2626' : p === 'MEDIUM' ? '#d97706' : '#64748b';
  }
}
