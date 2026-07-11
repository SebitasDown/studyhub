import { Component, input, output, ElementRef, AfterViewInit, inject } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styles: [`
    dialog {
      padding: 0;
      border: none;
      overflow: visible;
      max-height: 100dvh;
      background: transparent;
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
    }
  `],
})
export class ConfirmDialogComponent implements AfterViewInit {
  private el = inject(ElementRef<HTMLElement>);

  title = input('Confirmar');
  message = input('¿Estás seguro?');
  confirmText = input('Eliminar');
  cancelText = input('Cancelar');
  confirmClass = input('bg-red-500 hover:bg-red-600 text-white');

  confirm = output<void>();
  cancel = output<void>();

  ngAfterViewInit(): void {
    const dialog = this.el.nativeElement.querySelector('dialog');
    if (dialog) {
      (dialog as HTMLDialogElement).showModal();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const isInDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height
      && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      this.cancel.emit();
    }
  }

  close(): void {
    const dialog = this.el.nativeElement.querySelector('dialog');
    if (dialog) {
      (dialog as HTMLDialogElement).close();
    }
  }
}
