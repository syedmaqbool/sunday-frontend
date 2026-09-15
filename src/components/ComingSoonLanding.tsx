import { Link } from 'react-router-dom';
import comingSoonBanner from '@/assets/comming-soon-banner.png';
import LandingNavbar from '@/components/LandingNavbar';

export default function ComingSoonLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-[#999999] text-white">
      <LandingNavbar navigationDisabled />

      <main className="flex flex-1 items-center overflow-hidden">
        <section className="grid w-full items-center gap-10 px-[6.7vw] py-16 md:min-h-[calc(100vh-10rem)] md:grid-cols-2 md:gap-4 md:py-10 lg:py-16">
          <div className="relative z-10 max-w-3xl md:-translate-y-8">
            <p className="mb-8 inline-flex border border-white/20 bg-[#aab2ca]/70 px-4 py-2 text-sm font-semibold tracking-[0.12em] text-white sm:text-base">
              COMING SOON
            </p>
            <h1 className="max-w-3xl text-[clamp(3.2rem,5.5vw,6.25rem)] font-bold leading-[0.98] tracking-[-0.045em]">
              The Internet&apos;s
              <br />
              Rotating Closet
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-[1.45] text-white/85 sm:text-xl lg:text-[1.65rem]">
              A new kind of fashion marketplace built for pieces that keep moving - discovered, worn, passed on, and found again. Buy what you love. Sell what you&apos;re done with.
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end">
            <img
              src={comingSoonBanner}
              alt="Clothing arranged in a circle with arrows showing them being passed on"
              className="w-full max-w-[50rem] object-contain md:-mr-10 md:-translate-x-24 lg:-mr-20 lg:-translate-x-32"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white/60">
        <div className="flex min-h-20 flex-col items-center justify-between gap-4 px-[3.3vw] py-5 sm:flex-row">
          <p>© 2026 Sunday. All rights reserved.</p>
          <div className="flex items-center gap-7">
            <a className="transition-colors hover:text-white" href="https://www.instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a className="transition-colors hover:text-white" href="https://www.tiktok.com" target="_blank" rel="noreferrer">
              TikTok
            </a>
          </div>
          <div className="flex gap-7">
            <Link
              aria-disabled="true"
              className="transition-colors hover:text-white"
              onClick={event => event.preventDefault()}
              to="/privacy"
            >
              Privacy Policy
            </Link>
            <Link
              aria-disabled="true"
              className="transition-colors hover:text-white"
              onClick={event => event.preventDefault()}
              to="/terms"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
