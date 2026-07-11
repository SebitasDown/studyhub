import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './verify-email.component.html',
  styles: [`:host { display: contents; }`]
})
export class VerifyEmailComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user.email) this.email = user.email;
      } catch {}
    }
  }
  code = '';
  error = '';
  success = '';
  loading = false;
  resending = false;

  submit(): void {
    if (!this.code || this.code.length !== 6) {
      this.error = 'Ingresa el código de 6 dígitos.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.verifyEmail(this.email, this.code).subscribe({
      next: () => {
        this.success = 'Correo verificado correctamente. Redirigiendo…';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = Array.isArray(msg) ? msg[0] : msg || 'Código inválido o expirado.';
        this.loading = false;
      },
    });
  }

  resend(): void {
    if (!this.email) {
      this.error = 'Ingresa tu correo primero.';
      return;
    }

    this.resending = true;
    this.error = '';
    this.success = '';

    this.auth.resendCode(this.email).subscribe({
      next: () => {
        this.success = 'Código reenviado. Revisa tu bandeja de entrada.';
        this.resending = false;
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = Array.isArray(msg) ? msg[0] : msg || 'Error al reenviar el código.';
        this.resending = false;
      },
    });
  }
}
