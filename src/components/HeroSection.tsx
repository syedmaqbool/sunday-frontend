import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroFallback from "@/assets/hero-fashion.jpg";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

type HeroContent = {
  url?: string;
  mobile_url?: string;
  badge?: string;
  title_line1?: string;
  title_line2?: string;
  subtitle?: string;
  primary_cta?: string;
  secondary_cta?: string;
  title_line1_color?: string;
  title_line2_color?: string;
  subtitle_color?: string;
};

const DEFAULTS: Required<Omit<HeroContent, "url">> = {
  badge: "Pre-loved fashion",
  title_line1: "Style doesn't",
  title_line2: "expire.",
  subtitle:
    "Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.",
  primary_cta: "Shop Now",
  secondary_cta: "Start Selling",
  title_line1_color: "",
  title_line2_color: "",
  subtitle_color: "",
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["hero_image"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_image")
        .maybeSingle();
      return (data?.value as HeroContent | null) ?? null;
    },
    staleTime: 60_000,
  });

  const heroImage = data?.url || heroFallback;
  const c = { ...DEFAULTS, ...(data || {}) };

  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Fashion editorial" className="h-full w-full object-cover" />
      </div>

      <div className="container relative z-10">
        <motion.div
          className="max-w-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="mb-4 inline-block rounded-sm bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
            {c.badge}
          </span>
          <h1 className="font-heading text-5xl font-bold leading-tight text-surface-dark-foreground md:text-7xl">
            <span style={c.title_line1_color ? { color: c.title_line1_color } : undefined}>{c.title_line1}</span>
            <br />
            <span
              className={c.title_line2_color ? "italic" : "italic text-gold"}
              style={c.title_line2_color ? { color: c.title_line2_color } : undefined}
            >
              {c.title_line2}
            </span>
          </h1>
          <p
            className="mt-5 max-w-md text-base leading-relaxed text-surface-dark-foreground/80"
            style={c.subtitle_color ? { color: c.subtitle_color } : undefined}
          >
            {c.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" onClick={() => navigate("/listings")}>
              {c.primary_cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-surface-dark-foreground/30 bg-transparent text-surface-dark-foreground hover:bg-surface-dark-foreground/10"
              onClick={() => navigate("/create-listing")}
            >
              {c.secondary_cta}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
