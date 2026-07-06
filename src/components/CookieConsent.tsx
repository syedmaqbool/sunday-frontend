import { Cookie, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'sunday_cookie_consent';

function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // slight delay so it doesn't flash before the page renders
        const t = setTimeout(setVisible, 400, true);
        return () => clearTimeout(t);
      }
    }
    catch {
      setVisible(true);
    }
  }, []);

  const setConsent = (value: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: new Date().toISOString(), value }),
      );
    }
    catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible)
    return null;

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
        <div className="
          hidden shrink-0 rounded-full bg-muted p-2
          sm:block
        "
        >
          <Cookie className="h-5 w-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold">We use cookies</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sunday uses cookies to keep you signed in, remember your preferences and understand
            how the site is used. See our
            {' '}
            <Link to="/cookies" className="underline">Cookie Policy</Link>
            {' '}
            and
            {' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>
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
