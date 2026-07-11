import { Component, Input, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './sidebar.component.html',
  styles: [`:host { display: contents; }`],
})
export class SidebarComponent implements OnInit {
  @Input() activeRoute: string = '';
  protected auth = inject(AuthService);
  protected notifService = inject(NotificationsService);
  protected profileService = inject(ProfileService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.notifService.getUnreadCount().subscribe();
      this.profileService.getPersonal().subscribe();
    }
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
    return this.user?.progress?.level ?? 7;
  }

  get xp(): number {
    return this.user?.progress?.totalXp ?? 2840;
  }
}
