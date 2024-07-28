import {
  ContentToken,
  ImageContentToken,
  ListContentToken,
  NewlineContentToken,
  ParagraphContentToken,
  TextContentToken,
  TitleContentToken,
  UrlContentToken,
} from '../type.js';

export class BaseContentTokenizer {
  parseText(token: TextContentToken) {
    return token.content;
  }

  parseImage(token: ImageContentToken) {
    return '[image]';
  }

  parseTitle(token: TitleContentToken) {
    return token.content + '\n';
  }

  parseParagraph(token: ParagraphContentToken) {
    return token.content + '\n';
  }

  parseNewline(token: NewlineContentToken) {
    return '\n';
  }

  parseUrl(token: UrlContentToken) {
    return token.url;
  }

  parseList(token: ListContentToken) {
    return token.items.map((item) => this.parse([item])).join('\n');
  }

  parse(tokens: ContentToken[]): string {
    return tokens
      .map((token) => {
        if (token.type === 'text') {
          return this.parseText(token);
        }

        if (token.type === 'image') {
          return this.parseImage(token);
        }

        if (token.type === 'title') {
          return this.parseTitle(token);
        }

        if (token.type === 'paragraph') {
          return this.parseParagraph(token);
        }

        if (token.type === 'newline') {
          return this.parseNewline(token);
        }

        if (token.type === 'list') {
          return this.parseList(token);
        }

        return '';
      })
      .join('')
      .trim();
  }
}
