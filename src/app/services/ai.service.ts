import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';

export interface TeacherProfile {
  code: string;
  name: string;
  description: string;
  subjects: string[];
  systemPrompt: string;
  teachingStyle: string;
  difficultyLevel: string;
  active: boolean;
  isSystem?: boolean;
  _id?: string;
}

export interface Conversation {
  _id: string;
  userId: number;
  title: string | null;
  description: string | null;
  lastMessageAt: string;
  messageCount: number;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  userId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface KnowledgeGap {
  _id: string;
  userId: number;
  topic: string;
  subject: string;
  confidence: number;
  status: string;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningGoal {
  _id: string;
  userId: number;
  title: string;
  description: string;
  progress: number;
  status: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
}

export interface GeneratedResource {
  id: string;
  userId: number;
  subject: string;
  type: string;
  title: string;
  difficulty: string | null;
  generatedFrom: string | null;
  completed: boolean;
  completedAt: string | null;
  trigger: string | null;
  createdAt: string;
  content?: any;
}

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);

  getTeacherProfiles(): Observable<{ profiles: TeacherProfile[] }> {
    return this.http.get<{ profiles: TeacherProfile[] }>(`${API}/ai/teacher-profiles`);
  }

  createTeacherProfile(data: Partial<TeacherProfile>): Observable<{ profile: TeacherProfile }> {
    return this.http.post<{ profile: TeacherProfile }>(`${API}/ai/teacher-profiles`, data);
  }

  createConversation(): Observable<Conversation> {
    return this.http.post<Conversation>(`${API}/ai/conversations`, {});
  }

  getConversations(): Observable<{ conversations: Conversation[]; total: number; page: number; limit: number }> {
    return this.http.get<{ conversations: Conversation[]; total: number; page: number; limit: number }>(
      `${API}/ai/conversations`
    );
  }

  getConversation(id: string): Observable<{ conversation: Conversation; messages: Message[] }> {
    return this.http.get<{ conversation: Conversation; messages: Message[] }>(`${API}/ai/conversations/${id}`);
  }

  getConversationMessages(id: string): Observable<{ messages: Message[] }> {
    return this.http.get<{ messages: Message[] }>(`${API}/ai/conversations/${id}/messages`);
  }

  deleteConversation(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/ai/conversations/${id}`);
  }

  sendMessage(message: string, conversationId?: string, teacherId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${API}/ai/chat`, {
      conversationId: conversationId || undefined,
      teacherId,
      message,
    });
  }

  streamChat(
    message: string,
    conversationId?: string,
    teacherId?: string,
  ): Observable<{ chunk: string }> {
    return new Observable((observer: Observer<{ chunk: string }>) => {
      const controller = new AbortController();
      let cancelled = false;

      (async () => {
        try {
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
          const res = await fetch(`${API}/ai/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              conversationId: conversationId || undefined,
              teacherId,
              message,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            observer.error(new Error(`HTTP ${res.status}`));
            return;
          }

          const reader = res.body?.getReader();
          if (!reader) {
            observer.error(new Error('No response body'));
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (!cancelled) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                observer.next({ chunk: line.slice(6) });
              }
              if (line.startsWith('event: done')) {
                observer.complete();
                return;
              }
              if (line.startsWith('event: error')) {
                observer.error(new Error('Stream error'));
                return;
              }
            }
          }

          observer.complete();
        } catch (err: any) {
          if (!cancelled) observer.error(err);
        }
      })();

      return () => {
        cancelled = true;
        controller.abort();
      };
    });
  }

  getKnowledgeGaps(): Observable<{ gaps: KnowledgeGap[] }> {
    return this.http.get<{ gaps: KnowledgeGap[] }>(`${API}/ai/knowledge-gaps`);
  }

  updateKnowledgeGap(id: string, data: { status?: string; confidence?: number }): Observable<{ gap: KnowledgeGap }> {
    return this.http.patch<{ gap: KnowledgeGap }>(`${API}/ai/knowledge-gaps/${id}`, data);
  }

  getGoals(): Observable<{ goals: LearningGoal[] }> {
    return this.http.get<{ goals: LearningGoal[] }>(`${API}/ai/goals`);
  }

  createGoal(data: { title: string; description?: string; targetDate?: string }): Observable<{ goal: LearningGoal }> {
    return this.http.post<{ goal: LearningGoal }>(`${API}/ai/goals`, data);
  }

  updateGoal(id: string, data: { title?: string; description?: string; progress?: number; status?: string; targetDate?: string }): Observable<{ goal: LearningGoal }> {
    return this.http.patch<{ goal: LearningGoal }>(`${API}/ai/goals/${id}`, data);
  }

  deleteGoal(id: string): Observable<any> {
    return this.http.delete(`${API}/ai/goals/${id}`);
  }

  // ---- Dashboard ----
  getDashboard(): Observable<any> {
    return this.http.get(`${API}/ai/dashboard`);
  }

  // ---- Generated Resources ----
  getResources(type?: string): Observable<{ resources: GeneratedResource[] }> {
    const params = type ? `?type=${type}` : '';
    return this.http.get<{ resources: GeneratedResource[] }>(`${API}/ai/resources${params}`);
  }

  getResource(id: string): Observable<{ resource: GeneratedResource }> {
    return this.http.get<{ resource: GeneratedResource }>(`${API}/ai/resources/${id}`);
  }

  completeResource(id: string, data: { resultScore?: number; resultCorrect?: number; resultTotal?: number }): Observable<any> {
    return this.http.patch(`${API}/ai/resources/${id}/complete`, data);
  }

  deleteResource(id: string): Observable<any> {
    return this.http.delete(`${API}/ai/resources/${id}`);
  }
}
