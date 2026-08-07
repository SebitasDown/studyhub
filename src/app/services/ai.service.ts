import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { AppCache } from '../utils/cache';

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

const API = 'https://study-hub-backend-sigma.vercel.app'!;

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);

  getTeacherProfiles(forceRefresh = false): Observable<{ profiles: TeacherProfile[] }> {
    if (!forceRefresh) {
      const cached = AppCache.get<{ profiles: TeacherProfile[] }>('ai_teacher_profiles');
      if (cached) return of(cached);
    }
    return this.http.get<{ profiles: TeacherProfile[] }>(`${API}/ai/teacher-profiles`).pipe(
      tap(data => AppCache.set('ai_teacher_profiles', data))
    );
  }

  createTeacherProfile(data: Partial<TeacherProfile>): Observable<{ profile: TeacherProfile }> {
    return this.http.post<{ profile: TeacherProfile }>(`${API}/ai/teacher-profiles`, data).pipe(
      tap(() => AppCache.invalidate('ai_teacher_profiles'))
    );
  }

  createConversation(): Observable<Conversation> {
    return this.http.post<Conversation>(`${API}/ai/conversations`, {}).pipe(
      tap(() => AppCache.invalidate('ai_conversations'))
    );
  }

  getConversations(forceRefresh = false): Observable<{ conversations: Conversation[]; total: number; page: number; limit: number }> {
    if (!forceRefresh) {
      const cached = AppCache.get<{ conversations: Conversation[]; total: number; page: number; limit: number }>('ai_conversations');
      if (cached) return of(cached);
    }
    return this.http.get<{ conversations: Conversation[]; total: number; page: number; limit: number }>(
      `${API}/ai/conversations`
    ).pipe(
      tap(data => AppCache.set('ai_conversations', data))
    );
  }

  getConversation(id: string, forceRefresh = false): Observable<{ conversation: Conversation; messages: Message[] }> {
    const key = `ai_conversation_${id}`;
    if (!forceRefresh) {
      const cached = AppCache.get<{ conversation: Conversation; messages: Message[] }>(key);
      if (cached) return of(cached);
    }
    return this.http.get<{ conversation: Conversation; messages: Message[] }>(`${API}/ai/conversations/${id}`).pipe(
      tap(data => AppCache.set(key, data))
    );
  }

  getConversationMessages(id: string): Observable<{ messages: Message[] }> {
    return this.http.get<{ messages: Message[] }>(`${API}/ai/conversations/${id}/messages`);
  }

  deleteConversation(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/ai/conversations/${id}`).pipe(
      tap(() => {
        AppCache.invalidate('ai_conversations');
        AppCache.invalidate(`ai_conversation_${id}`);
      })
    );
  }

  sendMessage(message: string, conversationId?: string, teacherId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${API}/ai/chat`, {
      conversationId: conversationId || undefined,
      teacherId,
      message,
    }).pipe(
      tap(() => {
        if (conversationId) AppCache.invalidate(`ai_conversation_${conversationId}`);
        AppCache.invalidate('ai_conversations');
      })
    );
  }

  /**
   * Envía un mensaje y consume la respuesta en streaming vía SSE (POST /ai/chat/stream).
   *
   * NOTA: EventSource solo soporta GET, por lo que para enviar el mensaje (POST) con
   * autenticación se usa fetch() + ReadableStream.
   *
   * Formato de los eventos:
   * - 'message': fragmento de texto. El backend lo envía como JSON.stringify(chunk)
   *   para escapar saltos de línea; si llega texto crudo (backend antiguo) se usa tal cual.
   * - 'done': marca el final (payload JSON con conversationId o `true`).
   * - 'error': notifica un fallo del servidor.
   *
   * Seguridad: incluye un timeout (120 s) por si el servidor corta la conexión sin
   * enviar 'done' (timeouts de Vercel, red, etc.) para no dejar el chat colgado.
   */
  streamChat(
    message: string,
    conversationId: string | undefined,
    teacherId: string | undefined,
    onChunk: (chunk: string) => void,
  ): Observable<ChatResponse> {
    return new Observable<ChatResponse>((subscriber) => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
      const controller = new AbortController();
      let reply = '';
      let finished = false;

      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          controller.abort();
          subscriber.error(new Error('El stream tardó demasiado y se cortó.'));
        }
      }, 120_000);

      const cleanup = () => {
        clearTimeout(timeout);
        controller.abort();
      };

      // Decodifica el contenido de un evento 'message': acepta JSON (backend nuevo)
      // o texto crudo (backend antiguo).
      const decodeChunk = (data: string): string => {
        const trimmed = data.trim();
        if (trimmed.startsWith('"')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') return parsed;
          } catch {
            /* no es JSON, usar texto crudo */
          }
        }
        return data;
      };

      fetch(`${API}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          teacherId,
          message,
        }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok || !res.body) {
            const body = await res.text().catch(() => '');
            throw new Error(`SSE error ${res.status}: ${body.slice(0, 200)}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          // Evento SSE en construcción. El backend nuevo envía JSON (sin \n\n reales en
          // data), pero el antiguo envía texto crudo; el parser tolera ambos.
          let current: { eventName: string; dataLines: string[] } | null = null;

          const dispatch = (eventName: string, data: string) => {
            if (eventName === 'message') {
              const chunk = decodeChunk(data);
              reply += chunk;
              onChunk(chunk);
            } else if (eventName === 'done') {
              finished = true;
              let streamConversationId = conversationId || '';
              try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed.conversationId === 'string') {
                  streamConversationId = parsed.conversationId;
                }
              } catch {
                // payload 'done' simple (ej: true), conservar el id conocido
              }
              subscriber.next({ conversationId: streamConversationId, reply });
              subscriber.complete();
              cleanup();
            } else if (eventName === 'error') {
              finished = true;
              subscriber.error(new Error(data));
              cleanup();
            }
          };

          const flushCurrent = () => {
            if (current && current.dataLines.length > 0) {
              // Según el estándar SSE, múltiples líneas data: se unen con \n
              dispatch(current.eventName, current.dataLines.join('\n'));
            }
            current = null;
          };

          const hasEventField = (lines: string[]): boolean =>
            lines.some((l) =>
              /^(event|data|id|retry):/.test(l) || l.startsWith(':')
            );

          const read = (): Promise<void> =>
            reader.read().then(({ done, value }) => {
              if (done) {
                flushCurrent();
                if (!finished) {
                  finished = true;
                  subscriber.next({ conversationId: conversationId || '', reply });
                  subscriber.complete();
                }
                cleanup();
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              let sep: number;
              while ((sep = buffer.indexOf('\n\n')) !== -1) {
                const raw = buffer.slice(0, sep);
                buffer = buffer.slice(sep + 2);
                const lines = raw.split('\n');

                if (hasEventField(lines)) {
                  // Nuevo evento SSE
                  flushCurrent();
                  current = { eventName: 'message', dataLines: [] };
                  let seenData = false;
                  for (const line of lines) {
                    if (line.startsWith('event:')) {
                      current.eventName = line.slice(6).trim();
                    } else if (line.startsWith('data:')) {
                      seenData = true;
                      current.dataLines.push(line.slice(5).trimStart());
                    } else if (seenData && line.trim() !== '') {
                      // Continuación de un data: multilínea (texto crudo del backend antiguo)
                      current.dataLines.push(line);
                    }
                  }
                } else if (current && current.dataLines.length > 0) {
                  // Sin prefijos de evento: es la continuación de un data: crudo que
                  // contenía \n\n (backend antiguo). Se conserva el salto de párrafo.
                  if (lines.length > 0 && lines[0].trim() === '') {
                    current.dataLines.push(''); // el \n\n consumido separa párrafos
                  }
                  for (const line of lines) {
                    if (line.trim() !== '') current.dataLines.push(line);
                  }
                }
              }
              return read();
            });

          read().catch((err) => {
            if (err?.name === 'AbortError') {
              if (!finished) subscriber.complete();
            } else {
              subscriber.error(err);
            }
            cleanup();
          });
        })
        .catch((err) => {
          if (!finished) subscriber.error(err);
          cleanup();
        });

      return cleanup;
    });
  }

  getKnowledgeGaps(forceRefresh = false): Observable<{ gaps: KnowledgeGap[] }> {
    if (!forceRefresh) {
      const cached = AppCache.get<{ gaps: KnowledgeGap[] }>('ai_knowledge_gaps');
      if (cached) return of(cached);
    }
    return this.http.get<{ gaps: KnowledgeGap[] }>(`${API}/ai/knowledge-gaps`).pipe(
      tap(data => AppCache.set('ai_knowledge_gaps', data))
    );
  }

  updateKnowledgeGap(id: string, data: { status?: string; confidence?: number }): Observable<{ gap: KnowledgeGap }> {
    return this.http.patch<{ gap: KnowledgeGap }>(`${API}/ai/knowledge-gaps/${id}`, data).pipe(
      tap(() => AppCache.invalidate('ai_knowledge_gaps'))
    );
  }

  getGoals(forceRefresh = false): Observable<{ goals: LearningGoal[] }> {
    if (!forceRefresh) {
      const cached = AppCache.get<{ goals: LearningGoal[] }>('ai_goals');
      if (cached) return of(cached);
    }
    return this.http.get<{ goals: LearningGoal[] }>(`${API}/ai/goals`).pipe(
      tap(data => AppCache.set('ai_goals', data))
    );
  }

  createGoal(data: { title: string; description?: string; targetDate?: string }): Observable<{ goal: LearningGoal }> {
    return this.http.post<{ goal: LearningGoal }>(`${API}/ai/goals`, data).pipe(
      tap(() => AppCache.invalidate('ai_goals'))
    );
  }

  updateGoal(id: string, data: { title?: string; description?: string; progress?: number; status?: string; targetDate?: string }): Observable<{ goal: LearningGoal }> {
    return this.http.patch<{ goal: LearningGoal }>(`${API}/ai/goals/${id}`, data).pipe(
      tap(() => AppCache.invalidate('ai_goals'))
    );
  }

  deleteGoal(id: string): Observable<any> {
    return this.http.delete(`${API}/ai/goals/${id}`).pipe(
      tap(() => AppCache.invalidate('ai_goals'))
    );
  }

  getDashboard(forceRefresh = false): Observable<any> {
    if (!forceRefresh) {
      const cached = AppCache.get<any>('ai_dashboard');
      if (cached) return of(cached);
    }
    return this.http.get(`${API}/ai/dashboard`).pipe(
      tap(data => AppCache.set('ai_dashboard', data))
    );
  }

  getResources(type?: string, forceRefresh = false): Observable<{ resources: GeneratedResource[] }> {
    const key = type ? `ai_resources_${type}` : 'ai_resources';
    if (!forceRefresh) {
      const cached = AppCache.get<{ resources: GeneratedResource[] }>(key);
      if (cached) return of(cached);
    }
    const params = type ? `?type=${type}` : '';
    return this.http.get<{ resources: GeneratedResource[] }>(`${API}/ai/resources${params}`).pipe(
      tap(data => AppCache.set(key, data))
    );
  }

  getResource(id: string): Observable<{ resource: GeneratedResource }> {
    return this.http.get<{ resource: GeneratedResource }>(`${API}/ai/resources/${id}`);
  }

  completeResource(id: string, data: { resultScore?: number; resultCorrect?: number; resultTotal?: number }): Observable<any> {
    return this.http.patch(`${API}/ai/resources/${id}/complete`, data).pipe(
      tap(() => {
        AppCache.invalidatePrefix('ai_resources');
        AppCache.invalidate('ai_dashboard');
      })
    );
  }

  deleteResource(id: string): Observable<any> {
    return this.http.delete(`${API}/ai/resources/${id}`).pipe(
      tap(() => AppCache.invalidatePrefix('ai_resources'))
    );
  }
}
