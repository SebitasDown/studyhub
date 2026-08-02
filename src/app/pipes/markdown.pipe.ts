import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    if (!value) return '';

    // 1. Pre-process math blocks (katex)
    // Block math: $$ ... $$ or \[ ... \]
    let processedValue = value.replace(/\$\$(.*?)\$\$|\\\[(.*?)\\\]/gs, (match, p1, p2) => {
      try {
        return katex.renderToString(p1 || p2, { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Inline math: $ ... $ or \( ... \)
    processedValue = processedValue.replace(/\$(.*?)\$|\\\((.*?)\\\)/g, (match, p1, p2) => {
      try {
        return katex.renderToString(p1 || p2, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // 2. Parse markdown
    const html = marked.parse(processedValue, { async: false }) as string;

    // 3. Purify HTML (allowing katex classes and mathml)
    const cleanHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'mspace', 'msqrt', 'mfrac', 'mroot', 'mstyle', 'merror', 'mpadded', 'mphantom', 'mfenced', 'msubsup', 'msup', 'msub', 'mmultiscripts', 'mover', 'munder', 'munderover', 'annotation', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
      ADD_ATTR: ['display', 'xmlns', 'class', 'style', 'aria-hidden']
    });

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
