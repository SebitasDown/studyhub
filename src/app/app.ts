import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiPreferencesService } from './services/ui-preferences.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styles: [`:host { display: contents; }`]
})
export class App {
  // Instantiating the service restores the saved visual preferences on startup.
  private uiPreferences = inject(UiPreferencesService);
}
