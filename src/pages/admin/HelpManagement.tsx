import type { HelpCategoryAPI, HelpFaqAPI } from '@/types/adminSettings.type';
import type { HelpTutorial } from '@/types/helpTutorial.type';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  BookOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { createElement, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { HELP_ICON_OPTIONS, getHelpIcon } from '@/lib/helpIcons';
import {
  getAdminSettingsOptions,
  useUpdateHelpCategoriesMutation,
  useUpdateHelpFaqsMutation,
} from '@/queries/adminSettings.query';
import {
  getAdminHelpTutorialsOptions,
  helpTutorialQueryKey,
  useCreateHelpTutorialMutation,
  useDeleteHelpTutorialMutation,
  useUpdateHelpTutorialMutation,
} from '@/queries/helpTutorial.query';
import { getApiErrorCode } from '@/services/ky-base-instance';

// ── Display types ────────────────────────────────────────────────────────────
interface Category {
  key: string;
  active: boolean;
  label: string;
  blurb: string;
  icon: string;
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

// ── API ↔ Display adapters ───────────────────────────────────────────────────
function adaptCategory(c: HelpCategoryAPI): Category {
  return {
    key: c.key,
    active: c.active,
    label: c.label,
    blurb: c.blurb ?? '',
    icon: c.icon ?? 'BookOpen',
    sort_order: c.sortOrder,
  };
}
function categoryToApi(c: Category): HelpCategoryAPI {
  return {
    key: c.key,
    active: c.active,
    label: c.label,
    blurb: c.blurb,
    icon: c.icon,
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

function toCategoryApiList(categories: Category[]) {
  return categories.map(category => categoryToApi(category));
}

function toFaqApiList(faqs: Faq[]) {
  return faqs.map(faq => faqToApi(faq));
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
  blurb: z.string().trim().max(160),
  icon: z.string().min(1),
  sort_order: z.number().int().min(0),
});
const faqSchema = z.object({
  answer: z.string().trim().min(3).max(2000),
  category_key: z.string().min(1, 'Choose a category'),
  question: z.string().trim().min(3).max(200),
  sort_order: z.number().int().min(0),
});
const tutorialSchema = z.object({
  ctaLabel: z.string().trim().max(100),
  ctaTo: z.string().trim().max(500),
  icon: z.string().min(1),
  published: z.boolean(),
  sortOrder: z.number().int().min(0),
  steps: z
    .array(z.string().trim().min(1).max(500))
    .min(1, 'At least one step')
    .max(20, 'At most 20 steps'),
  title: z.string().trim().min(1).max(200),
}).superRefine((data, context) => {
  if (Boolean(data.ctaLabel) !== Boolean(data.ctaTo)) {
    context.addIssue({
      path: ['ctaTo'],
      code: z.ZodIssueCode.custom,
      message: 'Set both CTA label and path, or clear both',
    });
  }
});

const emptyTutorialForm = {
  ctaLabel: '',
  ctaTo: '',
  icon: 'BookOpen',
  published: true,
  sortOrder: 0,
  steps: [''] as string[],
  title: '',
};

function tutorialErrorMessage(error: unknown) {
  const code = getApiErrorCode(error);
  if (code === 'APP_HELP_TUTORIAL_CONFLICT')
    return 'A tutorial with that title already exists.';
  if (code === 'APP_HELP_TUTORIAL_INVALID_CTA')
    return 'Set both CTA label and path, or clear both.';
  return error instanceof Error ? error.message : 'Failed to save tutorial';
}

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

const TUTORIAL_PAGE_SIZE = 20;

function HelpManagement() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery(getAdminSettingsOptions());
  const updateCategories = useUpdateHelpCategoriesMutation();
  const updateFaqs = useUpdateHelpFaqsMutation();

  const categories: Category[] = (settings?.helpCategories ?? []).map(
    category => adaptCategory(category),
  );
  const faqs: Faq[] = (settings?.helpFaqs ?? []).map(faq => adaptFaq(faq));

  // ── Tutorials list (own paginated endpoint) ──
  const [tutPage, setTutPage] = useState(1);
  const { data: tutorialsResponse, isLoading: loadingTutorials } = useQuery({
    ...getAdminHelpTutorialsOptions({ page: tutPage, size: TUTORIAL_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const tutorials: HelpTutorial[] = tutorialsResponse?.data ?? [];
  const tutPagination = tutorialsResponse?.pagination;

  const createTutorial = useCreateHelpTutorialMutation();
  const updateTutorial = useUpdateHelpTutorialMutation();
  const deleteTutorial = useDeleteHelpTutorialMutation();

  const refetchTutorials = () =>
    qc.invalidateQueries({ queryKey: helpTutorialQueryKey.adminAll() });

  // ── Category dialog ──
  const [catOpen, setCatOpen] = useState(false);
  const [catEdit, setCatEdit] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ key: '', label: '', blurb: '', icon: 'BookOpen', sort_order: 0 });

  const openCategoryDialog = (c: Category | null) => {
    setCatEdit(c);
    setCatForm(
      c
        ? { key: c.key, label: c.label, blurb: c.blurb, icon: c.icon, sort_order: c.sort_order }
        : { key: '', label: '', blurb: '', icon: 'BookOpen', sort_order: categories.length },
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
        blurb: parsed.data.blurb,
        icon: parsed.data.icon,
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

  // ── Tutorial dialog ──
  const [tutOpen, setTutOpen] = useState(false);
  const [tutEdit, setTutEdit] = useState<HelpTutorial | null>(null);
  const [tutForm, setTutForm] = useState(emptyTutorialForm);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openTutorialDialog = (t: HelpTutorial | null) => {
    setTutEdit(t);
    setTutForm(
      t
        ? {
          ctaLabel: t.ctaLabel ?? '',
          ctaTo: t.ctaTo ?? '',
          icon: t.icon ?? 'BookOpen',
          published: t.published,
          sortOrder: t.sortOrder,
          steps: t.steps.length > 0 ? t.steps : [''],
          title: t.title,
        }
        : emptyTutorialForm,
    );
    setTutOpen(true);
  };

  const saveTutorial = () => {
    const cleanSteps = tutForm.steps.map(s => s.trim()).filter(Boolean);
    const parsed = tutorialSchema.safeParse({ ...tutForm, steps: cleanSteps });
    if (!parsed.success)
      return toast.error(parsed.error.issues[0].message);

    const payload = {
      ctaLabel: parsed.data.ctaLabel || null,
      ctaTo: parsed.data.ctaTo || null,
      icon: parsed.data.icon || null,
      published: parsed.data.published,
      sortOrder: parsed.data.sortOrder,
      steps: parsed.data.steps,
      title: parsed.data.title,
    };

    if (tutEdit) {
      updateTutorial.mutate(
        { id: tutEdit.id, payload },
        {
          onError: (error: unknown) => toast.error(tutorialErrorMessage(error)),
          onSuccess: () => {
            toast.success('Tutorial updated');
            setTutOpen(false);
          },
        },
      );
    }
    else {
      createTutorial.mutate(payload, {
        onError: (error: unknown) => toast.error(tutorialErrorMessage(error)),
        onSuccess: () => {
          toast.success('Tutorial added');
          setTutOpen(false);
        },
      });
    }
  };

  const toggleTutorialPublished = (id: string, isPublished: boolean) => {
    updateTutorial.mutate(
      { id, payload: { published: isPublished } },
      { onError: () => toast.error('Failed to update tutorial') },
    );
  };

  const handleDeleteTutorial = (id: string) => {
    deleteTutorial.mutate(id, {
      onError: (error: unknown) => {
        if (getApiErrorCode(error) === 'APP_HELP_TUTORIAL_NOT_FOUND') {
          toast.error('Tutorial was already removed');
          refetchTutorials();
          return;
        }
        toast.error('Failed to remove tutorial');
      },
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

        {/* ── FAQs (unchanged) ── */}
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

        {/* ── Tutorials (own paginated CRUD endpoints) ── */}
        <TabsContent value="tutorials" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => openTutorialDialog(null)} className="gap-2">
              <Plus className="h-4 w-4" />
              {' '}
              Add tutorial
            </Button>
          </div>
          {loadingTutorials
            ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )
            : tutorials.length === 0
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
                        {createElement(getHelpIcon(t.icon), { className: 'h-5 w-5' })}
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
                            {t.sortOrder}
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-foreground">
                          {t.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t.steps.length}
                          {' '}
                          step
                          {t.steps.length === 1 ? '' : 's'}
                          {t.ctaLabel && t.ctaTo ? ` · CTA: ${t.ctaLabel} → ${t.ctaTo}` : ''}
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete tutorial?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes "
                                {t.title}
                                " and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTutorial(t.id)}
                                className="
                                  bg-destructive text-destructive-foreground
                                  hover:bg-destructive/90
                                "
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          {tutPagination && tutPagination.lastPage > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={tutPagination.prevPage == null}
                    className={tutPagination.prevPage == null ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      if (tutPagination.prevPage)
                        setTutPage(tutPagination.prevPage);
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-3 text-sm text-muted-foreground">
                    Page
                    {' '}
                    {tutPagination.currentPage}
                    {' '}
                    of
                    {' '}
                    {tutPagination.lastPage}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={tutPagination.nextPage == null}
                    className={tutPagination.nextPage == null ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      if (tutPagination.nextPage)
                        setTutPage(tutPagination.nextPage);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        {/* ── Categories (restored: icon + blurb, like old code) ── */}
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
              categories.map((c) => {
                const Icon = getHelpIcon(c.icon);
                return (
                  <Card key={c.key}>
                    <CardContent className="
                        flex flex-col gap-3 p-4
                        sm:flex-row sm:items-center
                      "
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-5 w-5" />
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
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {c.blurb}
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
                );
              })
            )}
        </TabsContent>
      </Tabs>

      {/* ── Category dialog (restored: Blurb + Icon fields) ── */}
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
              <Label>Blurb</Label>
              <Input
                onChange={event =>
                  setCatForm({ ...catForm, blurb: event.target.value })}
                value={catForm.blurb}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <IconSelect
                  value={catForm.icon}
                  onChange={v => setCatForm({ ...catForm, icon: v })}
                />
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

      {/* ── FAQ dialog (unchanged) ── */}
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

      {/* ── Tutorial dialog (restored: icon, steps, CTA) ── */}
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
                      sortOrder: Number(event.target.value) || 0,
                    })}
                  value={tutForm.sortOrder}
                  type="number"
                  className="w-20"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <IconSelect
                value={tutForm.icon}
                onChange={v => setTutForm({ ...tutForm, icon: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Steps</Label>
              {tutForm.steps.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex h-9 w-7 shrink-0 items-center justify-center text-xs text-muted-foreground">
                    {i + 1}
                    .
                  </span>
                  <Input
                    value={s}
                    onChange={(event) => {
                      const next = [...tutForm.steps];
                      next[i] = event.target.value;
                      setTutForm({ ...tutForm, steps: next });
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const next = tutForm.steps.filter((_, idx) => idx !== i);
                      setTutForm({ ...tutForm, steps: next.length ? next : [''] });
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
                disabled={tutForm.steps.length >= 20}
                onClick={() => setTutForm({ ...tutForm, steps: [...tutForm.steps, ''] })}
                className="gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                {' '}
                Add step
              </Button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>CTA (optional — set both, or leave both blank)</Label>
                {(tutForm.ctaLabel || tutForm.ctaTo) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTutForm({ ...tutForm, ctaLabel: '', ctaTo: '' })}
                  >
                    Clear CTA
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  onChange={event =>
                    setTutForm({ ...tutForm, ctaLabel: event.target.value })}
                  value={tutForm.ctaLabel}
                  placeholder="CTA label, e.g. Start browsing"
                />
                <Input
                  onChange={event =>
                    setTutForm({ ...tutForm, ctaTo: event.target.value })}
                  value={tutForm.ctaTo}
                  placeholder="/listings"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTutOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={saveTutorial}
              disabled={createTutorial.isPending || updateTutorial.isPending}
            >
              {(createTutorial.isPending || updateTutorial.isPending) && (
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
