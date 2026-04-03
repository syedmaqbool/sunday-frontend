import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PARENT_CATEGORIES, SUBCATEGORIES, CONDITIONS, SIZES } from "@/lib/constants";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CreateListing = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing
  const isEditing = !!id;
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", price: "", brand: "",
    category: "", condition: "", size: "", weight: "",
  });

  // Load existing listing if editing
  const { data: existingListing, isLoading: loadingListing } = useQuery({
    queryKey: ["edit-listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (existingListing) {
      // Verify ownership
      if (existingListing.seller_id !== user?.id) {
        navigate("/listings", { replace: true });
        return;
      }
      setForm({
        title: existingListing.title,
        description: existingListing.description || "",
        price: String(existingListing.price),
        brand: existingListing.brand || "",
        category: existingListing.category,
        condition: existingListing.condition,
        size: existingListing.size,
        weight: existingListing.weight ? String(existingListing.weight) : "",
      });
      setExistingImages(existingListing.images || []);
    }
  }, [existingListing, user, navigate]);

  const uploadImages = async (listingId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${listingId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = imageFiles.length + existingImages.length + files.length;
    if (total > 6) {
      toast({ title: "Max 6 photos allowed", variant: "destructive" });
      return;
    }
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      if (isEditing) {
        // Upload new images
        const newUrls = imageFiles.length > 0 ? await uploadImages(id!) : [];
        const allImages = [...existingImages, ...newUrls];

        const { error } = await supabase
          .from("listings")
          .update({
            title: form.title,
            description: form.description,
            price: parseFloat(form.price),
            brand: form.brand,
            category: form.category,
            condition: form.condition,
            size: form.size,
            weight: form.weight ? parseFloat(form.weight) : null,
            images: allImages,
          })
          .eq("id", id!)
          .eq("seller_id", user.id);

        if (error) throw error;
        toast({ title: "Listing updated!", description: "Your changes have been saved." });
        navigate(`/listing/${id}`);
      } else {
        // Create new listing first to get ID
        const { data: newListing, error: insertError } = await supabase
          .from("listings")
          .insert({
            title: form.title,
            description: form.description,
            price: parseFloat(form.price),
            brand: form.brand,
            category: form.category,
            condition: form.condition,
            size: form.size,
            weight: form.weight ? parseFloat(form.weight) : null,
            seller_id: user.id,
            images: [],
            status: "pending",
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        // Upload images and update listing
        if (imageFiles.length > 0) {
          const urls = await uploadImages(newListing.id);
          await supabase
            .from("listings")
            .update({ images: urls })
            .eq("id", newListing.id);
        }

        toast({ title: "Listing created!", description: "Your item is pending review." });
        navigate("/listings");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (authLoading || loadingListing) return null;

  const allPreviews = [
    ...existingImages.map((url) => ({ type: "existing" as const, url })),
    ...imageFiles.map((file, i) => ({ type: "new" as const, url: URL.createObjectURL(file), index: i })),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-2xl flex-1 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {isEditing ? "Edit Listing" : "Sell an Item"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isEditing ? "Update your listing details" : "List your pre-loved fashion for sale"}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Photo upload */}
          <div>
            <Label>Photos (up to 6)</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {allPreviews.map((preview, i) => (
                <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border">
                  <img src={preview.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive hover:bg-background"
                    onClick={() =>
                      preview.type === "existing"
                        ? removeExistingImage(existingImages.indexOf(preview.url))
                        : removeNewImage(preview.index!)
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-center text-[9px] font-semibold text-primary-foreground">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              {allPreviews.length < 6 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground transition hover:border-primary hover:text-primary">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                  />
                  {allPreviews.length === 0 ? <Camera className="h-5 w-5" /> : <Upload className="h-4 w-4" />}
                  <span className="mt-1 text-[10px]">Add photo</span>
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Vintage Levi's 501 Jeans" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" placeholder="e.g. Levi's" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Describe the item, its condition, and any flaws..." rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (ZAR)</Label>
              <Input id="price" type="number" min="1" step="0.01" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" min="0" step="0.01" placeholder="e.g. 0.5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Size</Label>
            <Select value={form.size} onValueChange={v => setForm(f => ({ ...f, size: v }))}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select size" /></SelectTrigger>
              <SelectContent>
                {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Submit Listing"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateListing;
