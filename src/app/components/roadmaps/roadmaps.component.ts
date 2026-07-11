import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-roadmaps',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './roadmaps.component.html',
  styles: [`:host { display: contents; }`],
})
export class RoadmapsComponent {}
