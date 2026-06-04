import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroFallback from "@/assets/hero-fashion.jpg";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const navigate = useNavigate();
  const { data: heroUrl } = useQuery({
    queryKey: ["hero_image"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_image")
        .maybeSingle();
      const v = data?.value as { url?: string } | null;
      return v?.url || null;
    },
    staleTime: 60_000,
  });
  const heroImage = heroUrl || heroFallback;

  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Fashion editorial" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 via-surface-dark/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <motion.div
          className="max-w-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="mb-4 inline-block rounded-sm bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
            Pre-loved fashion
          </span>
          <h1 className="font-heading text-5xl font-bold leading-tight text-surface-dark-foreground md:text-7xl">
            Style doesn't
            <br />
            <span className="italic text-gold">expire.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-surface-dark-foreground/80">
            Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate("/listings")}
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-surface-dark-foreground/30 bg-transparent text-surface-dark-foreground hover:bg-surface-dark-foreground/10"
              onClick={() => navigate("/create-listing")}
            >
              Start Selling
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
