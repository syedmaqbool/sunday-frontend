import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "sunday_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // slight delay so it doesn't flash before the page renders
        const t = setTimeout(() => setVisible(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const setConsent = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, date: new Date().toISOString() })
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="hidden shrink-0 rounded-full bg-muted p-2 sm:block">
          <Cookie className="h-5 w-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold">We use cookies</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sunday uses cookies to keep you signed in, remember your preferences and understand
            how the site is used. See our{" "}
            <Link to="/cookies" className="underline">Cookie Policy</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setConsent("accepted")}>
              Accept all
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConsent("rejected")}>
              Reject non-essential
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConsent("rejected")}
          aria-label="Dismiss cookie banner"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
