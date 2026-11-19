import '@testing-library/jest-dom/vitest';

if (!Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => {},
  });
}

// jsdom reports every programmatic link navigation as "Not implemented: navigation". Those are
// harmless in these tests, and the message hid real output, so only that message is suppressed.
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (String(args[0]).includes('Not implemented: navigation')) return;
  consoleError(...args);
};

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
    value:
      Reflect.get(globalThis, 'ResizeObserver') ??
      class ResizeObserverMock {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    writable: true,
  },
});
