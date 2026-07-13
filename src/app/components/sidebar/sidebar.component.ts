import { Component, Input, inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';
import { ProfileService } from '../../services/profile.service';
import { GamificationService } from '../../services/gamification.service';
import { EventBusService } from '../../services/event-bus.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './sidebar.component.html',
  styles: [`:host { display: contents; }`],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() activeRoute: string = '';
  protected auth = inject(AuthService);
  protected notifService = inject(NotificationsService);
  protected profileService = inject(ProfileService);
  protected gamificationService = inject(GamificationService);
  private events = inject(EventBusService);
  private platformId = inject(PLATFORM_ID);
  private unsubscribers: (() => void)[] = [];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.notifService.getUnreadCount().subscribe();
      this.profileService.getPersonal().subscribe();
      this.gamificationService.getProgress().subscribe();
    }

    // Escuchar cambios de gamificación
    this.unsubscribers.push(
      this.events.on('gamification:updated', () => {
        this.gamificationService.getProgress(true).subscribe();
      })
    );
    this.unsubscribers.push(
      this.events.on('task:created', () => {
        this.gamificationService.getProgress(true).subscribe();
      })
    );
    this.unsubscribers.push(
      this.events.on('task:toggled', () => {
        this.gamificationService.getProgress(true).subscribe();
      })
    );
    this.unsubscribers.push(
      this.events.on('note:created', () => {
        this.gamificationService.getProgress(true).subscribe();
      })
    );
  }

  ngOnDestroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
  }

  get user() {
    // Return profile data from service if available, else fallback to localStorage
    const p = this.profileService.personal();
    if (p) return p;

    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  getInitial(): string {
    const u = this.user;
    const name = u?.nombre || u?.email || 'U';
    return name.charAt(0).toUpperCase();
  }

  get fullName(): string {
    const u = this.user;
    if (!u) return 'Usuario';
    return `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Usuario';
  }

  get level(): number {
    return this.gamificationService.progress()?.level ?? 0;
  }

  get xp(): number {
    return this.gamificationService.progress()?.totalXp ?? 0;
  }
}
