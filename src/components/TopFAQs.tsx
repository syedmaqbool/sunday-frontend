import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utilities';
import { getTopFaqsOptions,getHelpFaqsOptions } from '@/queries/help.query';

interface Faq {
  id: string;
  answer: string;
  question: string;
}

function FaqItem({ faq }: { faq: Faq }) {
  return (
    <AccordionPrimitive.Item value={faq.id} className="border-b border-border">
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            `
              group flex flex-1 items-center justify-between py-5 text-left text-base font-medium text-foreground transition-colors
              hover:text-primary
            `,
          )}
        >
          <span>{faq.question}</span>
          <Plus className="
            h-5 w-5 shrink-0 text-primary transition-transform duration-300
            group-data-[state=open]:rotate-45
          "
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="
        overflow-hidden text-sm text-muted-foreground
        data-[state=closed]:animate-accordion-up
        data-[state=open]:animate-accordion-down
      "
      >
        <div className="whitespace-pre-line pb-5 pr-10 leading-relaxed">
          {faq.answer}
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

export default function TopFAQs() {
 const { data: faqs = [] } = useQuery(getHelpFaqsOptions());

  if (faqs.length === 0)
    return null;

const sortedFaqs = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

const topFaqs = sortedFaqs.slice(0, 10);

const leftFaqs = topFaqs.slice(0, 5);
const rightFaqs = topFaqs.slice(5, 10);

  return (
    <section className="
      container max-w-6xl py-14
      md:py-20
    "
    >
      <div className="mb-8 text-center">
        <h2 className="
          font-heading text-3xl font-semibold tracking-tight text-foreground
          md:text-4xl
        "
        >
          Frequently Asked Questions
        </h2>
      </div>

      {/* ← Old UI: 2 column grid */}
      <div className="
        grid gap-x-12
        md:grid-cols-2
      "
      >
        <AccordionPrimitive.Root collapsible type="single" className="border-t border-border">
          {leftFaqs.map(faq => (
            <FaqItem key={faq.id} faq={faq} />
          ))}
        </AccordionPrimitive.Root>
        {rightFaqs.length > 0 && (
          <AccordionPrimitive.Root collapsible type="single" className="border-t border-border">
            {rightFaqs.map(faq => (
              <FaqItem key={faq.id} faq={faq} />
            ))}
          </AccordionPrimitive.Root>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/help"
          className="
            inline-flex items-center gap-1.5 text-sm font-medium text-primary
            hover:underline
          "
        >
          View all FAQs
          {' '}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
