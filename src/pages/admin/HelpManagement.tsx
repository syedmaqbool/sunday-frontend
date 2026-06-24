import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminSettingsOptions,
  useUpdateHelpCategories,
  useUpdateHelpFaqs,
  useUpdateHelpTutorials,
} from "@/queries/useAdminSettings";
import type {
  HelpCategoryAPI,
  HelpFaqAPI,
  HelpTutorialAPI,
} from "@/types/admin/settings";
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// ── Display types ────────────────────────────────────────────────────────────
// Note: backend HelpCategorySchema has no `id`/`blurb`/`icon` — `key` is the
// identifier. HelpTutorialSchema has no `icon`/`steps`/`cta` — it's a simple
// title+slug+body article, not a step-by-step card. UI redesigned to match.
interface Category {
  key: string;
  label: string;
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
  slug: string;
  body: string;
  sort_order: number;
  published: boolean;
}

// ── API ↔ Display adapters ───────────────────────────────────────────────────
const adaptCategory = (c: HelpCategoryAPI): Category => ({
  key: c.key,
  label: c.label,
  sort_order: c.sortOrder,
  active: c.active,
});
const categoryToApi = (c: Category): HelpCategoryAPI => ({
  key: c.key,
  label: c.label,
  sortOrder: c.sort_order,
  active: c.active,
});

const adaptFaq = (f: HelpFaqAPI): Faq => ({
  id: f.id,
  category_key: f.categoryKey,
  question: f.question,
  answer: f.answer,
  sort_order: f.sortOrder,
  published: f.published,
});
const faqToApi = (f: Faq): HelpFaqAPI => ({
  id: f.id,
  categoryKey: f.category_key,
  question: f.question,
  answer: f.answer,
  sortOrder: f.sort_order,
  published: f.published,
});

const adaptTutorial = (t: HelpTutorialAPI): Tutorial => ({
  id: t.id,
  title: t.title,
  slug: t.slug,
  body: t.body,
  sort_order: t.sortOrder,
  published: t.published,
});
const tutorialToApi = (t: Tutorial): HelpTutorialAPI => ({
  id: t.id,
  title: t.title,
  slug: t.slug,
  body: t.body,
  sortOrder: t.sort_order,
  published: t.published,
});

// ── Validation ────────────────────────────────────────────────────────────────
const categorySchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, _ or -"),
  label: z.string().trim().min(1).max(60),
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
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, - only"),
  body: z.string().trim().min(3).max(5000),
  sort_order: z.number().int().min(0),
});

const HelpManagement = () => {
  const { data: settings, isLoading } = useQuery(getAdminSettingsOptions());
  const updateCategories = useUpdateHelpCategories();
  const updateFaqs = useUpdateHelpFaqs();
  const updateTutorials = useUpdateHelpTutorials();

  const categories: Category[] = (settings?.helpCategories ?? []).map(
    adaptCategory,
  );
  const faqs: Faq[] = (settings?.helpFaqs ?? []).map(adaptFaq);
  const tutorials: Tutorial[] = (settings?.helpTutorials ?? []).map(
    adaptTutorial,
  );

  // ── Category dialog ──
  const [catOpen, setCatOpen] = useState(false);
  const [catEdit, setCatEdit] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ key: "", label: "", sort_order: 0 });

  const openCategoryDialog = (c: Category | null) => {
    setCatEdit(c);
    setCatForm(
      c
        ? { key: c.key, label: c.label, sort_order: c.sort_order }
        : { key: "", label: "", sort_order: categories.length },
    );
    setCatOpen(true);
  };

  const saveCategory = () => {
    const parsed = categorySchema.safeParse(catForm);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    let next: Category[];
    if (catEdit) {
      next = categories.map((c) =>
        c.key === catEdit.key ? { ...c, ...parsed.data } : c,
      );
    } else {
      if (categories.some((c) => c.key === parsed.data.key))
        return toast.error("That key already exists");
      const newCategory: Category = {
        key: parsed.data.key,
        label: parsed.data.label,
        sort_order: parsed.data.sort_order,
        active: true,
      };
      next = [...categories, newCategory];
    }

    updateCategories.mutate(next.map(categoryToApi), {
      onSuccess: () => {
        toast.success(catEdit ? "Category updated" : "Category added");
        setCatOpen(false);
      },
      onError: (e: any) => toast.error(e.message ?? "Failed to save"),
    });
  };

  const toggleCategoryActive = (key: string, active: boolean) => {
    const next = categories.map((c) => (c.key === key ? { ...c, active } : c));
    updateCategories.mutate(next.map(categoryToApi));
  };

  const deleteCategory = (key: string) => {
    const next = categories.filter((c) => c.key !== key);
    updateCategories.mutate(next.map(categoryToApi), {
      onSuccess: () => toast.success("Category removed"),
      onError: () => toast.error("Failed to remove category"),
    });
  };

  // ── FAQ dialog ──
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqEdit, setFaqEdit] = useState<Faq | null>(null);
  const [faqForm, setFaqForm] = useState({
    category_key: "",
    question: "",
    answer: "",
    sort_order: 0,
  });

  const openFaqDialog = (f: Faq | null) => {
    setFaqEdit(f);
    setFaqForm(
      f
        ? {
            category_key: f.category_key,
            question: f.question,
            answer: f.answer,
            sort_order: f.sort_order,
          }
        : {
            category_key: categories[0]?.key ?? "",
            question: "",
            answer: "",
            sort_order: faqs.length,
          },
    );
    setFaqOpen(true);
  };

  const saveFaq = () => {
    const parsed = faqSchema.safeParse(faqForm);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    let next: Faq[];
    if (faqEdit) {
      next = faqs.map((f) =>
        f.id === faqEdit.id ? { ...f, ...parsed.data } : f,
      );
    } else {
      const newFaq: Faq = {
        id: `faq-${Date.now()}`,
        category_key: parsed.data.category_key,
        question: parsed.data.question,
        answer: parsed.data.answer,
        sort_order: parsed.data.sort_order,
        published: true,
      };
      next = [...faqs, newFaq];
    }

    updateFaqs.mutate(next.map(faqToApi), {
      onSuccess: () => {
        toast.success(faqEdit ? "FAQ updated" : "FAQ added");
        setFaqOpen(false);
      },
      onError: (e: any) => toast.error(e.message ?? "Failed to save"),
    });
  };

  const toggleFaqPublished = (id: string, published: boolean) => {
    const next = faqs.map((f) => (f.id === id ? { ...f, published } : f));
    updateFaqs.mutate(next.map(faqToApi));
  };

  const deleteFaq = (id: string) => {
    const next = faqs.filter((f) => f.id !== id);
    updateFaqs.mutate(next.map(faqToApi), {
      onSuccess: () => toast.success("FAQ removed"),
      onError: () => toast.error("Failed to remove FAQ"),
    });
  };

  // ── Tutorial dialog (simplified: title + slug + body — no icon/steps/CTA) ──
  const [tutOpen, setTutOpen] = useState(false);
  const [tutEdit, setTutEdit] = useState<Tutorial | null>(null);
  const [tutForm, setTutForm] = useState({
    title: "",
    slug: "",
    body: "",
    sort_order: 0,
  });

  const openTutorialDialog = (t: Tutorial | null) => {
    setTutEdit(t);
    setTutForm(
      t
        ? {
            title: t.title,
            slug: t.slug,
            body: t.body,
            sort_order: t.sort_order,
          }
        : { title: "", slug: "", body: "", sort_order: tutorials.length },
    );
    setTutOpen(true);
  };

  const saveTutorial = () => {
    const parsed = tutorialSchema.safeParse(tutForm);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    let next: Tutorial[];
    if (tutEdit) {
      next = tutorials.map((t) =>
        t.id === tutEdit.id ? { ...t, ...parsed.data } : t,
      );
    } else {
      const newTutorial: Tutorial = {
        id: `tutorial-${Date.now()}`,
        title: parsed.data.title,
        slug: parsed.data.slug,
        body: parsed.data.body,
        sort_order: parsed.data.sort_order,
        published: true,
      };
      next = [...tutorials, newTutorial];
    }
    updateTutorials.mutate(next.map(tutorialToApi), {
      onSuccess: () => {
        toast.success(tutEdit ? "Tutorial updated" : "Tutorial added");
        setTutOpen(false);
      },
      onError: (e: any) => toast.error(e.message ?? "Failed to save"),
    });
  };

  const toggleTutorialPublished = (id: string, published: boolean) => {
    const next = tutorials.map((t) => (t.id === id ? { ...t, published } : t));
    updateTutorials.mutate(next.map(tutorialToApi));
  };

  const deleteTutorial = (id: string) => {
    const next = tutorials.filter((t) => t.id !== id);
    updateTutorials.mutate(next.map(tutorialToApi), {
      onSuccess: () => toast.success("Tutorial removed"),
      onError: () => toast.error("Failed to remove tutorial"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Help Center
        </h1>
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
            <Button
              onClick={() => openFaqDialog(null)}
              className="gap-2"
              disabled={categories.length === 0}
            >
              <Plus className="h-4 w-4" /> Add FAQ
            </Button>
          </div>
          {faqs.length === 0 ? (
            <EmptyState label="No FAQs yet" />
          ) : (
            faqs.map((f) => {
              const cat = categories.find((c) => c.key === f.category_key);
              return (
                <Card key={f.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {cat?.label ?? f.category_key}
                        </Badge>
                        {!f.published && (
                          <Badge variant="outline" className="text-[10px]">
                            Draft
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          #{f.sort_order}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">
                        {f.question}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {f.answer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={f.published}
                        onCheckedChange={(v) => toggleFaqPublished(f.id, v)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openFaqDialog(f)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteFaq(f.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── Tutorials (simple articles: title + slug + body) ── */}
        <TabsContent value="tutorials" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => openTutorialDialog(null)} className="gap-2">
              <Plus className="h-4 w-4" /> Add tutorial
            </Button>
          </div>
          {tutorials.length === 0 ? (
            <EmptyState label="No tutorials yet" />
          ) : (
            tutorials.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!t.published && (
                        <Badge variant="outline" className="text-[10px]">
                          Draft
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        #{t.sort_order}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        /{t.slug}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">
                      {t.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {t.body}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={t.published}
                      onCheckedChange={(v) => toggleTutorialPublished(t.id, v)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openTutorialDialog(t)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteTutorial(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Categories ── */}
        <TabsContent value="categories" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog(null)} className="gap-2">
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </div>
          {categories.length === 0 ? (
            <EmptyState label="No categories yet" />
          ) : (
            categories.map((c) => (
              <Card key={c.key}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        {c.key}
                      </Badge>
                      {!c.active && (
                        <Badge variant="outline" className="text-[10px]">
                          Hidden
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        #{c.sort_order}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">
                      {c.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={c.active}
                      onCheckedChange={(v) => toggleCategoryActive(c.key, v)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openCategoryDialog(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteCategory(c.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── Category dialog ── */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {catEdit ? "Edit category" : "Add category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Key</Label>
                <Input
                  value={catForm.key}
                  onChange={(e) =>
                    setCatForm({
                      ...catForm,
                      key: e.target.value.toLowerCase(),
                    })
                  }
                  disabled={!!catEdit}
                  placeholder="e.g. shipping"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input
                  value={catForm.label}
                  onChange={(e) =>
                    setCatForm({ ...catForm, label: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={catForm.sort_order}
                onChange={(e) =>
                  setCatForm({
                    ...catForm,
                    sort_order: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveCategory}
              disabled={updateCategories.isPending}
            >
              {updateCategories.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FAQ dialog ── */}
      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{faqEdit ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={faqForm.category_key}
                onValueChange={(v) =>
                  setFaqForm({ ...faqForm, category_key: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Question</Label>
              <Input
                value={faqForm.question}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, question: e.target.value })
                }
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Answer</Label>
              <Textarea
                value={faqForm.answer}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, answer: e.target.value })
                }
                rows={6}
                maxLength={2000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={faqForm.sort_order}
                onChange={(e) =>
                  setFaqForm({
                    ...faqForm,
                    sort_order: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveFaq} disabled={updateFaqs.isPending}>
              {updateFaqs.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tutorial dialog (simple article — no icon/steps/CTA) ── */}
      <Dialog open={tutOpen} onOpenChange={setTutOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tutEdit ? "Edit tutorial" : "Add tutorial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={tutForm.title}
                  onChange={(e) =>
                    setTutForm({ ...tutForm, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={tutForm.sort_order}
                  onChange={(e) =>
                    setTutForm({
                      ...tutForm,
                      sort_order: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={tutForm.slug}
                onChange={(e) =>
                  setTutForm({ ...tutForm, slug: e.target.value.toLowerCase() })
                }
                placeholder="creating-your-first-listing"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                rows={10}
                value={tutForm.body}
                onChange={(e) =>
                  setTutForm({ ...tutForm, body: e.target.value })
                }
                placeholder="Write the tutorial content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTutorial} disabled={updateTutorials.isPending}>
              {updateTutorials.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
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
