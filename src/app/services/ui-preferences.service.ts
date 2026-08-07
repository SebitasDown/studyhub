import { Injectable, signal } from '@angular/core';

export type AppTheme = 'classic' | 'midnight' | 'lavender';
export type UiDensity = 'comfortable' | 'compact' | 'spacious';
export type NavigationMode = 'expanded' | 'compact';

/**
 * Módulos que nunca aparecen en el menú: no son configurables por el usuario.
 * (Grupos de estudio y Bolsa de empleos están desactivados forzosamente.)
 */
export const HIDDEN_MODULES = ['empleos', 'grupos'];

export interface UiPreferences {
  theme: AppTheme;
  density: UiDensity;
  navigation: NavigationMode;
}

const STORAGE_KEY = 'studyhub_ui_preferences_v2';
const DEFAULT_PREFERENCES: UiPreferences = {
  theme: 'classic',
  density: 'comfortable',
  navigation: 'expanded',
};

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  preferences = signal<UiPreferences>(this.readPreferences());

  constructor() {
    this.apply(this.preferences());
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
    this.preferences.set({ ...DEFAULT_PREFERENCES });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences()));
    }
    this.apply(this.preferences());
  }

  /** true si el módulo debe mostrarse en el sidebar (los ocultos nunca se ven). */
  isModuleVisible(id: string): boolean {
    return !HIDDEN_MODULES.includes(id);
  }

  private readPreferences(): UiPreferences {
    if (typeof localStorage === 'undefined') {
      return { ...DEFAULT_PREFERENCES };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...DEFAULT_PREFERENCES, ...saved };
    } catch {
      return { ...DEFAULT_PREFERENCES };
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
