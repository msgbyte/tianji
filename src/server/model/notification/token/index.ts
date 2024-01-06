import { BaseContentTokenizer } from './tokenizer/base';
import { HTMLContentTokenizer } from './tokenizer/html';
import { MarkdownContentTokenizer } from './tokenizer/markdown';
import { TelegramContentTokenizer } from './tokenizer/telegram';
import {
  ContentToken,
  ImageContentToken,
  NewlineContentToken,
  ParagraphContentToken,
  TextContentToken,
  TitleContentToken,
} from './type';

export { ContentToken };

export const token = {
  text: (content: string): TextContentToken => ({
    type: 'text',
    content,
  }),
  image: (url: string): ImageContentToken => ({
    type: 'image',
    url,
  }),
  title: (content: string, level: 1 | 2 | 3): TitleContentToken => ({
    type: 'title',
    level,
    content,
  }),
  paragraph: (content: string): ParagraphContentToken => ({
    type: 'paragraph',
    content,
  }),
  newline: (): NewlineContentToken => ({
    type: 'newline',
  }),
};

export const baseContentTokenizer = new BaseContentTokenizer();
export const htmlContentTokenizer = new HTMLContentTokenizer();
export const markdownContentTokenizer = new MarkdownContentTokenizer();
export const telegramContentTokenizer = new TelegramContentTokenizer();
