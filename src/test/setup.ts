import '@testing-library/jest-dom';

Object.defineProperty(globalThis, 'matchMedia', {
  value: (query: string) => ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => {},
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  }),
  writable: true,
});
