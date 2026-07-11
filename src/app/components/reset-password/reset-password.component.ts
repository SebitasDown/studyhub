import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './reset-password.component.html',
  styles: [`:host { display: contents; }`]
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token = '';
  password = '';
  confirmPassword = '';
  error = '';
  success = '';
  loading = false;

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (t) {
      this.token = t;
    } else {
      this.error = 'Token de restablecimiento no encontrado.';
    }
  }

  submit(): void {
    if (!this.password || !this.confirmPassword) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.success = 'Contraseña actualizada. Redirigiendo al inicio de sesión…';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = Array.isArray(msg) ? msg[0] : msg || 'Error al restablecer la contraseña.';
        this.loading = false;
      },
    });
  }
}
