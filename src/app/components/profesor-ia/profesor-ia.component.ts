import { SidebarComponent } from '../sidebar/sidebar.component';
import { Component, ElementRef, NgZone, OnInit, ViewChild, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import {
  lucideMessageCircle, lucideBrain, lucideCrosshair, lucidePlus,
  lucideRuler, lucideTerminal, lucideSendHorizonal, lucideTrash2,
  lucideCalendar, lucideGraduationCap, lucideCalculator, lucideCode,
  lucideLanguages, lucidePen, lucideBot, lucideLoader,
} from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  AiService, TeacherProfile, Conversation, Message, KnowledgeGap, LearningGoal,
} from '../../services/ai.service';

@Component({
  selector: 'app-profesor-ia',
  standalone: true,
  imports: [SidebarComponent, RouterLink, NgIconComponent, FormsModule, DatePipe, MarkdownPipe],
  providers: [provideIcons({
    lucideMessageCircle, lucideBrain, lucideCrosshair, lucidePlus,
    lucideRuler, lucideTerminal, lucideSendHorizonal, lucideTrash2,
    lucideCalendar, lucideGraduationCap, lucideCalculator, lucideCode,
    lucideLanguages, lucidePen, lucideBot, lucideLoader,
  })],
  templateUrl: './profesor-ia.component.html',
  styles: [`:host { display: contents; }
    .chat-msg p { margin: 0 0 0.5em 0; }
    .chat-msg p:last-child { margin-bottom: 0; }
    .chat-msg ul, .chat-msg ol { margin: 0.25em 0; padding-left: 1.5em; }
    .chat-msg li { margin-bottom: 0.15em; }
    .chat-msg strong { font-weight: 700; }
    .chat-msg em { font-style: italic; }
    .chat-msg br { display: block; content: ''; margin: 0.25em 0; }
  `],
})
export class ProfesorIaComponent implements OnInit {
  protected auth = inject(AuthService);
  private ai = inject(AiService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLElement>;

  activeTab = signal<'chat' | 'gaps' | 'metas'>('chat');

  teacherProfiles = signal<TeacherProfile[]>([]);
  selectedTeacher = signal<TeacherProfile | null>(null);

  conversations = signal<Conversation[]>([]);
  selectedConversationId = signal<string | null>(null);
  messages = signal<Message[]>([]);

  messageInput = signal('');
  sending = signal(false);

  loadingChat = signal(true);
  loadingMessages = signal(false);

  knowledgeGaps = signal<KnowledgeGap[]>([]);
  loadingGaps = signal(true);

  goals = signal<LearningGoal[]>([]);
  loadingGoals = signal(true);

  newGoal = signal<{ title: string; description: string; targetDate: string }>({
    title: '', description: '', targetDate: '',
  });
  showNewGoalForm = signal(false);

  showNewTeacherForm = signal(false);
  newTeacherProfile = signal<{ name: string; description: string; subjects: string; systemPrompt: string; teachingStyle: string; difficultyLevel: string }>({
    name: '', description: '', subjects: '', systemPrompt: '', teachingStyle: 'balanced', difficultyLevel: 'intermediate',
  });

  user = signal<any>(null);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('user');
      this.user.set(raw ? JSON.parse(raw) : null);
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadChatData();
    this.loadGaps();
    this.loadGoals();
  }

  switchTab(tab: 'chat' | 'gaps' | 'metas') {
    this.activeTab.set(tab);
  }

  private loadChatData(): void {
    this.loadingChat.set(true);
    this.ai.getTeacherProfiles().subscribe({
      next: (res) => {
        this.teacherProfiles.set(res.profiles);
        if (res.profiles.length > 0) {
          const general = res.profiles.find(p => p.code === 'GENERAL_TEACHER');
          this.selectedTeacher.set(general || res.profiles[0]);
        }
      },
      error: () => {
        this.loadingChat.set(false);
      },
    });
    this.ai.getConversations().subscribe({
      next: (res) => {
        this.conversations.set(res.conversations);
        this.loadingChat.set(false);
        if (this.conversations().length > 0) {
          this.selectConversation(this.conversations()[0]._id);
        } else {
          this.newConversation();
        }
      },
      error: () => {
        this.loadingChat.set(false);
      },
    });
  }

  selectConversation(id: string): void {
    this.selectedConversationId.set(id);
    this.loadingMessages.set(true);
    this.messages.set([]);
    this.ai.getConversation(id).subscribe({
      next: (res) => {
        this.messages.set(res.messages || []);
        this.loadingMessages.set(false);
        setTimeout(() => this.scrollToBottom(true), 50);
      },
      error: () => {
        this.loadingMessages.set(false);
      },
    });
  }

  newConversation(): void {
    this.sending.set(true);
    this.ai.createConversation().subscribe({
      next: (conv) => {
        this.conversations.update(arr => [conv, ...arr]);
        this.selectedConversationId.set(conv._id);
        this.messages.set([]);
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
      },
    });
  }

  deleteConversation(id: string, event: Event): void {
    event.stopPropagation();
    this.ai.deleteConversation(id).subscribe({
      next: () => {
        this.conversations.update(arr => arr.filter(c => c._id !== id));
        if (this.selectedConversationId() === id) {
          this.selectedConversationId.set(null);
          this.messages.set([]);
          if (this.conversations().length > 0) {
            this.selectConversation(this.conversations()[0]._id);
          }
        }
      },
    });
  }

  selectTeacher(profile: TeacherProfile): void {
    this.selectedTeacher.set(profile);
  }

  sendMessage(): void {
    const text = this.messageInput().trim();
    if (!text || this.sending()) return;
    this.messageInput.set('');

    const userMsg: Message = {
      _id: 'temp-' + Date.now(),
      conversationId: this.selectedConversationId() || '',
      userId: 0,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    this.messages.update(arr => [...arr, userMsg]);
    this.sending.set(true);
    setTimeout(() => this.scrollToBottom(true), 50);

    const assistantId = 'resp-' + Date.now();
    const assistantMsg: Message = {
      _id: assistantId,
      conversationId: this.selectedConversationId() || '',
      userId: 0,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    this.messages.update(arr => [...arr, assistantMsg]);

    this.ai.streamChat(
      text,
      this.selectedConversationId() || undefined,
      this.selectedTeacher()?.code || undefined,
    ).subscribe({
      next: ({ chunk }) => {
        this.ngZone.run(() => {
          this.messages.update(arr =>
            arr.map(m => m._id === assistantId ? { ...m, content: m.content + chunk } : m)
          );
          requestAnimationFrame(() => this.scrollToBottom());
        });
      },
      error: (err) => {
        console.warn('[streamChat] fallback a chat normal:', err);
        this.ngZone.run(() => {
          this.messages.update(arr => arr.filter(m => m._id !== assistantId));
          this.sendMessageFallback(text);
        });
      },
      complete: () => {
        this.ngZone.run(() => {
          const finalMsg = this.messages().find(m => m._id === assistantId);
          if (finalMsg) {
            const convId = this.selectedConversationId() || finalMsg.conversationId;
            this.messages.update(arr =>
              arr.map(m => m._id === assistantId ? { ...m, conversationId: convId } : m)
            );
            if (convId && convId !== this.selectedConversationId()) {
              this.selectedConversationId.set(convId);
            }
          }
          this.sending.set(false);
          this.refreshConversations();
          setTimeout(() => this.scrollToBottom(true), 50);
        });
      },
    });
  }

  private scrollToBottom(force = false): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    if (force) {
      el.scrollTop = el.scrollHeight;
    } else {
      const threshold = 60;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      if (isNearBottom) el.scrollTop = el.scrollHeight;
    }
  }

  private sendMessageFallback(text: string): void {
    this.ai.sendMessage(
      text,
      this.selectedConversationId() || undefined,
      this.selectedTeacher()?.code || undefined,
    ).subscribe({
      next: (res) => {
        const assistantMsg: Message = {
          _id: 'resp-' + Date.now(),
          conversationId: res.conversationId || this.selectedConversationId() || '',
          userId: 0,
          role: 'assistant',
          content: res.reply,
          createdAt: new Date().toISOString(),
        };
        this.messages.update(arr => [...arr, assistantMsg]);
        if (!this.selectedConversationId() && res.conversationId) {
          this.selectedConversationId.set(res.conversationId);
        }
        this.sending.set(false);
        this.refreshConversations();
        setTimeout(() => this.scrollToBottom(true), 50);
      },
      error: () => {
        this.sending.set(false);
      },
    });
  }

  private refreshConversations(): void {
    this.ai.getConversations().subscribe({
      next: (res) => {
        this.conversations.set(res.conversations);
      },
    });
  }

  // ---- Knowledge Gaps ----
  private loadGaps(): void {
    this.loadingGaps.set(true);
    this.ai.getKnowledgeGaps().subscribe({
      next: (res) => {
        this.knowledgeGaps.set(res.gaps);
        this.loadingGaps.set(false);
      },
      error: () => {
        this.loadingGaps.set(false);
      },
    });
  }

  updateGapStatus(gap: KnowledgeGap, status: string): void {
    this.ai.updateKnowledgeGap(gap._id, { status }).subscribe({
      next: (res) => {
        this.knowledgeGaps.update(arr => {
          const idx = arr.findIndex(g => g._id === gap._id);
          if (idx >= 0) {
            const copy = [...arr];
            copy[idx] = res.gap;
            return copy;
          }
          return arr;
        });
      },
    });
  }

  // ---- Goals ----
  private loadGoals(): void {
    this.loadingGoals.set(true);
    this.ai.getGoals().subscribe({
      next: (res) => {
        this.goals.set(res.goals);
        this.loadingGoals.set(false);
      },
      error: () => {
        this.loadingGoals.set(false);
      },
    });
  }

  createGoal(): void {
    if (!this.newGoal().title.trim()) return;
    this.ai.createGoal({
      title: this.newGoal().title,
      description: this.newGoal().description || undefined,
      targetDate: this.newGoal().targetDate || undefined,
    }).subscribe({
      next: (res) => {
        this.goals.update(arr => [res.goal, ...arr]);
        this.newGoal.set({ title: '', description: '', targetDate: '' });
        this.showNewGoalForm.set(false);
      },
    });
  }

  createTeacherProfile(): void {
    const data = this.newTeacherProfile();
    if (!data.name.trim()) return;
    this.ai.createTeacherProfile({
      name: data.name,
      description: data.description,
      subjects: data.subjects.split(',').map(s => s.trim()).filter(Boolean),
      systemPrompt: data.systemPrompt,
      teachingStyle: data.teachingStyle,
      difficultyLevel: data.difficultyLevel,
      active: true,
    }).subscribe({
      next: (res) => {
        this.teacherProfiles.update(arr => [...arr, res.profile]);
        this.newTeacherProfile.set({ name: '', description: '', subjects: '', systemPrompt: '', teachingStyle: 'balanced', difficultyLevel: 'intermediate' });
        this.showNewTeacherForm.set(false);
      },
    });
  }

  updateGoalProgress(goal: LearningGoal, event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.ai.updateGoal(goal._id, { progress: value }).subscribe({
      next: (res) => {
        this.goals.update(arr => {
          const idx = arr.findIndex(g => g._id === goal._id);
          if (idx >= 0) {
            const copy = [...arr];
            copy[idx] = res.goal;
            return copy;
          }
          return arr;
        });
      },
      error: (err) => {
        console.error('[updateGoalProgress] error:', err);
      },
    });
  }

  deleteGoal(id: string): void {
    this.ai.deleteGoal(id).subscribe({
      next: () => {
        this.goals.update(arr => arr.filter(g => g._id !== id));
      },
    });
  }
}
