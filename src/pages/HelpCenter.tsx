import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  ShoppingBag,
  Tag,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Truck,
  Mail,
  BookOpen,
  ArrowRight,
  LifeBuoy,
} from "lucide-react";

type CategoryKey = "buying" | "selling" | "payments" | "shipping" | "messaging" | "trust";

const CATEGORIES: Array<{ key: CategoryKey; label: string; icon: any; blurb: string }> = [
  { key: "buying", label: "Buying", icon: ShoppingBag, blurb: "Browse, offers & checkout" },
  { key: "selling", label: "Selling", icon: Tag, blurb: "Listings, offers & payouts" },
  { key: "payments", label: "Payments", icon: CreditCard, blurb: "Pricing, fees & discounts" },
  { key: "shipping", label: "Shipping", icon: Truck, blurb: "Tracking & delivery" },
  { key: "messaging", label: "Messaging", icon: MessageCircle, blurb: "Chat with buyers & sellers" },
  { key: "trust", label: "Trust & Safety", icon: ShieldCheck, blurb: "Reviews & moderation" },
];

const FAQS: Array<{ category: CategoryKey; q: string; a: string }> = [
  {
    category: "buying",
    q: "How do I make an offer on a listing?",
    a: "Open any listing and tap Make an Offer. Enter your price and an optional message. The seller can accept, decline, or counter. Once accepted, the item is reserved and a private chat opens.",
  },
  {
    category: "buying",
    q: "How does checkout work?",
    a: "Add items to your cart, tap Checkout, fill in shipping details, and apply any promo code. Once you confirm, the item is marked as sold and the seller is notified to ship it.",
  },
  {
    category: "buying",
    q: "Where can I see my orders?",
    a: "Go to Profile → Bought. You'll see every order, its current status, and shipping details once the seller marks it as shipped.",
  },
  {
    category: "selling",
    q: "How do I list an item?",
    a: "Tap Sell from the navbar, upload up to 8 photos, set the title, brand, condition, size, category, and price. Listings are reviewed by an admin before going live.",
  },
  {
    category: "selling",
    q: "When does my listing become visible?",
    a: "After moderation. If admins request changes you'll see feedback on Profile → My Listings — update the listing and resubmit for approval.",
  },
  {
    category: "selling",
    q: "How do I mark an item as shipped?",
    a: "Open Profile → Sold, find the order, and click Mark as Shipped. You'll be asked for the courier, optional tracking number, expected delivery date, and a proof image.",
  },
  {
    category: "payments",
    q: "Can I use a discount code?",
    a: "Yes. Enter the code at checkout and the discount is applied to your subtotal automatically. Codes may have minimum order amounts or usage limits.",
  },
  {
    category: "payments",
    q: "Where do I add my payout details?",
    a: "Profile → Edit Profile → Bank Details. Sellers receive payouts to the registered account once an order is delivered.",
  },
  {
    category: "shipping",
    q: "How do I track my order?",
    a: "Once the seller marks the item as shipped, the courier name, tracking number, and expected delivery date appear on your order in Profile → Bought.",
  },
  {
    category: "messaging",
    q: "Why was my message hidden or flagged?",
    a: "To keep transactions safe, our system flags messages containing phone numbers, emails, or social handles. Some content is removed automatically; the rest is reviewed by admins.",
  },
  {
    category: "messaging",
    q: "When can I message a seller?",
    a: "After your offer is accepted, a private conversation opens between you and the seller for shipping and item-related questions.",
  },
  {
    category: "trust",
    q: "How do reviews work?",
    a: "After an order is delivered, both buyer and seller can leave a 1–5 star rating with an optional comment, photo, or video. Reviews appear on the seller's public profile.",
  },
  {
    category: "trust",
    q: "How do I report a problem?",
    a: "Use the Contact link below or message us through your profile. Our team reviews reports within 1–2 business days.",
  },
];

const TUTORIALS: Array<{ title: string; steps: string[]; icon: any; cta: { label: string; to: string } }> = [
  {
    title: "Buy your first item",
    icon: ShoppingBag,
    steps: [
      "Browse listings or search by brand & category",
      "Open a listing and add it to cart, or send an offer",
      "Complete checkout with shipping details",
      "Track the order from Profile → Bought",
    ],
    cta: { label: "Start browsing", to: "/listings" },
  },
  {
    title: "Sell your first item",
    icon: Tag,
    steps: [
      "Tap Sell and upload up to 8 high-quality photos",
      "Add brand, condition, size, category, and price",
      "Submit for review — admins approve within 24h",
      "Ship promptly once a buyer purchases",
    ],
    cta: { label: "Create a listing", to: "/create-listing" },
  },
  {
    title: "Negotiate with confidence",
    icon: MessageCircle,
    steps: [
      "Send a fair offer with a short message",
      "Seller can accept, decline, or counter",
      "Once accepted, chat opens for shipping details",
      "Complete checkout to finalize the deal",
    ],
    cta: { label: "View open offers", to: "/my-offers" },
  },
];

const HelpCenter = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      const matchCat = activeCategory === "all" || f.category === activeCategory;
      const matchQ = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="container py-14 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <LifeBuoy className="h-3.5 w-3.5" /> Support & Help
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              How can we help you?
            </h1>
            <p className="mt-3 text-muted-foreground">
              Browse our FAQs, follow a quick tutorial, or get in touch with our team.
            </p>

            <div className="relative mt-7">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, e.g. 'how to ship'"
                className="h-12 rounded-full pl-11 text-base shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = activeCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(isActive ? "all" : c.key)}
                className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{c.label}</p>
                  <p className="text-sm text-muted-foreground">{c.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>
        {activeCategory !== "all" && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveCategory("all")}>
              Clear filter
            </Button>
          </div>
        )}
      </section>

      {/* FAQs */}
      <section className="container pb-16">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Frequently asked questions
            </h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
              <Search className="h-10 w-10" />
              <p className="font-medium text-foreground">No results found</p>
              <p className="text-sm">Try a different search or clear your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filtered.map((f, idx) => {
              const cat = CATEGORIES.find((c) => c.key === f.category)!;
              return (
                <AccordionItem
                  key={`${f.category}-${idx}`}
                  value={`${f.category}-${idx}`}
                  className="rounded-lg border border-border bg-card px-4"
                >
                  <AccordionTrigger className="py-4 text-left hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {cat.label}
                      </Badge>
                      <span className="font-medium text-foreground">{f.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pl-[5.25rem] pr-4 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </section>

      {/* Tutorials */}
      <section className="border-t border-border bg-muted/20">
        <div className="container py-14">
          <div className="mb-8 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl font-semibold text-foreground">Quick tutorials</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TUTORIALS.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.title} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{t.title}</h3>
                    <ol className="flex-1 space-y-2 text-sm text-muted-foreground">
                      {t.steps.map((s, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                            {i + 1}
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                    <Button asChild variant="outline" className="mt-2 w-full gap-2">
                      <Link to={t.cta.to}>
                        {t.cta.label} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="container py-14">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center md:flex-row md:text-left">
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
                Contact support <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;
