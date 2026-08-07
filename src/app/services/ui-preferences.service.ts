import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

export type AppTheme = 'classic' | 'midnight' | 'lavender';
export type UiDensity = 'comfortable' | 'compact' | 'spacious';
export type NavigationMode = 'expanded' | 'compact';

/** Identificadores de módulos navegables de la app. */
export type AppModuleId =
  | 'dashboard'
  | 'materias'
  | 'estudio'
  | 'agenda'
  | 'profesor-ia'
  | 'mi-cv'
  | 'roadmaps'
  | 'riesgo'
  | 'laboratorio'
  | 'empleos'
  | 'grupos'
  | 'perfil';

/** Módulos que el usuario NO puede activar bajo ninguna circunstancia. */
export const FORCED_OFF_MODULES: AppModuleId[] = ['empleos', 'grupos'];

/**
 * Mapeo de módulos del frontend → slugs del backend (tabla app_modules).
 * Los módulos sin slug equivalente (materias, estudio, riesgo, laboratorio)
 * se gestionan solo con preferencia local.
 */
const FRONTEND_TO_BACKEND_SLUG: Record<string, string> = {
  dashboard: 'dashboard',
  agenda: 'schedule',
  'profesor-ia': 'ai-tutor',
  'mi-cv': 'cv-builder',
  roadmaps: 'roadmaps',
  perfil: 'profile',
  empleos: 'jobs',
  grupos: 'study-groups',
};

export interface UiPreferences {
  theme: AppTheme;
  density: UiDensity;
  navigation: NavigationMode;
  /** Habilita el módulo Laboratorio / Sandbox de programación. */
  sandboxEnabled: boolean;
  /** Módulos que el usuario decidió ver (false = oculto del sidebar). */
  visibleModules: Record<string, boolean>;
}

const STORAGE_KEY = 'studyhub_ui_preferences';
const API = 'https://study-hub-backend-sigma.vercel.app';
const DEFAULT_PREFERENCES: UiPreferences = {
  theme: 'classic',
  density: 'comfortable',
  navigation: 'expanded',
  sandboxEnabled: false,
  visibleModules: {
    dashboard: true,
    materias: true,
    estudio: true,
    agenda: true,
    'profesor-ia': true,
    'mi-cv': true,
    roadmaps: true,
    riesgo: true,
    laboratorio: true,
    empleos: false, // forzado off
    grupos: false,  // forzado off
    perfil: true,
  },
};

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  preferences = signal<UiPreferences>(this.readPreferences());

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  /** Catálogo de módulos del backend (slug → id) para persistir toggles. */
  private moduleCatalog = new Map<string, number>();
  /** Estado activo conocido del backend (slug → activo). */
  private backendModuleStates = new Map<string, boolean>();
  /** Módulos que el usuario tocó mientras había una sync en vuelo. */
  private dirtyModules = new Set<string>();
  private synced = false;

  constructor() {
    this.apply(this.preferences());
    this.syncModules(); // fire & forget: no bloquea el arranque
  }

  update(changes: Partial<UiPreferences>): void {
    const next = { ...this.preferences(), ...changes };
    this.preferences.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    this.apply(next);
  }

  reset(): void {
    this.preferences.set({ ...DEFAULT_PREFERENCES, visibleModules: { ...DEFAULT_PREFERENCES.visibleModules } });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences()));
    }
    this.apply(this.preferences());
  }

  // ───────────── Módulos ─────────────

  /** true si el módulo puede verse en el sidebar (respeta forzados-off y sandbox). */
  isModuleVisible(id: string): boolean {
    const prefs = this.preferences();
    if (FORCED_OFF_MODULES.includes(id as AppModuleId)) return false;
    if (id === 'laboratorio' && !prefs.sandboxEnabled) return false;
    return prefs.visibleModules[id] !== false;
  }

  /** true si el módulo está bloqueado (forzado off, no activable). */
  isModuleForcedOff(id: string): boolean {
    return FORCED_OFF_MODULES.includes(id as AppModuleId);
  }

  /** Alterna la visibilidad de un módulo (no hace nada si está forzado off). */
  toggleModule(id: string): void {
    if (this.isModuleForcedOff(id)) return;
    const current = this.preferences().visibleModules[id] !== false;
    const next = !current;
    this.dirtyModules.add(id);
    this.update({
      visibleModules: { ...this.preferences().visibleModules, [id]: next },
    });
    // Persistir en el backend (si el módulo tiene equivalente y hay sesión).
    this.persistModuleToBackend(id, next);
  }

  /** true si ya se sincronizó con el backend al menos una vez. */
  get isSynced(): boolean {
    return this.synced;
  }

  setSandbox(enabled: boolean): void {
    this.update({ sandboxEnabled: enabled });
  }

  /**
   * Sincroniza los módulos visibles con el backend (tabla user_modules).
   * - Carga el catálogo de módulos y los activos del usuario.
   * - Si el usuario aún no tiene módulos, inicializa con los por defecto.
   * - Los módulos forzados-off siempre quedan desactivados.
   * Los errores de red/API se ignoran: se mantiene la preferencia local.
   */
  async syncModules(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!localStorage.getItem('access_token')) return;

    // Marcas de toggles del usuario que no deben sobrescribirse.
    const userTouched = new Set(this.dirtyModules);

    try {
      const all = await firstValueFrom(this.http.get<any[]>(`${API}/modules`));
      this.moduleCatalog.clear();
      for (const m of all) {
        if (m?.slug) this.moduleCatalog.set(m.slug, Number(m.id));
      }

      let userModules = await firstValueFrom(this.http.get<any[]>(`${API}/profile/modules`));
      // Primer inicio de sesión: inicializar con los módulos por defecto del backend.
      if (!userModules || userModules.length === 0) {
        userModules = await firstValueFrom(this.http.post<any[]>(`${API}/profile/modules/defaults`, {}));
      }

      const activeSlugs = new Set((userModules || []).map((um) => um?.module?.slug).filter(Boolean));

      // Guardar el estado conocido del backend para los toggles posteriores.
      for (const slug of this.moduleCatalog.keys()) {
        this.backendModuleStates.set(slug, activeSlugs.has(slug));
      }

      const visible = { ...DEFAULT_PREFERENCES.visibleModules, ...this.preferences().visibleModules };
      for (const [id, slug] of Object.entries(FRONTEND_TO_BACKEND_SLUG)) {
        // No sobrescribir los toggles que el usuario hizo durante la sync.
        if (userTouched.has(id)) continue;
        visible[id] = activeSlugs.has(slug);
      }
      // Los forzados-off nunca se muestran ni se activan.
      for (const id of FORCED_OFF_MODULES) {
        visible[id] = false;
        // Si el backend los tenía activos, desactivarlos.
        if (this.backendModuleStates.get(FRONTEND_TO_BACKEND_SLUG[id])) {
          this.persistModuleToBackend(id, false);
        }
      }

      this.update({ visibleModules: visible });
      this.synced = true;
    } catch {
      // Sin conexión o API no disponible: se conserva la preferencia local.
      this.synced = false;
    }
  }

  /**
   * Persiste un toggle en el backend. El endpoint hace toggle (crea o elimina),
   * así que solo llamamos cuando el estado del backend difiere del deseado.
   * Si aún no conocemos el estado real del backend, lo consultamos antes de
   * togglear para no invertirlo. Silencioso si falla (p.ej. sin red).
   */
  private async persistModuleToBackend(id: string, active: boolean): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!localStorage.getItem('access_token')) return;
    const slug = FRONTEND_TO_BACKEND_SLUG[id];
    const moduleId = slug ? this.moduleCatalog.get(slug) : undefined;
    if (!moduleId) return;

    try {
      let currentBackend = this.backendModuleStates.get(slug);
      if (currentBackend === undefined) {
        // Estado desconocido (sync aún no terminó): consultarlo primero.
        const userModules = await firstValueFrom(this.http.get<any[]>(`${API}/profile/modules`));
        currentBackend = (userModules || []).some((um) => um?.module?.id === moduleId);
        this.backendModuleStates.set(slug, currentBackend);
      }
      if (currentBackend === active) return; // ya está en el estado deseado

      const res: any = await firstValueFrom(this.http.post(`${API}/profile/modules`, { moduleId }));
      this.backendModuleStates.set(slug, res?.activo ?? active);
    } catch {
      // Sin red / API no disponible: se queda solo en preferencia local.
    }
  }

  private readPreferences(): UiPreferences {
    if (typeof localStorage === 'undefined') {
      return { ...DEFAULT_PREFERENCES, visibleModules: { ...DEFAULT_PREFERENCES.visibleModules } };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const merged: UiPreferences = {
        ...DEFAULT_PREFERENCES,
        ...saved,
        visibleModules: { ...DEFAULT_PREFERENCES.visibleModules, ...(saved.visibleModules || {}) },
      };
      // Los módulos forzados-off nunca se activan, incluso si quedaron guardados así.
      for (const id of FORCED_OFF_MODULES) {
        merged.visibleModules[id] = false;
      }
      return merged;
    } catch {
      return { ...DEFAULT_PREFERENCES, visibleModules: { ...DEFAULT_PREFERENCES.visibleModules } };
    }
  }

  private apply(preferences: UiPreferences): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset['theme'] = preferences.theme;
    root.dataset['density'] = preferences.density;
    root.dataset['navigation'] = preferences.navigation;
  }
}
