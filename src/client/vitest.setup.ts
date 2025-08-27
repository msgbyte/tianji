// Ensure extended DOM matchers are available in Vitest
import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

// Keep test results deterministic across environments
process.env.TZ ||= 'UTC';

// Automatically cleanup React Testing Library after each test
afterEach(() => {
  cleanup();
});

// Provide `crypto.subtle` for environments that lack it in jsdom
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto as unknown as Crypto;
}

// Mock `window.matchMedia` used by some UI libs
if (typeof window !== 'undefined' && !window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock `ResizeObserver` for libraries relying on element resize detection
class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!(globalThis as any).ResizeObserver) {
  (globalThis as any).ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}

// Mock `IntersectionObserver` for viewport-dependent components
class IntersectionObserverMock {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_callback?: unknown, _options?: unknown) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (!(globalThis as any).IntersectionObserver) {
  (globalThis as any).IntersectionObserver =
    IntersectionObserverMock as unknown as typeof IntersectionObserver;
}

// Stub scrolling and URL helpers commonly used in components
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).scrollTo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).scrollTo = vi.fn();
  }
}

if (!(URL as unknown as { createObjectURL?: unknown }).createObjectURL) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (URL as any).createObjectURL = vi.fn();
}

export {};
