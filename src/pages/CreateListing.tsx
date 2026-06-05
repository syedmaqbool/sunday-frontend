import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONDITIONS, SIZES, WEIGHT_OPTIONS } from "@/lib/constants";
import { useCategories, useSubcategories } from "@/hooks/useCategories";
import { Camera, Upload, Loader2, X, Video as VideoIcon, Info, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import BankDetailsModal from "@/components/BankDetailsModal";
import { trackEvent } from "@/lib/analytics";

const MAX_PHOTOS = 20;

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);

const FieldTip = ({ tip }: { tip: string }) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Field help"
          className="ml-1.5 inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {tip}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const CreateListing = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing
  const isEditing = !!id;
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: parentCategories = [] } = useCategories();
  const { data: subCategories = [] } = useSubcategories();
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", price: "", brand: "",
    parentCategory: "", subCategory: "", condition: "", size: "", weight: "",
  });
  const [bankModalOpen, setBankModalOpen] = useState(false);

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
      const parts = (existingListing.category || "").split("-");
      const closestWeight = (() => {
        if (!existingListing.weight) return "";
        const options = WEIGHT_OPTIONS.map(o => ({ ...o, num: parseFloat(o.value) }));
        let closest = options[0];
        let minDist = Math.abs(options[0].num - existingListing.weight);
        for (let i = 1; i < options.length; i++) {
          const dist = Math.abs(options[i].num - existingListing.weight);
          if (dist < minDist) {
            minDist = dist;
            closest = options[i];
          }
        }
        return closest.value;
      })();
      setForm({
        title: existingListing.title,
        description: existingListing.description || "",
        price: String(existingListing.price),
        brand: existingListing.brand || "",
        parentCategory: parts[0] || "",
        subCategory: parts[1] || "",
        condition: existingListing.condition,
        size: existingListing.size,
        weight: closestWeight,
      });
      const media = existingListing.images || [];
      setExistingImages(media.filter((u: string) => !isVideoUrl(u)));
      const vid = media.find((u: string) => isVideoUrl(u));
      setExistingVideo(vid || null);
    }
  }, [existingListing, user, navigate]);

  const uploadFiles = async (listingId: string, files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
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
    if (total > MAX_PHOTOS) {
      toast({ title: `Max ${MAX_PHOTOS} photos allowed`, variant: "destructive" });
      return;
    }
    setImageFiles((prev) => [...prev, ...files]);
  };

  const handleAddVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Video must be under 50MB", variant: "destructive" });
      return;
    }
    setVideoFile(file);
    setExistingVideo(null);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoFile(null);
    setExistingVideo(null);
  };

  const totalPhotos = imageFiles.length + existingImages.length;
  const hasVideo = !!videoFile || !!existingVideo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (totalPhotos === 0) {
      toast({ title: "At least 1 photo is required", variant: "destructive" });
      return;
    }
    if (!hasVideo) {
      toast({ title: "A video is required", description: "Please upload 1 video of the item.", variant: "destructive" });
      return;
    }

    // Before creating a NEW listing, ensure the seller has bank/payout details on file.
    if (!isEditing) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("bank_account_holder, bank_name, bank_account_number")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        toast({ title: "Error", description: profileError.message, variant: "destructive" });
        return;
      }

      const hasBankDetails =
        !!profile?.bank_account_holder &&
        !!profile?.bank_name &&
        !!profile?.bank_account_number;

      if (!hasBankDetails) {
        setBankModalOpen(true);
        return;
      }
    }

    await performSubmit();
  };

  const performSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      if (isEditing) {
        const newImageUrls = imageFiles.length > 0 ? await uploadFiles(id!, imageFiles) : [];
        const newVideoUrls = videoFile ? await uploadFiles(id!, [videoFile]) : [];
        const videoUrl = newVideoUrls[0] || existingVideo;
        const allMedia = [...existingImages, ...newImageUrls, ...(videoUrl ? [videoUrl] : [])];

        const { error } = await supabase
          .from("listings")
          .update({
            title: form.title,
            description: form.description,
            price: parseFloat(form.price),
            brand: form.brand,
            category: `${form.parentCategory}-${form.subCategory}`,
            condition: form.condition,
            size: form.size,
            weight: form.weight ? parseFloat(form.weight) : null,
            images: allMedia,
          })
          .eq("id", id!)
          .eq("seller_id", user.id);

        if (error) throw error;
        toast({ title: "Listing updated!", description: "Your changes have been saved." });
        navigate(`/listing/${id}`);
      } else {
        const { data: newListing, error: insertError } = await supabase
          .from("listings")
          .insert({
            title: form.title,
            description: form.description,
            price: parseFloat(form.price),
            brand: form.brand,
            category: `${form.parentCategory}-${form.subCategory}`,
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

        const imageUrls = imageFiles.length > 0 ? await uploadFiles(newListing.id, imageFiles) : [];
        const videoUrls = videoFile ? await uploadFiles(newListing.id, [videoFile]) : [];
        const allMedia = [...imageUrls, ...videoUrls];

        await supabase
          .from("listings")
          .update({ images: allMedia })
          .eq("id", newListing.id);

        trackEvent("listing_created", {
          listing_id: newListing.id,
          category: `${form.parentCategory}-${form.subCategory}`,
          price: parseFloat(form.price),
          brand: form.brand,
        });
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

  const videoPreviewUrl = videoFile ? URL.createObjectURL(videoFile) : existingVideo;

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
            <Label>Photos (up to {MAX_PHOTOS}) <span className="text-muted-foreground font-normal">— {totalPhotos}/{MAX_PHOTOS}</span><FieldTip tip="Upload clear, well-lit photos from multiple angles. The first image will be your cover. Show any flaws or details up close. Up to 20 images." /></Label>
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
              {allPreviews.length < MAX_PHOTOS && (
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

          {/* Video upload (mandatory) */}
          <div>
            <Label>
              Video <span className="text-destructive">*</span>{" "}
              <span className="text-muted-foreground font-normal">— 1 short video required (max 50MB)</span>
              <FieldTip tip="A short 360° video helps buyers trust your listing. Show the item from all sides, zoom in on labels, fabric, and any flaws. Max 50MB." />
            </Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {videoPreviewUrl ? (
                <div className="relative h-32 w-44 rounded-lg overflow-hidden border border-border bg-muted">
                  <video src={videoPreviewUrl} className="h-full w-full object-cover" controls />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive hover:bg-background"
                    onClick={removeVideo}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 w-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground transition hover:border-primary hover:text-primary">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleAddVideo}
                  />
                  <VideoIcon className="h-5 w-5" />
                  <span className="mt-1 text-[10px]">Add video</span>
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title<FieldTip tip="A concise, descriptive title shoppers can search for. Include brand, item type, and a key detail (e.g. 'Vintage Levi's 501 high-waist jeans')." /></Label>
              <Input id="title" placeholder="e.g. Vintage Levi's 501 Jeans" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand<FieldTip tip="The original maker of the item. Use the official brand name as it appears on the label (e.g. Nike, Zara, Gucci)." /></Label>
              <Input id="brand" placeholder="e.g. Levi's" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description<FieldTip tip="Describe size fit, materials, measurements, condition, and any flaws or signs of wear. Honest detailed descriptions reduce returns and complaints." /></Label>
            <Textarea id="description" placeholder="Describe the item, its condition, and any flaws..." rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category<FieldTip tip="Pick the broad category that best matches your item (e.g. Women, Men, Kids, Accessories). Choosing the right one helps the right buyers find it." /></Label>
              <Select value={form.parentCategory} onValueChange={v => setForm(f => ({ ...f, parentCategory: v, subCategory: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {parentCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory<FieldTip tip="Refines your category — e.g. under Women → Dresses, Tops, Shoes. Pick the closest match so your item appears in the correct browse filters." /></Label>
              <Select value={form.subCategory} onValueChange={v => setForm(f => ({ ...f, subCategory: v }))} disabled={!form.parentCategory}>
                <SelectTrigger><SelectValue placeholder={form.parentCategory ? "Select type" : "Choose category first"} /></SelectTrigger>
                <SelectContent>
                  {subCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (PKR)<FieldTip tip="Set a fair selling price in Pakistani Rupees. Buyers can still negotiate via offers — pick a price that leaves a little room to bargain." /></Label>
              <Input id="price" type="number" min="1" step="0.01" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Weight<FieldTip tip="Approximate packed weight range. Used to estimate shipping cost. Pick the range that best matches your item in its packaging." /></Label>
              <Select value={form.weight} onValueChange={v => setForm(f => ({ ...f, weight: v }))}>
                <SelectTrigger><SelectValue placeholder="Select weight" /></SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition<FieldTip tip="Honest condition rating: New with tags, Like new, Good (light wear), or Fair (visible wear). Be accurate — buyers can report mismatched listings." /></Label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Size<FieldTip tip="Use the size on the garment label. If sizing runs differently from standard, mention it in the description (e.g. 'M but fits like S')." /></Label>
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

      <BankDetailsModal
        open={bankModalOpen}
        onCancel={() => setBankModalOpen(false)}
        onSaved={async () => {
          setBankModalOpen(false);
          await performSubmit();
        }}
      />
    </div>
  );
};

export default CreateListing;
