import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

import styleCasual from "@/assets/style-casual.jpg";
import styleStreetwear from "@/assets/style-streetwear.jpg";
import styleVintage from "@/assets/style-vintage.jpg";
import styleMinimalist from "@/assets/style-minimalist.jpg";
import styleLuxury from "@/assets/style-luxury.jpg";
import styleBohemian from "@/assets/style-bohemian.jpg";

const STYLES = [
  { id: "casual", label: "Casual", image: styleCasual },
  { id: "streetwear", label: "Streetwear", image: styleStreetwear },
  { id: "vintage", label: "Vintage", image: styleVintage },
  { id: "minimalist", label: "Minimalist", image: styleMinimalist },
  { id: "luxury", label: "Luxury", image: styleLuxury },
  { id: "bohemian", label: "Bohemian", image: styleBohemian },
];

const BRANDS = [
  "Nike", "Adidas", "Gucci", "Chanel", "Zara", "H&M",
  "Prada", "Balenciaga", "Levi's", "Acne Studios",
  "The North Face", "Patagonia", "Versace", "Dior",
  "Supreme", "Uniqlo",
];

const FITS = [
  { id: "slim", label: "Slim", desc: "Close to the body" },
  { id: "regular", label: "Regular", desc: "Classic comfortable fit" },
  { id: "relaxed", label: "Relaxed", desc: "Easy, roomy silhouette" },
  { id: "oversized", label: "Oversized", desc: "Extra volume & drape" },
];

const STEPS = ["Style", "Brands", "Fit", "Budget"];

const Preferences = () => {
  const [step, setStep] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFit, setSelectedFit] = useState("regular");
  const [budgetRange, setBudgetRange] = useState([50, 500]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleStyle = (id: string) =>
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const toggleBrand = (brand: string) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  const canProceed = () => {
    if (step === 0) return selectedStyles.length > 0;
    if (step === 1) return selectedBrands.length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      styles: selectedStyles,
      brands: selectedBrands,
      preferred_fit: selectedFit,
      budget_min: budgetRange[0],
      budget_max: budgetRange[1],
      onboarding_completed: true,
    }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferences saved!", description: "Your feed is now personalized." });
      navigate("/");
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <h1 className="font-heading text-lg font-bold text-foreground">
            <Sparkles className="mr-2 inline h-5 w-5 text-primary" />
            Set up your style
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        </div>
        {/* Step indicators */}
        <div className="container flex gap-2 pb-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1 w-full rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  i <= step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="container flex-1 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepWrapper key="style">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                What's your style?
              </h2>
              <p className="mt-1 text-muted-foreground">
                Select all that resonate with you
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                {STYLES.map((s) => {
                  const selected = selectedStyles.includes(s.id);
                  return (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleStyle(s.id)}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-colors ${
                        selected
                          ? "border-primary shadow-lg"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="aspect-[3/4] overflow-hidden">
                        <img
                          src={s.image}
                          alt={s.label}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 font-heading text-lg font-bold text-background">
                        {s.label}
                      </span>
                      {selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary"
                        >
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </StepWrapper>
          )}

          {step === 1 && (
            <StepWrapper key="brands">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Brands you love
              </h2>
              <p className="mt-1 text-muted-foreground">
                Pick your favourites — we'll highlight them in your feed
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {BRANDS.map((brand) => {
                  const selected = selectedBrands.includes(brand);
                  return (
                    <motion.button
                      key={brand}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleBrand(brand)}
                      className={`rounded-full border-2 px-5 py-2.5 text-sm font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-muted-foreground/40"
                      }`}
                    >
                      {selected && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                      {brand}
                    </motion.button>
                  );
                })}
              </div>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper key="fit">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                How do you like the fit?
              </h2>
              <p className="mt-1 text-muted-foreground">
                Your preferred silhouette
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {FITS.map((fit) => {
                  const selected = selectedFit === fit.id;
                  return (
                    <motion.button
                      key={fit.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedFit(fit.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-center transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <div
                        className={`flex h-16 items-center justify-center text-4xl ${
                          selected ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {fit.id === "slim" && "╏"}
                        {fit.id === "regular" && "▯"}
                        {fit.id === "relaxed" && "▭"}
                        {fit.id === "oversized" && "⬜"}
                      </div>
                      <span className="font-heading text-base font-bold text-foreground">
                        {fit.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{fit.desc}</span>
                      {selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                        >
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper key="budget">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Set your budget range
              </h2>
              <p className="mt-1 text-muted-foreground">
                We'll prioritise listings in your price comfort zone
              </p>
              <div className="mx-auto mt-10 max-w-lg space-y-8">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-3xl font-bold text-primary">
                    ${budgetRange[0]}
                  </span>
                  <span className="text-muted-foreground">—</span>
                  <span className="font-heading text-3xl font-bold text-primary">
                    ${budgetRange[1]}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={5000}
                  step={25}
                  value={budgetRange}
                  onValueChange={setBudgetRange}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>$5,000+</span>
                </div>
              </div>
            </StepWrapper>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? "Saving..." : "Finish"}{" "}
              <Sparkles className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -40 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export default Preferences;
