import { SidebarComponent } from '../sidebar/sidebar.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBriefcase, lucideBookmark, lucideMapPin, lucideClock,
  lucideDollarSign, lucideSearch, lucideChevronDown, lucideLoader,
  lucideCheckCircle2, lucideSparkles, lucideX, lucideGlobe,
  lucidePlus, lucidePencil, lucideTrash2, lucideGraduationCap,
  lucideAward, lucideLanguages, lucideFolderGit2, lucideDownload,
  lucideSave, lucideExternalLink, lucideGithub, lucideShare2,
  lucideMail, lucidePhone, lucideLink,
} from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import {
  ResumeService, Resume, ResumeExperience, ResumeEducation,
  ResumeProject, ResumeCertificate, ResumeLanguage,
} from '../../services/resume.service';

@Component({
  selector: 'app-mi-cv',
  standalone: true,
  imports: [SidebarComponent, RouterLink, NgIconComponent, FormsModule],
  providers: [provideIcons({
    lucideBriefcase, lucideBookmark, lucideMapPin, lucideClock,
    lucideDollarSign, lucideSearch, lucideChevronDown, lucideLoader,
    lucideCheckCircle2, lucideSparkles, lucideX, lucideGlobe,
    lucidePlus, lucidePencil, lucideTrash2, lucideGraduationCap,
    lucideAward, lucideLanguages, lucideFolderGit2, lucideDownload,
    lucideSave, lucideExternalLink, lucideGithub, lucideShare2,
    lucideMail, lucidePhone, lucideLink,
  })],
  templateUrl: './mi-cv.component.html',
  styles: [':host { display: contents; }'],
})
export class MiCvComponent implements OnInit {
  protected auth = inject(AuthService);
  protected resumeService = inject(ResumeService);
  protected profileService = inject(ProfileService);

  activeTab = signal<string>('experience');
  editingIndex = signal<number | null>(null);
  saving = signal(false);
  downloading = signal(false);

  form = signal<Partial<Resume>>({
    titulo: '',
    resumen: '',
    experiences: [],
    educations: [],
    projects: [],
    certificates: [],
    languages: [],
  });

  ngOnInit(): void {
    this.resumeService.getMyResume().subscribe({
      next: (r) => {
        if (r) {
          this.form.set({
            titulo: r.titulo || '',
            resumen: r.resumen || '',
            experiences: r.experiences || [],
            educations: r.educations || [],
            projects: r.projects || [],
            certificates: r.certificates || [],
            languages: r.languages || [],
          });
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.form.set({
            titulo: '',
            resumen: '',
            experiences: [],
            educations: [],
            projects: [],
            certificates: [],
            languages: [],
          });
        }
      },
    });
    this.profileService.getPersonalInfo().subscribe();
    this.profileService.getUserSkills().subscribe();
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
    this.editingIndex.set(null);
  }

  toggleEditItem(index: number): void {
    if (this.editingIndex() === index) {
      this.editingIndex.set(null);
      this.save();
    } else {
      this.editingIndex.set(index);
    }
  }

  closeEdit(): void {
    this.editingIndex.set(null);
    this.save();
  }

  save(): void {
    this.saving.set(true);
    const raw = this.form();
    const body: Record<string, unknown> = {
      titulo: raw.titulo || '',
      resumen: raw.resumen || '',
    };

    const cleanExperiences = (raw.experiences || []).filter(e => e.company && e.position && e.startDate);
    const cleanEducations = (raw.educations || []).filter(e => e.institution && e.degree && e.startDate);
    const cleanProjects = (raw.projects || []).filter(p => p.title && p.description);
    const cleanCertificates = (raw.certificates || []).filter(c => c.title && c.issuer);
    const cleanLanguages = (raw.languages || []).filter(l => l.name && l.level);

    body['experiences'] = cleanExperiences.map(({ id, ...rest }) => rest);
    body['educations'] = cleanEducations.map(({ id, ...rest }) => rest);
    body['projects'] = cleanProjects.map(({ id, ...rest }) => rest);
    body['certificates'] = cleanCertificates.map(({ id, ...rest }) => rest);
    body['languages'] = cleanLanguages.map(({ id, ...rest }) => rest);

    const existing = this.resumeService.resume();
    const obs = existing
      ? this.resumeService.updateResume(body as unknown as Partial<Resume>)
      : this.resumeService.createResume(body as unknown as Partial<Resume>);
    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res) {
          // Keep form bound with updated values
          this.form.update(f => ({
            ...f,
            experiences: res.experiences || [],
            educations: res.educations || [],
            projects: res.projects || [],
            certificates: res.certificates || [],
            languages: res.languages || [],
          }));
        }
      },
      error: (err) => {
        console.error('Error al guardar CV', err);
        this.saving.set(false);
      },
    });
  }

  addExperience(): void {
    this.form.update(f => {
      const list = [...(f.experiences || []), { company: '', position: '', description: '', startDate: '', endDate: '', isCurrent: false }];
      this.editingIndex.set(list.length - 1);
      return { ...f, experiences: list };
    });
  }

  removeExperience(i: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.form.update(f => {
      const list = (f.experiences || []).filter((_, idx) => idx !== i);
      return { ...f, experiences: list };
    });
    this.editingIndex.set(null);
    this.save();
  }

  addEducation(): void {
    this.form.update(f => {
      const list = [...(f.educations || []), { institution: '', degree: '', startDate: '', endDate: '', isCurrent: false }];
      this.editingIndex.set(list.length - 1);
      return { ...f, educations: list };
    });
  }

  removeEducation(i: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.form.update(f => {
      const list = (f.educations || []).filter((_, idx) => idx !== i);
      return { ...f, educations: list };
    });
    this.editingIndex.set(null);
    this.save();
  }

  addProject(): void {
    this.form.update(f => {
      const list = [...(f.projects || []), { title: '', description: '', technologies: [], githubUrl: '', liveUrl: '' }];
      this.editingIndex.set(list.length - 1);
      return { ...f, projects: list };
    });
  }

  removeProject(i: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.form.update(f => {
      const list = (f.projects || []).filter((_, idx) => idx !== i);
      return { ...f, projects: list };
    });
    this.editingIndex.set(null);
    this.save();
  }

  addTechToProject(projIdx: number, tech: string): void {
    if (!tech.trim()) return;
    this.form.update(f => {
      const projects = [...(f.projects || [])];
      const p = { ...projects[projIdx] };
      p.technologies = [...(p.technologies || []), tech.trim()];
      projects[projIdx] = p;
      return { ...f, projects };
    });
  }

  removeTechFromProject(projIdx: number, techIdx: number): void {
    this.form.update(f => {
      const projects = [...(f.projects || [])];
      const p = { ...projects[projIdx] };
      p.technologies = p.technologies.filter((_, i) => i !== techIdx);
      projects[projIdx] = p;
      return { ...f, projects };
    });
  }

  addCertificate(): void {
    this.form.update(f => {
      const list = [...(f.certificates || []), { title: '', issuer: '', issueDate: '', credentialUrl: '' }];
      this.editingIndex.set(list.length - 1);
      return { ...f, certificates: list };
    });
  }

  removeCertificate(i: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.form.update(f => {
      const list = (f.certificates || []).filter((_, idx) => idx !== i);
      return { ...f, certificates: list };
    });
    this.editingIndex.set(null);
    this.save();
  }

  addLanguage(): void {
    this.form.update(f => {
      const list = [...(f.languages || []), { name: '', level: 'BASIC' as const }];
      return { ...f, languages: list };
    });
    this.save();
  }

  removeLanguage(i: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.form.update(f => {
      const list = (f.languages || []).filter((_, idx) => idx !== i);
      return { ...f, languages: list };
    });
    this.save();
  }

  trackIndex(_: number, __: any): number {
    return _;
  }

  getLevelLabel(level: string): string {
    return { BASIC: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado', NATIVE: 'Nativo' }[level] || level;
  }

  formatDate(d: string | undefined | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
  }

  getInitial(): string {
    const info = this.profileService.personalInfo();
    if (info?.nombre && info?.apellido) {
      return info.nombre[0] + info.apellido[0];
    }
    return 'U';
  }

  async downloadPdf(): Promise<void> {
    const resume = this.resumeService.resume();
    if (!resume || this.downloading()) return;

    this.downloading.set(true);
    try {
      const token = localStorage.getItem('access_token') ?? '';
      const res = await fetch(
        `${process.env['BASE_URL']}/resume/${resume.userId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV-${this.fullName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('No se pudo generar el PDF. Asegúrate de tener contenido en tu CV.');
    } finally {
      this.downloading.set(false);
    }
  }

  get fullName(): string {
    const info = this.profileService.personalInfo();
    if (info?.nombre && info?.apellido) return `${info.nombre} ${info.apellido}`;
    return 'Usuario';
  }

  get userEmail(): string {
    return this.profileService.personalInfo()?.email || '';
  }

  get userLocation(): string {
    const info = this.profileService.personalInfo();
    const parts = [info?.ciudad, info?.pais].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
  }

  get userLinkedin(): string {
    return this.profileService.personalInfo()?.linkedin || '';
  }

  get userGithub(): string {
    return this.profileService.personalInfo()?.github || '';
  }

  get userPhone(): string {
    return this.profileService.personalInfo()?.telefono || '';
  }

  get userPortfolio(): string {
    return this.profileService.personalInfo()?.portafolio || '';
  }

  get userWebsite(): string {
    return this.profileService.personalInfo()?.paginaPersonal || '';
  }

  saveContactInfo(): void {
    const info = this.profileService.personalInfo();
    if (!info) return;
    this.profileService.updatePersonalInfo({
      linkedin: info.linkedin || '',
      github: info.github || '',
      telefono: info.telefono || '',
      portafolio: info.portafolio || '',
      paginaPersonal: info.paginaPersonal || '',
    }).subscribe();
  }

  shareProfile(): void {
    const resume = this.resumeService.resume();
    if (resume?.slug) {
      const url = `${process.env['BASE_URL']}/resume/public/${resume.slug}`;
      navigator.clipboard.writeText(url).then(() => {
        alert('¡Link copiado al portapapeles!');
      });
    }
  }
}
