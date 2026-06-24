import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

interface Faq {
  id: string;
  question: string;
  answer: string;
}

const MOCK_FAQS: Faq[] = [
  {
    id: "faq-1",
    question: "How do I create a listing?",
    answer:
      "Click on 'Create Listing' in the navbar, fill in your item details, upload photos, set a price, and hit publish. Your item will be live instantly.",
  },
  {
    id: "faq-2",
    question: "How does payment work?",
    answer:
      "We use secure payment processing. Buyers pay at checkout, and sellers receive their payout once the buyer confirms delivery.",
  },
  {
    id: "faq-3",
    question: "What is your return policy?",
    answer:
      "Buyers have 12 hours after delivery to raise a quality concern. If the item doesn't match the listing, we'll help resolve it.",
  },
  {
    id: "faq-4",
    question: "How do I ship my sold item?",
    answer:
      "Once your item sells, go to your profile under 'Sold' and mark it as shipped with a tracking number. We support PostNet, Aramex, DHL, and more.",
  },
  {
    id: "faq-5",
    question: "Can I make an offer on a listing?",
    answer:
      "Yes! On any listing page, click 'Make Offer' and enter your price. The seller will accept, decline, or counter your offer.",
  },
];

const TopFAQs = () => {
  const { data: faqs = [] } = useQuery({
    queryKey: ["top-faqs"],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_FAQS;

      const { data, error } = await supabase
        .from("help_faqs")
        .select("id, question, answer")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as Faq[];
    },
  });

  if (faqs.length === 0) return null;

  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Frequently asked questions
        </h2>
      </div>

      <AccordionPrimitive.Root
        type="single"
        collapsible
        className="border-t border-border"
      >
        {faqs.map((faq) => (
          <AccordionPrimitive.Item
            key={faq.id}
            value={faq.id}
            className="border-b border-border"
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                className={cn(
                  "group flex flex-1 items-center justify-between py-5 text-left text-base font-medium text-foreground transition-colors hover:text-primary",
                )}
              >
                <span>{faq.question}</span>
                <Plus className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-data-[state=open]:rotate-45" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="pb-5 pr-10 leading-relaxed whitespace-pre-line">
                {faq.answer}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>

      <div className="mt-8 flex justify-center">
        <Link
          to="/help"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View all FAQs <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default TopFAQs;
