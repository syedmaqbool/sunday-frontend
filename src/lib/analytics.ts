// Google Analytics 4 helper
// Replace the placeholder Measurement ID below with your real G-XXXXXXXXXX value.
export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...arguments_: any[]) => void;
  }
}

const analyticsState = {
  initialized: false,
};

function getAnalyticsTarget() {
  return globalThis as Window & typeof globalThis;
}

export function initGA() {
  if (analyticsState.initialized)
    return;
  if (typeof window === 'undefined')
    return;
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.includes('XXXX')) {
    // Still set up dataLayer so calls don't break; just don't load script.
    const analyticsTarget = getAnalyticsTarget();
    analyticsTarget.dataLayer = analyticsTarget.dataLayer || [];
    analyticsTarget.gtag = (...arguments_: any[]) => {
      analyticsTarget.dataLayer.push(arguments_);
    };
    analyticsState.initialized = true;

    console.warn('[analytics] GA placeholder in use; replace GA_MEASUREMENT_ID in src/lib/analytics.ts');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.append(script);

  const analyticsTarget = getAnalyticsTarget();
  analyticsTarget.dataLayer = analyticsTarget.dataLayer || [];
  analyticsTarget.gtag = (...arguments_: any[]) => {
    analyticsTarget.dataLayer.push(arguments_);
  };
  analyticsTarget.gtag('js', new Date());
  analyticsTarget.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
  analyticsState.initialized = true;
}

export function trackPageView(path: string, title?: string) {
  if (typeof document === 'undefined')
    return;
  const browserWindow = document.defaultView;
  if (browserWindow === null || !browserWindow.gtag)
    return;
  browserWindow.gtag('event', 'page_view', {
    page_location: location.href,
    page_path: path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(name: string, parameters: Record<string, any> = {}) {
  if (typeof document === 'undefined')
    return;
  const browserWindow = document.defaultView;
  if (browserWindow === null || !browserWindow.gtag)
    return;
  browserWindow.gtag('event', name, parameters);
}

export function setUser(userId: string | null) {
  if (typeof document === 'undefined')
    return;
  const browserWindow = document.defaultView;
  if (browserWindow === null || !browserWindow.gtag)
    return;
  browserWindow.gtag('set', { user_id: userId ?? undefined });
  if (GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes('XXXX')) {
    browserWindow.gtag('config', GA_MEASUREMENT_ID, { user_id: userId ?? undefined });
  }
}
