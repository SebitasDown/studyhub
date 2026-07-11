import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { HeroComponent } from '../hero/hero.component';
import { FeaturesComponent } from '../features/features.component';
import { BottomCtaComponent } from '../bottom-cta/bottom-cta.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [HeaderComponent, HeroComponent, FeaturesComponent, BottomCtaComponent, FooterComponent],
  template: `
    <app-header/>
    <app-hero/>
    <app-features/>
    <app-bottom-cta/>
    <app-footer/>
  `,
  styles: [`:host { display: contents; }`]
})
export class LandingComponent {}
