import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styles: [`:host { display: contents; }`]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  googleUrl = `${process.env['BASE_URL']}/auth/google`;
  email = '';
  password = '';
  error = '';
  loading = false;

  submit(): void {
    if (!this.email || !this.password) {
      this.error = 'Completa todos los campos.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = Array.isArray(msg) ? msg[0] : msg || 'Error al iniciar sesión. Intenta de nuevo.';
        this.loading = false;
      },
    });
  }
}
