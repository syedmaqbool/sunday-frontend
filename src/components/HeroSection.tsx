import { useQuery } from '@tanstack/react-query';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroFallback from '@/assets/hero-fashion.jpg';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { getPublicHeroImageOptions } from '@/queries/siteSettings.query';

interface HeroContent {
  badge?: string;
  mobile_url?: string;
  primary_cta?: string;
  secondary_cta?: string;
  subtitle?: string;
  subtitle_color?: string;
  title_line1?: string;
  title_line1_color?: string;
  title_line2?: string;
  title_line2_color?: string;
  url?: string;
}

const DEFAULTS: Required<Omit<HeroContent, 'mobile_url' | 'url'>> = {
  badge: 'Pre-loved fashion',
  primary_cta: 'Shop Now',
  secondary_cta: 'Start Selling',
  subtitle:
    'Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.',
  subtitle_color: '',
  title_line1: 'Style doesn\'t',
  title_line1_color: '',
  title_line2: 'expire.',
  title_line2_color: '',
};

function HeroSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data } = useQuery(getPublicHeroImageOptions());
  const heroContent = data as HeroContent | null | undefined;

  const heroImage
    = (isMobile
      ? heroContent?.mobile_url || heroContent?.url
      : heroContent?.url) || heroFallback;
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
            {c.badge}
          </span>
          <h1 className="
            font-heading text-5xl font-bold leading-tight text-surface-dark-foreground
            md:text-7xl
          "
          >
            <span
              style={
                c.title_line1_color ? { color: c.title_line1_color } : undefined
              }
            >
              {c.title_line1}
            </span>
            <br />
            <span
              style={
                c.title_line2_color ? { color: c.title_line2_color } : undefined
              }
              className={c.title_line2_color ? 'italic' : 'italic text-gold'}
            >
              {c.title_line2}
            </span>
          </h1>
          <p
            style={c.subtitle_color ? { color: c.subtitle_color } : undefined}
            className="mt-5 max-w-md text-base leading-relaxed text-surface-dark-foreground/80"
          >
            {c.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/listings')}
              size="lg"
              className="gap-2"
            >
              {c.primary_cta}
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
              {c.secondary_cta}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
