import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { BarList } from './BarList';

describe('BarList', () => {
  test('defaults the total to the sum of counts and tolerates a zero total', () => {
    const { rerender } = render(
      <BarList
        aria-label="Idiomas"
        data={[
          { label: 'Español', count: 3 },
          { label: 'Otros', count: 1, muted: true },
        ]}
      />
    );

    const list = screen.getByRole('list', { name: 'Idiomas' });
    expect(list).toHaveTextContent('75.0%');
    expect(list).toHaveTextContent('25.0%');

    rerender(
      <BarList aria-label="Idiomas" data={[{ label: 'Español', count: 0 }]} />
    );
    expect(screen.getByRole('list', { name: 'Idiomas' })).toHaveTextContent(
      '0.0%'
    );
  });
});
