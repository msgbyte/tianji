export type TextContentToken = {
  type: 'text';
  content: string;
};

export type ImageContentToken = {
  type: 'image';
  url: string;
};

export type TitleContentToken = {
  type: 'title';
  level: 1 | 2 | 3;
  content: string;
};

export type ParagraphContentToken = {
  type: 'paragraph';
  content: string;
};

export type NewlineContentToken = {
  type: 'newline';
};

export type UrlContentToken = {
  type: 'url';
  url: string;
  title?: string;
};

export type ListContentToken = {
  type: 'list';
  items: ContentToken[];
};

export type ContentToken =
  | TextContentToken
  | ImageContentToken
  | TitleContentToken
  | ParagraphContentToken
  | NewlineContentToken
  | UrlContentToken
  | ListContentToken;
