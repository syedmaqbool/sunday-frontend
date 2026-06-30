import type { BoostPackage, BoostPlacement } from '@/hooks/useBoosts';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import {
  CalendarIcon,
  Check,
  Eye,
  Loader2,
  MousePointerClick,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getBoostPackagesOptions } from '@/hooks/useBoosts';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utilities';
import {
  boostWithCampaign,
  boostWithPackage,
} from '@/services/clientBoost.service';

const placementMeta: Record<
  BoostPlacement,
  { color: string; icon: any; label: string }
> = {
  FOR_YOU: { color: 'text-primary', icon: Sparkles, label: 'Picked for You' },
  SEARCH: { color: 'text-blue-500', icon: Search, label: 'Search & Browse' },
  TRENDING: {
    color: 'text-orange-500',
    icon: TrendingUp,
    label: 'Trending Now',
  },
};

const SUGGESTED_DAILY_RATE: Record<
  Exclude<BoostPlacement, 'TRENDING'>,
  number
> = {
  FOR_YOU: 300,
  SEARCH: 200,
};

// Mock estimation rates (per Rs 1 spend)
const RATE_PER_EURO: Record<
  BoostPlacement,
  { clicks: number; impressions: number }
> = {
  FOR_YOU: { clicks: 22, impressions: 380 },
  SEARCH: { clicks: 14, impressions: 300 },
  TRENDING: { clicks: 18, impressions: 420 },
};

interface Props {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
}

function BoostDialog({ listingId, listingTitle, trigger }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Packages tab state
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const { data: packages = [], isLoading } = useQuery(getBoostPackagesOptions());

  // Custom campaign tab state
  const [placement, setPlacement] = useState<BoostPlacement>('FOR_YOU');
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date>(() => addDays(new Date(), 7));
  const dailyRate
    = SUGGESTED_DAILY_RATE[placement as Exclude<BoostPlacement, 'TRENDING'>]
      ?? 200;
  const [goal, setGoal] = useState<'clicks' | 'impressions'>('impressions');

  const days = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const budget = dailyRate * days;
  const rate = RATE_PER_EURO[placement];
  const estImpressions = Math.round(budget * rate.impressions);
  const estClicks = Math.round(budget * rate.clicks);
  const cpm
    = budget > 0 && estImpressions > 0 ? (budget / estImpressions) * 1000 : 0;
  const cpc = estClicks > 0 ? budget / estClicks : 0;

  const togglePackage = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id))
        next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const packagesTotal = packages
    .filter(p => selected.has(p.id))
    .reduce((sum, p) => sum + Number(p.price), 0);

  const purchasePackages = useMutation({
    mutationFn: async () => {
      if (!user)
        throw new Error('Not authenticated');
      await boostWithPackage(listingId, {
        packageIds: [...selected],
        paymentStatus: 'MOCK',
      });
    },
    onError: (error: any) => toast.error(error.message ?? 'Failed to activate boost'),
    onSuccess: () => {
      trackEvent('boost_purchased', {
        currency: 'PKR',
        listing_id: listingId,
        type: 'package',
        value: packagesTotal,
      });
      toast.success('Boost activated! (Mock payment)');
      queryClient.invalidateQueries({ queryKey: ['my-boosts'] });
      queryClient.invalidateQueries({ queryKey: ['active-boosts'] });
      setSelected(new Set());
      setOpen(false);
    },
  });

  const purchaseCampaign = useMutation({
    mutationFn: async () => {
      if (!user)
        throw new Error('Not authenticated');
      if (budget <= 0)
        throw new Error('Budget must be greater than 0');
      if (endDate <= startDate)
        throw new Error('End date must be after start date');
      await boostWithCampaign(listingId, {
        paymentStatus: 'MOCK',
        placement: placement as 'FOR_YOU' | 'SEARCH',
        endsAt: endDate.toISOString(),
        startsAt: startDate.toISOString(),
      });
    },
    onError: (error: any) => toast.error(error.message ?? 'Failed to launch campaign'),
    onSuccess: () => {
      trackEvent('boost_purchased', {
        currency: 'PKR',
        listing_id: listingId,
        placement,
        type: 'campaign',
        value: budget,
      });
      toast.success('Campaign launched! (Mock payment)');
      queryClient.invalidateQueries({ queryKey: ['my-boosts'] });
      queryClient.invalidateQueries({ queryKey: ['active-boosts'] });
      setOpen(false);
    },
  });

  const grouped = useMemo(() => {
    const g: Record<BoostPlacement, BoostPackage[]> = {
      FOR_YOU: [],
      SEARCH: [],
      TRENDING: [],
    };
    for (const p of packages) g[p.placement].push(p);
    return g;
  }, [packages]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1">
            <Rocket className="h-3.5 w-3.5" />
            {' '}
            Boost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-2xl">
            <Rocket className="h-5 w-5 text-primary" />
            {' '}
            Boost "
            {listingTitle}
            "
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
                onValueChange={v => setPlacement(v as BoostPlacement)}
                value={placement}
                className="grid grid-cols-2 gap-2"
              >
                {(Object.keys(placementMeta) as BoostPlacement[])
                  .filter(p => p !== 'TRENDING')
                  .map((p) => {
                    const M = placementMeta[p];
                    const Icon = M.icon;
                    return (
                      <Label
                        key={p}
                        htmlFor={`pl-${p}`}
                        className={cn(
                          `
                            flex cursor-pointer flex-col items-center gap-1.5 rounded-md border border-border bg-background p-3 text-center text-xs transition-all
                            hover:border-primary/50
                          `,
                          placement === p && 'border-primary bg-primary/5',
                        )}
                      >
                        <RadioGroupItem
                          id={`pl-${p}`}
                          value={p}
                          className="sr-only"
                        />
                        <Icon className={cn('h-4 w-4', M.color)} />
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
                      {format(startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      onSelect={(d) => {
                        if (!d)
                          return;
                        setStartDate(d);
                        if (endDate <= d)
                          setEndDate(addDays(d, 7));
                      }}
                      disabled={d =>
                        d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      mode="single"
                      selected={startDate}
                      className={cn('pointer-events-auto p-3')}
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
                      {format(endDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      onSelect={d => d && setEndDate(d)}
                      disabled={d => d <= startDate}
                      initialFocus
                      mode="single"
                      selected={endDate}
                      className={cn('pointer-events-auto p-3')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Duration:
              {' '}
              <span className="font-medium text-foreground">
                {days}
                {' '}
                day
                {days > 1 ? 's' : ''}
              </span>
            </p>

            {/* Goal */}
            <div className="space-y-2">
              <Label>Optimize for</Label>
              <RadioGroup
                onValueChange={v => setGoal(v as any)}
                value={goal}
                className="grid grid-cols-2 gap-2"
              >
                <Label
                  htmlFor="g-imp"
                  className={cn(
                    `
                      flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm transition-all
                      hover:border-primary/50
                    `,
                    goal === 'impressions' && 'border-primary bg-primary/5',
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
                    `
                      flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm transition-all
                      hover:border-primary/50
                    `,
                    goal === 'clicks' && 'border-primary bg-primary/5',
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
                    Fixed Rs
                    {' '}
                    {dailyRate}
                    /day for
                    {' '}
                    {placementMeta[placement].label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Rs
                    {' '}
                    {budget.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Rs
                    {' '}
                    {dailyRate}
                    {' '}
                    ×
                    {' '}
                    {days}
                    {' '}
                    day
                    {days > 1 ? 's' : ''}
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
                <div className={cn(goal === 'impressions' && 'text-primary')}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {' '}
                    Impressions
                  </div>
                  <p className="font-heading text-2xl font-bold">
                    {estImpressions.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    CPM ≈ Rs
                    {' '}
                    {cpm.toFixed(2)}
                  </p>
                </div>
                <div className={cn(goal === 'clicks' && 'text-primary')}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    {' '}
                    Clicks
                  </div>
                  <p className="font-heading text-2xl font-bold">
                    {estClicks.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    CPC ≈ Rs
                    {' '}
                    {cpc.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Estimates based on recent
                {' '}
                {placementMeta[placement].label}
                {' '}
                performance.
              </p>
            </Card>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  You'll be charged
                </p>
                <p className="font-heading text-2xl font-bold text-foreground">
                  Rs
                  {' '}
                  {budget.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={() => purchaseCampaign.mutate()}
                disabled={purchaseCampaign.isPending || budget <= 0}
                className="gap-1"
              >
                {purchaseCampaign.isPending
                  ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )
                  : (
                      <Rocket className="h-4 w-4" />
                    )}
                Launch Campaign (Mock)
              </Button>
            </div>
          </TabsContent>

          {/* PACKAGES */}
          <TabsContent value="packages" className="space-y-4 pt-4">
            {isLoading
              ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )
              : (
                  (Object.keys(grouped) as BoostPlacement[])
                    .filter(p => p !== 'TRENDING')
                    .map((p) => {
                      const items = grouped[p];
                      if (items.length === 0)
                        return null;
                      const M = placementMeta[p];
                      const Icon = M.icon;
                      return (
                        <div key={p}>
                          <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                            <Icon className={cn('h-4 w-4', M.color)} />
                            {' '}
                            {M.label}
                          </h3>
                          <div className="
                            grid gap-2
                            sm:grid-cols-2
                          "
                          >
                            {items.map((package_) => {
                              const isSelected = selected.has(package_.id);
                              return (
                                <Card
                                  key={package_.id}
                                  onClick={() => togglePackage(package_.id)}
                                  className={cn(
                                    `
                                      cursor-pointer p-3 transition-all
                                      hover:border-primary/50
                                    `,
                                    isSelected && 'border-primary bg-primary/5',
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground">
                                        {package_.name}
                                      </p>
                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                        {package_.durationDays}
                                        {' '}
                                        days
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      <Badge variant="secondary">
                                        Rs
                                        {' '}
                                        {Number(package_.price).toFixed(2)}
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
                  Total (
                  {selected.size}
                  {' '}
                  selected)
                </p>
                <p className="font-heading text-2xl font-bold text-foreground">
                  Rs
                  {' '}
                  {packagesTotal.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={() => purchasePackages.mutate()}
                disabled={selected.size === 0 || purchasePackages.isPending}
                className="gap-1"
              >
                {purchasePackages.isPending
                  ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )
                  : (
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
}

export default BoostDialog;
