import type { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gem,
  Globe,
  Landmark,

  Search,
  Shirt,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

import { useAuth } from '@/contexts/AuthContext';

// Naye TanStack Hooks ka centralized  import 👇
import {
  getBackendBrandsOptions,
  getBackendCategoriesOptions,
  getPreferencesOptions,
  useSavePreferences,
} from '@/queries/buyer/userBuyerPreferences';

// Static static styles config (as UI labels matching backend expectations)
const STYLES: { id: string; desc: string; icon: LucideIcon; label: string }[]
  = [
    {
      id: 'eastern',
      desc: 'Traditional & cultural elegance',
      icon: Landmark,
      label: 'Eastern',
    },
    {
      id: 'western',
      desc: 'Classic contemporary fashion',
      icon: Globe,
      label: 'Western',
    },
    {
      id: 'casual',
      desc: 'Laid-back everyday wear',
      icon: Sun,
      label: 'Casual',
    },
    {
      id: 'formal',
      desc: 'Premium & elegant attire',
      icon: Gem,
      label: 'Formal',
    },
    {
      id: 'semi_formal',
      desc: 'Smart yet relaxed style',
      icon: Shirt,
      label: 'Semi Formal',
    },
  ];

const FITS = [
  { id: 'slim', desc: 'Close to the body', label: 'Slim' },
  { id: 'regular', desc: 'Classic comfortable fit', label: 'Regular' },
  { id: 'relaxed', desc: 'Easy, roomy silhouette', label: 'Relaxed' },
  { id: 'oversized', desc: 'Extra volume & drape', label: 'Oversized' },
];

const STEPS = ['Category', 'Style', 'Brands', 'Fit', 'Budget'];

function Preferences() {
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFit, setSelectedFit] = useState('regular');
  const [budgetRange, setBudgetRange] = useState([50, 500]);
  const [brandSearch, setBrandSearch] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  // ── 1. TANSTACK QUERIES CALLS ─────────────────────────────────────────────
  // Signup ke baad page load hote hi background mein saara data aik sath fetch hoga
  const { data: savedPrefs, isLoading: loadingPrefs } = useQuery(
    getPreferencesOptions(),
  );
  const { data: categories = [], isLoading: loadingCats } = useQuery(
    getBackendCategoriesOptions(),
  );
  const { data: brands = [], isLoading: loadingBrands } = useQuery(
    getBackendBrandsOptions(),
  );
  const isLoadingPreferences = loadingPrefs || loadingCats || loadingBrands;

  // Save preferences mutation hook
  const { isPending: saving, mutate: savePreferences } = useSavePreferences();

  // ── 2. PRE-FILL EFFECT FOR RETURNING USERS ─────────────────────────────────
  useEffect(() => {
    if (!savedPrefs) {
      return;
    }

    setSelectedCategories(savedPrefs.categories || []);
    setSelectedStyles(savedPrefs.styles || []);
    setSelectedBrands(savedPrefs.brands || []);
    setSelectedFit(savedPrefs.preferredFit || 'regular');
    setBudgetRange([savedPrefs.budgetMin || 50, savedPrefs.budgetMax || 500]);
  }, [savedPrefs]);

  // ── 3. SEARCH FILTERED BRANDS ──────────────────────────────────────────────
  const filteredBrands = useMemo(
    () =>
      brands.filter(b =>
        b.name.toLowerCase().includes(brandSearch.toLowerCase()),
      ),
    [brands, brandSearch],
  );

  // ── 4. TOGGLE LOGICS ───────────────────────────────────────────────────────
  const toggleCategory = (value: string) =>
    setSelectedCategories(previous =>
      previous.includes(value) ? previous.filter(c => c !== value) : [...previous, value],
    );

  const toggleStyle = (id: string) =>
    setSelectedStyles(previous =>
      previous.includes(id) ? previous.filter(s => s !== id) : [...previous, id],
    );

  const toggleBrand = (brandName: string) =>
    setSelectedBrands(previous =>
      previous.includes(brandName)
        ? previous.filter(b => b !== brandName)
        : [...previous, brandName],
    );

  // Validation before allowing the user to click 'Continue'
  const canProceed = () => {
    if (step === 0)
      return selectedCategories.length > 0;
    if (step === 1)
      return selectedStyles.length > 0;
    if (step === 2)
      return selectedBrands.length > 0;
    return true;
  };

  // ── 5. FINISH & PUT PAYLOAD HANDLER ────────────────────────────────────────
  const handleFinish = () => {
    if (!user)
      return;

    // Naye backend API spec key-names ke mutabik direct payload execute hoga
    savePreferences({
      brands: selectedBrands,
      budgetMax: budgetRange[1],
      budgetMin: budgetRange[0],
      categories: selectedCategories,
      onboardingCompleted: true,
      preferredFit: selectedFit,
      styles: selectedStyles,
    });
  };

  return (
    isLoadingPreferences
      ? (
          <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Personalizing your profile experience...
            </p>
          </div>
        )
      : (
          <div className="flex min-h-screen flex-col bg-background">
            {/* Progress Top Bar */}
            <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
              <div className="container flex items-center justify-between py-4">
                <h1 className="font-heading text-lg font-bold text-foreground">
                  <Sparkles className="mr-2 inline h-5 w-5 text-primary" />
                  Set up your style
                </h1>
                <button
                  onClick={() => navigate('/')}
                  className="
                    text-sm text-muted-foreground
                    hover:text-foreground
                  "
                >
                  Skip for now
                </button>
              </div>
              {/* Step Indicators */}
              <div className="container flex gap-2 pb-3">
                {STEPS.map((s, index) => (
                  <div key={s} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`
                        h-1 w-full rounded-full transition-colors
                        ${index <= step ? 'bg-primary' : 'bg-muted'}
                      `}
                    />
                    <span
                      className={`
                        text-xs font-medium
                        ${index <= step ? 'text-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps Render Core Container */}
            <main className="container flex-1 py-8">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <StepWrapper key="category">
                    <h2 className="
                      font-heading text-2xl font-bold text-foreground
                      md:text-3xl
                    "
                    >
                      What are you shopping for?
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Pick the categories you're interested in
                    </p>
                    <div className="
                      mt-6 grid grid-cols-2 gap-4
                      md:grid-cols-3
                    "
                    >
                      {categories.map((c) => {
                        const selected = selectedCategories.includes(c.value);
                        return (
                          <motion.button
                            key={c.id}
                            onClick={() => toggleCategory(c.value)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`
                              relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-colors
                              ${
                          selected
                            ? 'border-primary bg-primary/5 shadow-lg'
                            : `
                              border-border bg-card
                              hover:border-muted-foreground/30
                            `
                          }
                            `}
                          >
                            {/* Backend handles icon as emoji string structure */}
                            <div
                              className={`
                                flex h-14 w-14 items-center justify-center rounded-full text-3xl
                                ${selected ? 'bg-primary/10' : 'bg-muted'}
                              `}
                            >
                              {c.icon}
                            </div>
                            <span className="font-heading text-base font-bold text-foreground">
                              {c.label}
                            </span>
                            {selected && (
                              <motion.div
                                animate={{ scale: 1 }}
                                initial={{ scale: 0 }}
                                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
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

                {step === 1 && (
                  <StepWrapper key="style">
                    <h2 className="
                      font-heading text-2xl font-bold text-foreground
                      md:text-3xl
                    "
                    >
                      What's your style?
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Select all that resonate with you
                    </p>
                    <div className="
                      mt-6 grid grid-cols-2 gap-4
                      md:grid-cols-3
                    "
                    >
                      {STYLES.map((s) => {
                        const selected = selectedStyles.includes(s.id);
                        const Icon = s.icon;
                        return (
                          <motion.button
                            key={s.id}
                            onClick={() => toggleStyle(s.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`
                              relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-colors
                              ${
                          selected
                            ? 'border-primary bg-primary/5 shadow-lg'
                            : `
                              border-border bg-card
                              hover:border-muted-foreground/30
                            `
                          }
                            `}
                          >
                            <div
                              className={`
                                flex h-14 w-14 items-center justify-center rounded-full
                                ${selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                              `}
                            >
                              <Icon className="h-7 w-7" />
                            </div>
                            <span className="font-heading text-base font-bold text-foreground">
                              {s.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {s.desc}
                            </span>
                            {selected && (
                              <motion.div
                                animate={{ scale: 1 }}
                                initial={{ scale: 0 }}
                                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
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

                {step === 2 && (
                  <StepWrapper key="brands">
                    <h2 className="
                      font-heading text-2xl font-bold text-foreground
                      md:text-3xl
                    "
                    >
                      Brands you love
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Pick your favourites — we'll highlight them in your feed
                    </p>
                    <div className="relative mx-auto mt-6 max-w-md">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        onChange={event => setBrandSearch(event.target.value)}
                        value={brandSearch}
                        placeholder="Search brands..."
                        className="pl-9"
                      />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {filteredBrands.length === 0
                        ? (
                            <p className="text-sm text-muted-foreground">
                              No brands match your search.
                            </p>
                          )
                        : (
                            filteredBrands.map((brand) => {
                              const selected = selectedBrands.includes(brand.name);
                              return (
                                <motion.button
                                  key={brand.id}
                                  onClick={() => toggleBrand(brand.name)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`
                                    rounded-full border-2 px-5 py-2.5 text-sm font-medium transition-colors
                                    ${
                                selected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : `
                                    border-border bg-card text-foreground
                                    hover:border-muted-foreground/40
                                  `
                                }
                                  `}
                                >
                                  {selected && (
                                    <Check className="mr-1.5 inline h-3.5 w-3.5" />
                                  )}
                                  {brand.name}
                                </motion.button>
                              );
                            })
                          )}
                    </div>
                  </StepWrapper>
                )}

                {step === 3 && (
                  <StepWrapper key="fit">
                    <h2 className="
                      font-heading text-2xl font-bold text-foreground
                      md:text-3xl
                    "
                    >
                      How do you like the fit?
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Your preferred silhouette
                    </p>
                    <div className="
                      mt-6 grid grid-cols-2 gap-4
                      md:grid-cols-4
                    "
                    >
                      {FITS.map((fit) => {
                        const isSelected = selectedFit === fit.id;
                        return (
                          <motion.button
                            key={fit.id}
                            onClick={() => setSelectedFit(fit.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`
                              flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-center transition-colors
                              ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : `
                              border-border bg-card
                              hover:border-muted-foreground/30
                            `
                          }
                            `}
                          >
                            <div
                              className={`
                                flex h-16 items-center justify-center text-4xl
                                ${isSelected ? 'text-primary' : 'text-muted-foreground'}
                              `}
                            >
                              {fit.id === 'slim' && '╏'}
                              {fit.id === 'regular' && '▯'}
                              {fit.id === 'relaxed' && '▭'}
                              {fit.id === 'oversized' && '⬜'}
                            </div>
                            <span className="font-heading text-base font-bold text-foreground">
                              {fit.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {fit.desc}
                            </span>
                            {isSelected && (
                              <motion.div
                                animate={{ scale: 1 }}
                                initial={{ scale: 0 }}
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

                {step === 4 && (
                  <StepWrapper key="budget">
                    <h2 className="
                      font-heading text-2xl font-bold text-foreground
                      md:text-3xl
                    "
                    >
                      Set your budget range
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      We'll prioritise listings in your price comfort zone
                    </p>
                    <div className="mx-auto mt-10 max-w-lg space-y-8">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-3xl font-bold text-primary">
                          $
                          {budgetRange[0]}
                        </span>
                        <span className="text-muted-foreground">—</span>
                        <span className="font-heading text-3xl font-bold text-primary">
                          $
                          {budgetRange[1]}
                        </span>
                      </div>
                      <Slider
                        onValueChange={setBudgetRange}
                        value={budgetRange}
                        max={5000}
                        min={0}
                        step={25}
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

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-md">
              <div className="container flex items-center justify-between py-4">
                <Button
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                  variant="ghost"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {' '}
                  Back
                </Button>
                {step < STEPS.length - 1
                  ? (
                      <Button
                        onClick={() => setStep(s => s + 1)}
                        disabled={!canProceed()}
                      >
                        Continue
                        {' '}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )
                  : (
                      <Button onClick={handleFinish} disabled={saving}>
                        {saving ? 'Saving...' : 'Finish'}
                        {' '}
                        <Sparkles className="ml-1 h-4 w-4" />
                      </Button>
                    )}
              </div>
            </div>
          </div>
        )
  );
}

// Ab (sahi — sirf motion wrapper, loading check nahi):
function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      initial={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export default Preferences;
