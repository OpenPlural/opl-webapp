import { marked, Tokens } from 'marked';
import DOMPurify from "dompurify";

const markdownRenderer = new marked.Renderer();
markdownRenderer.image = function(img: Tokens.Image) {
  let render = `<img src="${img.href}" alt="${img.text}"`;
  if (img.title) {
    render += ` title="${img.title}"`;
  }
  if (URL.canParse(img.href)) {
    const url = new URL(img.href);
    if (url.hash) {
      const hash = url.hash.substring(1);
      const size = hash.split("x");
      if (size.length === 2) {
        const width = parseInt(size[0]);
        const height = parseInt(size[1]);
        if (isFinite(width) && isFinite(height)) {
          render += ` width="${width}" height="${height}"`;
        }
      }
    }
  }
  render += '>';
  return render;
};

marked.use({
  breaks: true,
  renderer: markdownRenderer,
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
        const nestedHtml = marked.parseInline(token["text"]) as string;
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
        const nestedHtml = marked.parse(token["text"]) as string;
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
        const nestedHtml = marked.parseInline(token["text"]) as string;
        return `<span lang="${token["code"]}">${nestedHtml}</span>`;
      }
    }
  ]
});

export function parseMarkdown(markdown: string): string {
  const htmlText = marked.parse(markdown) as string;
  return DOMPurify.sanitize(htmlText);
}
