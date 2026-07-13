import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideFileText, lucidePin, lucideTrash2, lucidePlus,
  lucideLoader, lucideX,
} from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { SubjectsService, Note } from '../../services/subjects.service';

@Component({
  selector: 'app-subject-notes',
  standalone: true,
  imports: [NgIconComponent, FormsModule],
  providers: [provideIcons({
    lucideFileText, lucidePin, lucideTrash2, lucidePlus, lucideLoader, lucideX,
  })],
  template: `
    <div>
      <button (click)="showForm.set(!showForm())" class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style="background: #0f766e;">
        <ng-icon name="lucidePlus" size="16" />
        Nueva nota
      </button>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="showForm.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-bold text-[#0f172a]">Nueva nota</h3>
              <button (click)="showForm.set(false)" class="text-[#94a3b8] hover:text-[#0f172a] transition-colors bg-transparent border-none cursor-pointer p-1">
                <ng-icon name="lucideX" size="18" />
              </button>
            </div>
            <input [(ngModel)]="newTitle" type="text" placeholder="Título de la nota *" class="border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0f766e]" />
            <textarea [(ngModel)]="newContent" placeholder="Contenido de la nota" rows="4" class="border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#0f766e] resize-none"></textarea>
            <div class="flex gap-2 justify-end">
              <button (click)="showForm.set(false)" [disabled]="creating()" class="px-4 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors">Cancelar</button>
              <button (click)="addNote()" [disabled]="creating()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50" style="background: #0f766e;">Guardar nota</button>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-10 mt-4">
          <ng-icon name="lucideLoader" size="20" class="animate-spin text-[#0f766e]" />
        </div>
      } @else {
        <div class="grid gap-4 mt-5" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          @for (note of notes(); track note.id) {
            <div class="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm flex flex-col gap-2.5 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  @if (note.isPinned) {
                    <ng-icon name="lucidePin" size="14" color="#f59e0b" class="flex-shrink-0" />
                  }
                  <h4 class="text-sm font-semibold text-[#0f172a] truncate">{{ note.title }}</h4>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <button (click)="togglePin(note.id)" class="text-[#94a3b8] hover:text-amber-500 transition-colors bg-transparent border-none cursor-pointer p-0.5">
                    <ng-icon name="lucidePin" size="14" />
                  </button>
                  <button (click)="deleteNote(note.id)" class="text-[#94a3b8] hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-0.5">
                    <ng-icon name="lucideTrash2" size="14" />
                  </button>
                </div>
              </div>
              <p class="text-xs text-[#64748b] leading-relaxed whitespace-pre-wrap break-words">{{ note.content }}</p>
            </div>
          }
          @if (notes().length === 0) {
            <p class="text-sm text-[#94a3b8] text-center py-10 col-span-full">No hay notas. ¡Crea la primera!</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class SubjectNotesComponent implements OnInit {
  private subjectsService = inject(SubjectsService);

  subjectId = input.required<number>();

  notes = signal<Note[]>([]);
  loading = signal(true);

  showForm = signal(false);
  creating = signal(false);
  newTitle = '';
  newContent = '';

  ngOnInit(): void {
    this.loadNotes();
  }

  private loadNotes(): void {
    this.loading.set(true);
    this.subjectsService.getSubject(this.subjectId()).subscribe({
      next: (subject) => {
        const all = subject.notes || [];
        all.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
        this.notes.set(all);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addNote(): void {
    if (!this.newTitle.trim() || this.creating()) return;
    this.creating.set(true);
    this.subjectsService.addNote(this.subjectId(), {
      title: this.newTitle.trim(),
      content: this.newContent.trim(),
    }).subscribe({
      next: () => {
        this.loadNotes();
        this.showForm.set(false);
        this.newTitle = '';
        this.newContent = '';
        this.creating.set(false);
      },
      error: () => this.creating.set(false),
    });
  }

  togglePin(noteId: number): void {
    this.subjectsService.togglePinNote(this.subjectId(), noteId).subscribe({
      next: () => this.loadNotes(),
    });
  }

  deleteNote(noteId: number): void {
    this.subjectsService.deleteNote(this.subjectId(), noteId).subscribe({
      next: () => this.loadNotes(),
    });
  }
}
