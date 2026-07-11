import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  personal = signal<any>(null);
  academic = signal<any>(null);
  professional = signal<any>(null);
  skills = signal<any[]>([]);
  saving = signal(false);

  // Aliases for backward compat with mi-cv component
  personalInfo() { return this.personal(); }

  getPersonal(): Observable<any> {
    return this.http.get<any>(`${API}/profile/personal`).pipe(tap(d => this.personal.set(d)));
  }

  // Alias
  getPersonalInfo(): Observable<any> { return this.getPersonal(); }
  updatePersonalInfo(dto: any): Observable<any> { return this.updatePersonal(dto); }

  updatePersonal(dto: any): Observable<any> {
    this.saving.set(true);
    return this.http.put<any>(`${API}/profile/personal`, dto).pipe(
      tap({ next: d => { this.personal.set(d); this.saving.set(false); }, error: () => this.saving.set(false) })
    );
  }

  getAcademic(): Observable<any> {
    return this.http.get<any>(`${API}/profile/academic`).pipe(tap(d => this.academic.set(d)));
  }

  updateAcademic(dto: any): Observable<any> {
    this.saving.set(true);
    return this.http.put<any>(`${API}/profile/academic`, dto).pipe(
      tap({ next: d => { this.academic.set(d); this.saving.set(false); }, error: () => this.saving.set(false) })
    );
  }

  getProfessional(): Observable<any> {
    return this.http.get<any>(`${API}/profile/professional`).pipe(tap(d => this.professional.set(d)));
  }

  updateProfessional(dto: any): Observable<any> {
    this.saving.set(true);
    return this.http.put<any>(`${API}/profile/professional`, dto).pipe(
      tap({ next: d => { this.professional.set(d); this.saving.set(false); }, error: () => this.saving.set(false) })
    );
  }

  getUserSkills(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/profile/skills`).pipe(tap(s => this.skills.set(s)));
  }
}
