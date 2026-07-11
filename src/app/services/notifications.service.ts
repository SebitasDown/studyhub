import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  notifications = signal<any[]>([]);
  unreadCount = signal(0);

  getAll(): Observable<any> {
    return this.http.get<any>(`${API}/notifications`).pipe(
      tap(res => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.notifications ?? []);
        this.notifications.set(Array.isArray(list) ? list : []);
      }),
      catchError(() => { this.notifications.set([]); return []; })
    );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${API}/notifications/unread-count`).pipe(
      tap(res => this.unreadCount.set(res?.count ?? 0)),
      catchError(() => { this.unreadCount.set(0); return []; })
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch(`${API}/notifications/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${API}/notifications/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(ns => ns.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      })
    );
  }
}
