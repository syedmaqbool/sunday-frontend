import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import heroFallback from "@/assets/hero-fashion.jpg";

const KEY = "hero_image";

const SiteSettings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["site_settings", KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      if (error) throw error;
      return (data?.value as { url?: string } | null) ?? null;
    },
  });

  useEffect(() => {
    setUrl(data?.url ?? "");
  }, [data]);

  const save = useMutation({
    mutationFn: async (newUrl: string) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: KEY, value: { url: newUrl }, updated_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hero image updated");
      qc.invalidateQueries({ queryKey: ["site_settings", KEY] });
      qc.invalidateQueries({ queryKey: ["hero_image"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/site/hero-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      setUrl(data.publicUrl);
      await save.mutateAsync(data.publicUrl);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const preview = url || heroFallback;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Site Settings</h2>
        <p className="text-sm text-muted-foreground">Manage homepage content and branding.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homepage hero image</CardTitle>
          <CardDescription>
            Shown as the background of the hero section on the homepage. Recommended 1920×1080, max 8MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="overflow-hidden rounded-md border border-border">
                <img src={preview} alt="Hero preview" className="aspect-[16/9] w-full object-cover" />
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload new image"}
                </Button>
                {url && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUrl("");
                      save.mutate("");
                    }}
                    disabled={save.isPending}
                  >
                    Reset to default
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-url">Or paste an image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="hero-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <Button onClick={() => save.mutate(url)} disabled={save.isPending}>
                    {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;
