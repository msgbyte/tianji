import { describe, expect, test } from 'vitest';
import { formatString, hasTemplateRegex } from './template.js';

describe('formatString', () => {
  test('replaces simple variable placeholders', () => {
    expect(formatString('hello {{ name }}', { name: 'tianji' })).toBe(
      'hello tianji'
    );
  });

  test('replaces simple variable placeholders with optional whitespace', () => {
    const variables = { name: 'tianji' };

    expect(formatString('hello {{name}}', variables)).toBe('hello tianji');
    expect(formatString('hello {{name }}', variables)).toBe('hello tianji');
    expect(formatString('hello {{ name  }}', variables)).toBe('hello tianji');
    expect(formatString('hello {{ name}}', variables)).toBe('hello tianji');
  });

  test('renders missing variables as empty strings', () => {
    expect(formatString('hello {{ name }}', {})).toBe('hello ');
  });

  test('does not evaluate lodash template code blocks', () => {
    expect(formatString('<% print(7*6) %>', {})).toBe('<% print(7*6) %>');
  });

  test('does not evaluate expressions inside interpolation braces', () => {
    expect(formatString('{{ process.version }}', {})).toBe(
      '{{ process.version }}'
    );
    expect(formatString('{{ 1 + 1 }}', {})).toBe('{{ 1 + 1 }}');
  });

  test('keeps survey and monitor style variables working', () => {
    expect(
      formatString('{{ _surveyName }} received {{ feedback }}', {
        _surveyName: 'NPS',
        feedback: 'great',
      })
    ).toBe('NPS received great');

    expect(
      formatString('{{ monitorName }} {{ currentTime }}', {
        monitorName: 'Homepage',
        currentTime: '2026-06-10 10:00',
      })
    ).toBe('Homepage 2026-06-10 10:00');
  });
});

describe('hasTemplateRegex', () => {
  test('detects supported simple variable placeholders', () => {
    expect(hasTemplateRegex('hello {{ name }}')).toBe(true);
  });

  test('detects supported placeholders with optional whitespace', () => {
    expect(hasTemplateRegex('hello {{name}}')).toBe(true);
    expect(hasTemplateRegex('hello {{name }}')).toBe(true);
    expect(hasTemplateRegex('hello {{ name  }}')).toBe(true);
    expect(hasTemplateRegex('hello {{ name}}')).toBe(true);
  });

  test('does not detect unsupported expressions as templates', () => {
    expect(hasTemplateRegex('{{ process.version }}')).toBe(false);
    expect(hasTemplateRegex('{{ 1 + 1 }}')).toBe(false);
  });
});
