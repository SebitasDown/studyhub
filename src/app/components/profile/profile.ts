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
  styles: [`:host { display: contents; }`]
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

  readonly modalidades = ['PRESENCIAL', 'VIRTUAL', 'HIBRIDO'];
  readonly nivelesProfesionales = ['ESTUDIANTE', 'JUNIOR', 'SEMI_SENIOR', 'SENIOR', 'LEAD'];
  readonly disponibilidades = ['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'FREELANCE', 'PRACTICAS'];
  readonly modalidadesDeseadas = ['PRESENCIAL', 'REMOTO', 'HIBRIDO'];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('user');
      if (stored) this.user = JSON.parse(stored);

      this.profileService.getPersonal().subscribe(d => { this.personal = { ...d }; });
      this.profileService.getAcademic().subscribe(d => { this.academic = { ...d }; });
      this.profileService.getProfessional().subscribe(d => { this.professional = { ...d }; });
    }
  }

  setTab(t: string): void { this.activeTab = t as Tab; }

  savePersonal(): void {
    this.profileService.updatePersonal(this.personal).subscribe(() => this.flashSaved());
  }

  saveAcademic(): void {
    this.profileService.updateAcademic(this.academic).subscribe(() => this.flashSaved());
  }

  saveProfessional(): void {
    this.profileService.updateProfessional(this.professional).subscribe(() => this.flashSaved());
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
