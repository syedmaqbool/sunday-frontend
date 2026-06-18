import { useRef, useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Palette } from "lucide-react";
import heroFallback from "@/assets/hero-fashion.jpg";

const KEY = "hero_image";

type HeroContent = {
  url?: string;
  mobile_url?: string;
  badge?: string;
  title_line1?: string;
  title_line2?: string;
  subtitle?: string;
  primary_cta?: string;
  secondary_cta?: string;
  title_line1_color?: string;
  title_line2_color?: string;
  subtitle_color?: string;
};

const DEFAULTS: Required<Omit<HeroContent, "url" | "mobile_url">> = {
  badge: "Pre-loved fashion",
  title_line1: "Style doesn't",
  title_line2: "expire.",
  subtitle:
    "Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.",
  primary_cta: "Shop Now",
  secondary_cta: "Start Selling",
  title_line1_color: "",
  title_line2_color: "",
  subtitle_color: "",
};

// ── Mock data (used when NEXT_PUBLIC_USE_MOCK_DATA = true) ──
// `let` so the save mutation can update it in place and the UI reflects edits instantly.
let MOCK_HERO_CONTENT: HeroContent = {
  url: heroFallback,
  mobile_url: "",
  badge: "Pre-loved fashion",
  title_line1: "Style doesn't",
  title_line2: "expire.",
  subtitle:
    "Buy and sell authentic pre-owned fashion. From vintage luxury to modern streetwear — give every piece a second life.",
  primary_cta: "Shop Now",
  secondary_cta: "Start Selling",
  title_line1_color: "#FFFFFF",
  title_line2_color: "#F59E0B",
  subtitle_color: "#FFFFFF",
};

const COLOR_PALETTE = [
  "#FFFFFF", "#000000", "#1F2937", "#6B7280",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#EC4899", "#F43F5E", "#C2410C", "#B45309",
];

const ColorPicker = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="h-7 w-7 rounded-full border-2 border-border shadow-sm transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-center"
        style={value ? { backgroundColor: value, borderColor: value } : undefined}
        aria-label="Pick color"
      >
        {!value && <Palette className="h-4 w-4 text-muted-foreground" />}
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-3" align="start">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Text color</span>
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
                value.toLowerCase() === c.toLowerCase() ? "border-primary ring-2 ring-primary/30" : "border-border"
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
  const { user } = useAuth();
  const qc = useQueryClient();
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const [form, setForm] = useState<HeroContent>({ ...DEFAULTS });

  const { data, isLoading } = useQuery({
    queryKey: ["site_settings", KEY],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_HERO_CONTENT;
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      if (error) throw error;
      return (data?.value as HeroContent | null) ?? null;
    },
  });

  useEffect(() => {
    setForm({ ...DEFAULTS, ...(data || {}) });
  }, [data]);

  const save = useMutation({
    mutationFn: async (next: HeroContent) => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        MOCK_HERO_CONTENT = next;
        qc.setQueryData(["site_settings", KEY], MOCK_HERO_CONTENT);
        return;
      }
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: KEY, value: next, updated_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hero section updated");
      qc.invalidateQueries({ queryKey: ["site_settings", KEY] });
      qc.invalidateQueries({ queryKey: ["hero_image"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const handleUpload = (variant: "desktop" | "mobile") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user && !NEXT_PUBLIC_USE_MOCK_DATA) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    setUploading(variant);
    try {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        // Local preview only — no real storage backend in mock mode.
        const previewUrl = URL.createObjectURL(file);
        const key = variant === "mobile" ? "mobile_url" : "url";
        const next = { ...form, [key]: previewUrl };
        setForm(next);
        await save.mutateAsync(next);
        return;
      }
      const ext = file.name.split(".").pop();
      const path = `${user?.id ?? "mock-user-id"}/site/hero-${variant}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
      const key = variant === "mobile" ? "mobile_url" : "url";
      const next = { ...form, [key]: pub.publicUrl };
      setForm(next);
      await save.mutateAsync(next);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const update = (k: keyof HeroContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Desktop banner</Label>
                  <div className="overflow-hidden rounded-md border border-border">
                    <img src={form.url || heroFallback} alt="Desktop hero preview" className="aspect-[16/9] w-full object-cover" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input ref={desktopInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload("desktop")} />
                    <Button onClick={() => desktopInputRef.current?.click()} disabled={uploading === "desktop"} className="gap-2">
                      {uploading === "desktop" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading === "desktop" ? "Uploading..." : "Upload desktop image"}
                    </Button>
                    {form.url && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const next = { ...form, url: "" };
                          setForm(next);
                          save.mutate(next);
                        }}
                        disabled={save.isPending}
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
                      src={form.mobile_url || form.url || heroFallback}
                      alt="Mobile hero preview"
                      className="aspect-[9/16] max-h-80 w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload("mobile")} />
                    <Button onClick={() => mobileInputRef.current?.click()} disabled={uploading === "mobile"} className="gap-2">
                      {uploading === "mobile" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading === "mobile" ? "Uploading..." : "Upload mobile image"}
                    </Button>
                    {form.mobile_url && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const next = { ...form, mobile_url: "" };
                          setForm(next);
                          save.mutate(next);
                        }}
                        disabled={save.isPending}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <Input
                    value={form.mobile_url ?? ""}
                    onChange={update("mobile_url")}
                    placeholder="Or paste a mobile image URL"
                  />
                  <p className="text-xs text-muted-foreground">Falls back to desktop banner if not set. Recommended 1080×1920.</p>
                </div>
              </div>


              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="badge">Badge</Label>
                  <Input id="badge" value={form.badge ?? ""} onChange={update("badge")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t1">Headline — line 1</Label>
                  <Input id="t1" value={form.title_line1 ?? ""} onChange={update("title_line1")} />
                  <ColorPicker
                    value={form.title_line1_color ?? ""}
                    onChange={(c) => setForm((f) => ({ ...f, title_line1_color: c }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t2">Headline — line 2 (italic accent)</Label>
                  <Input id="t2" value={form.title_line2 ?? ""} onChange={update("title_line2")} />
                  <ColorPicker
                    value={form.title_line2_color ?? ""}
                    onChange={(c) => setForm((f) => ({ ...f, title_line2_color: c }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sub">Subtitle</Label>
                  <Textarea id="sub" rows={3} value={form.subtitle ?? ""} onChange={update("subtitle")} />
                  <ColorPicker
                    value={form.subtitle_color ?? ""}
                    onChange={(c) => setForm((f) => ({ ...f, subtitle_color: c }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta1">Primary button label</Label>
                  <Input id="cta1" value={form.primary_cta ?? ""} onChange={update("primary_cta")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta2">Secondary button label</Label>
                  <Input id="cta2" value={form.secondary_cta ?? ""} onChange={update("secondary_cta")} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
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