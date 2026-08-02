import { Pipe, PipeTransform, inject, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'markdown', standalone: true, pure: false })
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  
  private lastValue = '';
  private cachedHtml: SafeHtml = '';
  private loaded = false;

  private marked: any;
  private dompurify: any;
  private katex: any;

  constructor() {
    this.loadDependencies();
  }

  async loadDependencies() {
    const [markedLib, dompurifyLib, katexLib] = await Promise.all([
      import('marked'),
      import('dompurify'),
      import('katex')
    ]);
    this.marked = markedLib.marked;
    this.dompurify = dompurifyLib.default || dompurifyLib;
    this.katex = katexLib.default || katexLib;
    this.loaded = true;
    this.cdr.markForCheck();
  }

  transform(value: string): SafeHtml {
    if (!value) return '';
    if (this.lastValue === value && this.cachedHtml) return this.cachedHtml;
    
    this.lastValue = value;

    if (!this.loaded) {
      // Return unformatted text while loading
      return this.sanitizer.bypassSecurityTrustHtml(value);
    }

    // 1. Pre-process math blocks (katex)
    let processedValue = value.replace(/\$\$(.*?)\$\$|\\\[(.*?)\\\]/gs, (match, p1, p2) => {
      try {
        return this.katex.renderToString(p1 || p2, { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    processedValue = processedValue.replace(/\$(.*?)\$|\\\((.*?)\\\)/g, (match, p1, p2) => {
      try {
        return this.katex.renderToString(p1 || p2, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // 2. Parse markdown
    const html = this.marked.parse(processedValue, { async: false }) as string;

    // 3. Purify HTML
    const cleanHtml = this.dompurify.sanitize(html, {
      ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'mspace', 'msqrt', 'mfrac', 'mroot', 'mstyle', 'merror', 'mpadded', 'mphantom', 'mfenced', 'msubsup', 'msup', 'msub', 'mmultiscripts', 'mover', 'munder', 'munderover', 'annotation', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
      ADD_ATTR: ['display', 'xmlns', 'class', 'style', 'aria-hidden']
    });

    this.cachedHtml = this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
    return this.cachedHtml;
  }
}
