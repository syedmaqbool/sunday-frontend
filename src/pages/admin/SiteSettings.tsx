import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Palette } from "lucide-react";
import heroFallback from "@/assets/hero-fashion.jpg";
import {
  getHeroImageQueryOptions,
  useUpdateHeroImage,
  useUploadSiteAsset,
} from "@/queries/useSiteSettings";
import type { HeroImageValue } from "@/types/admin/site-settings";

const DEFAULTS: HeroImageValue = {
  url: "",
  mobileUrl: "",
  alt: "",
  badgeText: "Pre-loved fashion",
  headlineLine1: "Style doesn't",
  headlineLine1Color: "",
  headlineLine2: "expire.",
  headlineLine2Color: "",
  subtitle:
    "Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.",
  subtitleColor: "",
  primaryCtaLabel: "Shop Now",
  secondaryCtaLabel: "Start Selling",
};

const COLOR_PALETTE = [
  "#FFFFFF",
  "#000000",
  "#1F2937",
  "#6B7280",
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#EC4899",
  "#F43F5E",
  "#C2410C",
  "#B45309",
];

const ColorPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="h-7 w-7 rounded-full border-2 border-border shadow-sm transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-center"
        style={
          value ? { backgroundColor: value, borderColor: value } : undefined
        }
        aria-label="Pick color"
      >
        {!value && <Palette className="h-4 w-4 text-muted-foreground" />}
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-3" align="start">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Text color
          </span>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`Select ${c}`}
              className={`h-6 w-6 rounded border-2 transition ${
                value.toLowerCase() === c.toLowerCase()
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border"
              }`}
              style={{ background: c }}
            />
          ))}
          <label className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border bg-muted hover:bg-muted/80">
            <span className="text-[10px] font-bold leading-none">+</span>
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
              aria-label="Custom color"
            />
          </label>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);

const SiteSettings = () => {
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const [form, setForm] = useState<HeroImageValue>({ ...DEFAULTS });

  const { data, isLoading } = useQuery(getHeroImageQueryOptions());
  const updateHero = useUpdateHeroImage();
  const uploadAsset = useUploadSiteAsset();

  useEffect(() => {
    setForm({ ...DEFAULTS, ...(data || {}) });
  }, [data]);

  const save = (next: HeroImageValue) => {
    updateHero.mutate(next, {
      onSuccess: () => toast.success("Hero section updated"),
      onError: (e: any) => toast.error(e.message || "Failed to save"),
    });
  };

  const handleUpload =
    (variant: "desktop" | "mobile") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image must be under 8MB");
        return;
      }
      setUploading(variant);
      try {
        const asset = await uploadAsset.mutateAsync(file);
        const key = variant === "mobile" ? "mobileUrl" : "url";
        const next = { ...form, [key]: asset.url };
        setForm(next);
        save(next);
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      } finally {
        setUploading(null);
      }
    };

  const update =
    (k: keyof HeroImageValue) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

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
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
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
                      ref={desktopInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload("desktop")}
                    />
                    <Button
                      onClick={() => desktopInputRef.current?.click()}
                      disabled={uploading === "desktop"}
                      className="gap-2"
                    >
                      {uploading === "desktop" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading === "desktop"
                        ? "Uploading..."
                        : "Upload desktop image"}
                    </Button>
                    {form.url && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const next = { ...form, url: "" };
                          setForm(next);
                          save(next);
                        }}
                        disabled={updateHero.isPending}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <Input
                    value={form.url ?? ""}
                    onChange={update("url")}
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
                      ref={mobileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload("mobile")}
                    />
                    <Button
                      onClick={() => mobileInputRef.current?.click()}
                      disabled={uploading === "mobile"}
                      className="gap-2"
                    >
                      {uploading === "mobile" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading === "mobile"
                        ? "Uploading..."
                        : "Upload mobile image"}
                    </Button>
                    {form.mobileUrl && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const next = { ...form, mobileUrl: "" };
                          setForm(next);
                          save(next);
                        }}
                        disabled={updateHero.isPending}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <Input
                    value={form.mobileUrl ?? ""}
                    onChange={update("mobileUrl")}
                    placeholder="Or paste a mobile image URL"
                  />
                  <p className="text-xs text-muted-foreground">
                    Falls back to desktop banner if not set. Recommended
                    1080×1920.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="badge">Badge</Label>
                  <Input
                    id="badge"
                    value={form.badgeText ?? ""}
                    onChange={update("badgeText")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t1">Headline — line 1</Label>
                  <Input
                    id="t1"
                    value={form.headlineLine1 ?? ""}
                    onChange={update("headlineLine1")}
                  />
                  <ColorPicker
                    value={form.headlineLine1Color ?? ""}
                    onChange={(c) =>
                      setForm((f) => ({ ...f, headlineLine1Color: c }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t2">Headline — line 2 (italic accent)</Label>
                  <Input
                    id="t2"
                    value={form.headlineLine2 ?? ""}
                    onChange={update("headlineLine2")}
                  />
                  <ColorPicker
                    value={form.headlineLine2Color ?? ""}
                    onChange={(c) =>
                      setForm((f) => ({ ...f, headlineLine2Color: c }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sub">Subtitle</Label>
                  <Textarea
                    id="sub"
                    rows={3}
                    value={form.subtitle ?? ""}
                    onChange={update("subtitle")}
                  />
                  <ColorPicker
                    value={form.subtitleColor ?? ""}
                    onChange={(c) =>
                      setForm((f) => ({ ...f, subtitleColor: c }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta1">Primary button label</Label>
                  <Input
                    id="cta1"
                    value={form.primaryCtaLabel ?? ""}
                    onChange={update("primaryCtaLabel")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta2">Secondary button label</Label>
                  <Input
                    id="cta2"
                    value={form.secondaryCtaLabel ?? ""}
                    onChange={update("secondaryCtaLabel")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => save(form)}
                  disabled={updateHero.isPending}
                >
                  {updateHero.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;
