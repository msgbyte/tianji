import {
  ImageContentToken,
  ParagraphContentToken,
  TitleContentToken,
} from '../type';
import { BaseContentTokenizer } from './base';

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
}
