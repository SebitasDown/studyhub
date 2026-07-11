import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe, SidebarComponent],
  templateUrl: './notifications.html',
  styles: [`:host { display: contents; }`]
})
export class NotificationsComponent implements OnInit {
  notifService = inject(NotificationsService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.notifService.getAll().subscribe();
      this.notifService.getUnreadCount().subscribe();
    }
  }

  markAll(): void {
    this.notifService.markAllAsRead().subscribe();
  }

  markOne(id: number): void {
    this.notifService.markAsRead(id).subscribe();
  }

  getIcon(type: string): { icon: string; bg: string; color: string } {
    const map: Record<string, { icon: string; bg: string; color: string }> = {
      TASK:         { icon: '⏰', bg: '#FEF3C7', color: '#D97706' },
      CLASS:        { icon: '📅', bg: '#DBEAFE', color: '#2563EB' },
      JOB:          { icon: '💼', bg: '#D1FAE5', color: '#059669' },
      GAP:          { icon: '⚡', bg: '#F3F4F6', color: '#374151' },
      STREAK:       { icon: '🔥', bg: '#FEE2E2', color: '#DC2626' },
      ACHIEVEMENT:  { icon: '🏆', bg: '#FEF3C7', color: '#D97706' },
    };
    return map[type] ?? { icon: '🔔', bg: '#EDE9FE', color: '#7C3AED' };
  }
}
