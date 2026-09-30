import type { BoostPackage, BoostPlacement } from '@/hooks/useBoosts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { showErrorToast } from '@/lib/errorToast';
import { cn } from '@/lib/utilities';
import {
  useBoostWithCampaignMutation,
  useBoostWithPackageMutation,
} from '@/queries/clientBoost.query';

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

const campaignSchema = z.object({
  endDate: z.date(),
  goal: z.enum(['clicks', 'impressions']),
  placement: z.enum(['FOR_YOU', 'SEARCH']),
  startDate: z.date(),
}).superRefine(({ endDate, startDate }, context) => {
  if (endDate <= startDate) {
    context.addIssue({
      path: ['endDate'],
      code: z.ZodIssueCode.custom,
      message: 'End date must be after start date',
    });
  }
  if (startDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    context.addIssue({
      path: ['startDate'],
      code: z.ZodIssueCode.custom,
      message: 'Start date cannot be in the past',
    });
  }
});

const packageSelectionSchema = z.object({
  packageIds: z.array(z.string()).min(1, 'Select at least one package'),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;
type PackageSelectionFormValues = z.infer<typeof packageSelectionSchema>;

interface Props {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
}

function BoostDialog({ listingId, listingTitle, trigger }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [initialCampaignDates] = useState(() => {
    const startDate = new Date();
    return { endDate: addDays(startDate, 7), startDate };
  });

  const packageForm = useForm<PackageSelectionFormValues>({
    defaultValues: { packageIds: [] },
    resolver: zodResolver(packageSelectionSchema),
  });
  const { data: packagesResponse, isLoading } = useQuery(getBoostPackagesOptions());
  const packages = useMemo(() => packagesResponse?.data ?? [], [packagesResponse?.data]);

  const campaignForm = useForm<CampaignFormValues>({
    defaultValues: {
      ...initialCampaignDates,
      goal: 'impressions',
      placement: 'FOR_YOU',
    },
    resolver: zodResolver(campaignSchema),
  });
  const [placement, startDate, endDate, goal] = campaignForm.watch([
    'placement',
    'startDate',
    'endDate',
    'goal',
  ]);
  const selected = packageForm.watch('packageIds');
  const dailyRate
    = SUGGESTED_DAILY_RATE[placement] ?? 200;

  const days = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const budget = dailyRate * days;
  const rate = RATE_PER_EURO[placement];
  const estImpressions = Math.round(budget * rate.impressions);
  const estClicks = Math.round(budget * rate.clicks);
  const cpm
    = budget > 0 && estImpressions > 0 ? (budget / estImpressions) * 1000 : 0;
  const cpc = estClicks > 0 ? budget / estClicks : 0;

  const packagesTotal = packages
    .filter(p => selected.includes(p.id))
    .reduce((sum, p) => sum + Number(p.price), 0);

  const purchasePackages = useBoostWithPackageMutation();
  const purchaseCampaign = useBoostWithCampaignMutation();

  const launchCampaign = ({ endDate: campaignEndDate, placement: campaignPlacement, startDate: campaignStartDate }: CampaignFormValues) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }
    purchaseCampaign.mutate(
      {
        listingId,
        paymentStatus: 'MOCK',
        placement: campaignPlacement,
        endsAt: campaignEndDate.toISOString(),
        startsAt: campaignStartDate.toISOString(),
      },
      {
        onError: (error: any) => showErrorToast(error, 'Failed to launch campaign'),
        onSuccess: () => {
          trackEvent('boost_purchased', {
            currency: 'PKR',
            listing_id: listingId,
            placement: campaignPlacement,
            type: 'campaign',
            value: budget,
          });
          toast.success('Campaign launched! (Mock payment)');
          setOpen(false);
        },
      },
    );
  };

  const purchaseSelectedPackages = ({ packageIds }: PackageSelectionFormValues) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }
    purchasePackages.mutate(
      { listingId, packageIds, paymentStatus: 'MOCK' },
      {
        onError: (error: any) => showErrorToast(error, 'Failed to activate boost'),
        onSuccess: () => {
          trackEvent('boost_purchased', {
            currency: 'PKR',
            listing_id: listingId,
            type: 'package',
            value: packagesTotal,
          });
          toast.success('Boost activated! (Mock payment)');
          packageForm.reset({ packageIds: [] });
          setOpen(false);
        },
      },
    );
  };

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
          <TabsContent value="campaign" className="pt-4">
            <form
              onSubmit={campaignForm.handleSubmit(launchCampaign, () => toast.error('Please check the campaign dates'))}
              className="space-y-5"
            >
              {/* Placement */}
              <div className="space-y-2">
                <Label>Placement</Label>
                <Controller
                  name="placement"
                  control={campaignForm.control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
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
                                field.value === p && 'border-primary bg-primary/5',
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
                  )}
                />
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Controller
                    name="startDate"
                    control={campaignForm.control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(field.value, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            onSelect={(d) => {
                              if (!d)
                                return;
                              field.onChange(d);
                              if (endDate <= d)
                                campaignForm.setValue('endDate', addDays(d, 7));
                            }}
                            disabled={d =>
                              d < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            mode="single"
                            selected={field.value}
                            className={cn('pointer-events-auto p-3')}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Controller
                    name="endDate"
                    control={campaignForm.control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(field.value, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            onSelect={field.onChange}
                            disabled={d => d <= startDate}
                            initialFocus
                            mode="single"
                            selected={field.value}
                            className={cn('pointer-events-auto p-3')}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
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
                <Controller
                  name="goal"
                  control={campaignForm.control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-2"
                    >
                      <Label
                        htmlFor="g-imp"
                        className={cn(
                          `
                            flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm transition-all
                            hover:border-primary/50
                          `,
                          field.value === 'impressions' && 'border-primary bg-primary/5',
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
                          field.value === 'clicks' && 'border-primary bg-primary/5',
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
                  )}
                />
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
                  disabled={purchaseCampaign.isPending || budget <= 0}
                  type="submit"
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
            </form>
          </TabsContent>

          {/* PACKAGES */}
          <TabsContent value="packages" className="pt-4">
            <form
              onSubmit={packageForm.handleSubmit(purchaseSelectedPackages, () => toast.error('Select at least one package'))}
              className="space-y-4"
            >
              <Controller
                name="packageIds"
                control={packageForm.control}
                render={({ field }) => (
                  <div className="space-y-4">
                    {isLoading
                      ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )
                      : (Object.keys(grouped) as BoostPlacement[])
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
                                    const isSelected = field.value.includes(package_.id);
                                    return (
                                      <Card
                                        key={package_.id}
                                        onClick={() => field.onChange(
                                          isSelected
                                            ? field.value.filter(id => id !== package_.id)
                                            : [...field.value, package_.id],
                                        )}
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
                          })}
                  </div>
                )}
              />

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total (
                    {selected.length}
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
                  disabled={selected.length === 0 || purchasePackages.isPending}
                  type="submit"
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
            </form>
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
