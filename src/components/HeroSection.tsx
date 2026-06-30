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
  badgeText?: string;
  headlineLine1?: string;
  headlineLine1Color?: string;
  headlineLine2?: string;
  headlineLine2Color?: string;
  mobileUrl?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  subtitle?: string;
  subtitleColor?: string;
  url?: string;
}

const DEFAULTS: Required<Omit<HeroContent, 'mobileUrl' | 'url' | 'alt'>> = {
  badgeText: 'Pre-loved fashion',
  primaryCtaLabel: 'Shop Now',
  secondaryCtaLabel: 'Start Selling',
  subtitle: 'Buy and sell authentic pre-owned fashion...',
  subtitleColor: '',
  headlineLine1: 'Style doesn\'t',
  headlineLine1Color: '',
  headlineLine2: 'expire.',
  headlineLine2Color: '',
};

function HeroSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data } = useQuery(getPublicHeroImageOptions());
  const heroContent = data as HeroContent | null | undefined;

const heroImage =
  (isMobile ? heroContent?.mobileUrl || heroContent?.url : heroContent?.url) || heroFallback;
const c = { ...DEFAULTS, ...heroContent };


  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Fashion editorial"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="container relative z-10">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-xl"
        >
          <span className="mb-4 inline-block rounded-sm bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
            {c.badgeText}
          </span>
          <h1 className="
            font-heading text-5xl font-bold leading-tight text-surface-dark-foreground
            md:text-7xl
          "
          >
            <span
              style={c.headlineLine2Color ? { color: c.headlineLine2Color } : undefined}
className={c.headlineLine2Color ? 'italic' : 'italic text-gold'}
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
          <p
            style={c.subtitleColor ? { color: c.subtitleColor } : undefined}
            >
{c.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/listings')}
              size="lg"
              className="gap-2"
            >
              {c.primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate('/create-listing')}
              size="lg"
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
