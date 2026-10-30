export const GA_MEASUREMENT_ID = 'G-7RBJ8C6PD9';
export const ANALYTICS_CONSENT_STORAGE_KEY = 'sunday_cookie_consent';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let initialized = false;
let analyticsConsentGranted = false;
let currentUserId: string | null = null;

function hasStoredAnalyticsConsent() {
  try {
    const storedConsent = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (!storedConsent) return false;

    const consent = JSON.parse(storedConsent) as { value?: unknown };
    return consent.value === 'accepted';
  } catch {
    return false;
  }
}

export function initGA() {
  if (typeof window === 'undefined' || initialized) return;

  analyticsConsentGranted = hasStoredAnalyticsConsent();

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function (...args: any[]) {
      window.dataLayer.push(args);
    };

  window.gtag('consent', 'default', {
    analytics_storage: analyticsConsentGranted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.onerror = () => console.error('[GA4] Script loading failed');
  document.head.appendChild(script);

  initialized = true;
}

export function updateAnalyticsConsent(accepted: boolean) {
  if (typeof window === 'undefined') return;

  initGA();
  analyticsConsentGranted = accepted;

  window.gtag('consent', 'update', {
    analytics_storage: accepted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('set', { user_id: accepted ? (currentUserId ?? undefined) : undefined });
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag || !analyticsConsentGranted) return;

  window.gtag('event', 'page_view', {
    page_location: window.location.origin + path,
    page_path: path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(name: string, parameters: Record<string, any> = {}) {
  if (typeof window === 'undefined' || !window.gtag || !analyticsConsentGranted) return;

  window.gtag('event', name, parameters);
}

export function setUser(userId: string | null) {
  currentUserId = userId;

  if (typeof window === 'undefined' || !window.gtag || !analyticsConsentGranted) return;

  window.gtag('set', { user_id: userId ?? undefined });
}
