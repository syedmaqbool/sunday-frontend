
 // Google Analytics 4 helper
export const GA_MEASUREMENT_ID = 'G-7RBJ8C6PD9';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...arguments_: any[]) => void;
  }
}

const analyticsState = {
  initialized: false,
  scriptRequested: false,
};

function getAnalyticsTarget() {
  return globalThis as Window & typeof globalThis;
}

export function initGA() {
  if (analyticsState.initialized || typeof window === 'undefined') {
    return;
  }

  const analyticsTarget = getAnalyticsTarget();

  analyticsTarget.dataLayer = analyticsTarget.dataLayer || [];
  analyticsTarget.gtag =
    analyticsTarget.gtag ||
    function (...arguments_: any[]) {
      analyticsTarget.dataLayer.push(arguments_);
    };

  // Avoid loading an invalid placeholder ID.
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.includes('XXXX')) {
    analyticsState.initialized = true;
    console.warn('[analytics] Replace GA_MEASUREMENT_ID with your real GA4 ID.');
    return;
  }

  // Queue configuration before the external script loads.
  analyticsTarget.gtag('js', new Date());
  analyticsTarget.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  });

  analyticsState.initialized = true;

  const loadScript = () => {
    if (analyticsState.scriptRequested) {
      return;
    }

    analyticsState.scriptRequested = true;

    const script = document.createElement('script');
    script.async = true;
    script.src =
      `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

    document.head.appendChild(script);
  };

  // Let the page's initial resources finish before requesting GA.
  if (document.readyState === 'complete') {
    window.setTimeout(loadScript, 2000);
  } else {
    window.addEventListener(
      'load',
      () => window.setTimeout(loadScript, 2000),
      { once: true },
    );
  }
}

export function trackPageView(path: string, title?: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const browserWindow = document.defaultView;
  if (!browserWindow?.gtag) {
    return;
  }

  browserWindow.gtag('event', 'page_view', {
    page_location: location.href,
    page_path: path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(
  name: string,
  parameters: Record<string, any> = {},
) {
  if (typeof document === 'undefined') {
    return;
  }

  const browserWindow = document.defaultView;
  if (!browserWindow?.gtag) {
    return;
  }

  browserWindow.gtag('event', name, parameters);
}

export function setUser(userId: string | null) {
  if (typeof document === 'undefined') {
    return;
  }

  const browserWindow = document.defaultView;
  if (!browserWindow?.gtag) {
    return;
  }

  browserWindow.gtag('set', {
    user_id: userId ?? undefined,
  });

  if (GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes('XXXX')) {
    browserWindow.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId ?? undefined,
    });
  }
}
