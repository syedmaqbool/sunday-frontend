import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";

// Naye TanStack Hooks ka centralized import 👇
import { 
  useGetPreferences, 
  useBackendCategories, 
  useBackendBrands, 
  useSavePreferences 
} from "@/queries/buyer/userBuyerPreferences";

import { Check, ChevronRight, ChevronLeft, Sparkles, Sun, Gem, Landmark, Globe, Shirt, Search, type LucideIcon } from "lucide-react";

// Static static styles config (as UI labels matching backend expectations)
const STYLES: { id: string; label: string; icon: LucideIcon; desc: string }[] = [
  { id: "eastern", label: "Eastern", icon: Landmark, desc: "Traditional & cultural elegance" },
  { id: "western", label: "Western", icon: Globe, desc: "Classic contemporary fashion" },
  { id: "casual", label: "Casual", icon: Sun, desc: "Laid-back everyday wear" },
  { id: "formal", label: "Formal", icon: Gem, desc: "Premium & elegant attire" },
  { id: "semi_formal", label: "Semi Formal", icon: Shirt, desc: "Smart yet relaxed style" },
];

const FITS = [
  { id: "slim", label: "Slim", desc: "Close to the body" },
  { id: "regular", label: "Regular", desc: "Classic comfortable fit" },
  { id: "relaxed", label: "Relaxed", desc: "Easy, roomy silhouette" },
  { id: "oversized", label: "Oversized", desc: "Extra volume & drape" },
];

const STEPS = ["Category", "Style", "Brands", "Fit", "Budget"];

const Preferences = () => {
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFit, setSelectedFit] = useState("regular");
  const [budgetRange, setBudgetRange] = useState([50, 500]);
  const [brandSearch, setBrandSearch] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  // ── 1. TANSTACK QUERIES CALLS ─────────────────────────────────────────────
  // Signup ke baad page load hote hi background mein saara data aik sath fetch hoga
  const { data: savedPrefs, isLoading: loadingPrefs } = useGetPreferences();
  const { data: categories = [], isLoading: loadingCats } = useBackendCategories();
  const { data: brands = [], isLoading: loadingBrands } = useBackendBrands();
  
  // Save preferences mutation hook
  const { mutate: savePreferences, isPending: saving } = useSavePreferences();

  // ── 2. PRE-FILL EFFECT FOR RETURNING USERS ─────────────────────────────────
  useEffect(() => {
    if (savedPrefs) {
      setSelectedCategories(savedPrefs.categories || []);
      setSelectedStyles(savedPrefs.styles || []);
      setSelectedBrands(savedPrefs.brands || []);
      setSelectedFit(savedPrefs.preferredFit || "regular");
      setBudgetRange([savedPrefs.budgetMin || 50, savedPrefs.budgetMax || 500]);
    }
  }, [savedPrefs]);

  // ── 3. SEARCH FILTERED BRANDS ──────────────────────────────────────────────
  const filteredBrands = useMemo(
    () => brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase())),
    [brands, brandSearch]
  );

  // ── 4. TOGGLE LOGICS ───────────────────────────────────────────────────────
  const toggleCategory = (value: string) =>
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );

  const toggleStyle = (id: string) =>
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const toggleBrand = (brandName: string) =>
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );

  // Validation before allowing the user to click 'Continue'
  const canProceed = () => {
    if (step === 0) return selectedCategories.length > 0;
    if (step === 1) return selectedStyles.length > 0;
    if (step === 2) return selectedBrands.length > 0;
    return true;
  };

  // ── 5. FINISH & PUT PAYLOAD HANDLER ────────────────────────────────────────
  const handleFinish = () => {
    if (!user) return;
    
    // Naye backend API spec key-names ke mutabik direct payload execute hoga
    savePreferences({
      categories: selectedCategories,
      styles: selectedStyles,
      brands: selectedBrands,
      preferredFit: selectedFit,
      budgetMin: budgetRange[0],
      budgetMax: budgetRange[1],
      onboardingCompleted: true,
    });
  };

  // ── 6. GLOBAL LOADING SKELETON / SCREEN ────────────────────────────────────
  if (loadingPrefs || loadingCats || loadingBrands) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-3">
        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground font-medium">Personalizing your profile experience...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress Top Bar */}
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
        {/* Step Indicators */}
        <div className="container flex gap-2 pb-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`text-xs font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps Render Core Container */}
      <main className="container flex-1 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepWrapper key="category">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">What are you shopping for?</h2>
              <p className="mt-1 text-muted-foreground">Pick the categories you're interested in</p>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                {categories.map((c) => {
                  const selected = selectedCategories.includes(c.value);
                  return (
                    <motion.button
                      key={c.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleCategory(c.value)}
                      className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-colors ${
                        selected ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      {/* Backend handles icon as emoji string structure */}
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl ${selected ? "bg-primary/10" : "bg-muted"}`}>{c.icon}</div>
                      <span className="font-heading text-base font-bold text-foreground">{c.label}</span>
                      {selected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </StepWrapper>
          )}

          {step === 1 && (
            <StepWrapper key="style">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">What's your style?</h2>
              <p className="mt-1 text-muted-foreground">Select all that resonate with you</p>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                {STYLES.map((s) => {
                  const selected = selectedStyles.includes(s.id);
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleStyle(s.id)}
                      className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-colors ${
                        selected ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><Icon className="h-7 w-7" /></div>
                      <span className="font-heading text-base font-bold text-foreground">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.desc}</span>
                      {selected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper key="brands">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Brands you love</h2>
              <p className="mt-1 text-muted-foreground">Pick your favourites — we'll highlight them in your feed</p>
              <div className="relative mx-auto mt-6 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} placeholder="Search brands..." className="pl-9" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {filteredBrands.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No brands match your search.</p>
                ) : filteredBrands.map((brand) => {
                  const selected = selectedBrands.includes(brand.name);
                  return (
                    <motion.button
                      key={brand.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleBrand(brand.name)}
                      className={`rounded-full border-2 px-5 py-2.5 text-sm font-medium transition-colors ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-muted-foreground/40"
                      }`}
                    >
                      {selected && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                      {brand.name}
                    </motion.button>
                  );
                })}
              </div>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper key="fit">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">How do you like the fit?</h2>
              <p className="mt-1 text-muted-foreground">Your preferred silhouette</p>
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
                        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`flex h-16 items-center justify-center text-4xl ${selected ? "text-primary" : "text-muted-foreground"}`}>
                        {fit.id === "slim" && "╏"}
                        {fit.id === "regular" && "▯"}
                        {fit.id === "relaxed" && "▭"}
                        {fit.id === "oversized" && "⬜"}
                      </div>
                      <span className="font-heading text-base font-bold text-foreground">{fit.label}</span>
                      <span className="text-xs text-muted-foreground">{fit.desc}</span>
                      {selected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </StepWrapper>
          )}

          {step === 4 && (
            <StepWrapper key="budget">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Set your budget range</h2>
              <p className="mt-1 text-muted-foreground">We'll prioritise listings in your price comfort zone</p>
              <div className="mx-auto mt-10 max-w-lg space-y-8">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-3xl font-bold text-primary">${budgetRange[0]}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="font-heading text-3xl font-bold text-primary">${budgetRange[1]}</span>
                </div>
                <Slider min={0} max={5000} step={25} value={budgetRange} onValueChange={setBudgetRange} className="py-4" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>$5,000+</span>
                </div>
              </div>
            </StepWrapper>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Action Footer */}
      <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? "Saving..." : "Finish"} <Sparkles className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
    {children}
  </motion.div>
);

export default Preferences;