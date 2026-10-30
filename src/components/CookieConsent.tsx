import { Cookie, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  trackPageView,
  updateAnalyticsConsent,
} from '@/lib/analytics';

function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
      if (stored) return;

      const timeout = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timeout);
    } catch {
      setVisible(true);
    }
  }, []);

  const setConsent = (value: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(
        ANALYTICS_CONSENT_STORAGE_KEY,
        JSON.stringify({
          date: new Date().toISOString(),
          value,
        }),
      );
    } catch {
      // Continue with this page's consent choice if storage is unavailable.
    }

    const accepted = value === 'accepted';
    updateAnalyticsConsent(accepted);

    if (accepted) {
      trackPageView(location.pathname + location.search);
    }

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      aria-label="Cookie consent"
      aria-live="polite"
      role="dialog"
      className="
        fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur
        md:p-5
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            hidden shrink-0 rounded-full bg-muted p-2
            sm:block
          "
        >
          <Cookie className="h-5 w-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold">We use cookies</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sunday uses cookies to keep you signed in, remember your preferences and understand how
            the site is used. See our{' '}
            <Link to="/cookies" className="underline">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setConsent('accepted')} size="sm">
              Accept all
            </Button>
            <Button onClick={() => setConsent('rejected')} size="sm" variant="outline">
              Reject non-essential
            </Button>
          </div>
        </div>
        <button
          onClick={() => setConsent('rejected')}
          aria-label="Dismiss cookie banner"
          type="button"
          className="
            shrink-0 rounded-md p-1 text-muted-foreground
            hover:bg-muted hover:text-foreground
          "
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default CookieConsent;
