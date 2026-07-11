import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProfileService } from '../../services/profile.service';

type Tab = 'personal' | 'academico' | 'profesional' | 'ajustes';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './profile.html',
  styles: [`:host { display: contents; }`],
})
export class ProfileComponent implements OnInit {
  profileService = inject(ProfileService);
  private platformId = inject(PLATFORM_ID);
  activeTab: Tab = 'personal';

  // local form models
  personal: any = {};
  academic: any = {};
  professional: any = {};
  user: any = {};
  saved = false;
  errorMsg = '';

  readonly modalidades = ['ON_SITE', 'REMOTE', 'HYBRID'];
  readonly nivelesProfesionales = ['STUDENT', 'INTERN', 'JUNIOR', 'MID', 'SENIOR'];
  readonly disponibilidades = ['FULL_TIME', 'PART_TIME', 'FREELANCE', 'NOT_AVAILABLE'];
  readonly modalidadesDeseadas = ['ON_SITE', 'REMOTE', 'HYBRID'];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('user');
      if (stored) this.user = JSON.parse(stored);

      this.personal = { ...this.user };

      this.profileService.getPersonal().subscribe(() => {
        setTimeout(() => {
          this.personal = { ...this.user, ...this.profileService.personal() };
        });
      });
      this.profileService.getAcademic().subscribe(() => {
        setTimeout(() => {
          this.academic = { ...this.profileService.academic() };
        });
      });
      this.profileService.getProfessional().subscribe(() => {
        setTimeout(() => {
          this.professional = { ...this.profileService.professional() };
        });
      });
    }
  }

  setTab(t: string): void { this.activeTab = t as Tab; }

  savePersonal(): void {
    this.errorMsg = '';
    const dto: any = {};
    if (this.personal.nombre) dto.nombre = this.personal.nombre;
    if (this.personal.apellido) dto.apellido = this.personal.apellido;
    if (this.personal.ciudad) dto.ciudad = this.personal.ciudad;
    if (this.personal.pais) dto.pais = this.personal.pais;
    if (this.personal.biografia) dto.biografia = this.personal.biografia;
    if (this.personal.github) dto.github = this.personal.github;
    if (this.personal.linkedin) dto.linkedin = this.personal.linkedin;
    if (this.personal.portafolio) dto.portafolio = this.personal.portafolio;
    this.profileService.updatePersonal(dto).subscribe({
      next: () => this.flashSaved(),
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al guardar. Intenta de nuevo.';
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }

  saveAcademic(): void {
    this.errorMsg = '';
    const dto = { ...this.academic, semestreActual: this.academic.semestre };
    if (this.academic.id) {
      this.profileService.updateAcademic(dto).subscribe({
        next: () => this.flashSaved(),
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al guardar. Intenta de nuevo.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      });
    } else {
      this.profileService.createAcademic(dto).subscribe({
        next: () => this.flashSaved(),
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al guardar. Intenta de nuevo.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      });
    }
  }

  saveProfessional(): void {
    this.errorMsg = '';
    if (this.professional.id) {
      this.profileService.updateProfessional(this.professional).subscribe({
        next: () => this.flashSaved(),
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al guardar. Intenta de nuevo.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      });
    } else {
      this.profileService.createProfessional(this.professional).subscribe({
        next: () => this.flashSaved(),
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al guardar. Intenta de nuevo.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      });
    }
  }

  private flashSaved(): void {
    this.saved = true;
    setTimeout(() => this.saved = false, 2500);
  }

  getInitial(): string {
    return (this.user?.nombre?.charAt(0) ?? 'U').toUpperCase();
  }

  getLevel(): number { return this.user?.level ?? 7; }
  getXP(): number { return this.user?.xp ?? 2840; }
  getStreak(): number { return this.user?.streak ?? 12; }
  getXPProgress(): number { return ((this.getXP() % 500) / 500) * 100; }
}
