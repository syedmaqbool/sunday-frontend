import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { HELP_ICON_OPTIONS, getHelpIcon } from "@/lib/helpIcons";

interface Category {
  id: string;
  key: string;
  label: string;
  blurb: string;
  icon: string;
  sort_order: number;
  active: boolean;
}
interface Faq {
  id: string;
  category_key: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}
interface Tutorial {
  id: string;
  title: string;
  icon: string;
  steps: string[];
  cta_label: string;
  cta_to: string;
  sort_order: number;
  published: boolean;
}

const categorySchema = z.object({
  key: z.string().trim().min(2).max(40).regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, _ or -"),
  label: z.string().trim().min(1).max(60),
  blurb: z.string().trim().max(160),
  icon: z.string().min(1),
  sort_order: z.number().int().min(0),
});
const faqSchema = z.object({
  category_key: z.string().min(1, "Choose a category"),
  question: z.string().trim().min(3).max(200),
  answer: z.string().trim().min(3).max(2000),
  sort_order: z.number().int().min(0),
});
const tutorialSchema = z.object({
  title: z.string().trim().min(2).max(80),
  icon: z.string().min(1),
  steps: z.array(z.string().trim().min(1)).min(1, "At least one step"),
  cta_label: z.string().trim().max(40),
  cta_to: z.string().trim().max(200),
  sort_order: z.number().int().min(0),
});

const IconSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="max-h-64">
      {HELP_ICON_OPTIONS.map((name) => {
        const Icon = getHelpIcon(name);
        return (
          <SelectItem key={name} value={name}>
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {name}
            </span>
          </SelectItem>
        );
      })}
    </SelectContent>
  </Select>
);

const HelpManagement = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-help-categories"] });
    qc.invalidateQueries({ queryKey: ["admin-help-faqs"] });
    qc.invalidateQueries({ queryKey: ["admin-help-tutorials"] });
    qc.invalidateQueries({ queryKey: ["help-categories"] });
    qc.invalidateQueries({ queryKey: ["help-faqs"] });
    qc.invalidateQueries({ queryKey: ["help-tutorials"] });
  };

  // ── Queries (admin sees everything, including unpublished) ──
  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["admin-help-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["admin-help-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_faqs")
        .select("*")
        .order("category_key")
        .order("sort_order");
      if (error) throw error;
      return data as Faq[];
    },
  });
  const { data: tutorials = [], isLoading: loadingTuts } = useQuery({
    queryKey: ["admin-help-tutorials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_tutorials")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Tutorial[];
    },
  });

  // ── Category dialog ──
  const [catOpen, setCatOpen] = useState(false);
  const [catEdit, setCatEdit] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ key: "", label: "", blurb: "", icon: "BookOpen", sort_order: 0 });

  const openCategoryDialog = (c: Category | null) => {
    setCatEdit(c);
    setCatForm(
      c
        ? { key: c.key, label: c.label, blurb: c.blurb, icon: c.icon, sort_order: c.sort_order }
        : { key: "", label: "", blurb: "", icon: "BookOpen", sort_order: categories.length }
    );
    setCatOpen(true);
  };
  const saveCategory = useMutation({
    mutationFn: async () => {
      const parsed = categorySchema.safeParse(catForm);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (catEdit) {
        const { error } = await supabase.from("help_categories").update(parsed.data).eq("id", catEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("help_categories").insert(parsed.data as Category);
        if (error) {
          if (error.code === "23505") throw new Error("That key already exists");
          throw error;
        }
      }
    },
    onSuccess: () => { toast.success(catEdit ? "Category updated" : "Category added"); setCatOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleCategoryActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("help_categories").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("help_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Category removed"); invalidate(); },
    onError: () => toast.error("Failed to remove category"),
  });

  // ── FAQ dialog ──
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqEdit, setFaqEdit] = useState<Faq | null>(null);
  const [faqForm, setFaqForm] = useState({ category_key: "", question: "", answer: "", sort_order: 0 });

  const openFaqDialog = (f: Faq | null) => {
    setFaqEdit(f);
    setFaqForm(
      f
        ? { category_key: f.category_key, question: f.question, answer: f.answer, sort_order: f.sort_order }
        : { category_key: categories[0]?.key ?? "", question: "", answer: "", sort_order: faqs.length }
    );
    setFaqOpen(true);
  };
  const saveFaq = useMutation({
    mutationFn: async () => {
      const parsed = faqSchema.safeParse(faqForm);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (faqEdit) {
        const { error } = await supabase.from("help_faqs").update(parsed.data).eq("id", faqEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("help_faqs").insert(parsed.data as Faq);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(faqEdit ? "FAQ updated" : "FAQ added"); setFaqOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleFaqPublished = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("help_faqs").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
  const deleteFaq = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("help_faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("FAQ removed"); invalidate(); },
    onError: () => toast.error("Failed to remove FAQ"),
  });

  // ── Tutorial dialog ──
  const [tutOpen, setTutOpen] = useState(false);
  const [tutEdit, setTutEdit] = useState<Tutorial | null>(null);
  const [tutForm, setTutForm] = useState({
    title: "",
    icon: "BookOpen",
    steps: [""] as string[],
    cta_label: "",
    cta_to: "",
    sort_order: 0,
  });

  const openTutorialDialog = (t: Tutorial | null) => {
    setTutEdit(t);
    setTutForm(
      t
        ? { title: t.title, icon: t.icon, steps: t.steps.length ? t.steps : [""], cta_label: t.cta_label, cta_to: t.cta_to, sort_order: t.sort_order }
        : { title: "", icon: "BookOpen", steps: [""], cta_label: "", cta_to: "", sort_order: tutorials.length }
    );
    setTutOpen(true);
  };
  const saveTutorial = useMutation({
    mutationFn: async () => {
      const cleanSteps = tutForm.steps.map((s) => s.trim()).filter(Boolean);
      const parsed = tutorialSchema.safeParse({ ...tutForm, steps: cleanSteps });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (tutEdit) {
        const { error } = await supabase.from("help_tutorials").update(parsed.data).eq("id", tutEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("help_tutorials").insert(parsed.data);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(tutEdit ? "Tutorial updated" : "Tutorial added"); setTutOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleTutorialPublished = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("help_tutorials").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
  const deleteTutorial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("help_tutorials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tutorial removed"); invalidate(); },
    onError: () => toast.error("Failed to remove tutorial"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Help Center</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the categories, FAQs, and tutorials shown on /help.
        </p>
      </div>

      <Tabs defaultValue="faqs">
        <TabsList>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* ── FAQs ── */}
        <TabsContent value="faqs" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => openFaqDialog(null)} className="gap-2" disabled={categories.length === 0}>
              <Plus className="h-4 w-4" /> Add FAQ
            </Button>
          </div>
          {loadingFaqs ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : faqs.length === 0 ? (
            <EmptyState label="No FAQs yet" />
          ) : (
            faqs.map((f) => {
              const cat = categories.find((c) => c.key === f.category_key);
              return (
                <Card key={f.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{cat?.label ?? f.category_key}</Badge>
                        {!f.published && <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                        <span className="text-[10px] text-muted-foreground">#{f.sort_order}</span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{f.question}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{f.answer}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={f.published}
                        onCheckedChange={(v) => toggleFaqPublished.mutate({ id: f.id, published: v })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => openFaqDialog(f)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteFaq.mutate(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── Tutorials ── */}
        <TabsContent value="tutorials" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => openTutorialDialog(null)} className="gap-2">
              <Plus className="h-4 w-4" /> Add tutorial
            </Button>
          </div>
          {loadingTuts ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : tutorials.length === 0 ? (
            <EmptyState label="No tutorials yet" />
          ) : (
            tutorials.map((t) => {
              const Icon = getHelpIcon(t.icon);
              return (
                <Card key={t.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {!t.published && <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                        <span className="text-[10px] text-muted-foreground">#{t.sort_order}</span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{t.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.steps.length} step{t.steps.length === 1 ? "" : "s"}
                        {t.cta_label && t.cta_to ? ` · CTA: ${t.cta_label} → ${t.cta_to}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={t.published}
                        onCheckedChange={(v) => toggleTutorialPublished.mutate({ id: t.id, published: v })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => openTutorialDialog(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteTutorial.mutate(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── Categories ── */}
        <TabsContent value="categories" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog(null)} className="gap-2">
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </div>
          {loadingCats ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : categories.length === 0 ? (
            <EmptyState label="No categories yet" />
          ) : (
            categories.map((c) => {
              const Icon = getHelpIcon(c.icon);
              return (
                <Card key={c.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[10px]">{c.key}</Badge>
                        {!c.active && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                        <span className="text-[10px] text-muted-foreground">#{c.sort_order}</span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{c.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">{c.blurb}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={c.active}
                        onCheckedChange={(v) => toggleCategoryActive.mutate({ id: c.id, active: v })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => openCategoryDialog(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCategory.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* ── Category dialog ── */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{catEdit ? "Edit category" : "Add category"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Key</Label>
                <Input
                  value={catForm.key}
                  onChange={(e) => setCatForm({ ...catForm, key: e.target.value.toLowerCase() })}
                  disabled={!!catEdit}
                  placeholder="e.g. shipping"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input value={catForm.label} onChange={(e) => setCatForm({ ...catForm, label: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Blurb</Label>
              <Input value={catForm.blurb} onChange={(e) => setCatForm({ ...catForm, blurb: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <IconSelect value={catForm.icon} onChange={(v) => setCatForm({ ...catForm, icon: v })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={catForm.sort_order}
                  onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Cancel</Button>
            <Button onClick={() => saveCategory.mutate()} disabled={saveCategory.isPending}>
              {saveCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FAQ dialog ── */}
      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{faqEdit ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={faqForm.category_key} onValueChange={(v) => setFaqForm({ ...faqForm, category_key: v })}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Question</Label>
              <Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label>Answer</Label>
              <Textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                rows={6}
                maxLength={2000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={faqForm.sort_order}
                onChange={(e) => setFaqForm({ ...faqForm, sort_order: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqOpen(false)}>Cancel</Button>
            <Button onClick={() => saveFaq.mutate()} disabled={saveFaq.isPending}>
              {saveFaq.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tutorial dialog ── */}
      <Dialog open={tutOpen} onOpenChange={setTutOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{tutEdit ? "Edit tutorial" : "Add tutorial"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={tutForm.title} onChange={(e) => setTutForm({ ...tutForm, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={tutForm.sort_order}
                  onChange={(e) => setTutForm({ ...tutForm, sort_order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <IconSelect value={tutForm.icon} onChange={(v) => setTutForm({ ...tutForm, icon: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>Steps</Label>
              {tutForm.steps.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex h-9 w-7 shrink-0 items-center justify-center text-xs text-muted-foreground">{i + 1}.</span>
                  <Input
                    value={s}
                    onChange={(e) => {
                      const next = [...tutForm.steps];
                      next[i] = e.target.value;
                      setTutForm({ ...tutForm, steps: next });
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const next = tutForm.steps.filter((_, idx) => idx !== i);
                      setTutForm({ ...tutForm, steps: next.length ? next : [""] });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTutForm({ ...tutForm, steps: [...tutForm.steps, ""] })}
                className="gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add step
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CTA label (optional)</Label>
                <Input value={tutForm.cta_label} onChange={(e) => setTutForm({ ...tutForm, cta_label: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>CTA path (optional)</Label>
                <Input
                  value={tutForm.cta_to}
                  onChange={(e) => setTutForm({ ...tutForm, cta_to: e.target.value })}
                  placeholder="/listings"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTutOpen(false)}>Cancel</Button>
            <Button onClick={() => saveTutorial.mutate()} disabled={saveTutorial.isPending}>
              {saveTutorial.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
    <BookOpen className="h-10 w-10" />
    <p className="text-sm">{label}</p>
  </div>
);

export default HelpManagement;
