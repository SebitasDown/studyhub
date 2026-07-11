import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AcademicRiskService } from '../../services/academic-risk.service';

@Component({
  selector: 'app-academic-risk',
  standalone: true,
  imports: [CommonModule, DatePipe, SidebarComponent],
  templateUrl: './academic-risk.html',
  styles: [`:host { display: contents; }`]
})
export class AcademicRiskComponent implements OnInit {
  riskService = inject(AcademicRiskService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.riskService.getLatest().subscribe();
      this.riskService.getHistory().subscribe();
    }
  }

  recalculate(): void {
    this.riskService.recalculate().subscribe();
  }

  getLevelColor(level: string): string {
    if (level === 'LOW') return '#1E9F68';
    if (level === 'MEDIUM') return '#F4B960';
    return '#EF4444';
  }

  getLevelBg(level: string): string {
    if (level === 'LOW') return '#DCFCE7';
    if (level === 'MEDIUM') return '#FEF3C7';
    return '#FEE2E2';
  }

  getBarPercent(score: number, max: number): number {
    return max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
  }

  getRiskFactors(reasons: any): { label: string; score: number; max: number; pct: number; weight: string }[] {
    if (!reasons) return [];
    return [
      { label: 'Knowledge Gaps', score: reasons.knowledgeGaps?.score ?? 0, max: reasons.knowledgeGaps?.max ?? 30, pct: this.getBarPercent(reasons.knowledgeGaps?.score ?? 0, reasons.knowledgeGaps?.max ?? 30), weight: '30%' },
      { label: 'Tareas vencidas', score: reasons.overdueTasks?.score ?? 0, max: reasons.overdueTasks?.max ?? 25, pct: this.getBarPercent(reasons.overdueTasks?.score ?? 0, reasons.overdueTasks?.max ?? 25), weight: '25%' },
      { label: 'Confianza IA', score: reasons.confidenceIA?.score ?? 0, max: reasons.confidenceIA?.max ?? 20, pct: this.getBarPercent(reasons.confidenceIA?.score ?? 0, reasons.confidenceIA?.max ?? 20), weight: '20%' },
      { label: 'Progreso roadmaps', score: reasons.roadmaps?.score ?? 0, max: reasons.roadmaps?.max ?? 15, pct: this.getBarPercent(reasons.roadmaps?.score ?? 0, reasons.roadmaps?.max ?? 15), weight: '15%' },
      { label: 'Engagement', score: reasons.engagement?.score ?? 0, max: reasons.engagement?.max ?? 10, pct: this.getBarPercent(reasons.engagement?.score ?? 0, reasons.engagement?.max ?? 10), weight: '10%' },
    ];
  }
}
