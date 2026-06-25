import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  LifeBuoy,
  Loader2,
  Mail,
  Search,
} from 'lucide-react';
import { createElement, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { getHelpIcon } from '@/lib/helpIcons';
import { isMockDataEnabled } from '@/lib/mockConfig';

interface Category {
  key: string;
  id: string;
  blurb: string;
  icon: string;
  label: string;
  sort_order: number;
}
interface Faq {
  id: string;
  answer: string;
  category_key: string;
  question: string;
  sort_order: number;
}
interface Tutorial {
  id: string;
  cta_label: string;
  cta_to: string;
  icon: string;
  sort_order: number;
  steps: string[];
  title: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: Category[] = [
  {
    key: 'buying',
    id: 'cat-1',
    blurb: 'How to find and purchase items',
    icon: 'shopping-bag',
    label: 'Buying',
    sort_order: 1,
  },
  {
    key: 'selling',
    id: 'cat-2',
    blurb: 'List items and manage your sales',
    icon: 'package',
    label: 'Selling',
    sort_order: 2,
  },
  {
    key: 'shipping',
    id: 'cat-3',
    blurb: 'Couriers, tracking and delivery',
    icon: 'truck',
    label: 'Shipping',
    sort_order: 3,
  },
  {
    key: 'payments',
    id: 'cat-4',
    blurb: 'Payouts, refunds and billing',
    icon: 'credit-card',
    label: 'Payments',
    sort_order: 4,
  },
  {
    key: 'account',
    id: 'cat-5',
    blurb: 'Profile, settings and security',
    icon: 'user',
    label: 'Account',
    sort_order: 5,
  },
  {
    key: 'returns',
    id: 'cat-6',
    blurb: 'Disputes, returns and complaints',
    icon: 'undo-2',
    label: 'Returns',
    sort_order: 6,
  },
];

const MOCK_FAQS: Faq[] = [
  {
    id: 'faq-1',
    answer:
      'Open any listing and tap \'Make Offer\'. Enter your price and the seller will accept, decline, or counter within 24 hours.',
    category_key: 'buying',
    question: 'How do I make an offer on a listing?',
    sort_order: 1,
  },
  {
    id: 'faq-2',
    answer:
      'Yes — add items from different sellers to your cart and check out in one go. Each seller ships their items separately.',
    category_key: 'buying',
    question: 'Can I buy multiple items in one checkout?',
    sort_order: 2,
  },
  {
    id: 'faq-3',
    answer:
      'Click \'Create Listing\' in the navbar, fill in the item details, upload photos, set a price, and publish. Your item goes live instantly.',
    category_key: 'selling',
    question: 'How do I create a listing?',
    sort_order: 1,
  },
  {
    id: 'faq-4',
    answer:
      'Go to your profile, open the \'Sold\' tab, expand the order, and tap \'Mark as Shipped\'. Enter the courier and tracking number.',
    category_key: 'selling',
    question: 'How do I mark an item as shipped?',
    sort_order: 2,
  },
  {
    id: 'faq-5',
    answer:
      'We support PostNet, The Courier Guy, Aramex, PUDO, Pargo, Fastway, DHL, SA Post Office, and Hand Delivery.',
    category_key: 'shipping',
    question: 'Which couriers are supported?',
    sort_order: 1,
  },
  {
    id: 'faq-6',
    answer:
      'You have 12 hours after the expected delivery date to raise a concern. Go to the order in your profile and tap \'Item Not Received\'.',
    category_key: 'shipping',
    question: 'What if my item hasn\'t arrived?',
    sort_order: 2,
  },
  {
    id: 'faq-7',
    answer:
      'Your payout is released once the buyer confirms delivery (or after the auto-complete window). Funds arrive in your linked bank account within 2–3 business days.',
    category_key: 'payments',
    question: 'When do I get paid as a seller?',
    sort_order: 1,
  },
  {
    id: 'faq-8',
    answer:
      'Go to your Profile page and click \'Add details\' under Payout Details. Enter your account holder name, bank, account number, IBAN, and SWIFT/BIC.',
    category_key: 'payments',
    question: 'How do I add my bank account for payouts?',
    sort_order: 2,
  },
  {
    id: 'faq-9',
    answer:
      'Within 12 hours of delivery, open the order in your profile and tap \'Raise Concern\'. Attach photos and describe the issue — our team will review it.',
    category_key: 'returns',
    question: 'How do I raise a quality complaint?',
    sort_order: 1,
  },
  {
    id: 'faq-10',
    answer:
      'Click \'Edit Profile\' on your profile page to update your name, bio, location, phone number, and avatar.',
    category_key: 'account',
    question: 'How do I edit my profile?',
    sort_order: 1,
  },
];

const MOCK_TUTORIALS: Tutorial[] = [
  {
    id: 'tut-1',
    cta_label: 'Create a listing',
    cta_to: '/create-listing',
    icon: 'package',
    sort_order: 1,
    steps: [
      'Click \'Create Listing\' in the top navbar.',
      'Upload clear photos of your item.',
      'Fill in title, brand, condition, size, and price.',
      'Hit \'Publish\' — your listing is live!',
    ],
    title: 'List your first item',
  },
  {
    id: 'tut-2',
    cta_label: 'Browse listings',
    cta_to: '/listings',
    icon: 'shopping-bag',
    sort_order: 2,
    steps: [
      'Browse listings or search for what you need.',
      'Tap \'Buy Now\' or make an offer.',
      'Enter your shipping address and pay securely.',
      'Track your order from your profile.',
    ],
    title: 'Buy an item safely',
  },
  {
    id: 'tut-3',
    cta_label: 'View sold items',
    cta_to: '/profile',
    icon: 'truck',
    sort_order: 3,
    steps: [
      'Go to your Profile and open the \'Sold\' tab.',
      'Expand the order and tap \'Mark as Shipped\'.',
      'Choose a courier and enter the tracking number.',
      'The buyer is notified automatically.',
    ],
    title: 'Ship a sold item',
  },
];

function HelpIcon({
  className,
  icon,
}: {
  className?: string;
  icon: string;
}) {
  return createElement(getHelpIcon(icon), { className });
}

// ─── Component ────────────────────────────────────────────────────────────────

function HelpCenter() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: categories = [] } = useQuery({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_CATEGORIES;
      const { data, error } = await supabase
        .from('help_categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      if (error)
        throw error;
      return data as Category[];
    },
    queryKey: ['help-categories'],
  });

  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_FAQS;
      const { data, error } = await supabase
        .from('help_faqs')
        .select('*')
        .eq('published', true)
        .order('category_key', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error)
        throw error;
      return data as Faq[];
    },
    queryKey: ['help-faqs'],
  });

  const { data: tutorials = [] } = useQuery({
    queryFn: async () => {
      if (isMockDataEnabled)
        return MOCK_TUTORIALS;
      const { data, error } = await supabase
        .from('help_tutorials')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true });
      if (error)
        throw error;
      return data as Tutorial[];
    },
    queryKey: ['help-tutorials'],
  });

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.key, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const isMatchCat
        = activeCategory === 'all' || f.category_key === activeCategory;
      const matchQ
        = !q
          || f.question.toLowerCase().includes(q)
          || f.answer.toLowerCase().includes(q);
      return isMatchCat && matchQ;
    });
  }, [query, activeCategory, faqs]);

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
                  key={c.id}
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
                    <HelpIcon icon={c.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{c.label}</p>
                    <p className="text-sm text-muted-foreground">{c.blurb}</p>
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
                      const cat = categoryMap.get(f.category_key);
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
                        <HelpIcon icon={t.icon} className="h-5 w-5" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {t.title}
                      </h3>
                      <ol className="flex-1 space-y-2 text-sm text-muted-foreground">
                        {t.steps.map((step, index) => (
                          <li key={step} className="flex gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      {t.cta_label && t.cta_to && (
                        <Button
                          asChild
                          variant="outline"
                          className="mt-2 w-full gap-2"
                        >
                          <Link to={t.cta_to}>
                            {t.cta_label}
                            {' '}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
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
                {' '}
                <ArrowRight className="h-4 w-4" />
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
