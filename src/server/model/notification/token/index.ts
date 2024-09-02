import { BaseContentTokenizer } from './tokenizer/base.js';
import { HTMLContentTokenizer } from './tokenizer/html.js';
import { MarkdownContentTokenizer } from './tokenizer/markdown.js';
import { TelegramContentTokenizer } from './tokenizer/telegram.js';
import {
  ContentToken,
  ImageContentToken,
  ListContentToken,
  NewlineContentToken,
  ParagraphContentToken,
  TextContentToken,
  TitleContentToken,
  UrlContentToken,
} from './type.js';

export type { ContentToken };

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
  url: (url: string, title?: string): UrlContentToken => ({
    type: 'url',
    url,
    title,
  }),
  list: (items: ContentToken[][]): ListContentToken => ({
    type: 'list',
    items,
  }),
};

export const baseContentTokenizer = new BaseContentTokenizer();
export const htmlContentTokenizer = new HTMLContentTokenizer();
export const markdownContentTokenizer = new MarkdownContentTokenizer();
export const telegramContentTokenizer = new TelegramContentTokenizer();
