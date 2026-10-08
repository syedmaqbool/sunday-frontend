import type { HeroImageValue } from '@/types/adminSiteSettings.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Palette, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import heroFallback from '@/assets/hero-fashion.jpg';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { showErrorToast } from '@/lib/errorToast';
import { getUploadedFileUrl } from '@/lib/uploadFile';
import {
  getHeroImageQueryOptions,
  useUpdateHeroImageMutation,
  useUploadFileMutation,
} from '@/queries/siteSettings.query';

const DEFAULTS: HeroImageValue = {
  alt: '',
  badgeIconUrl: '',
  badgeText: 'Pre-loved fashion',
  headlineLine1: 'Style doesn\'t',
  headlineLine1Color: '',
  headlineLine2: 'expire.',
  headlineLine2Color: '',
  mobileUrl: '',
  primaryCtaBg: '',
  primaryCtaLabel: 'Shop Now',
  primaryCtaTextColor: '',
  secondaryCtaBorderColor: '',
  secondaryCtaLabel: 'Start Selling',
  secondaryCtaTextColor: '',
  siteLogoUrl: '',
  subtitle:
    'Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.',
  subtitleColor: '',
  url: '',
};

const heroImageFormSchema = z.object({
  alt: z.string(),
  badgeIconUrl: z.string(),
  badgeText: z.string(),
  headlineLine1: z.string(),
  headlineLine1Color: z.string(),
  headlineLine2: z.string(),
  headlineLine2Color: z.string(),
  mobileUrl: z.string(),
  primaryCtaBg: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaTextColor: z.string(),
  secondaryCtaBorderColor: z.string(),
  secondaryCtaLabel: z.string(),
  secondaryCtaTextColor: z.string(),
  siteLogoUrl: z.string(),
  subtitle: z.string(),
  subtitleColor: z.string(),
  url: z.string(),
});

const COLOR_PALETTE = [
  '#FFFFFF',
  '#000000',
  '#1F2937',
  '#6B7280',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#EC4899',
  '#F43F5E',
  '#C2410C',
  '#B45309',
];

function ColorPicker({ onChange, value }: { onChange: (c: string) => void; value: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Pick color"
          style={value ? { backgroundColor: value, borderColor: value } : undefined}
          type="button"
          className="
            flex h-7 w-7 items-center justify-center rounded-full border-2 border-border shadow-sm transition
            hover:scale-110
            focus:outline-none focus:ring-2 focus:ring-primary/30
          "
        >
          {!value && <Palette className="h-4 w-4 text-muted-foreground" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Text Color</span>
            {value && (
              <button
                onClick={() => onChange('')}
                type="button"
                className="
                  text-xs text-muted-foreground underline
                  hover:text-foreground
                "
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex max-w-[220px] flex-wrap gap-1.5">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                onClick={() => onChange(c)}
                aria-label={`Select ${c}`}
                style={{ background: c }}
                type="button"
                className={`
                  h-6 w-6 rounded border-2 transition
                  ${value.toLowerCase() === c.toLowerCase()
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border'
              }
                `}
              />
            ))}
            <label className="
              flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border bg-muted
              hover:bg-muted/80
            "
            >
              <span className="text-[10px] font-bold leading-none">+</span>
              <input
                onChange={event => onChange(event.target.value)}
                value={value || '#000000'}
                aria-label="Custom color"
                type="color"
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SiteSettings() {
  const desktopInputReference = useRef<HTMLInputElement>(null);
  const mobileInputReference = useRef<HTMLInputElement>(null);
  const badgeInputReference = useRef<HTMLInputElement>(null); // ← NEW
  const [uploading, setUploading] = useState<'badge' | 'desktop' | 'logo' | 'mobile' | null>(null);
  const { data, isError, isLoading, refetch } = useQuery(getHeroImageQueryOptions());
  const form = useForm<HeroImageValue>({
    defaultValues: data ? { ...DEFAULTS, ...data } : DEFAULTS,
    resolver: zodResolver(heroImageFormSchema),
  });
  const [isFormReady, setIsFormReady] = useState(() => data !== undefined);
  const formValues = form.watch();
  const isDirty = form.formState.isDirty;
  const resetForm = form.reset;

  const updateHero = useUpdateHeroImageMutation();
  const uploadAsset = useUploadFileMutation();
  const logoInputReference = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data === undefined) {
      return;
    }

    if (!isDirty) {
      resetForm(data ? { ...DEFAULTS, ...data } : DEFAULTS);
    }

    setIsFormReady(true);
  }, [data, isDirty, resetForm]);

  const save = (next: HeroImageValue) => {
    updateHero.mutate(next, {
      onError: (error: any) => showErrorToast(error, 'Failed to save settings'),
      onSuccess: (response) => {
        const currentValues = form.getValues();
        const valuesMatchSubmitted = Object.entries(next).every(
          ([key, value]) => currentValues[key as keyof HeroImageValue] === value,
        );

        if (valuesMatchSubmitted) {
          form.reset({ ...DEFAULTS, ...response.data.value });
        }

        toast.success('Hero section updated');
      },
    });
  };

  // ← UPDATED: now handles 'badge' variant too
  const handleUpload
    = (variant: 'badge' | 'desktop' | 'logo' | 'mobile') =>
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file)
          return;
        if (file.size > 8 * 1024 * 1024) {
          toast.error('Image must be under 8MB');
          return;
        }
        setUploading(variant);
        try {
          const asset = await uploadAsset.mutateAsync(file);
          const key
            = variant === 'mobile'
              ? 'mobileUrl'
              : variant === 'badge'
                ? 'badgeIconUrl'
                : variant === 'logo'
                  ? 'siteLogoUrl'
                  : 'url';
          const next = { ...form.getValues(), [key]: getUploadedFileUrl(asset) };
          form.setValue(key, getUploadedFileUrl(asset), { shouldDirty: true, shouldValidate: true });
          save(next);
        }
        catch (error: any) {
          showErrorToast(error, 'Upload failed');
        }
        finally {
          setUploading(null);
        }
      };

  const updateValue = (key: keyof HeroImageValue, value: string) =>
    form.setValue(key, value, { shouldDirty: true, shouldValidate: true });

  const loadingContent = (isLoading || !isError) && (
    <div aria-label="Loading site settings" role="status" className="flex justify-center py-8">
      <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Site Settings</h2>
        <p className="text-sm text-muted-foreground">Manage homepage hero image and text.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homepage hero</CardTitle>
          <CardDescription>
            Background image (1920×1080 recommended, max 8MB) and headline text shown on the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <div role="alert" className="flex items-center justify-between gap-4">
              <p className="text-sm text-destructive">
                {isFormReady ? 'Failed to refresh site settings.' : 'Failed to load site settings.'}
              </p>
              <Button onClick={() => void refetch()} type="button" variant="outline">
                Retry
              </Button>
            </div>
          )}
          {isLoading || !isFormReady
            ? loadingContent
            : (
                <form onSubmit={form.handleSubmit(save)} className="space-y-4">
                  {/* ── Banner images ── */}
                  <div className="
                    grid gap-6
                    md:grid-cols-2
                  "
                  >
                    {/* Desktop */}
                    <div className="space-y-2">
                      <Label>Desktop banner</Label>
                      <div className="overflow-hidden rounded-md border border-border">
                        <img
                          src={formValues.url || heroFallback}
                          alt="Desktop hero preview"
                          className="aspect-[16/9] w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input onChange={handleUpload('desktop')} ref={desktopInputReference} accept="image/*" type="file" className="hidden" />
                        <Button onClick={() => desktopInputReference.current?.click()} disabled={uploading === 'desktop'} type="button" className="gap-2">
                          {uploading === 'desktop' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {uploading === 'desktop' ? 'Uploading...' : 'Upload desktop image'}
                        </Button>
                        {formValues.url && (
                          <Button
                            onClick={() => {
                              const n = { ...form.getValues(), url: '' };
                              updateValue('url', '');
                              save(n);
                            }}
                            disabled={updateHero.isPending}
                            type="button"
                            variant="outline"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                      <Controller name="url" control={form.control} render={({ field }) => <Input {...field} placeholder="Or paste a desktop image URL" />} />
                    </div>

                    {/* Mobile */}
                    <div className="space-y-2">
                      <Label>Mobile banner</Label>
                      <div className="overflow-hidden rounded-md border border-border bg-muted">
                        <img
                          src={formValues.mobileUrl || formValues.url || heroFallback}
                          alt="Mobile hero preview"
                          className="aspect-[9/16] max-h-80 w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input onChange={handleUpload('mobile')} ref={mobileInputReference} accept="image/*" type="file" className="hidden" />
                        <Button onClick={() => mobileInputReference.current?.click()} disabled={uploading === 'mobile'} type="button" className="gap-2">
                          {uploading === 'mobile' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {uploading === 'mobile' ? 'Uploading...' : 'Upload mobile image'}
                        </Button>
                        {formValues.mobileUrl && (
                          <Button
                            onClick={() => {
                              const n = { ...form.getValues(), mobileUrl: '' };
                              updateValue('mobileUrl', '');
                              save(n);
                            }}
                            disabled={updateHero.isPending}
                            type="button"
                            variant="outline"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                      <Controller name="mobileUrl" control={form.control} render={({ field }) => <Input {...field} placeholder="Or paste a mobile image URL" />} />
                      <p className="text-xs text-muted-foreground">Falls back to desktop banner if not set. Recommended 1080×1920.</p>
                    </div>
                  </div>

                  {/* ── Text & colour fields ── */}
                  <div className="
                    grid gap-4
                    sm:grid-cols-2
                  "
                  >

                    {/* ── Site Logo ── */}
                    <div className="
                      space-y-3 rounded-md border border-border p-4
                      sm:col-span-2
                    "
                    >
                      <div className="space-y-2">
                        <Label>Site logo (Navbar)</Label>
                        <div className="
                          flex flex-col gap-3
                          sm:flex-row sm:items-center sm:gap-4
                        "
                        >
                          <div className="flex h-12 w-32 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                            {formValues.siteLogoUrl
                              ? <img src={formValues.siteLogoUrl} alt="Site logo" className="h-full w-full object-contain p-1" />
                              : <span className="text-xs text-muted-foreground">No logo</span>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input onChange={handleUpload('logo')} ref={logoInputReference} accept="image/*" type="file" className="hidden" />
                            <Button onClick={() => logoInputReference.current?.click()} disabled={uploading === 'logo'} size="sm" type="button" className="gap-2">
                              {uploading === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              {uploading === 'logo' ? 'Uploading...' : 'Upload logo'}
                            </Button>
                            {formValues.siteLogoUrl && (
                              <Button
                                onClick={() => {
                                  const n = { ...form.getValues(), siteLogoUrl: '' };
                                  updateValue('siteLogoUrl', '');
                                  save(n);
                                }}
                                disabled={updateHero.isPending}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG/SVG transparent background. Falls back to default logo.</p>
                      </div>
                    </div>

                    {/* ── Badge section (icon + text) ── NEW */}
                    <div className="
                      space-y-3 rounded-md border border-border p-4
                      sm:col-span-2
                    "
                    >
                      {/* Badge icon upload */}
                      <div className="space-y-2">
                        <Label>Badge icon (replaces badge text when uploaded)</Label>
                        <div className="
                          flex flex-col gap-3
                          sm:flex-row sm:items-center sm:gap-4
                        "
                        >
                          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                            {formValues.badgeIconUrl
                              ? (
                                  <img src={formValues.badgeIconUrl} alt="Badge icon" className="h-full w-full object-contain" />
                                )
                              : (
                                  <span className="text-xs text-muted-foreground">No icon</span>
                                )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input onChange={handleUpload('badge')} ref={badgeInputReference} accept="image/*" type="file" className="hidden" />
                            <Button onClick={() => badgeInputReference.current?.click()} disabled={uploading === 'badge'} size="sm" type="button" className="gap-2">
                              {uploading === 'badge' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              {uploading === 'badge' ? 'Uploading...' : 'Upload icon'}
                            </Button>
                            {formValues.badgeIconUrl && (
                              <Button
                                onClick={() => {
                                  const n = { ...form.getValues(), badgeIconUrl: '' };
                                  updateValue('badgeIconUrl', '');
                                  save(n);
                                }}
                                disabled={updateHero.isPending}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Remove icon
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG/SVG with transparent background recommended. Max 8MB.</p>
                      </div>

                      {/* Badge text */}
                      <div className="space-y-2">
                        <Label htmlFor="badge">Badge text (used when no icon is uploaded)</Label>
                        <Controller name="badgeText" control={form.control} render={({ field }) => <Input {...field} id="badge" />} />
                      </div>
                    </div>

                    {/* Headline line 1 */}
                    <div className="space-y-2">
                      <Label htmlFor="t1">Headline — line 1</Label>
                      <Controller name="headlineLine1" control={form.control} render={({ field }) => <Input {...field} id="t1" />} />
                      <Controller name="headlineLine1Color" control={form.control} render={({ field }) => <ColorPicker onChange={field.onChange} value={field.value} />} />
                    </div>

                    {/* Headline line 2 */}
                    <div className="space-y-2">
                      <Label htmlFor="t2">Headline — line 2 (italic accent)</Label>
                      <Controller name="headlineLine2" control={form.control} render={({ field }) => <Input {...field} id="t2" />} />
                      <Controller name="headlineLine2Color" control={form.control} render={({ field }) => <ColorPicker onChange={field.onChange} value={field.value} />} />
                    </div>

                    {/* Subtitle */}
                    <div className="
                      space-y-2
                      sm:col-span-2
                    "
                    >
                      <Label htmlFor="sub">Subtitle</Label>
                      <Controller name="subtitle" control={form.control} render={({ field }) => <Textarea {...field} id="sub" rows={3} />} />
                      <Controller name="subtitleColor" control={form.control} render={({ field }) => <ColorPicker onChange={field.onChange} value={field.value} />} />
                    </div>

                    {/* Primary CTA ← NEW: bg + text color pickers */}
                    <div className="space-y-2">
                      <Label htmlFor="cta1">Primary button label</Label>
                      <Controller name="primaryCtaLabel" control={form.control} render={({ field }) => <Input {...field} id="cta1" />} />
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Background</span>
                          <Controller name="primaryCtaBg" control={form.control} render={({ field }) => <ColorPicker onChange={field.onChange} value={field.value} />} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Text</span>
                          <Controller name="primaryCtaTextColor" control={form.control} render={({ field }) => <ColorPicker onChange={field.onChange} value={field.value} />} />
                        </div>
                      </div>
                    </div>

                    {/* Secondary CTA ← NEW: border + text color pickers */}
                    <div className="space-y-2">
                      <Label htmlFor="cta2">Secondary button label</Label>
                      <Controller name="secondaryCtaLabel" control={form.control} render={({ field }) => <Input {...field} id="cta2" />} />
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Border</span>
                          <Controller name="secondaryCtaBorderColor" control={form.control} render={({ field }) => <ColorPicker onChange={field.onChange} value={field.value} />} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Text</span>
                          <Controller name="secondaryCtaTextColor" control={form.control} render={({ field }) => <ColorPicker onChange={field.onChange} value={field.value} />} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button disabled={updateHero.isPending} type="submit">
                      {updateHero.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
                    </Button>
                  </div>
                </form>
              )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SiteSettings;
