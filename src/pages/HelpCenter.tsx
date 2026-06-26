import { useQuery } from '@tanstack/react-query';
import { BookOpen, LifeBuoy, Loader2, Mail, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getHelpCategoriesOptions,
  getHelpFaqsOptions,
  getHelpTutorialsOptions,
} from '@/queries/useHelp';

// ─── Component ────────────────────────────────────────────────────────────────

function HelpCenter() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const activeCategoryKey
    = activeCategory === 'all' ? undefined : activeCategory;

  const { data: categories = [] } = useQuery(getHelpCategoriesOptions());

  const { data: faqs = [], isLoading: loadingFaqs } = useQuery(
    getHelpFaqsOptions(activeCategoryKey),
  );

  const { data: tutorials = [] } = useQuery(getHelpTutorialsOptions());

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.key, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const matchQ
        = !q
          || f.question.toLowerCase().includes(q)
          || f.answer.toLowerCase().includes(q);
      return matchQ;
    });
  }, [query, faqs]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="
          container py-14
          md:py-20
        "
        >
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <LifeBuoy className="h-3.5 w-3.5" />
              {' '}
              Support & Help
            </Badge>
            <h1 className="
              font-heading text-4xl font-bold tracking-tight text-foreground
              md:text-5xl
            "
            >
              How can we help you?
            </h1>
            <p className="mt-3 text-muted-foreground">
              Browse our FAQs, follow a quick tutorial, or get in touch with our
              team.
            </p>

            <div className="relative mt-7">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                onChange={event => setQuery(event.target.value)}
                value={query}
                placeholder="Search articles, e.g. 'how to ship'"
                className="h-12 rounded-full pl-11 text-base shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container py-10">
          <div className="
            grid gap-3
            sm:grid-cols-2
            lg:grid-cols-3
          "
          >
            {categories.map((c) => {
              const isActive = activeCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(isActive ? 'all' : c.key)}
                  className={`
                    group flex items-center gap-4 rounded-xl border p-4 text-left transition-colors
                    ${
                isActive
                  ? 'border-primary bg-primary/5'
                  : `
                    border-border bg-card
                    hover:border-primary/40 hover:bg-muted/40
                  `
                }
                  `}
                >
                  <div
                    className={`
                      flex h-11 w-11 shrink-0 items-center justify-center rounded-lg
                      ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
                }
                    `}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{c.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Browse help articles in this category.
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {activeCategory !== 'all' && (
            <div className="mt-3">
              <Button
                onClick={() => setActiveCategory('all')}
                size="sm"
                variant="ghost"
              >
                Clear filter
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="container pb-16">
        <div className="mb-5">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Frequently asked questions
          </h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length}
            {' '}
            {filtered.length === 1 ? 'article' : 'articles'}
          </p>
        </div>

        {loadingFaqs
          ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )
          : (filtered.length === 0
              ? (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
                      <Search className="h-10 w-10" />
                      <p className="font-medium text-foreground">No results found</p>
                      <p className="text-sm">
                        Try a different search or clear your filters.
                      </p>
                    </CardContent>
                  </Card>
                )
              : (
                  <Accordion collapsible type="single" className="space-y-2">
                    {filtered.map((f) => {
                      const cat = categoryMap.get(f.categoryKey);
                      return (
                        <AccordionItem
                          key={f.id}
                          value={f.id}
                          className="rounded-lg border border-border bg-card px-4"
                        >
                          <AccordionTrigger className="
                            py-4 text-left
                            hover:no-underline
                          "
                          >
                            <div className="flex items-center gap-3 text-left">
                              {cat && (
                                <Badge
                                  variant="secondary"
                                  className="shrink-0 text-[10px]"
                                >
                                  {cat.label}
                                </Badge>
                              )}
                              <span className="font-medium text-foreground">
                                {f.question}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="whitespace-pre-line pb-4 pl-[5.25rem] pr-4 text-sm leading-relaxed text-muted-foreground">
                            {f.answer}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ))}
      </section>

      {tutorials.length > 0 && (
        <section className="border-t border-border bg-muted/20">
          <div className="container py-14">
            <div className="mb-8 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Quick tutorials
              </h2>
            </div>
            <div className="
              grid gap-4
              md:grid-cols-3
            "
            >
              {tutorials.map((t) => {
                return (
                  <Card key={t.id} className="flex flex-col">
                    <CardContent className="flex flex-1 flex-col gap-4 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {t.title}
                      </h3>
                      {t.slug && (
                        <p className="font-mono text-xs text-muted-foreground">
                          /
                          {t.slug}
                        </p>
                      )}
                      <p className="flex-1 whitespace-pre-line text-sm text-muted-foreground">
                        {t.body}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="container py-14">
        <Card className="overflow-hidden">
          <CardContent className="
            flex flex-col items-center gap-4 p-10 text-center
            md:flex-row md:text-left
          "
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Still need help?
              </h3>
              <p className="text-sm text-muted-foreground">
                Our support team replies within 1 business day.
              </p>
            </div>
            <Button asChild className="gap-2">
              <a href="mailto:support@sunday.app">
                Contact support
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}

export default HelpCenter;
