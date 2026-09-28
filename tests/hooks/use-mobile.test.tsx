import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

const originalInnerWidth = innerWidth;

function setViewportWidth(width: number) {
  Object.defineProperty(globalThis, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
}

function MobileLabel() {
  return <span>{useIsMobile() ? 'mobile' : 'desktop'}</span>;
}

afterEach(() => {
  setViewportWidth(originalInnerWidth);
});

describe('useIsMobile', () => {
  it('determines the mobile state during the initial render', () => {
    setViewportWidth(767);

    expect(renderToString(<MobileLabel />)).toContain('mobile');

    setViewportWidth(768);
    expect(renderToString(<MobileLabel />)).toContain('desktop');
  });

  it('updates when the viewport crosses the breakpoint', () => {
    setViewportWidth(900);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      setViewportWidth(767);
      dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(true);

    act(() => {
      setViewportWidth(768);
      dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(false);
  });
});
