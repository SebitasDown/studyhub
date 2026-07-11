const fs = require('fs');
const path = require('path');

const components = [
  { name: 'dashboard', ts: 'dashboard/dashboard.component.ts', html: 'dashboard/dashboard.component.html', route: 'dashboard' },
  { name: 'profesor-ia', ts: 'profesor-ia/profesor-ia.component.ts', html: 'profesor-ia/profesor-ia.component.html', route: 'profesor-ia' },
  { name: 'jobs', ts: 'jobs/jobs.component.ts', html: 'jobs/jobs.component.html', route: 'empleos' },
  { name: 'mi-cv', ts: 'mi-cv/mi-cv.component.ts', html: 'mi-cv/mi-cv.component.html', route: 'mi-cv' },
  { name: 'subjects-list', ts: 'subjects/subjects-list.component.ts', html: 'subjects/subjects-list.component.html', route: 'subjects' },
  { name: 'subject-detail', ts: 'subjects/subject-detail.component.ts', html: 'subjects/subject-detail.component.html', route: 'subjects' }
];

const basePath = '/home/sebas/Escritorio/studyhub/src/app/components';

for (const comp of components) {
  // Update HTML
  const htmlPath = path.join(basePath, comp.html);
  if (fs.existsSync(htmlPath)) {
    let content = fs.readFileSync(htmlPath, 'utf8');
    // regex to replace <aside ...> ... </aside> exactly
    const asideRegex = /<aside[\s\S]*?<\/aside>/;
    content = content.replace(asideRegex, `<app-sidebar activeRoute="${comp.route}" />`);
    fs.writeFileSync(htmlPath, content);
    console.log('Updated HTML:', htmlPath);
  }

  // Update TS to import SidebarComponent
  const tsPath = path.join(basePath, comp.ts);
  if (fs.existsSync(tsPath)) {
    let tsContent = fs.readFileSync(tsPath, 'utf8');
    if (!tsContent.includes('SidebarComponent')) {
      // Add import
      tsContent = `import { SidebarComponent } from '../sidebar/sidebar.component';\n` + tsContent;
      // Add to imports array
      tsContent = tsContent.replace(/imports:\s*\[([^\]]*)\]/, (match, p1) => {
        return `imports: [SidebarComponent, ${p1}]`;
      });
      fs.writeFileSync(tsPath, tsContent);
      console.log('Updated TS:', tsPath);
    }
  }
}
