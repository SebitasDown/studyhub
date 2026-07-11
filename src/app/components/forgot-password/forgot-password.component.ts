import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './forgot-password.component.html',
  styles: [`:host { display: contents; }`]
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  email = '';
  error = '';
  success = '';
  loading = false;

  submit(): void {
    if (!this.email) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.success = res.message;
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = Array.isArray(msg) ? msg[0] : msg || 'Error al enviar el correo.';
        this.loading = false;
      },
    });
  }
}
