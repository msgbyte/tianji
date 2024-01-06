import {
  ImageContentToken,
  NewlineContentToken,
  ParagraphContentToken,
  TitleContentToken,
} from '../type';
import { BaseContentTokenizer } from './base';

export class HTMLContentTokenizer extends BaseContentTokenizer {
  parseImage(token: ImageContentToken) {
    return `<img src="${token.url}" />`;
  }

  parseParagraph(token: ParagraphContentToken) {
    return `<p>${token.content}</p>`;
  }

  parseTitle(token: TitleContentToken) {
    if (token.level === 1) {
      return `<h1>${token.content}</h1>`;
    }
    if (token.level === 2) {
      return `<h2>${token.content}</h2>`;
    }
    if (token.level === 3) {
      return `<h3>${token.content}</h3>`;
    }

    return `<p>${token.content}</p>`;
  }

  parseNewline(token: NewlineContentToken) {
    return '<br />';
  }
}
