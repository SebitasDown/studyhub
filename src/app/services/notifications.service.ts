import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { io, Socket } from 'socket.io-client';

const API = 'https://study-hub-backend-sigma.vercel.app'!;

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  notifications = signal<any[]>([]);
  unreadCount = signal(0);
  connected = signal(false);
  private socket?: Socket;

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

  // ---------- Actualización en vivo (WebSocket) ----------

  startLive(): void {
    if (this.socket || typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.socket = io(`${API}/notifications`, {
      // Token fresco en cada intento de (re)conexión
      auth: (cb) => cb({ token: localStorage.getItem('access_token') ?? undefined }),
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      // Sincronizar estado al (re)conectar
      this.refresh();
    });
    this.socket.on('disconnect', () => {
      this.connected.set(false);
    });
    this.socket.on('notification:created', () => {
      this.refresh();
    });
  }

  stopLive(): void {
    this.socket?.disconnect();
    this.socket = undefined;
    this.connected.set(false);
  }

  private refresh(): void {
    this.getAll().subscribe();
    this.getUnreadCount().subscribe();
  }
}
