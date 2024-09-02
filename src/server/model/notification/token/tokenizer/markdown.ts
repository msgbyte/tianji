import {
  ImageContentToken,
  ListContentToken,
  ParagraphContentToken,
  TitleContentToken,
  UrlContentToken,
} from '../type.js';
import { BaseContentTokenizer } from './base.js';

export class MarkdownContentTokenizer extends BaseContentTokenizer {
  parseImage(token: ImageContentToken) {
    return `![](${token.url})`;
  }

  parseParagraph(token: ParagraphContentToken) {
    return `\n${token.content}\n`;
  }

  parseTitle(token: TitleContentToken) {
    if (token.level === 1) {
      return `\n# ${token.content}\n`;
    }
    if (token.level === 2) {
      return `\n## ${token.content}\n`;
    }
    if (token.level === 3) {
      return `\n### ${token.content}\n`;
    }

    return `\n${token.content}\n`;
  }

  parseUrl(token: UrlContentToken): string {
    return `[${token.title ?? ''}](${token.url})`;
  }

  parseList(token: ListContentToken) {
    return (
      '\n' +
      token.items.map((tokens) => `- ${this.parse(tokens)}`).join('\n') +
      '\n'
    );
  }
}
