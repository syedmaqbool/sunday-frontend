import type { HeroImageValue } from '@/types/admin/site-settings';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Palette, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  getHeroImageQueryOptions,
  useUpdateHeroImage,
  useUploadFile,
} from '@/queries/useSiteSettings';

const DEFAULTS: HeroImageValue = {
  alt: '',
  badgeText: 'Pre-loved fashion',
  headlineLine1: 'Style doesn\'t',
  headlineLine1Color: '',
  headlineLine2: 'expire.',
  headlineLine2Color: '',
  mobileUrl: '',
  primaryCtaLabel: 'Shop Now',
  secondaryCtaLabel: 'Start Selling',
  subtitle:
    'Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.',
  subtitleColor: '',
  url: '',
};

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

function ColorPicker({
  onChange,
  value,
}: {
  onChange: (c: string) => void;
  value: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Pick color"
          style={
            value ? { backgroundColor: value, borderColor: value } : undefined
          }
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
            <span className="text-xs font-medium text-muted-foreground">
              Text color
            </span>
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
                  ${
              value.toLowerCase() === c.toLowerCase()
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
  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);
  const [form, setForm] = useState<HeroImageValue>({ ...DEFAULTS });

  const { data, isLoading } = useQuery(getHeroImageQueryOptions());
  const updateHero = useUpdateHeroImage();
  const uploadAsset = useUploadFile();

  useEffect(() => {
    setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const save = (next: HeroImageValue) => {
    updateHero.mutate(next, {
      onError: (error: any) => toast.error(error.message || 'Failed to save'),
      onSuccess: () => toast.success('Hero section updated'),
    });
  };

  const handleUpload
    = (variant: 'desktop' | 'mobile') =>
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
          const key = variant === 'mobile' ? 'mobileUrl' : 'url';
          const next = { ...form, [key]: asset.url };
          setForm(next);
          save(next);
        }
        catch (error: any) {
          toast.error(error.message || 'Upload failed');
        }
        finally {
          setUploading(null);
        }
      };

  const update
    = (k: keyof HeroImageValue) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: event.target.value }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Site Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage homepage hero image and text.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homepage hero</CardTitle>
          <CardDescription>
            Background image (1920×1080 recommended, max 8MB) and headline text
            shown on the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading
            ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )
            : (
                <>
                  <div className="
                    grid gap-6
                    md:grid-cols-2
                  "
                  >
                    <div className="space-y-2">
                      <Label>Desktop banner</Label>
                      <div className="overflow-hidden rounded-md border border-border">
                        <img
                          src={form.url || heroFallback}
                          alt="Desktop hero preview"
                          className="aspect-[16/9] w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input
                          onChange={handleUpload('desktop')}
                          ref={desktopInputReference}
                          accept="image/*"
                          type="file"
                          className="hidden"
                        />
                        <Button
                          onClick={() => desktopInputReference.current?.click()}
                          disabled={uploading === 'desktop'}
                          className="gap-2"
                        >
                          {uploading === 'desktop'
                            ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )
                            : (
                                <Upload className="h-4 w-4" />
                              )}
                          {uploading === 'desktop'
                            ? 'Uploading...'
                            : 'Upload desktop image'}
                        </Button>
                        {form.url && (
                          <Button
                            onClick={() => {
                              const next = { ...form, url: '' };
                              setForm(next);
                              save(next);
                            }}
                            disabled={updateHero.isPending}
                            variant="outline"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input
                        onChange={update('url')}
                        value={form.url ?? ''}
                        placeholder="Or paste a desktop image URL"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Mobile banner</Label>
                      <div className="overflow-hidden rounded-md border border-border bg-muted">
                        <img
                          src={form.mobileUrl || form.url || heroFallback}
                          alt="Mobile hero preview"
                          className="aspect-[9/16] max-h-80 w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input
                          onChange={handleUpload('mobile')}
                          ref={mobileInputReference}
                          accept="image/*"
                          type="file"
                          className="hidden"
                        />
                        <Button
                          onClick={() => mobileInputReference.current?.click()}
                          disabled={uploading === 'mobile'}
                          className="gap-2"
                        >
                          {uploading === 'mobile'
                            ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )
                            : (
                                <Upload className="h-4 w-4" />
                              )}
                          {uploading === 'mobile'
                            ? 'Uploading...'
                            : 'Upload mobile image'}
                        </Button>
                        {form.mobileUrl && (
                          <Button
                            onClick={() => {
                              const next = { ...form, mobileUrl: '' };
                              setForm(next);
                              save(next);
                            }}
                            disabled={updateHero.isPending}
                            variant="outline"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input
                        onChange={update('mobileUrl')}
                        value={form.mobileUrl ?? ''}
                        placeholder="Or paste a mobile image URL"
                      />
                      <p className="text-xs text-muted-foreground">
                        Falls back to desktop banner if not set. Recommended
                        1080×1920.
                      </p>
                    </div>
                  </div>

                  <div className="
                    grid gap-4
                    sm:grid-cols-2
                  "
                  >
                    <div className="
                      space-y-2
                      sm:col-span-2
                    "
                    >
                      <Label htmlFor="badge">Badge</Label>
                      <Input
                        id="badge"
                        onChange={update('badgeText')}
                        value={form.badgeText ?? ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t1">Headline — line 1</Label>
                      <Input
                        id="t1"
                        onChange={update('headlineLine1')}
                        value={form.headlineLine1 ?? ''}
                      />
                      <ColorPicker
                        onChange={c =>
                          setForm(f => ({ ...f, headlineLine1Color: c }))}
                        value={form.headlineLine1Color ?? ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t2">Headline — line 2 (italic accent)</Label>
                      <Input
                        id="t2"
                        onChange={update('headlineLine2')}
                        value={form.headlineLine2 ?? ''}
                      />
                      <ColorPicker
                        onChange={c =>
                          setForm(f => ({ ...f, headlineLine2Color: c }))}
                        value={form.headlineLine2Color ?? ''}
                      />
                    </div>
                    <div className="
                      space-y-2
                      sm:col-span-2
                    "
                    >
                      <Label htmlFor="sub">Subtitle</Label>
                      <Textarea
                        id="sub"
                        onChange={update('subtitle')}
                        value={form.subtitle ?? ''}
                        rows={3}
                      />
                      <ColorPicker
                        onChange={c =>
                          setForm(f => ({ ...f, subtitleColor: c }))}
                        value={form.subtitleColor ?? ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cta1">Primary button label</Label>
                      <Input
                        id="cta1"
                        onChange={update('primaryCtaLabel')}
                        value={form.primaryCtaLabel ?? ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cta2">Secondary button label</Label>
                      <Input
                        id="cta2"
                        onChange={update('secondaryCtaLabel')}
                        value={form.secondaryCtaLabel ?? ''}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => save(form)}
                      disabled={updateHero.isPending}
                    >
                      {updateHero.isPending
                        ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )
                        : (
                            'Save changes'
                          )}
                    </Button>
                  </div>
                </>
              )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SiteSettings;
