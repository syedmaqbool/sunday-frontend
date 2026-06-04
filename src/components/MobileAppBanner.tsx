import { Smartphone, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileAppBanner = () => (
  <section className="bg-surface-dark py-12 text-surface-dark-foreground">
    <div className="container flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Smartphone className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-semibold">
            Sunday Mobile App
          </h3>
          <p className="mt-1 max-w-md text-sm text-surface-dark-foreground/70">
            Shop pre-loved fashion on the go. Get notified about new drops, offers, and messages — all from your pocket.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="border-surface-dark-foreground/30 bg-transparent text-surface-dark-foreground hover:bg-surface-dark-foreground/10"
      >
        <Bell className="mr-2 h-4 w-4" />
        Coming Soon
      </Button>
    </div>
  </section>
);

export default MobileAppBanner;
