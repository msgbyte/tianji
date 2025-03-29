import { describe, expect, it } from 'vitest';
import { token } from './index.js';
import { baseContentTokenizer } from './index.js';
import { htmlContentTokenizer } from './index.js';
import { markdownContentTokenizer } from './index.js';
import { telegramContentTokenizer } from './index.js';
import { ContentToken } from './type.js';

describe('BaseContentTokenizer', () => {
  it('should parse text token correctly', () => {
    const text = token.text('Hello World');
    expect(baseContentTokenizer.parseText(text)).toBe('Hello World');
  });

  it('should parse image token correctly', () => {
    const image = token.image('https://example.com/image.jpg');
    expect(baseContentTokenizer.parseImage(image)).toBe('[image]');
  });

  it('should parse title token correctly', () => {
    const title = token.title('Title', 1);
    expect(baseContentTokenizer.parseTitle(title)).toBe('Title\n');
  });

  it('should parse paragraph token correctly', () => {
    const paragraph = token.paragraph('Paragraph content');
    expect(baseContentTokenizer.parseParagraph(paragraph)).toBe(
      'Paragraph content\n'
    );
  });

  it('should parse newline token correctly', () => {
    const newline = token.newline();
    expect(baseContentTokenizer.parseNewline(newline)).toBe('\n');
  });

  it('should parse url token correctly', () => {
    const url = token.url('https://example.com', 'Example');
    expect(baseContentTokenizer.parseUrl(url)).toBe('https://example.com');
  });

  it('should parse list token correctly', () => {
    const list = token.list([[token.text('Item 1')], [token.text('Item 2')]]);
    expect(baseContentTokenizer.parseList(list)).toBe('Item 1\nItem 2');
  });

  it('should parse multiple tokens correctly', () => {
    const tokens: ContentToken[] = [
      token.text('Hello '),
      token.text('World'),
      token.newline(),
      token.paragraph('This is a paragraph'),
    ];
    expect(baseContentTokenizer.parse(tokens)).toBe(
      'Hello World\nThis is a paragraph'
    );
  });
});

describe('HTMLContentTokenizer', () => {
  it('should parse text token correctly', () => {
    const text = token.text('Hello World');
    expect(htmlContentTokenizer.parseText(text)).toBe('Hello World');
  });

  it('should parse image token correctly', () => {
    const image = token.image('https://example.com/image.jpg');
    expect(htmlContentTokenizer.parseImage(image)).toBe(
      '<img src="https://example.com/image.jpg" />'
    );
  });

  it('should parse title token with level 1 correctly', () => {
    const title = token.title('Title', 1);
    expect(htmlContentTokenizer.parseTitle(title)).toBe('<h1>Title</h1>');
  });

  it('should parse title token with level 2 correctly', () => {
    const title = token.title('Title', 2);
    expect(htmlContentTokenizer.parseTitle(title)).toBe('<h2>Title</h2>');
  });

  it('should parse title token with level 3 correctly', () => {
    const title = token.title('Title', 3);
    expect(htmlContentTokenizer.parseTitle(title)).toBe('<h3>Title</h3>');
  });

  it('should parse paragraph token correctly', () => {
    const paragraph = token.paragraph('Paragraph content');
    expect(htmlContentTokenizer.parseParagraph(paragraph)).toBe(
      '<p>Paragraph content</p>'
    );
  });

  it('should parse newline token correctly', () => {
    const newline = token.newline();
    expect(htmlContentTokenizer.parseNewline(newline)).toBe('<br />');
  });

  it('should parse url token correctly', () => {
    const url = token.url('https://example.com', 'Example');
    expect(htmlContentTokenizer.parseUrl(url)).toBe(
      '<a href="https://example.com">Example</a>'
    );
  });

  it('should parse url token without title correctly', () => {
    const url = token.url('https://example.com');
    expect(htmlContentTokenizer.parseUrl(url)).toBe(
      '<a href="https://example.com">https://example.com</a>'
    );
  });

  it('should parse list token correctly', () => {
    const list = token.list([[token.text('Item 1')], [token.text('Item 2')]]);
    expect(htmlContentTokenizer.parseList(list)).toBe(
      '<ul><li>Item 1</li><li>Item 2</li></ul>'
    );
  });
});

describe('MarkdownContentTokenizer', () => {
  it('should parse text token correctly', () => {
    const text = token.text('Hello World');
    expect(markdownContentTokenizer.parseText(text)).toBe('Hello World');
  });

  it('should parse image token correctly', () => {
    const image = token.image('https://example.com/image.jpg');
    expect(markdownContentTokenizer.parseImage(image)).toBe(
      '![](https://example.com/image.jpg)'
    );
  });

  it('should parse title token with level 1 correctly', () => {
    const title = token.title('Title', 1);
    expect(markdownContentTokenizer.parseTitle(title)).toBe('\n# Title\n');
  });

  it('should parse title token with level 2 correctly', () => {
    const title = token.title('Title', 2);
    expect(markdownContentTokenizer.parseTitle(title)).toBe('\n## Title\n');
  });

  it('should parse title token with level 3 correctly', () => {
    const title = token.title('Title', 3);
    expect(markdownContentTokenizer.parseTitle(title)).toBe('\n### Title\n');
  });

  it('should parse paragraph token correctly', () => {
    const paragraph = token.paragraph('Paragraph content');
    expect(markdownContentTokenizer.parseParagraph(paragraph)).toBe(
      '\nParagraph content\n'
    );
  });

  it('should parse url token correctly', () => {
    const url = token.url('https://example.com', 'Example');
    expect(markdownContentTokenizer.parseUrl(url)).toBe(
      '[Example](https://example.com)'
    );
  });

  it('should parse url token without title correctly', () => {
    const url = token.url('https://example.com');
    expect(markdownContentTokenizer.parseUrl(url)).toBe(
      '[](https://example.com)'
    );
  });

  it('should parse list token correctly', () => {
    const list = token.list([[token.text('Item 1')], [token.text('Item 2')]]);
    expect(markdownContentTokenizer.parseList(list)).toBe(
      '\n- Item 1\n- Item 2\n'
    );
  });
});

describe('TelegramContentTokenizer', () => {
  it('should parse text token correctly', () => {
    const text = token.text('Hello <World>');
    expect(telegramContentTokenizer.parseText(text)).toBe(
      'Hello &amp;lt;World&amp;gt;'
    );
  });

  it('should parse image token correctly', () => {
    const image = token.image('https://example.com/image.jpg');
    expect(telegramContentTokenizer.parseImage(image)).toBe('');
  });

  it('should parse title token correctly', () => {
    const title = token.title('Title <bold>', 1);
    expect(telegramContentTokenizer.parseTitle(title)).toBe(
      '\n<b>Title &amp;lt;bold&amp;gt;</b>\n'
    );
  });

  it('should parse paragraph token correctly', () => {
    const paragraph = token.paragraph('Paragraph & content');
    expect(telegramContentTokenizer.parseParagraph(paragraph)).toBe(
      '\nParagraph &amp; content\n'
    );
  });

  it('should parse url token correctly', () => {
    const url = token.url('https://example.com', 'Example <link>');
    expect(telegramContentTokenizer.parseUrl(url)).toBe(
      '<a href="https://example.com">Example <link></a>'
    );
  });

  it('should parse url token without title correctly', () => {
    const url = token.url('https://example.com');
    expect(telegramContentTokenizer.parseUrl(url)).toBe(
      '<a href="https://example.com">https://example.com</a>'
    );
  });

  it('should escape special characters correctly', () => {
    const text = token.text('<div>&test</div>');
    expect(telegramContentTokenizer.parseText(text)).toBe(
      '&amp;lt;div&amp;gt;&amp;test&amp;lt;/div&amp;gt;'
    );
  });
});
