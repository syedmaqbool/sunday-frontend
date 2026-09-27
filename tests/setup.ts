import '@testing-library/jest-dom';

Element.prototype.scrollIntoView ??= () => {};

Object.defineProperties(globalThis, {
  matchMedia: {
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
  },
  ResizeObserver: {
    value: Reflect.get(globalThis, 'ResizeObserver') ?? class ResizeObserverMock {
      observe() {}

      unobserve() {}

      disconnect() {}
    },
    writable: true,
  },
});
