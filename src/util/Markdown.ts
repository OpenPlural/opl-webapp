import {marked} from "marked";
import DOMPurify from "dompurify";

marked.use({
  breaks: true,
  extensions: [
    {
      name: 'underline',
      level: 'inline',
      start(src) { return src.indexOf('__'); },
      tokenizer(src) {
        const match = src.match(/^__([^_]*)__/);
        if (match) {
          return {
            type: 'underline',
            raw: match[0],
            text: match[1],
          }
        }
        return undefined;
      },
      renderer(token) {
        const nestedHtml = marked(token["text"]);
        return `<u>${nestedHtml}</u>`;
      }
    }, {
      name: 'centered',
      level: 'block',
      start(src) { return src.indexOf('{{'); },
      tokenizer(src) {
        const match = src.match(/^{{([^{}]*)}}/);
        if (match) {
          return {
            type: 'centered',
            raw: match[0],
            text: match[1],
          }
        }
        return undefined;
      },
      renderer(token) {
        const nestedHtml = marked(token["text"]);
        return `<div class="text-center">${nestedHtml}</div>`;
      }
    }, {
      name: 'language',
      level: 'inline',
      start(src) { return src.indexOf('<lang '); },
      tokenizer(src) {
        const match = src.match(/^<lang ([^>]*)>(.*?)<\/lang>/);
        if (match) {
          return {
            type: 'language',
            raw: match[0],
            code: match[1],
            text: match[2],
          }
        }
        return undefined;
      },
      renderer(token) {
        const nestedHtml = marked(token["text"]);
        return `<span lang="${token["code"]}">${nestedHtml}</span>`;
      }
    }
  ]
});

export function parseMarkdown(markdown: string): string {
  const htmlText = marked.parse(markdown) as string;
  return DOMPurify.sanitize(htmlText);
}
