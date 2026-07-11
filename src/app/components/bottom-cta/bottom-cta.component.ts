import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bottom-cta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bottom-cta.component.html',
  styles: [`:host { display: contents; }`]
})
export class BottomCtaComponent {}