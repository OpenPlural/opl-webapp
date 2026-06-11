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
          console.log(match);
          return {
            type: 'underline',
            raw: match[0],
            text: match[1],
          }
        }
        return undefined;
      },
      renderer(token) {
        return `<u>${token["text"]}</u>`;
      }
    }
  ]
});

export function parseMarkdown(markdown: string): string {
  const htmlText = marked.parse(markdown) as string;
  return DOMPurify.sanitize(htmlText);
}
