import type {
  HelpCategoryAPI,
  HelpFaqAPI,
  HelpTutorialAPI,
} from '@/types/adminSettings.type';
import { useQuery } from '@tanstack/react-query';

import {
  BookOpen,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  getAdminSettingsOptions,
  useUpdateHelpCategoriesMutation,
  useUpdateHelpFaqsMutation,
  useUpdateHelpTutorialsMutation,
} from '@/queries/adminSettings.query';

// ── Display types ────────────────────────────────────────────────────────────
// Note: backend HelpCategorySchema has no `id`/`blurb`/`icon` — `key` is the
// identifier. HelpTutorialSchema has no `icon`/`steps`/`cta` — it's a simple
// title+slug+body article, not a step-by-step card. UI redesigned to match.
interface Category {
  key: string;
  active: boolean;
  label: string;
  sort_order: number;
}
interface Faq {
  id: string;
  answer: string;
  category_key: string;
  published: boolean;
  question: string;
  sort_order: number;
}
interface Tutorial {
  id: string;
  body: string;
  published: boolean;
  slug: string;
  sort_order: number;
  title: string;
}

// ── API ↔ Display adapters ───────────────────────────────────────────────────
function adaptCategory(c: HelpCategoryAPI): Category {
  return {
    key: c.key,
    active: c.active,
    label: c.label,
    sort_order: c.sortOrder,
  };
}
function categoryToApi(c: Category): HelpCategoryAPI {
  return {
    key: c.key,
    active: c.active,
    label: c.label,
    sortOrder: c.sort_order,
  };
}

function adaptFaq(f: HelpFaqAPI): Faq {
  return {
    id: f.id,
    answer: f.answer,
    category_key: f.categoryKey,
    published: f.published,
    question: f.question,
    sort_order: f.sortOrder,
  };
}
function faqToApi(f: Faq): HelpFaqAPI {
  return {
    id: f.id,
    answer: f.answer,
    categoryKey: f.category_key,
    published: f.published,
    question: f.question,
    sortOrder: f.sort_order,
  };
}

function adaptTutorial(t: HelpTutorialAPI): Tutorial {
  return {
    id: t.id,
    body: t.body,
    published: t.published,
    slug: t.slug,
    sort_order: t.sortOrder,
    title: t.title,
  };
}
function tutorialToApi(t: Tutorial): HelpTutorialAPI {
  return {
    id: t.id,
    body: t.body,
    published: t.published,
    slug: t.slug,
    sortOrder: t.sort_order,
    title: t.title,
  };
}

function toCategoryApiList(categories: Category[]) {
  return categories.map(category => categoryToApi(category));
}

function toFaqApiList(faqs: Faq[]) {
  return faqs.map(faq => faqToApi(faq));
}

function toTutorialApiList(tutorials: Tutorial[]) {
  return tutorials.map(tutorial => tutorialToApi(tutorial));
}

// ── Validation ────────────────────────────────────────────────────────────────
const categorySchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, _ or -'),
  label: z.string().trim().min(1).max(60),
  sort_order: z.number().int().min(0),
});
const faqSchema = z.object({
  answer: z.string().trim().min(3).max(2000),
  category_key: z.string().min(1, 'Choose a category'),
  question: z.string().trim().min(3).max(200),
  sort_order: z.number().int().min(0),
});
const tutorialSchema = z.object({
  body: z.string().trim().min(3).max(5000),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, - only'),
  sort_order: z.number().int().min(0),
  title: z.string().trim().min(2).max(80),
});

function HelpManagement() {
  const { data: settings, isLoading } = useQuery(getAdminSettingsOptions());
  const updateCategories = useUpdateHelpCategoriesMutation();
  const updateFaqs = useUpdateHelpFaqsMutation();
  const updateTutorials = useUpdateHelpTutorialsMutation();

  const categories: Category[] = (settings?.helpCategories ?? []).map(
    category => adaptCategory(category),
  );
  const faqs: Faq[] = (settings?.helpFaqs ?? []).map(faq => adaptFaq(faq));
  const tutorials: Tutorial[] = (settings?.helpTutorials ?? []).map(
    tutorial => adaptTutorial(tutorial),
  );

  // ── Category dialog ──
  const [catOpen, setCatOpen] = useState(false);
  const [catEdit, setCatEdit] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ key: '', label: '', sort_order: 0 });

  const openCategoryDialog = (c: Category | null) => {
    setCatEdit(c);
    setCatForm(
      c
        ? { key: c.key, label: c.label, sort_order: c.sort_order }
        : { key: '', label: '', sort_order: categories.length },
    );
    setCatOpen(true);
  };

  const saveCategory = () => {
    const parsed = categorySchema.safeParse(catForm);
    if (!parsed.success)
      return toast.error(parsed.error.issues[0].message);

    let next: Category[];
    if (catEdit) {
      next = categories.map(c =>
        c.key === catEdit.key ? { ...c, ...parsed.data } : c,
      );
    }
    else {
      if (categories.some(c => c.key === parsed.data.key))
        return toast.error('That key already exists');
      const newCategory: Category = {
        key: parsed.data.key,
        active: true,
        label: parsed.data.label,
        sort_order: parsed.data.sort_order,
      };
      next = [...categories, newCategory];
    }

    updateCategories.mutate(toCategoryApiList(next), {
      onError: (error: any) => toast.error(error.message ?? 'Failed to save'),
      onSuccess: () => {
        toast.success(catEdit ? 'Category updated' : 'Category added');
        setCatOpen(false);
      },
    });
  };

  const toggleCategoryActive = (key: string, isActive: boolean) => {
    const next = categories.map(c => (c.key === key ? { ...c, active: isActive } : c));
    updateCategories.mutate(toCategoryApiList(next));
  };

  const deleteCategory = (key: string) => {
    const next = categories.filter(c => c.key !== key);
    updateCategories.mutate(toCategoryApiList(next), {
      onError: () => toast.error('Failed to remove category'),
      onSuccess: () => toast.success('Category removed'),
    });
  };

  // ── FAQ dialog ──
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqEdit, setFaqEdit] = useState<Faq | null>(null);
  const [faqForm, setFaqForm] = useState({
    answer: '',
    category_key: '',
    question: '',
    sort_order: 0,
  });

  const openFaqDialog = (f: Faq | null) => {
    setFaqEdit(f);
    setFaqForm(
      f
        ? {
            answer: f.answer,
            category_key: f.category_key,
            question: f.question,
            sort_order: f.sort_order,
          }
        : {
            answer: '',
            category_key: categories[0]?.key ?? '',
            question: '',
            sort_order: faqs.length,
          },
    );
    setFaqOpen(true);
  };

  const saveFaq = () => {
    const parsed = faqSchema.safeParse(faqForm);
    if (!parsed.success)
      return toast.error(parsed.error.issues[0].message);

    let next: Faq[];
    if (faqEdit) {
      next = faqs.map(f =>
        f.id === faqEdit.id ? { ...f, ...parsed.data } : f,
      );
    }
    else {
      const newFaq: Faq = {
        id: `faq-${Date.now()}`,
        answer: parsed.data.answer,
        category_key: parsed.data.category_key,
        published: true,
        question: parsed.data.question,
        sort_order: parsed.data.sort_order,
      };
      next = [...faqs, newFaq];
    }

    updateFaqs.mutate(toFaqApiList(next), {
      onError: (error: any) => toast.error(error.message ?? 'Failed to save'),
      onSuccess: () => {
        toast.success(faqEdit ? 'FAQ updated' : 'FAQ added');
        setFaqOpen(false);
      },
    });
  };

  const toggleFaqPublished = (id: string, isPublished: boolean) => {
    const next = faqs.map(f => (f.id === id ? { ...f, published: isPublished } : f));
    updateFaqs.mutate(toFaqApiList(next));
  };

  const deleteFaq = (id: string) => {
    const next = faqs.filter(f => f.id !== id);
    updateFaqs.mutate(toFaqApiList(next), {
      onError: () => toast.error('Failed to remove FAQ'),
      onSuccess: () => toast.success('FAQ removed'),
    });
  };

  // ── Tutorial dialog (simplified: title + slug + body — no icon/steps/CTA) ──
  const [tutOpen, setTutOpen] = useState(false);
  const [tutEdit, setTutEdit] = useState<Tutorial | null>(null);
  const [tutForm, setTutForm] = useState({
    body: '',
    slug: '',
    sort_order: 0,
    title: '',
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openTutorialDialog = (t: Tutorial | null) => {
    setTutEdit(t);
    setTutForm(
      t
        ? {
            body: t.body,
            slug: t.slug,
            sort_order: t.sort_order,
            title: t.title,
          }
        : { body: '', slug: '', sort_order: tutorials.length, title: '' },
    );
    setTutOpen(true);
  };

  const saveTutorial = () => {
    const parsed = tutorialSchema.safeParse(tutForm);
    if (!parsed.success)
      return toast.error(parsed.error.issues[0].message);

    let next: Tutorial[];
    if (tutEdit) {
      next = tutorials.map(t =>
        t.id === tutEdit.id ? { ...t, ...parsed.data } : t,
      );
    }
    else {
      const newTutorial: Tutorial = {
        id: `tutorial-${Date.now()}`,
        body: parsed.data.body,
        published: true,
        slug: parsed.data.slug,
        sort_order: parsed.data.sort_order,
        title: parsed.data.title,
      };
      next = [...tutorials, newTutorial];
    }
    updateTutorials.mutate(toTutorialApiList(next), {
      onError: (error: any) => toast.error(error.message ?? 'Failed to save'),
      onSuccess: () => {
        toast.success(tutEdit ? 'Tutorial updated' : 'Tutorial added');
        setTutOpen(false);
      },
    });
  };

  const toggleTutorialPublished = (id: string, isPublished: boolean) => {
    const next = tutorials.map(t => (t.id === id ? { ...t, published: isPublished } : t));
    updateTutorials.mutate(toTutorialApiList(next));
  };

  const deleteTutorial = (id: string) => {
    const next = tutorials.filter(t => t.id !== id);
    updateTutorials.mutate(toTutorialApiList(next), {
      onError: () => toast.error('Failed to remove tutorial'),
      onSuccess: () => toast.success('Tutorial removed'),
    });
  };

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
              disabled={categories.length === 0}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {' '}
              Add FAQ
            </Button>
          </div>
          {faqs.length === 0
            ? (
                <EmptyState label="No FAQs yet" />
              )
            : (
                faqs.map((f) => {
                  const cat = categories.find(c => c.key === f.category_key);
                  return (
                    <Card key={f.id}>
                      <CardContent className="
                        flex flex-col gap-3 p-4
                        sm:flex-row sm:items-start
                      "
                      >
                        <div className="min-w-0 flex-1">
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
                              #
                              {f.sort_order}
                            </span>
                          </div>
                          <p className="mt-1 font-medium text-foreground">
                            {f.question}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                            {f.answer}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Switch
                            onCheckedChange={v => toggleFaqPublished(f.id, v)}
                            checked={f.published}
                          />
                          <Button
                            onClick={() => openFaqDialog(f)}
                            size="icon"
                            variant="ghost"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteFaq(f.id)}
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
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
              <Plus className="h-4 w-4" />
              {' '}
              Add tutorial
            </Button>
          </div>
          {tutorials.length === 0
            ? (
                <EmptyState label="No tutorials yet" />
              )
            : (
                tutorials.map(t => (
                  <Card key={t.id}>
                    <CardContent className="
                      flex flex-col gap-3 p-4
                      sm:flex-row sm:items-start
                    "
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {!t.published && (
                            <Badge variant="outline" className="text-[10px]">
                              Draft
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            #
                            {t.sort_order}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            /
                            {t.slug}
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-foreground">
                          {t.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {t.body}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Switch
                          onCheckedChange={v => toggleTutorialPublished(t.id, v)}
                          checked={t.published}
                        />
                        <Button
                          onClick={() => openTutorialDialog(t)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteTutorial(t.id)}
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
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
              <Plus className="h-4 w-4" />
              {' '}
              Add category
            </Button>
          </div>
          {categories.length === 0
            ? (
                <EmptyState label="No categories yet" />
              )
            : (
                categories.map(c => (
                  <Card key={c.key}>
                    <CardContent className="
                      flex flex-col gap-3 p-4
                      sm:flex-row sm:items-center
                    "
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
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
                            #
                            {c.sort_order}
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-foreground">
                          {c.label}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Switch
                          onCheckedChange={v => toggleCategoryActive(c.key, v)}
                          checked={c.active}
                        />
                        <Button
                          onClick={() => openCategoryDialog(c)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteCategory(c.key)}
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
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
      <Dialog onOpenChange={setCatOpen} open={catOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {catEdit ? 'Edit category' : 'Add category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Key</Label>
                <Input
                  onChange={event =>
                    setCatForm({
                      ...catForm,
                      key: event.target.value.toLowerCase(),
                    })}
                  value={catForm.key}
                  disabled={!!catEdit}
                  placeholder="e.g. shipping"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input
                  onChange={event =>
                    setCatForm({ ...catForm, label: event.target.value })}
                  value={catForm.label}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                onChange={event =>
                  setCatForm({
                    ...catForm,
                    sort_order: Number(event.target.value) || 0,
                  })}
                value={catForm.sort_order}
                type="number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCatOpen(false)} variant="outline">
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
      <Dialog onOpenChange={setFaqOpen} open={faqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{faqEdit ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                onValueChange={v =>
                  setFaqForm({ ...faqForm, category_key: v })}
                value={faqForm.category_key}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
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
                onChange={event =>
                  setFaqForm({ ...faqForm, question: event.target.value })}
                value={faqForm.question}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Answer</Label>
              <Textarea
                onChange={event =>
                  setFaqForm({ ...faqForm, answer: event.target.value })}
                value={faqForm.answer}
                maxLength={2000}
                rows={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                onChange={event =>
                  setFaqForm({
                    ...faqForm,
                    sort_order: Number(event.target.value) || 0,
                  })}
                value={faqForm.sort_order}
                type="number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setFaqOpen(false)} variant="outline">
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
      <Dialog onOpenChange={setTutOpen} open={tutOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tutEdit ? 'Edit tutorial' : 'Add tutorial'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  onChange={event =>
                    setTutForm({ ...tutForm, title: event.target.value })}
                  value={tutForm.title}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort</Label>
                <Input
                  onChange={event =>
                    setTutForm({
                      ...tutForm,
                      sort_order: Number(event.target.value) || 0,
                    })}
                  value={tutForm.sort_order}
                  type="number"
                  className="w-20"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                onChange={event =>
                  setTutForm({ ...tutForm, slug: event.target.value.toLowerCase() })}
                value={tutForm.slug}
                placeholder="creating-your-first-listing"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                onChange={event =>
                  setTutForm({ ...tutForm, body: event.target.value })}
                value={tutForm.body}
                placeholder="Write the tutorial content..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTutOpen(false)} variant="outline">
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
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
      <BookOpen className="h-10 w-10" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default HelpManagement;
