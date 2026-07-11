import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideSend, lucideImage, lucideUsers, lucideCalendar, lucideX } from '@ng-icons/lucide';
import { GroupChatService } from '../../services/group-chat.service';
import { StudyGroupService } from '../../services/study-group.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, RouterLink],
  providers: [provideIcons({ lucideArrowLeft, lucideSend, lucideImage, lucideUsers, lucideCalendar, lucideX })],
  templateUrl: './group-detail.html',
  styles: [`:host { display: contents; }`]
})
export class GroupDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  
  groupService = inject(StudyGroupService);
  chatService = inject(GroupChatService);
  authService = inject(AuthService);

  groupId!: number;
  group: any;
  newMessage = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  myUserId = 0;

  @ViewChild('chatScroll') private chatScroll!: ElementRef;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.params.subscribe(params => {
        this.groupId = +params['id'];
        this.loadGroup();
        this.chatService.loadHistory(this.groupId).subscribe(() => this.scrollToBottom());
        this.chatService.connect(this.groupId);
        
        // Listen for new messages to scroll down
        // Angular signals don't have an easy subscribe, but we can do it in the template or using effect
        // For simplicity, we just scroll down periodically if near bottom, or when sending.
        setInterval(() => this.scrollToBottom(), 1000);
      });
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.myUserId = JSON.parse(userStr).id;
        } catch (e) {}
      }
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.groupId) {
      this.chatService.disconnect(this.groupId);
    }
  }

  loadGroup(): void {
    // We can fetch from myGroups if we have it
    const all = this.groupService.myGroups();
    this.group = all.find(g => g.id === this.groupId);
    // In a real app we'd fetch the specific group if not found.
  }

  sendMessage(): void {
    if (this.selectedImage) {
      this.chatService.sendImage(this.groupId, this.selectedImage).subscribe(() => {
        this.removeImage();
        this.scrollToBottom();
      });
    } else if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.groupId, this.newMessage);
      this.newMessage = '';
      this.scrollToBottom();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  scrollToBottom(): void {
    try {
      this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
    } catch(err) { }
  }

  getInitials(n: string, a: string): string {
    return `${n?.charAt(0) || ''}${a?.charAt(0) || ''}`.toUpperCase();
  }
}
