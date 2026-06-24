import { Smartphone, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileAppBanner = () => (
  <section className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl bg-[#0f0f12] shadow-2xl">
    {/* Decorative background glows — warm terracotta/gold tones */}
    <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />

    <div className="relative flex flex-col items-center justify-between gap-8 px-8 py-10 md:flex-row md:px-16 md:py-14">
      {/* Left content: icon and text */}
      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:gap-8 md:text-left">
        {/* Glass-effect icon */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 shadow-inner ring-1 ring-white/10">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/20 to-primary/20 opacity-50" />
          <Smartphone className="relative h-10 w-10 text-surface-dark-foreground" />
          {/* Notification dot */}
          <span className="absolute top-4 right-4 h-3 w-3 rounded-full bg-gold shadow-[0_0_12px_rgba(212,160,86,0.8)]" />
        </div>

        <div className="max-w-xl space-y-3">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
            Sunday Mobile App
          </h2>
          <p className="text-base leading-relaxed text-surface-dark-foreground/70 md:text-lg">
            Shop pre-loved fashion on the go. Get notified about new drops,
            offers, and messages — all from your pocket.
          </p>
        </div>
      </div>

      {/* CTA button */}
      <div className="shrink-0">
        <Button className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-white px-8 py-5 text-sm font-semibold text-black transition-all hover:bg-gray-100 hover:ring-8 hover:ring-white/10 active:scale-95">
          <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
          <span className="tracking-wide">Coming Soon</span>
        </Button>
      </div>
    </div>

    {/* Bottom accent gradient line */}
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
  </section>
);

export default MobileAppBanner;
