import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import {
  useBoostPackages,
  type BoostPackage,
  type BoostPlacement,
} from "@/hooks/useBoosts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Rocket,
  TrendingUp,
  Sparkles,
  Search,
  Check,
  Loader2,
  CalendarIcon,
  MousePointerClick,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const placementMeta: Record<
  BoostPlacement,
  { label: string; icon: any; color: string }
> = {
  trending: {
    label: "Trending Now",
    icon: TrendingUp,
    color: "text-orange-500",
  },
  for_you: { label: "Picked for You", icon: Sparkles, color: "text-primary" },
  search: { label: "Search & Browse", icon: Search, color: "text-blue-500" },
};

const SUGGESTED_DAILY_RATE: Record<
  Exclude<BoostPlacement, "trending">,
  number
> = {
  for_you: 300,
  search: 200,
};

// Mock estimation rates (per Rs 1 spend)
const RATE_PER_EURO: Record<
  BoostPlacement,
  { impressions: number; clicks: number }
> = {
  trending: { impressions: 420, clicks: 18 },
  for_you: { impressions: 380, clicks: 22 },
  search: { impressions: 300, clicks: 14 },
};

interface Props {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
}

const BoostDialog = ({ listingId, listingTitle, trigger }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Packages tab state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: packages = [], isLoading } = useBoostPackages();

  // Custom campaign tab state
  const [placement, setPlacement] = useState<BoostPlacement>("for_you");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const defaultDays = Math.max(
    1,
    differenceInCalendarDays(addDays(new Date(), 7), new Date()) + 1,
  );
  const dailyRate =
    SUGGESTED_DAILY_RATE[placement as Exclude<BoostPlacement, "trending">] ??
    200;
  const [goal, setGoal] = useState<"impressions" | "clicks">("impressions");

  const days = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const budget = dailyRate * days;
  const dailyBudget = dailyRate;
  const rate = RATE_PER_EURO[placement];
  const estImpressions = Math.round(budget * rate.impressions);
  const estClicks = Math.round(budget * rate.clicks);
  const cpm =
    budget > 0 && estImpressions > 0 ? (budget / estImpressions) * 1000 : 0;
  const cpc = estClicks > 0 ? budget / estClicks : 0;

  const togglePackage = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const packagesTotal = packages
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + Number(p.price), 0);

  const purchasePackages = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const chosen = packages.filter((p) => selected.has(p.id));
      const rows = chosen.map((p) => ({
        listing_id: listingId,
        seller_id: user.id,
        package_id: p.id,
        placement: p.placement,
        starts_at: new Date().toISOString(),
        ends_at: new Date(
          Date.now() + p.duration_days * 24 * 60 * 60 * 1000,
        ).toISOString(),
        price_paid: p.price,
        payment_status: "mock",
      }));
      const { error } = await supabase
        .from("listing_boosts" as any)
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      trackEvent("boost_purchased", {
        listing_id: listingId,
        type: "package",
        value: packagesTotal,
        currency: "PKR",
      });
      toast.success("Boost activated! (Mock payment)");
      queryClient.invalidateQueries({ queryKey: ["my-boosts"] });
      queryClient.invalidateQueries({ queryKey: ["active-boosts"] });
      setSelected(new Set());
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to activate boost"),
  });

  const purchaseCampaign = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (budget <= 0) throw new Error("Budget must be greater than 0");
      if (endDate <= startDate)
        throw new Error("End date must be after start date");
      const { error } = await supabase.from("listing_boosts" as any).insert({
        listing_id: listingId,
        seller_id: user.id,
        package_id: null,
        placement,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        price_paid: budget,
        payment_status: "mock",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      trackEvent("boost_purchased", {
        listing_id: listingId,
        type: "campaign",
        placement,
        value: budget,
        currency: "PKR",
      });
      toast.success("Campaign launched! (Mock payment)");
      queryClient.invalidateQueries({ queryKey: ["my-boosts"] });
      queryClient.invalidateQueries({ queryKey: ["active-boosts"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to launch campaign"),
  });

  const grouped = useMemo(() => {
    const g: Record<BoostPlacement, BoostPackage[]> = {
      trending: [],
      for_you: [],
      search: [],
    };
    for (const p of packages) g[p.placement].push(p);
    return g;
  }, [packages]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1">
            <Rocket className="h-3.5 w-3.5" /> Boost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" /> Boost "{listingTitle}"
          </DialogTitle>
          <DialogDescription>
            Run a custom campaign with your own budget and dates, or pick a
            ready-made package.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="campaign" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaign">Custom Campaign</TabsTrigger>
            <TabsTrigger value="packages">Quick Packages</TabsTrigger>
          </TabsList>

          {/* CUSTOM CAMPAIGN */}
          <TabsContent value="campaign" className="space-y-5 pt-4">
            {/* Placement */}
            <div className="space-y-2">
              <Label>Placement</Label>
              <RadioGroup
                value={placement}
                onValueChange={(v) => setPlacement(v as BoostPlacement)}
                className="grid grid-cols-2 gap-2"
              >
                {(Object.keys(placementMeta) as BoostPlacement[])
                  .filter((p) => p !== "trending")
                  .map((p) => {
                    const M = placementMeta[p];
                    const Icon = M.icon;
                    return (
                      <Label
                        key={p}
                        htmlFor={`pl-${p}`}
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-1.5 rounded-md border border-border bg-background p-3 text-center text-xs transition-all hover:border-primary/50",
                          placement === p && "border-primary bg-primary/5",
                        )}
                      >
                        <RadioGroupItem
                          id={`pl-${p}`}
                          value={p}
                          className="sr-only"
                        />
                        <Icon className={cn("h-4 w-4", M.color)} />
                        <span className="font-medium text-foreground">
                          {M.label}
                        </span>
                      </Label>
                    );
                  })}
              </RadioGroup>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        if (!d) return;
                        setStartDate(d);
                        if (endDate <= d) setEndDate(addDays(d, 7));
                      }}
                      disabled={(d) =>
                        d < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => d && setEndDate(d)}
                      disabled={(d) => d <= startDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Duration:{" "}
              <span className="font-medium text-foreground">
                {days} day{days > 1 ? "s" : ""}
              </span>
            </p>

            {/* Goal */}
            <div className="space-y-2">
              <Label>Optimize for</Label>
              <RadioGroup
                value={goal}
                onValueChange={(v) => setGoal(v as any)}
                className="grid grid-cols-2 gap-2"
              >
                <Label
                  htmlFor="g-imp"
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm transition-all hover:border-primary/50",
                    goal === "impressions" && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem
                    id="g-imp"
                    value="impressions"
                    className="sr-only"
                  />
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Impressions</span>
                </Label>
                <Label
                  htmlFor="g-clk"
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm transition-all hover:border-primary/50",
                    goal === "clicks" && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem
                    id="g-clk"
                    value="clicks"
                    className="sr-only"
                  />
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Clicks</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Budget (fixed by placement) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Total budget</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Fixed Rs {dailyRate}/day for{" "}
                    {placementMeta[placement].label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Rs {budget.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Rs {dailyRate} × {days} day{days > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Estimates */}
            <Card className="bg-muted/30 p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                Estimated reach
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className={cn(goal === "impressions" && "text-primary")}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> Impressions
                  </div>
                  <p className="font-heading text-2xl font-bold">
                    {estImpressions.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    CPM ≈ Rs {cpm.toFixed(2)}
                  </p>
                </div>
                <div className={cn(goal === "clicks" && "text-primary")}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MousePointerClick className="h-3.5 w-3.5" /> Clicks
                  </div>
                  <p className="font-heading text-2xl font-bold">
                    {estClicks.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    CPC ≈ Rs {cpc.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Estimates based on recent {placementMeta[placement].label}{" "}
                performance.
              </p>
            </Card>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  You'll be charged
                </p>
                <p className="font-heading text-2xl font-bold text-foreground">
                  Rs {budget.toFixed(2)}
                </p>
              </div>
              <Button
                disabled={purchaseCampaign.isPending || budget <= 0}
                onClick={() => purchaseCampaign.mutate()}
                className="gap-1"
              >
                {purchaseCampaign.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Launch Campaign (Mock)
              </Button>
            </div>
          </TabsContent>

          {/* PACKAGES */}
          <TabsContent value="packages" className="space-y-4 pt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              (Object.keys(grouped) as BoostPlacement[])
                .filter((p) => p !== "trending")
                .map((p) => {
                  const items = grouped[p];
                  if (items.length === 0) return null;
                  const M = placementMeta[p];
                  const Icon = M.icon;
                  return (
                    <div key={p}>
                      <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                        <Icon className={cn("h-4 w-4", M.color)} /> {M.label}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map((pkg) => {
                          const isSelected = selected.has(pkg.id);
                          return (
                            <Card
                              key={pkg.id}
                              onClick={() => togglePackage(pkg.id)}
                              className={cn(
                                "cursor-pointer p-3 transition-all hover:border-primary/50",
                                isSelected && "border-primary bg-primary/5",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {pkg.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {pkg.duration_days} days
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <Badge variant="secondary">
                                    Rs {Number(pkg.price).toFixed(2)}
                                  </Badge>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Total ({selected.size} selected)
                </p>
                <p className="font-heading text-2xl font-bold text-foreground">
                  Rs {packagesTotal.toFixed(2)}
                </p>
              </div>
              <Button
                disabled={selected.size === 0 || purchasePackages.isPending}
                onClick={() => purchasePackages.mutate()}
                className="gap-1"
              >
                {purchasePackages.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Activate Boost (Mock)
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="-mt-1 text-center text-[11px] text-muted-foreground">
          Mock mode — no real payment is taken. Stripe will be enabled once your
          country is configured.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default BoostDialog;
