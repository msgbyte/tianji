import React, { useEffect, useRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { VisitorLarkMap } from './VisitorLarkMap';

const { attributionState } = vi.hoisted(() => ({
  attributionState: {
    container: null as HTMLDetailsElement | null,
    collapsedAfterAttribution: false,
    userExpansionPreserved: false,
  },
}));

vi.mock('@antv/l7', () => ({
  MapLibre: class {
    constructor(public config: Record<string, unknown>) {}
  },
}));

vi.mock('@antv/larkmap', () => ({
  FullscreenControl: () => null,
  PointLayer: () => null,
  LarkMap: ({
    className,
    map,
    onSceneLoaded,
  }: {
    className?: string;
    map?: { config: Record<string, unknown> };
    onSceneLoaded?: (scene: unknown) => void;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const listeners = new Map<string, Set<() => void>>();
      const on = (event: string, listener: () => void) => {
        const eventListeners = listeners.get(event) ?? new Set();
        eventListeners.add(listener);
        listeners.set(event, eventListeners);
      };
      const off = (event: string, listener: () => void) => {
        listeners.get(event)?.delete(listener);
      };
      const emit = (event: string) => {
        [...(listeners.get(event) ?? [])].forEach((listener) => listener());
      };
      const sceneMap = {
        addControl: (control: { _container: HTMLDetailsElement }) => {
          containerRef.current?.append(control._container);
        },
        on,
        off,
        once: (event: string, listener: () => void) => {
          const onceListener = () => {
            off(event, onceListener);
            listener();
          };
          on(event, onceListener);
        },
      };

      onSceneLoaded?.({ map: sceneMap });
      emit('sourcedata');

      const attribution = attributionState.container;
      attribution?.classList.remove('maplibregl-attrib-empty');
      attribution?.classList.add(
        'maplibregl-compact',
        'maplibregl-compact-show'
      );
      attribution?.setAttribute('open', '');
      emit('sourcedata');
      attributionState.collapsedAfterAttribution =
        !attribution?.classList.contains('maplibregl-compact-show') &&
        !attribution?.hasAttribute('open');

      attribution?.classList.add('maplibregl-compact-show');
      attribution?.setAttribute('open', '');
      emit('sourcedata');
      attributionState.userExpansionPreserved =
        Boolean(
          attribution?.classList.contains('maplibregl-compact-show')
        ) && Boolean(attribution?.hasAttribute('open'));
    }, [onSceneLoaded]);

    return (
      <div
        ref={containerRef}
        className={className}
        data-testid="lark-map"
        data-style={String(map?.config.style)}
        data-attribution={String(map?.config.attributionControl)}
      />
    );
  },
}));

vi.mock('../../../hooks/useConfig', () => ({
  useGlobalConfig: () => ({}),
}));

vi.mock('../../../store/settings', () => ({
  useTheme: () => 'light',
}));

describe('VisitorLarkMap', () => {
  test('uses a collapsed attribution control for the no-key MapLibre map', () => {
    (window as any).maplibregl = {
      AttributionControl: class {
        options: Record<string, unknown>;
        _container = document.createElement('details');

        _updateCompactMinimize = () => {
          this._container.classList.remove('maplibregl-compact-show');
        };

        constructor(options: Record<string, unknown>) {
          this.options = options;
          this._container.classList.add('maplibregl-attrib-empty');
          attributionState.container = this._container;
        }
      },
    };

    render(<VisitorLarkMap data={[]} mapType="MapLibre" />);

    const map = screen.getByTestId('lark-map');
    expect(map.dataset.style).toBe(
      'https://tiles.openfreemap.org/styles/positron'
    );
    expect(map.dataset.attribution).toBe('false');
    expect(map.classList).toContain('visitor-lark-map');
    expect(attributionState.collapsedAfterAttribution).toBe(true);
    expect(attributionState.userExpansionPreserved).toBe(true);
  });
});
