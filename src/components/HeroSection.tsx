import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroFallback from '@/assets/hero-fashion.jpg';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { getPublicHeroImageOptions } from '@/queries/siteSettings.query';

interface HeroContent {
  alt?: string;
  badgeIconUrl?: string;
  badgeText?: string;
  headlineLine1?: string;
  headlineLine1Color?: string;
  headlineLine2?: string;
  headlineLine2Color?: string;
  mobileUrl?: string;
  primaryCtaBg?: string;
  primaryCtaLabel?: string;
  primaryCtaTextColor?: string;
  secondaryCtaBorderColor?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTextColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  url?: string;
}

const DEFAULTS: Required<Omit<HeroContent, 'alt' | 'badgeIconUrl' | 'mobileUrl' | 'url'>> = {
  badgeText: 'Pre-loved fashion',
  headlineLine1: 'Style doesn\'t',
  headlineLine1Color: '',
  headlineLine2: 'expire.',
  headlineLine2Color: '',
  primaryCtaBg: '',
  primaryCtaLabel: 'Shop Now',
  primaryCtaTextColor: '',
  secondaryCtaBorderColor: '',
  secondaryCtaLabel: 'Start Selling',
  secondaryCtaTextColor: '',
  subtitle: 'Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.',
  subtitleColor: '',
};

// Invalid URL guard — sirf base URL reject karo
function isValidUrl(url?: string) {
  return !!url && !/^https?:\/\/[^/]+\/?$/.test(url);
}

function HeroSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data } = useQuery(getPublicHeroImageOptions());

  // Empty strings aur invalid URLs filter karo
  const cleaned = Object.fromEntries(
    Object.entries(data ?? {}).filter(([_, v]) => {
      if (!v || v === '')
        return false;
      return !(typeof v === 'string' && /^https?:\/\/[^/]+\/?$/.test(v));
    }),
  ) as HeroContent;

  const c = { ...DEFAULTS, ...cleaned };

  const heroImage = (isMobile && isValidUrl(cleaned.mobileUrl) ? cleaned.mobileUrl : isValidUrl(cleaned.url) ? cleaned.url : null
  ) ?? heroFallback;

  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={cleaned.alt || 'Fashion editorial'}
          className="h-full w-full object-cover transition-opacity duration-500"
        />
      </div>

      <div className="container relative z-10">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-xl"
        >
          {/* ← Old UI: icon as image ya text as inline span */}
          {isValidUrl(c.badgeIconUrl)
            ? (
                <img
                  src={c.badgeIconUrl}
                  alt={c.badgeText || 'Badge'}
                  className="mb-4 h-12 w-auto object-contain"
                />
              )
            : c.badgeText?.trim() && (
              <span className="mb-4 inline-block rounded-sm bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                {c.badgeText}
              </span>
            )}

          <h1 className="
            font-heading text-5xl font-bold leading-tight text-surface-dark-foreground
            md:text-7xl
          "
          >
            <span
              style={c.headlineLine1Color ? { color: c.headlineLine1Color } : undefined}
              className={c.headlineLine1Color ? '' : 'text-gold'}
            >
              {c.headlineLine1}
            </span>
            <br />
            <span
              style={c.headlineLine2Color ? { color: c.headlineLine2Color } : undefined}
              className={c.headlineLine2Color ? 'italic' : 'italic text-gold'}
            >
              {c.headlineLine2}
            </span>
          </h1>

          {/* ← Old UI: mt-5 max-w-md text-lg leading-relaxed */}
          <p
            style={c.subtitleColor ? { color: c.subtitleColor } : undefined}
            className="mt-5 max-w-md whitespace-pre-wrap text-lg leading-relaxed text-surface-dark-foreground/80"
          >
            {c.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/listings')}
              size="lg"
              style={{
                ...(c.primaryCtaBg && { backgroundColor: c.primaryCtaBg, borderColor: c.primaryCtaBg }),
                ...(c.primaryCtaTextColor && { color: c.primaryCtaTextColor }),
              }}
              className="gap-2"
            >
              {c.primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => navigate('/create-listing')}
              size="lg"
              style={{
                ...(c.secondaryCtaBorderColor && { borderColor: c.secondaryCtaBorderColor }),
                ...(c.secondaryCtaTextColor && { color: c.secondaryCtaTextColor }),
              }}
              variant="outline"
              className="
                border-surface-dark-foreground/30 bg-transparent text-surface-dark-foreground
                hover:bg-surface-dark-foreground/10
              "
            >
              {c.secondaryCtaLabel}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
