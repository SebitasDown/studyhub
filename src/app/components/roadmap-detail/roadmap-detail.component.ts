import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCheck, lucideClock, lucideExternalLink } from '@ng-icons/lucide';
import { RoadmapService, RoadmapStep } from '../../services/roadmap.service';

@Component({
  selector: 'app-roadmap-detail',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ lucideArrowLeft, lucideCheck, lucideClock, lucideExternalLink })],
  templateUrl: './roadmap-detail.component.html',
  styleUrl: './roadmap-detail.component.css',
})
export class RoadmapDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected roadmapService = inject(RoadmapService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.roadmapService.findOne(id).subscribe();
    }
  }

  backToList(): void {
    this.router.navigate(['/roadmaps']);
  }

  get rm() {
    return this.roadmapService.selectedRoadmap();
  }

  completedCount(steps: RoadmapStep[] | undefined): number {
    return steps ? steps.filter((s) => s.completed).length : 0;
  }

  progressPercent(steps: RoadmapStep[] | undefined): number {
    if (!steps || !steps.length) return 0;
    return Math.round((this.completedCount(steps) / steps.length) * 100);
  }

  toggleStep(step: RoadmapStep): void {
    this.roadmapService.toggleStep(step.id, !step.completed).subscribe();
  }
}
