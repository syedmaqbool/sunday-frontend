import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CONDITIONS, SIZES } from "@/lib/constants";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CreateListing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: "", brand: "",
    category: "", condition: "", size: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase.from("listings").insert({
      title: form.title,
      description: form.description,
      price: parseInt(form.price),
      brand: form.brand,
      category: form.category,
      condition: form.condition,
      size: form.size,
      seller_id: user.id,
      images: [],
      status: "approved", // auto-approve for MVP
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing created!", description: "Your item is now live." });
      navigate("/listings");
    }
    setSubmitting(false);
  };

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-2xl flex-1 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Sell an Item</h1>
        <p className="mt-2 text-muted-foreground">List your pre-loved fashion for sale</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label>Photos</Label>
            <div className="mt-2 flex gap-3">
              {[1, 2, 3, 4].map(i => (
                <button
                  key={i}
                  type="button"
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {i === 1 ? <Camera className="h-5 w-5" /> : <Upload className="h-4 w-4" />}
                  <span className="mt-1 text-[10px]">{i === 1 ? "Cover" : `Photo ${i}`}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Photo upload coming soon</p>
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (ZAR)</Label>
              <Input id="price" type="number" min="1" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
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
            Submit Listing
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateListing;
