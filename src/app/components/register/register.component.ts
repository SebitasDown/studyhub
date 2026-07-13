import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styles: [`:host { display: contents; }`]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  googleUrl = `${process.env['BASE_URL']}/auth/google`;
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  submit(): void {
    if (!this.nombre || !this.apellido || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.register({
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
    }).subscribe({
      next: () => {
        this.router.navigate(['/verify-email']);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = Array.isArray(msg) ? msg[0] : msg || 'Error al registrarse. Intenta de nuevo.';
        this.loading = false;
      },
    });
  }
}
