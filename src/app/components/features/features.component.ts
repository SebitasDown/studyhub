import { Component } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBot, lucideTriangleAlert, lucideFileText, lucideBriefcase, lucideUsers, lucideSparkles } from '@ng-icons/lucide';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ lucideBot, lucideTriangleAlert, lucideFileText, lucideBriefcase, lucideUsers, lucideSparkles })],
  templateUrl: './features.component.html',
  styles: [`:host { display: contents; }`]
})
export class FeaturesComponent {
  protected features = [
    {
      icon: 'lucideBot',
      title: 'Profesor IA personalizado',
      desc: 'Chat ilimitado con tutores por materia. Detecta tus brechas de conocimiento y se adapta a tu estilo.'
    },
    {
      icon: 'lucideTriangleAlert',
      title: 'Riesgo académico',
      desc: 'Predicción temprana e intervención automática con planes de estudio.'
    },
    {
      icon: 'lucideFileText',
      title: 'Creador de CV + analizador',
      desc: 'Construye tu CV, exporta a PDF y deja que la IA lo analice.'
    },
    {
      icon: 'lucideBriefcase',
      title: 'Bolsa de empleo con coincidencia IA',
      desc: 'Cada oferta tiene tu % de coincidencia y habilidades faltantes.'
    },
    {
      icon: 'lucideUsers',
      title: 'Grupos de estudio',
      desc: 'Recomendaciones basadas en tus brechas de conocimiento, metas y materias.'
    },
    {
      icon: 'lucideSparkles',
      title: 'Rutas generadas por IA',
      desc: 'Camino paso a paso hacia tu rol soñado.'
    }
  ];
}