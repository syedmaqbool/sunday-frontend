// Google Analytics 4 helper
// Replace the placeholder Measurement ID below with your real G-XXXXXXXXXX value.
export const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let initialized = false;

export const initGA = () => {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.includes("XXXX")) {
    // Still set up dataLayer so calls don't break; just don't load script.
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    initialized = true;
    // eslint-disable-next-line no-console
    console.info("[analytics] GA placeholder in use; replace GA_MEASUREMENT_ID in src/lib/analytics.ts");
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
  initialized = true;
};

export const trackPageView = (path: string, title?: string) => {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  });
};

export const trackEvent = (name: string, params: Record<string, any> = {}) => {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
};

export const setUser = (userId: string | null) => {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("set", { user_id: userId ?? undefined });
  if (GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes("XXXX")) {
    window.gtag("config", GA_MEASUREMENT_ID, { user_id: userId ?? undefined });
  }
};
