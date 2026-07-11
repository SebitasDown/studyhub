import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface GroupMessage {
  id: number;
  groupId: number;
  userId: number;
  content?: string;
  imageUrl?: string;
  createdAt: string;
  user: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

const API = 'http://localhost:3000';
const WS_URL = 'http://localhost:3000/group-chat';

@Injectable({ providedIn: 'root' })
export class GroupChatService {
  private http = inject(HttpClient);
  private socket?: Socket;

  messages = signal<GroupMessage[]>([]);
  connected = signal(false);

  connect(groupId: number): void {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.socket = io(WS_URL, {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      this.socket?.emit('join-room', { groupId });
    });

    this.socket.on('disconnect', () => {
      this.connected.set(false);
    });

    this.socket.on('message-received', (msg: GroupMessage) => {
      this.messages.update(msgs => [...msgs, msg]);
    });
  }

  disconnect(groupId: number): void {
    if (this.socket) {
      this.socket.emit('leave-room', { groupId });
      this.socket.disconnect();
      this.socket = undefined;
      this.connected.set(false);
      this.messages.set([]);
    }
  }

  loadHistory(groupId: number): Observable<GroupMessage[]> {
    return this.http.get<GroupMessage[]>(`${API}/groups/${groupId}/messages`).pipe(
      tap(msgs => this.messages.set(msgs))
    );
  }

  sendMessage(groupId: number, content: string): void {
    if (this.socket && this.connected()) {
      this.socket.emit('send-message', { groupId, content });
    }
  }

  sendImage(groupId: number, file: File): Observable<GroupMessage> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<GroupMessage>(`${API}/groups/${groupId}/messages/image`, formData);
  }
}
