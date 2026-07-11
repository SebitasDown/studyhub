import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideExternalLink, lucideClock } from '@ng-icons/lucide';
import { RoadmapStep } from '../../services/roadmap.service';

@Component({
  selector: 'app-step-card',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ lucideCheck, lucideExternalLink, lucideClock })],
  templateUrl: './step-card.component.html',
  styles: [`:host { display: contents; }`],
})
export class StepCardComponent {
  @Input({ required: true }) step!: RoadmapStep;
  @Input({ required: true }) index!: number;
  @Output() toggle = new EventEmitter<void>();
}
