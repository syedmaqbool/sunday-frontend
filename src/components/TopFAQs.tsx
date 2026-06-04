import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, HelpCircle } from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
}

const TopFAQs = () => {
  const { data: faqs = [] } = useQuery({
    queryKey: ["top-faqs"],
    queryFn: async () => {
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
    <section className="container py-14 md:py-20">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Frequently asked questions
          </h2>
        </div>
        <Link
          to="/help"
          className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline md:flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="rounded-lg border border-border bg-card px-4"
          >
            <AccordionTrigger className="py-4 text-left hover:no-underline">
              <span className="font-medium text-foreground">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pr-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-6 flex justify-center md:hidden">
        <Link
          to="/help"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View all FAQs <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default TopFAQs;
