import {
  ContentToken,
  ImageContentToken,
  NewlineContentToken,
  ParagraphContentToken,
  TextContentToken,
  TitleContentToken,
} from '../type';

export class BaseContentTokenizer {
  parseText(token: TextContentToken) {
    return token.content;
  }

  parseImage(token: ImageContentToken) {
    return '[image]';
  }

  parseTitle(token: TitleContentToken) {
    return token.content;
  }

  parseParagraph(token: ParagraphContentToken) {
    return token.content;
  }

  parseNewline(token: NewlineContentToken) {
    return '\n';
  }

  parse(tokens: ContentToken[]) {
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

        return '';
      })
      .join('');
  }
}
