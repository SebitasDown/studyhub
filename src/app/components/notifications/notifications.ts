import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
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
export class NotificationsComponent implements OnInit, OnDestroy {
  notifService = inject(NotificationsService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.notifService.getAll().subscribe();
      this.notifService.getUnreadCount().subscribe();
      this.notifService.startLive();
    }
  }

  ngOnDestroy(): void {
    this.notifService.stopLive();
  }

  markAll(): void {
    this.notifService.markAllAsRead().subscribe();
  }

  markOne(id: number): void {
    this.notifService.markAsRead(id).subscribe();
  }
}
